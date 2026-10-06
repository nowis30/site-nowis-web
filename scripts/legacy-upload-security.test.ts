import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../src/lib/prisma';
import { signClientPortalSession } from '../src/features/client-portal/auth/session';
import { consumeContactRateLimit } from '../src/lib/contact-rate-limit';
import { MAX_UPLOAD_BODY_BYTES, MAX_UPLOAD_FILE_BYTES } from '../src/lib/bounded-upload-body';

test('legacy uploads authorize and bound real multipart bytes before persistent storage', async t => {
  const env = {NODE_ENV:'production',VERCEL:'1',DATABASE_URL:'postgresql://isolated:isolated@127.0.0.1:1/test',
    CLIENT_PORTAL_JWT_SECRET:'isolated-legacy-upload-session-key-32-characters',S3_REGION:'us-east-1',S3_BUCKET:'isolated-test-bucket',
    S3_PUBLIC_BASE_URL:'https://storage.example.test',S3_ACCESS_KEY_ID:'isolated-id',S3_SECRET_ACCESS_KEY:'isolated-key'};
  const previous=Object.fromEntries(Object.keys(env).map(key=>[key,process.env[key]]));
  const originals={contact:prisma.contact.findUnique,grantCreate:prisma.authGrant.create,grantFind:prisma.authGrant.findUnique,
    transaction:prisma.$transaction,send:S3Client.prototype.send};
  const contactId='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const grants=new Map<string,any>(),limits=new Map<string,any>();
  let authQueries=0,storageCalls=0,storageFails=false,limitFails=false;
  Object.assign(process.env,env);
  try {
    prisma.contact.findUnique=(async()=>({id:contactId,email:'owner@example.test',fullName:'Owner',authVersion:0,deletedAt:null,userAccount:null})) as typeof originals.contact;
    prisma.authGrant.create=(async({data}:any)=>{const grant={...data,usedAt:null,revokedAt:null};grants.set(data.tokenHash,grant);return grant;}) as typeof originals.grantCreate;
    prisma.authGrant.findUnique=(async({where}:any)=>{authQueries++;return grants.get(where.tokenHash)||null;}) as typeof originals.grantFind;
    prisma.$transaction=(async(callback:any)=>{
      if(limitFails)throw new Error('PRIVATE_DATABASE_CONFIG');
      return callback({apiRateLimit:{
        findUnique:async({where}:any)=>{const key=where.scope_identifier_windowStart;return limits.get(`${key.scope}:${key.identifier}:${key.windowStart.toISOString()}`)||null;},
        create:async({data}:any)=>{const key=`${data.scope}:${data.identifier}:${data.windowStart.toISOString()}`;const entry={...data,id:key};limits.set(key,entry);return entry;},
        update:async({where}:any)=>{const entry=limits.get(where.id)!;entry.count++;return entry;},
      }});
    }) as typeof originals.transaction;
    S3Client.prototype.send=(async(command:any)=>{
      assert.ok(command instanceof PutObjectCommand);
      assert.ok(command.input.Key.startsWith('legacy-uploads/'));
      storageCalls++;
      if(storageFails)throw new Error('PRIVATE_STORAGE_CONFIGURATION_KEY');
      return {};
    }) as typeof originals.send;
    const token=await signClientPortalSession({contactId,tenantId:null,email:'owner@example.test',fullName:'Owner'});
    const cookie=`nowis_client_session=${token}`;
    const routes=[{path:'/api/upload',post:(await import('../src/app/api/upload/route')).POST},
      {path:'/api/site/song-requests/upload',post:(await import('../src/app/api/site/song-requests/upload/route')).POST}];

    function request(route:string,body:BodyInit|null,headers:Record<string,string>={}) {
      const value=new NextRequest(`https://nowis.store${route}`,{method:'POST',headers:{origin:'https://nowis.store',cookie,...headers},body,
        ...(body instanceof ReadableStream?{duplex:'half'}:{})} as any);
      const stream=value.body;
      let bodyReads=0,unboundedParses=0;
      Object.defineProperty(value,'body',{get(){bodyReads++;return stream;}});
      Object.defineProperty(value,'formData',{value:async()=>{unboundedParses++;throw new Error('UNBOUNDED_PARSE_CALLED');}});
      return {value,reads:()=>bodyReads,parses:()=>unboundedParses};
    }
    const multipart=(type='application/pdf',bytes=12,file=true)=>{
      const data=new FormData();
      const content = new Uint8Array(bytes); content.set(Buffer.from('%PDF-1.7').subarray(0, bytes));
      data.append('file',file?new File([content],'sample.pdf',{type}):'not-a-file');
      return data;
    };
    const largeStream=()=>new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new Uint8Array(MAX_UPLOAD_BODY_BYTES));controller.enqueue(new Uint8Array(1));controller.close();}});
    const invalidMultipartHeaders={'content-type':'multipart/form-data; boundary=isolated'};

    await t.test('anonymous, cross-origin and cross-site requests never read or parse bodies',async()=>{
      for(const route of routes)for(const [headers,status] of [[{cookie:''},401],[{origin:'https://evil.example.test'},403],[{'sec-fetch-site':'cross-site'},403]] as const){
        const beforeAuth=authQueries,beforeStorage=storageCalls;
        const item=request(route.path,multipart(),headers);
        assert.equal((await route.post(item.value)).status,status);
        assert.equal(item.reads(),0);assert.equal(item.parses(),0);assert.equal(storageCalls,beforeStorage);
        assert.equal(authQueries,beforeAuth,'origin rejection and no session do not query grants');
      }
      assert.equal(limits.size,0);
    });

    await t.test('declared and actual sizes are bounded, even with a missing or forged Content-Length',async()=>{
      for(const route of routes){
        for(const headers of [
          {...invalidMultipartHeaders,'content-length':String(MAX_UPLOAD_BODY_BYTES+1)},
          invalidMultipartHeaders,{...invalidMultipartHeaders,'content-length':'1'},
        ]){
          limits.clear();const beforeStorage=storageCalls;
          const item=request(route.path,largeStream(),headers);
          assert.equal((await route.post(item.value)).status,413);
          assert.equal(item.parses(),0);assert.equal(storageCalls,beforeStorage);
          if(headers['content-length']===String(MAX_UPLOAD_BODY_BYTES+1))assert.equal(item.reads(),0);
        }
        limits.clear();const oversized=request(route.path,multipart('application/pdf',MAX_UPLOAD_FILE_BYTES+1));
        assert.equal((await route.post(oversized.value)).status,413);
        assert.equal(oversized.parses(),0);
      }
      assert.equal(storageCalls,0);
    });

    await t.test('multipart format and File/MIME validation reject malformed or active payloads without storage',async()=>{
      for(const route of routes){
        for(const [body,headers,status] of [
          ['not multipart',{'content-type':'text/plain'},415],
          ['missing boundary',{'content-type':'multipart/form-data'},400],
          ['invalid length',{...invalidMultipartHeaders,'content-length':'-1'},400],
          ['broken multipart',invalidMultipartHeaders,400],
          [multipart('text/html'),{},400],[multipart('application/pdf',12,false),{},400],
        ] as const){
          limits.clear();const item=request(route.path,body,headers);
          assert.equal((await route.post(item.value)).status,status);assert.equal(item.parses(),0);
        }
      }
      assert.equal(storageCalls,0);
    });

    await t.test('both legacy upload routes share the presign counter and preserve their success contracts',async()=>{
      limits.clear();
      for(let index=0;index<28;index++)assert.equal((await consumeContactRateLimit({scope:'file-upload:client',identifier:contactId,max:30,windowMs:3600000})).allowed,true);
      for(const route of routes){
        const item=request(route.path,multipart());const response=await route.post(item.value);const result=await response.json();
        assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
        assert.equal(item.parses(),0);assert.ok(item.reads()>0);
        if(route.path==='/api/upload'){
          assert.deepEqual(Object.keys(result),['url','name','size']);assert.equal(result.name,'sample.pdf');assert.equal(result.size,12);assert.ok(result.url.startsWith('https://storage.example.test/legacy-uploads/'));
        }else{
          assert.deepEqual(Object.keys(result),['ok','fileUrl','fileName','mimeType','sizeBytes']);assert.equal(result.ok,true);assert.equal(result.fileName,'sample.pdf');assert.equal(result.mimeType,'application/pdf');assert.equal(result.sizeBytes,12);
        }
      }
      assert.equal(storageCalls,2);
      for(const route of routes){
        const item=request(route.path,multipart(),{'x-forwarded-for':'198.51.100.90','x-real-ip':'192.0.2.90','x-vercel-forwarded-for':'203.0.113.90'});
        const response=await route.post(item.value);assert.equal(response.status,429);assert.ok(Number(response.headers.get('retry-after'))>0);
        assert.equal(item.reads(),0);assert.equal(item.parses(),0);
      }
      assert.equal(storageCalls,2);
    });

    await t.test('authentication/limiter DB failures and body or storage transport errors fail closed with generic 503',async()=>{
      for(const route of routes){
        limits.clear();const beforeStorage=storageCalls;
        const currentFind=prisma.authGrant.findUnique;
        prisma.authGrant.findUnique=(async()=>{throw new Error('PRIVATE_AUTH_DATABASE_CONFIG');}) as typeof currentFind;
        const authFailure=request(route.path,multipart());const authResponse=await route.post(authFailure.value);
        prisma.authGrant.findUnique=currentFind;
        assert.equal(authResponse.status,503);assert.equal(authFailure.reads(),0);assert.equal(JSON.stringify(await authResponse.json()).includes('PRIVATE_'),false);
        limitFails=true;const budgetFailure=request(route.path,multipart());const budgetResponse=await route.post(budgetFailure.value);limitFails=false;
        assert.equal(budgetResponse.status,503);assert.equal(budgetFailure.reads(),0);
        assert.equal(JSON.stringify(await budgetResponse.json()).includes('PRIVATE_'),false);
        const broken=new ReadableStream<Uint8Array>({start(controller){controller.error(new Error('PRIVATE_TRANSPORT_ERROR'));}});
        const transport=request(route.path,broken,invalidMultipartHeaders);const transportResponse=await route.post(transport.value);
        assert.equal(transportResponse.status,503);assert.equal(transport.parses(),0);assert.equal(JSON.stringify(await transportResponse.json()).includes('PRIVATE_'),false);
        assert.equal(storageCalls,beforeStorage);
        storageFails=true;const storageFailure=request(route.path,multipart());const storageResponse=await route.post(storageFailure.value);storageFails=false;
        assert.equal(storageResponse.status,503);assert.equal(JSON.stringify(await storageResponse.json()).includes('PRIVATE_'),false);
      }
    });
  } finally {
    prisma.contact.findUnique=originals.contact;prisma.authGrant.create=originals.grantCreate;prisma.authGrant.findUnique=originals.grantFind;
    prisma.$transaction=originals.transaction;S3Client.prototype.send=originals.send;
    for(const [name,value] of Object.entries(previous)){if(value===undefined)delete process.env[name];else process.env[name]=value;}
    await prisma.$disconnect();
  }
});
