import { AI_AGENT_BOUNDARIES } from '@/lib/ai-provider-security';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import corpus from '../src/data/tarot-oracle-cards.json';
import { GET } from '../src/app/api/tarot/oracle/route';
import {
  buildTarotOraclePrompt, createTarotOracleLimiter, extractTarotOracleReply, isTarotOracleAvailable,
  isTarotOracleOriginAllowed, parseTarotOracleInput, readTarotOracleInput, requestTarotOracleVision,
  TarotOracleRequestError, TAROT_ORACLE_GUIDE,
} from '../src/lib/tarot-oracle';

const payload = { consent: true, question: 'Quelle direction donner à mon projet ?', spread: '3', cardIds: ['major-1', 'major-17', 'coupes-13'], intention: 'clarte' };
const localUrl = 'http://localhost:3008/api/tarot/oracle';
function request(body: unknown, extra: Record<string, string> = {}) {
  return new Request(localUrl, { method: 'POST', headers: { origin: 'http://localhost:3008', 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', ...extra }, body: JSON.stringify(body) });
}

test('server corpus contains the same 78 meanings and positions as the public deck', () => {
  const sandbox = { window: {} as { TAROT_DATA?: typeof corpus } };
  vm.runInNewContext(readFileSync('public/tarot-reader/tarot-data.js', 'utf8'), sandbox);
  const data = sandbox.window.TAROT_DATA!;
  assert.equal(corpus.cards.length, 78);
  assert.equal(new Set(corpus.cards.map(card => card.id)).size, 78);
  for (const card of corpus.cards) {
    const source = data.cards.find(entry => entry.id === card.id)!;
    assert.equal(card.name, source.name);
    assert.equal(card.meaning, source.meaning);
    assert.equal(card.coverage, source.coverage);
    assert.equal(card.coverage, 'direct');
    assert.equal(card.definitionParagraphs.length, 3, card.id);
    const words=card.meaning.split(/\s+/).length;
    assert.ok(words >= 140 && words <= 180, card.id + ': ' + words);
    const reference=new URL(card.reference.url);
    assert.equal(reference.protocol, 'https:');
    assert.ok(['www.apprendre-tarotdemarseille.com', 'marselia.app'].includes(reference.hostname));
  }
  assert.equal(JSON.stringify(corpus.spreads), JSON.stringify(data.spreads));
});

test('same-origin gate rejects missing/null origins, sibling domains, wrong scheme and port', () => {
  assert.equal(isTarotOracleOriginAllowed(request(payload)), true);
  const publicUrl = 'https://nowis.store/api/tarot/oracle';
  assert.equal(isTarotOracleOriginAllowed(new Request(publicUrl, { headers: { origin: 'https://nowis.store', 'sec-fetch-site': 'same-origin' } })), true);
  for (const origin of ['', 'null', 'http://nowis.store', 'https://www.nowis.store', 'https://nowis.store.evil.example', 'https://nowis.store:8443']) {
    assert.equal(isTarotOracleOriginAllowed(new Request(publicUrl, { headers: { origin } })), false, origin);
  }
  assert.equal(isTarotOracleOriginAllowed(new Request(publicUrl)), false);
  assert.equal(isTarotOracleOriginAllowed(request(payload, { origin: 'http://localhost:3009' })), false);
  for (const fetchSite of ['cross-site', 'same-site', 'none']) assert.equal(isTarotOracleOriginAllowed(request(payload, { 'sec-fetch-site': fetchSite })), false);
});

test('consent, exact spread size, known IDs and uniqueness are required', () => {
  assert.equal(parseTarotOracleInput(payload).cardIds.length, 3);
  for (const value of [
    { ...payload, consent: false }, { ...payload, consent: 'true' }, { ...payload, consent: undefined },
    { ...payload, spread: '6' }, { ...payload, spread: 3 }, { ...payload, cardIds: ['major-1', 'major-1', 'major-17'] },
    { ...payload, cardIds: ['major-1', 'major-17'] }, { ...payload, cardIds: ['major-1', 'major-17', 'nope'] },
  ]) assert.throws(() => parseTarotOracleInput(value), TarotOracleRequestError);
  assert.equal(parseTarotOracleInput({ ...payload, question: '' }).question, '');
});

test('only the four bounded declared answers and intention enum can reach the model', () => {
  const answers = { situation: 's'.repeat(280), goal: 'g'.repeat(180), feeling: 'inquiet', blocker: 'hesitation' };
  assert.equal(parseTarotOracleInput({ ...payload, question: 'q'.repeat(500), answers }).answers?.situation.length, 280);
  for (const value of [
    { ...payload, question: 'q'.repeat(501) }, { ...payload, answers: { situation: 's'.repeat(281) } },
    { ...payload, answers: { goal: 'g'.repeat(181) } }, { ...payload, answers: { feeling: 'vision' } },
    { ...payload, answers: { blocker: 'malediction' } }, { ...payload, intention: 'voir les morts' },
    { ...payload, journal: 'private writing' }, { ...payload, birthdate: '1980-01-01' },
    { ...payload, answers: { journal: 'private writing' } }, { ...payload, meaning: 'fake card definition' },
  ]) assert.throws(() => parseTarotOracleInput(value), TarotOracleRequestError);
});

test('body reader rejects oversized streams even when declared length is small', async () => {
  await assert.rejects(readTarotOracleInput(request({ ...payload, extra: 'é'.repeat(5000) }, { 'content-length': '1' })), error => error instanceof TarotOracleRequestError && error.status === 413);
  await assert.rejects(readTarotOracleInput(request(payload, { 'content-type': 'text/plain' })), error => error instanceof TarotOracleRequestError && error.status === 415);
  await assert.rejects(readTarotOracleInput(request(payload, { origin: 'null' })), error => error instanceof TarotOracleRequestError && error.status === 403);
  const malformed = new Request(localUrl, { method: 'POST', headers: { origin: 'http://localhost:3008', 'content-type': 'application/json' }, body: '{' });
  await assert.rejects(readTarotOracleInput(malformed), error => error instanceof TarotOracleRequestError && error.status === 400);
  assert.equal((await readTarotOracleInput(request(payload))).question, payload.question);
});

test('prompt uses the complete server meanings including Mat and labels biographical data as declared', () => {
  const input = parseTarotOracleInput({ ...payload, cardIds: ['major-0', 'major-17', 'coupes-13'], answers: { situation: 'Je prépare un atelier.', feeling: 'inquiet' }, intention: 'apaisement' });
  const prompt = buildTarotOraclePrompt(input);
  assert.ok(prompt.includes(JSON.stringify(corpus.cards.find(card=>card.id==='major-0')!.meaning)));
  assert.equal(prompt.includes('Aucune définition du Mat'), false);
  assert.equal(prompt.includes('"couverture"'), false);
  assert.match(prompt, /"position":"Passé","carte":"Le Mat"/);
  assert.match(prompt, /contexteDeclare/);
  assert.match(prompt, /accueillir ce qui est ressenti avec calme/);
  assert.match(TAROT_ORACLE_GUIDE, /tu n’es ni voyant ni médium/);
  assert.match(TAROT_ORACLE_GUIDE, /sans leur inventer un sens/);
  assert.match(TAROT_ORACLE_GUIDE, /personne décédée/);
  assert.match(TAROT_ORACLE_GUIDE, /médicale, juridique ou financière/);
});

test('capabilities expose only a Boolean and never make a provider request', async () => {
  assert.equal(isTarotOracleAvailable({}), false);
  assert.equal(isTarotOracleAvailable({ OPENAI_API_KEY: 'test-not-secret' }), true);
  assert.equal(isTarotOracleAvailable({ AI_GATEWAY_API_KEY: '   ' }), false);
  let called = false;
  assert.equal(await requestTarotOracleVision(parseTarotOracleInput(payload), { env: {}, fetchImpl: (async () => { called = true; throw new Error('unexpected call'); }) as typeof fetch }), null);
  assert.equal(called, false);
});

test('runtime OIDC is used only on Vercel, only for the current request and never leaked into model context', async () => {
  const runtimeRequest = request(payload, { 'x-vercel-oidc-token': 'test-runtime-oidc-not-secret' });
  assert.equal(isTarotOracleAvailable({}, runtimeRequest), false);
  assert.equal(isTarotOracleAvailable({ VERCEL: '0' }, runtimeRequest), false);
  assert.equal(isTarotOracleAvailable({ VERCEL: '1' }, runtimeRequest), true);
  assert.equal(isTarotOracleAvailable({ VERCEL: '1' }, request(payload)), false);
  assert.equal(isTarotOracleAvailable({ VERCEL: '1' }, request(payload, { 'x-vercel-oidc-token': '   ' })), false);
  let called = false;
  assert.equal(await requestTarotOracleVision(parseTarotOracleInput(payload), { env: {}, request: runtimeRequest, fetchImpl: (async () => { called = true; throw new Error('unexpected'); }) as typeof fetch }), null);
  assert.equal(called, false);
  const env = { VERCEL: '1', SITE_ASSISTANT_MODEL: 'openai/test-runtime-model' };
  const reply = await requestTarotOracleVision(parseTarotOracleInput(payload), { env, request: runtimeRequest, fetchImpl: (async (url, init) => {
    assert.equal(url, 'https://ai-gateway.vercel.sh/v1/responses');
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer test-runtime-oidc-not-secret');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, 'openai/test-runtime-model');
    assert.deepEqual(body.input, [{ type: 'message', role: 'user', content: buildTarotOraclePrompt(parseTarotOracleInput(payload)) }]);
    assert.equal(body.instructions, TAROT_ORACLE_GUIDE + AI_AGENT_BOUNDARIES);
    assert.equal(String(init?.body).includes('test-runtime-oidc-not-secret'), false);
    return Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: 'Une vision symbolique.' }] }] });
  }) as typeof fetch });
  assert.equal(reply, 'Une vision symbolique.');
  assert.deepEqual(env, { VERCEL: '1', SITE_ASSISTANT_MODEL: 'openai/test-runtime-model' });
  assert.equal(isTarotOracleAvailable({ VERCEL: '1' }, request(payload)), false);
});

