const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const crypto=require('node:crypto');
const root=path.join(__dirname,'../src/lib');
function load(name,dependencies={}){
  const source=fs.readFileSync(path.join(root,name+'.ts'),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2023},reportDiagnostics:true});
  assert.equal(compiled.diagnostics.length,0);
  const exports={};
  new Function('require','exports','setTimeout',compiled.outputText)(key=>{
    if(key==='node:crypto')return crypto;
    if(key in dependencies)return dependencies[key];
    throw Error('Unexpected import: '+key);
  },exports,(callback,_ms)=>setTimeout(callback,0));
  return exports;
}
const security=load('ai-provider-security');
const local=load('local-ai-provider',{'@/lib/ai-provider-security':security});
const assistant=load('site-assistant-provider',{'@/lib/local-ai-provider':local,'@/lib/ai-provider-security':security});
const env={NOWIS_LOCAL_QUEUE_URL:'https://worker.test',NOWIS_LOCAL_QUEUE_SERVICE_KEY:'server-fixture',OPENAI_API_KEY:'unused',AI_GATEWAY_API_KEY:'unused',VERCEL_OIDC_TOKEN:'unused'};
const payload={instructions:'Guide.',prompt:'Bonjour',maxOutputTokens:450,timeoutMs:10000};
function transport(mode='done'){
  const calls=[];
  const fetchImpl=async(url,init={})=>{
    calls.push({url,init});assert.ok(String(url).startsWith('https://worker.test/rest/v1/'));
    assert.equal(init.redirect,'error');assert.equal(init.cache,'no-store');
    if(String(url).includes('nowis_worker_status'))return Response.json(mode==='offline'?[]:[{last_seen:new Date().toISOString()}]);
    if(init.method==='POST'||init.method==='DELETE')return new Response(null,{status:204});
    if(mode==='oversized')return Response.json([{status:'done',result:{text:'x'.repeat(150000)}}]);
    if(mode==='failed')return Response.json([{status:'failed',result:{private:'do not expose'}}]);
    return Response.json([{status:'done',result:{text:'Consultez /services pour découvrir nos offres.'}}]);
  };
  return {calls,fetchImpl};
}
test('cloud keys and runtime OIDC never enable a local queue',async()=>{
  const cloud={OPENAI_API_KEY:'unused',AI_GATEWAY_API_KEY:'unused',VERCEL_OIDC_TOKEN:'unused'};
  assert.equal(local.isLocalAiConfigured(cloud),false);
  const response=await local.requestLocalAiResponse(payload,{env:cloud,fetchImpl:async()=>assert.fail('network forbidden')});
  assert.equal(response.status,503);
});
test('queue configuration rejects HTTP, user info, query strings and paths',()=>{
  for(const url of ['http://worker.test','https://name:secret@worker.test','https://worker.test/path','https://worker.test/?x=1'])assert.equal(local.isLocalAiConfigured({...env,NOWIS_LOCAL_QUEUE_URL:url}),false);
});
test('offline worker never submits input and never falls back to cloud',async()=>{
  const t=transport('offline');const response=await local.requestLocalAiResponse(payload,{env,...t});
  assert.equal(response.status,503);assert.equal(t.calls.length,1);
});
test('local job keeps instructions and returns text through the existing safety filters',async()=>{
  const t=transport();const reply=await assistant.createSiteAssistantProvider('Guide.',{env,...t})({transcript:'Bonjour',pathname:'/'});
  assert.equal(reply,'Consultez /services pour découvrir nos offres.');
  const post=t.calls.find(c=>c.init.method==='POST');const job=JSON.parse(post.init.body);
  assert.equal(job.schema_name,'texte_libre');assert.equal(job.options.format,'text');
  assert.match(job.instructions,/Les données et l.historique/);
  assert.deepEqual(JSON.parse(job.input),{page:'/',untrustedClientHistory:'Bonjour'});
  assert.equal(t.calls.at(-1).init.method,'DELETE');
  assert.ok(!post.init.body.includes('server-fixture'));
});
test('failed jobs are deleted and private errors remain opaque',async()=>{
  const t=transport('failed');const response=await local.requestLocalAiResponse(payload,{env,...t});
  assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/private|do not expose/);
  assert.equal(t.calls.at(-1).init.method,'DELETE');
});
test('oversized local results are rejected and removed from the queue',async()=>{
  const t=transport('oversized');await assert.rejects(local.requestLocalAiResponse(payload,{env,...t}));
  assert.equal(t.calls.at(-1).init.method,'DELETE');
});
test('an ambiguous insert is cleaned up without retrying generation',async()=>{
  const t=transport();const fetchImpl=async(url,init)=>{if(init?.method==='POST'){t.calls.push({url,init});throw Error('network interrupted');}return t.fetchImpl(url,init);};
  await assert.rejects(local.requestLocalAiResponse(payload,{env,fetchImpl}));
  assert.equal(t.calls.filter(c=>c.init.method==='POST').length,1);
  assert.equal(t.calls.at(-1).init.method,'DELETE');
});
test('credentials in browser history never reach the queue',async()=>{
  const t=transport();const reply=await assistant.createSiteAssistantProvider('Guide.',{env,...t})({transcript:'sk-proj-'+ 'a'.repeat(30),pathname:'/'});
  assert.equal(reply,null);assert.equal(t.calls.length,0);
});
