import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { Prisma } from '@prisma/client';
import { createAiCommandQuota } from '@/lib/ai-command-quota';
import { createAssistantHandlers } from '@/lib/site-assistant-handler';
import { consumeAssistantQuota, readAssistantQuota, type QuotaDatabase } from '@/lib/site-assistant-quota';
import { POST as oracle } from '@/app/api/tarot/oracle/route';
import { POST as conclusion } from '@/app/api/tarot/conclusion/route';

const request = (path = '/api/site-assistant/chat', body: unknown = { messages: [{ role: 'user', content: 'Bonjour' }] }) => new Request(`https://nowis.store${path}`, {
  method: 'POST', headers: { origin: 'https://nowis.store', 'content-type': 'application/json', 'x-forwarded-for': 'fake-client-selected-address' }, body: JSON.stringify(body),
});
test('assistant, tarot vision and conclusion share one atomic quota across 50 parallel commands', async () => {
  const database = new PGlite();
  try {
    await database.exec(readFileSync('prisma/migrations/20260504153000_add_contact_api_rate_limits/migration.sql', 'utf8'));
    const db: QuotaDatabase = { async $queryRaw<T>(sql: Prisma.Sql): Promise<T> { return (await database.query(sql.text, sql.values)).rows as T; } };
    const deps = { identity: async () => 'contact:shared-test-account', consume: (id: string) => consumeAssistantQuota(id, db), read: (id: string) => readAssistantQuota(id, db) };
    let providerCalls = 0;
    const chatbot = createAssistantHandlers({ ...deps, reply: async () => { providerCalls++; return 'Test'; }, fallback: () => 'Test' });
    const vision = createAiCommandQuota(deps), summary = createAiCommandQuota(deps);
    const results = await Promise.all(Array.from({ length: 50 }, async (_, index) => {
      if (index % 3 === 0) return chatbot.POST(request());
      const result = await (index % 3 === 1 ? vision : summary).reserve(request(), true);
      if (result.response) return result.response;
      providerCalls++;
      return Response.json({ quota: result.quota });
    }));
    assert.equal(results.filter(result => result.status === 200).length, 20);
    assert.equal(results.filter(result => result.status === 429).length, 30);
    assert.equal(providerCalls, 20);
    const status = await vision.status(request(), true);
    const body = await status.json();
    assert.equal(body.available, false);
    assert.equal(body.reason, 'ASSISTANT_DAILY_LIMIT');
    assert.equal(body.quota.remaining, 0);
  } finally { await database.close(); }
});
test('no authenticated identity, failed storage or unavailable provider never reserve an anonymous allowance', async () => {
  let calls = 0;
  const deps = { identity: async (): Promise<string | null> => null, read: async () => { throw new Error('should not read'); },
    consume: async () => { calls++; throw new Error('should not consume'); } };
  const anonymous = createAiCommandQuota(deps);
  assert.equal((await anonymous.reserve(request(), true)).response?.status, 401);
  assert.equal((await (await anonymous.status(request(), true)).json()).reason, 'AUTH_REQUIRED');
  const closed = createAiCommandQuota({ ...deps, identity: async () => { throw new Error('storage failed'); } });
  assert.equal((await closed.reserve(request(), true)).response?.status, 503);
  const noProvider = createAiCommandQuota({ ...deps, identity: async () => 'valid-account' });
  assert.equal((await noProvider.reserve(request(), false)).response?.status, 503);
  assert.equal(calls, 0);
});
test('both actual tarot routes reject anonymous AI calls even with forged IP/provider headers', async () => {
  let calls = 0;
  const fetchBefore = globalThis.fetch;
  const keyBefore = process.env.OPENAI_API_KEY;
  globalThis.fetch = (async () => { calls++; throw new Error('No anonymous provider request is permitted'); }) as typeof fetch;
  process.env.OPENAI_API_KEY = 'isolated-test-key';
  try {
    const cards = { spread: '2', cardIds: ['major-1', 'major-17'] };
    const responses = [await oracle(request('/api/tarot/oracle', { consent: true, question: '', ...cards })),
      await conclusion(request('/api/tarot/conclusion', { consent: true, readings: [{ question: '', ...cards }] }))];
    for (const response of responses) {
      assert.equal(response.status, 401);
      assert.equal((await response.json()).code, 'AUTH_REQUIRED');
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = fetchBefore;
    if (keyBefore === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = keyBefore;
  }
});
