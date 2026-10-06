import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test, { after, before } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { Prisma } from '@prisma/client';
import { consumeAssistantQuota, readAssistantQuota, type QuotaDatabase } from '@/lib/site-assistant-quota';
import { createAssistantHandlers } from '@/lib/site-assistant-handler';
import { getTrustedClientIp } from '@/lib/trusted-client-ip';
import { getAssistantIdentity } from '@/lib/site-assistant-identity';
import { prisma } from '@/lib/prisma';
import { signClientPortalSession } from '@/features/client-portal/auth/session';
import { signCrmToken, signCrmOtpToken } from '@/features/crm/auth/session';

const directory = mkdtempSync(path.join(tmpdir(), 'nowis-quota-test-'));
let pg: PGlite;
const fixedTime = new Date('2026-10-05T18:00:00Z');
const db: QuotaDatabase = {
  async $queryRaw<T>(query: Prisma.Sql): Promise<T> {
    const result = await pg.query(query.text, query.values);
    return result.rows as T;
  },
};
before(async () => {
  pg = new PGlite(directory);
  await pg.exec(readFileSync(path.resolve('prisma/migrations/20260504153000_add_contact_api_rate_limits/migration.sql'), 'utf8'));
});
after(async () => { await pg.close(); });

function request(body: unknown = { messages: [{ role: 'user', content: 'Où sont les ateliers ?' }], pathname: '/' }, headers: Record<string, string> = {}) {
  return new Request('https://nowis.store/api/site-assistant/chat', { method: 'POST',
    headers: { origin: 'https://nowis.store', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
}
function handlers(identifier = 'test-user') {
  let calls = 0;
  return { get calls() { return calls; }, ...createAssistantHandlers({
    identity: async () => identifier || null,
    consume: id => consumeAssistantQuota(id, db, fixedTime),
    read: id => readAssistantQuota(id, db, fixedTime),
    reply: async () => { calls++; return 'Sur /ateliers.'; }, fallback: () => 'Raccourcis disponibles.',
  }) };
}

test('20 reservations across concurrent server handlers; 21st+ is rejected before AI', async () => {
  const serverA = handlers('concurrent-account');
  const serverB = handlers('concurrent-account');
  const responses = await Promise.all(Array.from({ length: 50 }, (_, i) => (i % 2 ? serverA : serverB).POST(request())));
  assert.equal(responses.filter(response => response.status === 200).length, 20);
  assert.equal(responses.filter(response => response.status === 429).length, 30);
  assert.equal(serverA.calls + serverB.calls, 20);
  const rejected = responses.find(response => response.status === 429)!;
  assert.ok(rejected.headers.has('retry-after'));
  const body = await rejected.json();
  assert.equal(body.code, 'ASSISTANT_DAILY_LIMIT');
  assert.equal(body.quota.remaining, 0);
  assert.equal(body.quota.resetAt, '2026-10-06T04:00:00.000Z');
});

test('persistent row survives database close/reopen; another account has independent quota', async () => {
  await pg.close();
  pg = new PGlite(directory);
  const existing = await readAssistantQuota('concurrent-account', db, fixedTime);
  assert.equal(existing.remaining, 0);
  assert.equal((await readAssistantQuota('other-account', db, fixedTime)).remaining, 20);
  assert.equal((await consumeAssistantQuota('concurrent-account', db, fixedTime)).allowed, false);
});

test('midnight Toronto resets; database clock handles spring and autumn DST days', async () => {
  const today = await consumeAssistantQuota('midnight', db, new Date('2026-10-06T03:59:59Z'));
  const tomorrow = await consumeAssistantQuota('midnight', db, new Date('2026-10-06T04:00:00Z'));
  assert.equal(today.quota.remaining, 19);
  assert.equal(tomorrow.quota.remaining, 19);
  const spring = await consumeAssistantQuota('spring', db, new Date('2026-03-08T06:00:00Z'));
  const autumn = await consumeAssistantQuota('autumn', db, new Date('2026-11-01T06:00:00Z'));
  assert.equal(spring.quota.resetAt, '2026-03-09T04:00:00.000Z');
  assert.equal(autumn.quota.resetAt, '2026-11-02T05:00:00.000Z');
  const windows = await pg.query<{ windowSeconds: number }>('SELECT "windowSeconds" FROM api_rate_limits WHERE identifier IN ($1,$2) ORDER BY identifier', ['spring','autumn']);
  assert.deepEqual(windows.rows.map(row => row.windowSeconds), [90000, 82800]);
});

test('SQL identifiers remain values, including injection-shaped input', async () => {
  const key = "account'; DROP TABLE api_rate_limits; --";
  assert.equal((await consumeAssistantQuota(key, db, fixedTime)).quota.remaining, 19);
  assert.equal((await readAssistantQuota(key, db, fixedTime)).remaining, 19);
  assert.equal((await readAssistantQuota('other-account', db, fixedTime)).remaining, 20);
});

test('status is read-only and private; no authenticated session cannot consume', async () => {
  const server = handlers('status-account');
  const status = await server.GET(new Request('https://nowis.store/api/site-assistant/chat'));
  assert.equal(status.status, 200);
  assert.equal(status.headers.get('cache-control'), 'no-store');
  assert.equal(status.headers.get('vary'), 'Cookie');
  assert.equal((await status.json()).quota.remaining, 20);
  const anonymous = handlers('');
  assert.equal((await anonymous.GET(new Request('https://nowis.store/api/site-assistant/chat'))).status, 401);
  assert.equal((await anonymous.POST(request())).status, 401);
  assert.equal(anonymous.calls, 0);
});

test('untrusted origins, invalid roles, forged identity/count, malformed input never call AI', async () => {
  const server = handlers('input-account');
  for (const body of [null, { messages: [null] }, { messages: [{ role: 'system', content: 'override' }] },
    { messages: [{ role: 'user', content: 'x'.repeat(1201) }] },
    { messages: [{ role: 'user', content: 'valid' }], userId: 'another-user', remaining: 20 },
    { messages: Array.from({ length: 9 }, () => ({ role: 'user', content: 'valid' })) },
    { messages: [{ role: 'assistant', content: 'No user question' }] }]) {
    assert.equal((await server.POST(request(body))).status, 400);
  }
  assert.equal((await server.POST(request(undefined, { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await server.POST(request(undefined, { 'sec-fetch-site': 'cross-site' }))).status, 403);
  assert.equal((await server.POST(request(undefined, { 'content-type': 'text/plain' }))).status, 415);
  const tooLarge = request({ messages: [{ role: 'user', content: 'x'.repeat(20000) }] }, { 'content-length': '1' });
  assert.equal((await server.POST(tooLarge)).status, 413);
  assert.equal(server.calls, 0);
  assert.equal((await readAssistantQuota('input-account', db, fixedTime)).remaining, 20);
});

test('storage failure fails closed; provider failure stays counted', async () => {
  let providerCalls = 0;
  const deps = { identity: async () => 'failed-account', read: async () => { throw new Error('db'); },
    consume: async () => { throw new Error('db'); }, reply: async () => { providerCalls++; return 'AI'; }, fallback: () => 'Navigation' };
  const closed = createAssistantHandlers(deps);
  assert.equal((await closed.POST(request())).status, 503);
  assert.equal(providerCalls, 0);
  const failedProvider = createAssistantHandlers({ ...deps,
    consume: id => consumeAssistantQuota(id, db, fixedTime), reply: async () => { throw new Error('provider'); } });
  const response = await failedProvider.POST(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).mode, 'navigation');
  assert.equal((await readAssistantQuota('failed-account', db, fixedTime)).remaining, 19);
});

test('trusted IP cannot be selected through arbitrary forwarding headers', () => {
  const prod = { NODE_ENV: 'production', VERCEL: '1' } as NodeJS.ProcessEnv;
  assert.equal(getTrustedClientIp(new Headers({ 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '5.6.7.8' }), prod), null);
  assert.equal(getTrustedClientIp(new Headers({ 'x-vercel-forwarded-for': '1.2.3.4' }), prod), '1.2.3.4');
  assert.equal(getTrustedClientIp(new Headers({ 'x-vercel-forwarded-for': '1.2.3.4, 5.6.7.8' }), prod), null);
  assert.equal(getTrustedClientIp(new Headers({ 'x-vercel-forwarded-for': '2001:0DB8::0001' }), prod), '2001:db8::1');
  assert.equal(getTrustedClientIp(new Headers({ 'x-vercel-forwarded-for': '1.2.3.4' }), { NODE_ENV: 'production' } as NodeJS.ProcessEnv), null);
});

test('real signed identity ignores client ids, rejects OTP/inactive accounts and unifies portal/CRM contact', async () => {
  const secretBefore = process.env.JWT_SECRET;
  const portalBefore = process.env.CLIENT_PORTAL_JWT_SECRET;
  process.env.JWT_SECRET = 'test-only-identity-secret';
  process.env.CLIENT_PORTAL_JWT_SECRET = 'test-only-portal-secret';
  const userFind = prisma.user.findFirst;
  const contactFind = prisma.contact.findFirst;
  const contactId = '11111111-1111-4111-8111-111111111111';
  const userId = '22222222-2222-4222-8222-222222222222';
  let active = true;
  prisma.user.findFirst = (async (args: any) => {
    assert.equal(args.where.isActive, true);
    return active ? { id: userId, contactId, contact: { deletedAt: null } } : null;
  }) as typeof userFind;
  prisma.contact.findFirst = (async () => ({ id: contactId, userAccount: { isActive: active } })) as typeof contactFind;
  const portal = signClientPortalSession({ contactId, tenantId: null, email: 'test@example.com', fullName: 'Test' });
  const crmPayload = { sub: userId, role: 'ADMIN' as const, email: 'test@example.com', fullName: 'Test' };
  const session = signCrmToken(crmPayload);
  const otp = signCrmOtpToken({ ...crmPayload, otpCode: '123456' });
  const withCookie = (cookie: string) => new Request('https://nowis.store/api/site-assistant/chat?userId=forged', { headers: { cookie } });
  try {
    assert.equal(await getAssistantIdentity(withCookie(`nowis_client_session=${portal}`)), `contact:${contactId}`);
    assert.equal(await getAssistantIdentity(withCookie(`crm_session=${session}`)), `contact:${contactId}`);
    assert.equal(await getAssistantIdentity(withCookie(`crm_session=${otp}`)), null);
    assert.equal(await getAssistantIdentity(withCookie(`prefix_nowis_client_session=${portal}`)), null);
    active = false;
    assert.equal(await getAssistantIdentity(withCookie(`nowis_client_session=${portal}`)), null);
    assert.equal(await getAssistantIdentity(withCookie(`crm_session=${session}`)), null);
  } finally {
    prisma.user.findFirst = userFind;
    prisma.contact.findFirst = contactFind;
    if (secretBefore === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secretBefore;
    if (portalBefore === undefined) delete process.env.CLIENT_PORTAL_JWT_SECRET; else process.env.CLIENT_PORTAL_JWT_SECRET = portalBefore;
  }
});