test('configured provider credentials remain prior to runtime OIDC headers', async () => {
  const runtimeRequest = request(payload, { 'x-vercel-oidc-token': 'ignored-runtime-token' });
  const fixtures = [
    { env: { VERCEL: '1', AI_GATEWAY_API_KEY: 'configured-gateway-token' }, endpoint: 'https://ai-gateway.vercel.sh/v1/responses', token: 'configured-gateway-token', model: 'openai/gpt-5.4-nano' },
    { env: { VERCEL: '1', VERCEL_OIDC_TOKEN: 'configured-env-oidc-token' }, endpoint: 'https://ai-gateway.vercel.sh/v1/responses', token: 'configured-env-oidc-token', model: 'openai/gpt-5.4-nano' },
    { env: { VERCEL: '1', OPENAI_API_KEY: 'configured-openai-token' }, endpoint: 'https://api.openai.com/v1/responses', token: 'configured-openai-token', model: 'gpt-5.6-luna' },
    { env: { VERCEL: '1' }, endpoint: 'https://ai-gateway.vercel.sh/v1/responses', token: 'ignored-runtime-token', model: 'openai/gpt-5.4-nano' },
  ];
  for (const fixture of fixtures) {
    const reply = await requestTarotOracleVision(parseTarotOracleInput(payload), { env: fixture.env, request: runtimeRequest, fetchImpl: (async (url, init) => {
      assert.equal(url, fixture.endpoint);
      assert.equal(new Headers(init?.headers).get('authorization'), `Bearer ${fixture.token}`);
      assert.equal(JSON.parse(String(init?.body)).model, fixture.model);
      return Response.json({ output: [{ content: [{ type: 'output_text', text: 'Vision issue du fournisseur configuré.' }] }] });
    }) as typeof fetch });
    assert.equal(reply, 'Vision issue du fournisseur configuré.');
  }
});

