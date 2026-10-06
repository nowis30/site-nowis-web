import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { S3Client, CopyObjectCommand, HeadObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest } from 'next/server';
import { InvalidUploadIntent, canClientDeleteStoredDocument, signFileUploadIntent, verifyFileUploadIntent, issueFileUploadIntent } from '../src/lib/file-upload-intent';
import { assertStoredObjectMetadata, createPresignedUploadUrl, getStoredFileUrl } from '../src/lib/file-storage';
import { prisma } from '../src/lib/prisma';
import { signClientPortalSession } from '../src/features/client-portal/auth/session';
import { deleteStoredFileByUrl } from '../src/lib/uploaded-file';

test('production upload signing refuses missing, public development or short keys without exposing their value', () => {
  const names = ['NODE_ENV', 'FILE_UPLOAD_JWT_SECRET', 'CLIENT_PORTAL_JWT_SECRET', 'JWT_SECRET'] as const;
  const old = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const actor = { actorType: 'client' as const, actorId: 'client-a' };
  const file = { storageKey: 'client-files/client-a/staging/isolated.pdf', originalName: 'file.pdf', mimeType: 'application/pdf', size: 12 };
  try {
    process.env.NODE_ENV = 'production';
    for (const name of names.slice(1)) delete process.env[name];
    for (const invalid of [undefined, 'your-secret-key', 'dev-only-portal-secret-must-change', 'isolated-short-key']) {
      if (invalid === undefined) delete process.env.FILE_UPLOAD_JWT_SECRET;
      else process.env.FILE_UPLOAD_JWT_SECRET = invalid;
      assert.throws(() => signFileUploadIntent(actor, file), (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /Configuration de signature invalide/);
        if (invalid) assert.equal(error.message.includes(invalid), false);
        return true;
      });
    }
    delete process.env.FILE_UPLOAD_JWT_SECRET;
    process.env.JWT_SECRET = 'isolated-long-test-key-not-a-live-secret-32-bytes';
    assert.equal(verifyFileUploadIntent(signFileUploadIntent(actor, file), actor, file).actorId, actor.actorId);
  } finally {
    for (const [name, value] of Object.entries(old)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});

test('upload finalization binds the server key, exact file and expiry to the authenticated actor', () => {
  const oldSecret = process.env.FILE_UPLOAD_JWT_SECRET;
  process.env.FILE_UPLOAD_JWT_SECRET = 'isolated-file-upload-secret';
  const actor = { actorType: 'client' as const, actorId: 'client-a' };
  const file = { storageKey: 'client-files/client-a/staging/2026/10/isolated-random-file.pdf', originalName: 'file.pdf', mimeType: 'application/pdf', size: 12 };
  try {
    const token = signFileUploadIntent(actor, file);
    assert.equal(verifyFileUploadIntent(token, actor, file).storageKey, file.storageKey);
    for (const malicious of [
      { ...file, storageKey: 'client-files/client-b/2026/10/private.pdf' },
      { ...file, storageKey: 'crm-files/admin/2026/10/private.pdf' },
      { ...file, mimeType: 'text/html' },
      { ...file, size: 13 },
      { ...file, originalName: 'different.pdf' },
    ]) assert.throws(() => verifyFileUploadIntent(token, actor, malicious), InvalidUploadIntent);
    assert.throws(() => verifyFileUploadIntent(token, { actorType: 'client', actorId: 'client-b' }, file), InvalidUploadIntent);
    assert.throws(() => verifyFileUploadIntent(token, { actorType: 'crm', actorId: 'client-a' }, file), InvalidUploadIntent);
    assert.throws(() => verifyFileUploadIntent(`${token}tampered`, actor, file), InvalidUploadIntent);
    const expired = jwt.sign({ ...actor, ...file, scope: 'file-upload' }, process.env.FILE_UPLOAD_JWT_SECRET, { expiresIn: -1 });
    assert.throws(() => verifyFileUploadIntent(expired, actor, file), InvalidUploadIntent);
    assert.throws(() => signFileUploadIntent(actor, { ...file, storageKey: 'client-files/client-b/stolen.pdf' }), InvalidUploadIntent);
    assert.throws(() => signFileUploadIntent(actor, { ...file, size: 300 * 1024 * 1024 }), /volumineux/);
  } finally {
    if (oldSecret === undefined) delete process.env.FILE_UPLOAD_JWT_SECRET; else process.env.FILE_UPLOAD_JWT_SECRET = oldSecret;
  }
});

test('HTTP file finalization is single-use, copies a checked staging version and leaves no document after a copy failure', async () => {
  const env = { DATABASE_URL: 'postgresql://isolated:isolated@localhost:1/test', FILE_UPLOAD_JWT_SECRET: 'isolated-file-intent-secret', CLIENT_PORTAL_JWT_SECRET: 'isolated-file-session-secret',
    S3_REGION: 'us-east-1', S3_BUCKET: 'isolated-test-bucket', S3_PUBLIC_BASE_URL: 'https://storage.example.test', S3_ACCESS_KEY_ID: 'isolated-test-id', S3_SECRET_ACCESS_KEY: 'isolated-test-key' };
  const old = Object.fromEntries(Object.keys(env).map(name => [name, process.env[name]]));
  const originalSend = S3Client.prototype.send;
  const originalContactFind = prisma.contact.findUnique;
  const originalGrantCreate = prisma.authGrant.create, originalGrantFind = prisma.authGrant.findUnique, originalGrantClaim = prisma.authGrant.updateMany;
  const originalCreateDocument = prisma.fileDocument.create, originalActivity = prisma.activity.create;
  const originalFindDocument = prisma.fileDocument.findUnique, originalDeleteDocument = prisma.fileDocument.delete;
  const contactId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const actor = { actorType: 'client' as const, actorId: contactId };
  const descriptor = { storageKey: `client-files/${contactId}/staging/2026/10/isolated-random-file.pdf`, originalName: 'file.pdf', mimeType: 'application/pdf', size: 12 };
  const grants = new Map<string, any>();
  const copied: any[] = [], deleted: string[] = [];
  const finalBytes = new Map<string, string>();
  let creates = 0, copyFails = false, stagedBytes = 'original-file';
  let currentDocument: any = null;
  Object.assign(process.env, env);
  try {
    prisma.contact.findUnique = (async () => ({ id: contactId, authVersion: 0, email: 'owner@example.test', fullName: 'Owner', deletedAt: null, userAccount: null })) as typeof originalContactFind;
    prisma.authGrant.create = (async ({ data }: any) => { const grant = { ...data, usedAt: null, revokedAt: null }; grants.set(data.tokenHash, grant); return grant; }) as typeof originalGrantCreate;
    prisma.authGrant.findUnique = (async ({ where }: any) => grants.get(where.tokenHash) ?? null) as typeof originalGrantFind;
    prisma.authGrant.updateMany = (async ({ where, data }: any) => {
      const grant = grants.get(where.tokenHash);
      if (!grant || grant.id !== where.id || grant.scope !== where.scope || grant.identityHash !== where.identityHash
        || grant.usedAt || grant.revokedAt || grant.expiresAt <= new Date()) return { count: 0 };
      // Assignment before yielding simulates the DB's atomic single-winner claim.
      Object.assign(grant, data); return { count: 1 };
    }) as typeof originalGrantClaim;
    prisma.fileDocument.create = (async ({ data }: any) => { creates += 1;
      currentDocument = { id: 'isolated-doc', invoiceId: null, commercialQuoteId: null, songRequest: null, workshopRequest: null, invoice: null, commercialQuote: null, ...data };
      return currentDocument;
    }) as typeof originalCreateDocument;
    prisma.fileDocument.findUnique = (async () => currentDocument) as typeof originalFindDocument;
    prisma.fileDocument.delete = (async () => currentDocument) as typeof originalDeleteDocument;
    prisma.activity.create = (async () => ({})) as typeof originalActivity;
    S3Client.prototype.send = (async (command: any) => {
      if (command instanceof HeadObjectCommand) return { ContentLength: 12, ContentType: 'application/pdf', ETag: '"checked-etag"' };
      if (command instanceof CopyObjectCommand) {
        copied.push(command.input);
        assert.equal(command.input.CopySourceIfMatch, '"checked-etag"');
        if (copyFails) throw new Error('PreconditionFailed: ETag changed');
        finalBytes.set(command.input.Key, stagedBytes); return { CopyObjectResult: { ETag: '"checked-etag"' } };
      }
      if (command instanceof DeleteObjectCommand) { deleted.push(command.input.Key); finalBytes.delete(command.input.Key); return {}; }
      if (command instanceof GetObjectCommand) return { ContentType: 'application/pdf', ContentLength: 12,
        Body: { transformToWebStream: () => new ReadableStream({ start(controller) { controller.enqueue(Buffer.from('hello world!')); controller.close(); } }) } };
      throw new Error('Unexpected storage operation');
    }) as typeof originalSend;
    const session = await signClientPortalSession({ contactId, tenantId: null, email: 'owner@example.test', fullName: 'Owner' });
    const { POST } = await import('../src/app/api/client-portal/file-documents/route');
    const request = (file: any, cookie = `nowis_client_session=${session}`) => new NextRequest('https://nowis.store/api/client-portal/file-documents', { method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://nowis.store', cookie }, body: JSON.stringify({ file: { ...file, url: 'https://untrusted.example.test/not-used', filename: 'untrusted-name.pdf' } }) });
    const uploadIntent = await issueFileUploadIntent(actor, descriptor);
    assert.equal((await POST(request({ ...descriptor, uploadIntent }, ''))).status, 401);
    assert.equal((await POST(request({ ...descriptor, storageKey: 'client-files/another-contact/staging/private.pdf', uploadIntent }))).status, 403);
    assert.equal(creates, 0);
    assert.equal(copied.length, 0);
    const responses = await Promise.all([POST(request({ ...descriptor, uploadIntent })), POST(request({ ...descriptor, uploadIntent }))]);
    assert.deepEqual(responses.map(response => response.status).sort(), [201, 403]);
    assert.equal(creates, 1);
    assert.equal(copied.length, 1);
    const finalKey = copied[0].Key;
    assert.ok(finalKey.startsWith(`client-files/${contactId}/`));
    assert.equal(finalKey.includes('/staging/'), false);
    assert.notEqual(finalKey, descriptor.storageKey);
    assert.ok(deleted.includes(descriptor.storageKey));
    assert.equal(finalBytes.get(finalKey), 'original-file');
    stagedBytes = 'replayed-staging-put';
    assert.equal(finalBytes.get(finalKey), 'original-file');
    const success = await responses.find(response => response.status === 201)!.json();
    assert.equal(success.item.storageKey, undefined);
    assert.equal(success.item.url, '/api/client-portal/file-documents/isolated-doc/download');
    copyFails = true;
    const nextDescriptor = { ...descriptor, storageKey: `client-files/${contactId}/staging/2026/10/another-random-file.pdf` };
    const nextIntent = await issueFileUploadIntent(actor, nextDescriptor);
    const failed = await POST(request({ ...nextDescriptor, uploadIntent: nextIntent }));
    assert.equal(failed.status, 503);
    assert.equal(creates, 1);
    assert.ok(deleted.includes(copied[1].Key));
    assert.equal(deleted.includes(finalKey), false);
    assert.equal((await POST(request({ ...nextDescriptor, uploadIntent: nextIntent }))).status, 403);
    const { GET: download } = await import('../src/app/api/client-portal/file-documents/[id]/download/route');
    const { DELETE: remove } = await import('../src/app/api/client-portal/file-documents/[id]/route');
    const fileRequest = (method = 'GET') => new NextRequest('https://nowis.store/api/client-portal/file-documents/isolated-doc/download',
      { method, headers: { origin: 'https://nowis.store', cookie: `nowis_client_session=${session}` } });
    const params = { params: Promise.resolve({ id: 'isolated-doc' }) };
    const ownDocument = currentDocument;
    const downloaded = await download(fileRequest(), params);
    assert.equal(downloaded.status, 200);
    assert.match(downloaded.headers.get('content-disposition') || '', /^attachment;/);
    assert.equal(downloaded.headers.get('cache-control'), 'private, no-store');
    assert.equal(downloaded.headers.get('x-content-type-options'), 'nosniff');
    currentDocument = { ...ownDocument, contactId: 'another-contact' };
    assert.equal((await download(fileRequest(), params)).status, 404);
    assert.equal((await remove(fileRequest('DELETE'), params)).status, 404);
    currentDocument = { ...ownDocument, storageKey: 'client-files/another-contact/private-file.pdf' };
    assert.equal((await download(fileRequest(), params)).status, 404);
    assert.equal((await remove(fileRequest('DELETE'), params)).status, 403);
    currentDocument = { ...ownDocument, uploadedByUserId: 'staff-user' };
    assert.equal((await remove(fileRequest('DELETE'), params)).status, 403);
    currentDocument = ownDocument;
    assert.equal((await remove(fileRequest('DELETE'), params)).status, 200);
    assert.ok(deleted.includes(finalKey));
    assert.equal(deleted.some(key => key.includes('another-contact')), false);
    prisma.contact.findUnique = (async () => { throw new Error('private-database-connection-details'); }) as typeof originalContactFind;
    const { POST: prepareClientUpload } = await import('../src/app/api/client-portal/file-documents/presign/route');
    const failedPrepare = await prepareClientUpload(new NextRequest('https://nowis.store/api/client-portal/file-documents/presign', { method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://nowis.store', cookie: `nowis_client_session=${session}` },
      body: JSON.stringify({ fileName: 'file.pdf', mimeType: 'application/pdf', size: 12 }) }));
    assert.equal(failedPrepare.status, 503);
    assert.equal(JSON.stringify(await failedPrepare.json()).includes('private-database'), false);
    assert.equal((await POST(request({ ...descriptor, uploadIntent }))).status, 503);
    assert.equal((await remove(fileRequest('DELETE'), params)).status, 503);
  } finally {
    S3Client.prototype.send = originalSend;
    prisma.contact.findUnique = originalContactFind;
    prisma.authGrant.create = originalGrantCreate; prisma.authGrant.findUnique = originalGrantFind; prisma.authGrant.updateMany = originalGrantClaim;
    prisma.fileDocument.create = originalCreateDocument; prisma.activity.create = originalActivity;
    prisma.fileDocument.findUnique = originalFindDocument; prisma.fileDocument.delete = originalDeleteDocument;
    for (const [name, value] of Object.entries(old)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
    await prisma.$disconnect();
  }
});

test('document mutation routes reject foreign origins and declared or actual oversized JSON before DB, quota or storage work', async () => {
  const originalFindContact = prisma.contact.findUnique, originalFindUser = prisma.user.findUnique;
  const originalFindGrant = prisma.authGrant.findUnique, originalTransaction = prisma.$transaction;
  const originalSend = S3Client.prototype.send;
  let databaseCalls = 0, quotaCalls = 0, storageCalls = 0;
  const unexpectedDatabase = async () => { databaseCalls++; throw new Error('Unexpected database lookup'); };
  try {
    prisma.contact.findUnique = unexpectedDatabase as typeof originalFindContact;
    prisma.user.findUnique = unexpectedDatabase as typeof originalFindUser;
    prisma.authGrant.findUnique = unexpectedDatabase as typeof originalFindGrant;
    prisma.$transaction = (async () => { quotaCalls++; throw new Error('Unexpected transaction'); }) as typeof originalTransaction;
    S3Client.prototype.send = (async () => { storageCalls++; throw new Error('Unexpected storage operation'); }) as typeof originalSend;
    const { POST: clientPresign } = await import('../src/app/api/client-portal/file-documents/presign/route');
    const { POST: clientFinalize } = await import('../src/app/api/client-portal/file-documents/route');
    const { POST: crmPresign } = await import('../src/app/api/crm/file-documents/presign/route');
    const { POST: crmFinalize } = await import('../src/app/api/crm/file-documents/route');
    for (const mutate of [clientPresign, clientFinalize, crmPresign, crmFinalize]) {
      const request = (body: string, headers: Record<string, string> = {}) => new NextRequest('https://nowis.store/api/client-portal/file-documents', {
        method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://nowis.store', ...headers }, body,
      });
      assert.equal((await mutate(request('{}', { origin: 'https://untrusted.example.test' }))).status, 403);
      assert.equal((await mutate(request('{}', { origin: '', 'sec-fetch-site': 'cross-site' }))).status, 403);
      assert.equal((await mutate(request('{}', { 'content-length': '16385' }))).status, 413);
      assert.equal((await mutate(request(JSON.stringify({ padding: 'x'.repeat(16385) }), { 'content-length': '2' }))).status, 413);
      assert.equal((await mutate(request('{'))).status, 400);
      assert.equal((await mutate(request('{}', { 'content-type': 'text/plain' }))).status, 415);
    }
    const { DELETE: remove } = await import('../src/app/api/client-portal/file-documents/[id]/route');
    assert.equal((await remove(new NextRequest('https://nowis.store/api/client-portal/file-documents/isolated-doc', {
      method: 'DELETE', headers: { origin: 'https://untrusted.example.test' },
    }), { params: Promise.resolve({ id: 'isolated-doc' }) })).status, 403);
    assert.equal(databaseCalls, 0);
    assert.equal(quotaCalls, 0);
    assert.equal(storageCalls, 0);
  } finally {
    prisma.contact.findUnique = originalFindContact; prisma.user.findUnique = originalFindUser;
    prisma.authGrant.findUnique = originalFindGrant; prisma.$transaction = originalTransaction;
    S3Client.prototype.send = originalSend;
  }
});

test('clients can delete their persisted uploads but cannot delete staff deliveries or another contact object', () => {
  const own = { contactId: 'client-a', uploadedByUserId: null, invoiceId: null, commercialQuoteId: null, storageKey: 'client-files/client-a/2026/10/file.pdf' };
  assert.equal(canClientDeleteStoredDocument(own, 'client-a'), true);
  assert.equal(canClientDeleteStoredDocument({ ...own, storageKey: 'crm-files/legacy-client-file.pdf' }, 'client-a'), true);
  assert.equal(canClientDeleteStoredDocument(own, 'client-b'), false);
  assert.equal(canClientDeleteStoredDocument({ ...own, uploadedByUserId: 'staff' }, 'client-a'), false);
  assert.equal(canClientDeleteStoredDocument({ ...own, invoiceId: 'invoice-a' }, 'client-a'), false);
  assert.equal(canClientDeleteStoredDocument({ ...own, commercialQuoteId: 'quote-a' }, 'client-a'), false);
  assert.equal(canClientDeleteStoredDocument({ ...own, storageKey: 'client-files/client-b/private.pdf' }, 'client-a'), false);
});

test('editable legacy document URLs cannot delete public media or ambiguous object keys', async () => {
  const env = { S3_REGION: 'us-east-1', S3_BUCKET: 'isolated-test-bucket', S3_PUBLIC_BASE_URL: 'https://storage.example.test', S3_ACCESS_KEY_ID: 'isolated-test-id', S3_SECRET_ACCESS_KEY: 'isolated-test-key' };
  const old = Object.fromEntries(Object.keys(env).map(name => [name, process.env[name]]));
  const originalSend = S3Client.prototype.send;
  const deleted: string[] = [];
  Object.assign(process.env, env);
  try {
    S3Client.prototype.send = (async (command: any) => {
      assert.ok(command instanceof DeleteObjectCommand);
      deleted.push(command.input.Key); return {};
    }) as typeof originalSend;
    for (const key of ['legacy-uploads/2026/10/file.pdf', 'crm-files/staff/2026/10/file.pdf', 'client-files/contact/2026/10/file.pdf']) {
      assert.equal(await deleteStoredFileByUrl(`https://storage.example.test/${key}`), true);
    }
    for (const key of ['audio/album.mp3', 'games/config.json', 'crm-files-other/file.pdf', 'crm-files/../audio.mp3',
      'crm-files/%2e%2e/audio.mp3', 'crm-files/%252e%252e/audio.mp3', 'crm-files/..%2faudio.mp3', 'crm-files/..\\audio.mp3',
      'crm-files//file.pdf', 'crm-files/./file.pdf', 'crm-files/file.pdf?key=audio/file.mp3', 'crm-files/file.pdf#fragment']) {
      assert.equal(await deleteStoredFileByUrl(`https://storage.example.test/${key}`), false);
    }
    assert.equal(await deleteStoredFileByUrl('https://untrusted.example.test/crm-files/file.pdf'), false);
    assert.equal(deleted.length, 3);
  } finally {
    S3Client.prototype.send = originalSend;
    for (const [name, value] of Object.entries(old)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});

test('S3 upload URLs bind the declared length and finalization checks actual object size and MIME without network calls', async () => {
  const env = { S3_REGION: 'us-east-1', S3_BUCKET: 'isolated-test-bucket', S3_PUBLIC_BASE_URL: 'https://storage.example.test', S3_ACCESS_KEY_ID: 'isolated-test-id', S3_SECRET_ACCESS_KEY: 'isolated-test-key' };
  const old = Object.fromEntries(Object.keys(env).map(name => [name, process.env[name]]));
  const originalSend = S3Client.prototype.send;
  Object.assign(process.env, env);
  try {
    const file = await createPresignedUploadUrl({ originalName: 'test.pdf', mimeType: 'application/pdf', size: 12 }, { folder: 'client-files/client-a' });
    assert.match(file.storageKey, /^client-files\/client-a\/\d{4}\/\d{2}\/\d+-[0-9a-f-]+-test.pdf$/);
    assert.equal(file.url, getStoredFileUrl(file.storageKey));
    assert.match(new URL(file.uploadUrl).searchParams.get('X-Amz-SignedHeaders') || '', /content-length/);
    let key = '';
    S3Client.prototype.send = (async (command: { input: { Key: string } }) => { key = command.input.Key; return { ContentLength: 12, ContentType: 'application/pdf' }; }) as typeof originalSend;
    await assertStoredObjectMetadata(file.storageKey, { mimeType: 'application/pdf', size: 12 });
    assert.equal(key, file.storageKey);
    await assert.rejects(assertStoredObjectMetadata(file.storageKey, { mimeType: 'application/pdf', size: 13 }), /taille/);
    await assert.rejects(assertStoredObjectMetadata(file.storageKey, { mimeType: 'text/html', size: 12 }), /MIME/);
  } finally {
    S3Client.prototype.send = originalSend;
    for (const [name, value] of Object.entries(old)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  }
});
