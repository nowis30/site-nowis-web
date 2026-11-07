import { requestLocalAiResponse } from '@/lib/local-ai-provider';
const LOCAL_ENV = { NOWIS_LOCAL_QUEUE_URL: 'https://queue.test', NOWIS_LOCAL_QUEUE_SERVICE_KEY: 'queue-fixture' };
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
  assert.equal(isTarotOracleAvailable({ OPENAI_API_KEY: 'test-not-secret' }), false);
  assert.equal(isTarotOracleAvailable({ AI_GATEWAY_API_KEY: '   ' }), false);
  let called = false;
  assert.equal(await requestTarotOracleVision(parseTarotOracleInput(payload), { env: {}, responseImpl: (async () => { called = true; throw new Error('unexpected call'); }) as typeof requestLocalAiResponse }), null);
  assert.equal(called, false);
});

test('runtime OIDC never enables a cloud fallback', async () => {
    const incoming = request(payload, { 'x-vercel-oidc-token': 'not-a-local-credential' });
    for (const env of [{}, {VERCEL:'0'}, {VERCEL:'1'}]) {
      assert.equal(isTarotOracleAvailable(env, incoming), false);
      assert.equal(await requestTarotOracleVision(parseTarotOracleInput(payload), { env, request: incoming, responseImpl: async () => { throw Error('must not run'); } }), null);
    }
    assert.equal(isTarotOracleAvailable(LOCAL_ENV, incoming), true);
  });

test('only explicit local queue credentials enable generation', async () => {
    for (const env of [{OPENAI_API_KEY:'unused'}, {AI_GATEWAY_API_KEY:'unused'}, {VERCEL_OIDC_TOKEN:'unused'}]) assert.equal(isTarotOracleAvailable(env), false);
    let calls=0;
    const reply=await requestTarotOracleVision(parseTarotOracleInput(payload), {env:LOCAL_ENV, responseImpl:async (body) => {
      calls++; assert.equal(body.instructions,TAROT_ORACLE_GUIDE+AI_AGENT_BOUNDARIES);
      assert.equal(body.prompt,buildTarotOraclePrompt(parseTarotOracleInput(payload)));
      return Response.json({status:'completed',output:[{content:[{type:'output_text',text:'Une vision symbolique.'}]}]});
    }});
    assert.equal(reply,'Une vision symbolique.'); assert.equal(calls,1);
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

test('local generation receives only permitted context with bounded output and a deadline', async () => {
    const input=parseTarotOracleInput(payload); let calls=0;
    const reply=await requestTarotOracleVision(input,{env:LOCAL_ENV,responseImpl:async body=>{
      calls++; assert.equal(body.instructions,TAROT_ORACLE_GUIDE+AI_AGENT_BOUNDARIES);
      assert.equal(body.prompt,buildTarotOraclePrompt(input)); assert.equal(body.maxOutputTokens,2200);
      assert.equal(body.timeoutMs,110000); assert.equal('tools' in body,false); assert.equal('journal' in body,false);
      return Response.json({status:'completed',output:[{content:[{type:'output_text',text:'Dans cette vision symbolique, votre projet offre des pistes à explorer.'}]}]});
    }});
    assert.match(reply!,/vision symbolique/);assert.equal(calls,1);
  });

test('provider errors, incomplete/empty output and outputs over 500 words never become a fake vision', async () => {
  const env = { ...LOCAL_ENV, OPENAI_API_KEY: 'test-not-secret' };
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
      assert.equal(await requestTarotOracleVision(input, { env, responseImpl: (async () => response) as typeof requestLocalAiResponse }), null);
    }
    assert.equal(await requestTarotOracleVision(input, { env, responseImpl: (async () => { throw new DOMException('private timeout details', 'TimeoutError'); }) as typeof requestLocalAiResponse }), null);
    assert.equal(await requestTarotOracleVision(input, { env, responseImpl: (async () => { throw new Error('private request details with token test-not-secret'); }) as typeof requestLocalAiResponse }), null);
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