test('GET returns only per-request capabilities without serializing the runtime credential', async () => {
  const names = ['VERCEL', 'AI_GATEWAY_API_KEY', 'VERCEL_OIDC_TOKEN', 'OPENAI_API_KEY'];
  const saved = names.map(name => [name, process.env[name]] as const);
  try {
    for (const name of names) delete process.env[name];
    process.env.VERCEL = '1';
    const runtimeRequest = request(payload, { 'x-vercel-oidc-token': 'runtime-token-not-for-client' });
    const response = await GET(runtimeRequest);
    assert.deepEqual(await response.json(), { available: false, reason: 'AUTH_REQUIRED', loginUrl: '/connexion?next=%2Ftarot', quota: null });
    assert.equal(response.headers.get('x-vercel-oidc-token'), null);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await (await GET(request(payload))).json()).reason, 'AUTH_REQUIRED');
    delete process.env.VERCEL;
    assert.equal((await (await GET(runtimeRequest)).json()).reason, 'AUTH_REQUIRED');
  } finally {
    for (const [name, value] of saved) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});

test('real-provider adapter sends only the permitted context, with non-storage and a timeout', async () => {
  const input = parseTarotOracleInput(payload);
  let providerCalls = 0;
  const mockFetch = (async (url: string | URL | Request, init?: RequestInit) => {
    providerCalls++;
    assert.equal(url, 'https://ai-gateway.vercel.sh/v1/responses');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.store, false);
    assert.equal(body.model, 'openai/test-model');
    assert.equal(body.max_output_tokens, 2200);
    assert.equal('previous_response_id' in body, false);
    assert.equal(init?.signal?.aborted, false);
    assert.equal(Array.isArray(body.input), true);
    assert.equal(body.input.length, 1);
    assert.equal(body.input[0].type, 'message');
    assert.equal(body.input[0].role, 'user');
    assert.match(body.input[0].content, /"carte":"Le Bateleur"/);
    assert.equal(body.instructions, TAROT_ORACLE_GUIDE + AI_AGENT_BOUNDARIES);
    return Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: 'Dans cette vision symbolique, votre projet offre des pistes à explorer.' }] }] });
  }) as typeof fetch;
  const reply = await requestTarotOracleVision(input, { env: { AI_GATEWAY_API_KEY: 'test-not-secret', OPENAI_API_KEY: 'unused-not-secret', SITE_ASSISTANT_MODEL: 'openai/test-model' }, fetchImpl: mockFetch });
  assert.match(reply!, /vision symbolique/);
  assert.equal(providerCalls, 1);
  await requestTarotOracleVision(input, { env: { OPENAI_API_KEY: 'test-not-secret', OPENAI_MODEL: 'direct-test-model' }, fetchImpl: (async (url, init) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, 'direct-test-model');
    assert.equal(body.input[0].role, 'user');
    assert.equal(body.input[0].type, 'message');
    return Response.json({ output: [{ content: [{ type: 'output_text', text: 'Une piste symbolique.' }] }] });
  }) as typeof fetch });
});

test('provider errors, incomplete/empty output and outputs over 500 words never become a fake vision', async () => {
  const env = { OPENAI_API_KEY: 'test-not-secret' };
  const input = parseTarotOracleInput(payload);
  const savedWarn = console.warn;
  const diagnostics: unknown[][] = [];
  console.warn = (...args: unknown[]) => { diagnostics.push(args); };
  try {
    for (const response of [
      new Response('provider body must never be logged', { status: 401 }), new Response('', { status: 429 }),
      Response.json({ error: { code: 'customer_verification_required', message: 'private account details' } }, { status: 403 }),
      Response.json({ error: { type: 'quota_for_entity_exceeded', message: 'private budget details' } }, { status: 402 }),
      Response.json({ error: { code: 'missing_parameter', type: 'invalid_request_error', message: payload.question } }, { status: 400 }),
      Response.json({ error: { type: 'invalid_request_error', message: 'private request details' } }, { status: 400 }),
      Response.json({ error: { code: 'private test-not-secret', type: 'unknown_account_state', message: payload.question } }, { status: 403 }),
      Response.json({ status: 'incomplete', output: [{ content: [{ type: 'output_text', text: 'private incomplete output' }] }] }),
      Response.json({ output: [] }),
    ]) {
      assert.equal(await requestTarotOracleVision(input, { env, fetchImpl: (async () => response) as typeof fetch }), null);
    }
    assert.equal(await requestTarotOracleVision(input, { env, fetchImpl: (async () => { throw new DOMException('private timeout details', 'TimeoutError'); }) as typeof fetch }), null);
    assert.equal(await requestTarotOracleVision(input, { env, fetchImpl: (async () => { throw new Error('private request details with token test-not-secret'); }) as typeof fetch }), null);
  } finally { console.warn = savedWarn; }
  assert.deepEqual(diagnostics, [
    ['TAROT_ORACLE', { code: 'PROVIDER_HTTP', status: 401, providerCode: 'OTHER' }],
    ['TAROT_ORACLE', { code: 'PROVIDER_HTTP', status: 429, providerCode: 'OTHER' }],
    ['TAROT_ORACLE', { code: 'PROVIDER_HTTP', status: 403, providerCode: 'customer_verification_required' }],
    ['TAROT_ORACLE', { code: 'PROVIDER_HTTP', status: 402, providerCode: 'quota_for_entity_exceeded' }],
    ['TAROT_ORACLE', { code: 'PROVIDER_HTTP', status: 400, providerCode: 'missing_parameter' }],
    ['TAROT_ORACLE', { code: 'PROVIDER_HTTP', status: 400, providerCode: 'invalid_request_error' }],
    ['TAROT_ORACLE', { code: 'PROVIDER_HTTP', status: 403, providerCode: 'OTHER' }],
    ['TAROT_ORACLE', { code: 'PROVIDER_OUTPUT' }],
    ['TAROT_ORACLE', { code: 'PROVIDER_OUTPUT' }],
    ['TAROT_ORACLE', { code: 'PROVIDER_TIMEOUT' }],
    ['TAROT_ORACLE', { code: 'PROVIDER_ERROR' }],
  ]);
  for (const sensitive of [payload.question, 'test-not-secret', 'private', 'provider body']) {
    assert.equal(JSON.stringify(diagnostics).includes(sensitive), false);
  }
  assert.equal(extractTarotOracleReply({ output: [{ content: [{ type: 'output_text', text: 'mot '.repeat(501) }] }] }), null);
  assert.equal(extractTarotOracleReply({ output: [{ content: [{ type: 'refusal', refusal: 'no' }] }] }), null);
});

test('ephemeral limiter is bounded, fails closed at capacity and frees expired entries', () => {
  const consume = createTarotOracleLimiter({ limit: 3, windowMs: 10000, maxKeys: 2 });
  assert.equal(consume('client-A', 100).allowed, true);
  assert.equal(consume('client-A', 101).allowed, true);
  assert.equal(consume('client-A', 102).allowed, true);
  assert.equal(consume('client-A', 103).allowed, false);
  assert.equal(consume('client-B', 104).allowed, true);
  assert.equal(consume('client-C', 105).allowed, false);
  assert.equal(consume('client-C', 10105).allowed, true);
  assert.equal(consume('client-A', 10106).allowed, true);
});
