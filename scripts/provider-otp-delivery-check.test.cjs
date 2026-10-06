const test = require('node:test');
const assert = require('node:assert/strict');
const { runDeliveryCheck } = require('./provider-otp-delivery-check.cjs');
const env = { RESEND_API_KEY: 'NEVER_OUTPUT_FIXTURE_KEY', VERCEL: '1', VERCEL_ENV: 'production' };

test('an explicit sole CLI gate is necessary; environment or accidental arguments never authorize an email', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; throw new Error('Unexpected network'); };
  for (const argv of [[], ['--other'], ['--send-authorized-test', '--other']]) {
    assert.equal((await runDeliveryCheck({ argv, env, fetchImpl })).status, 'not_authorized');
  }
  assert.equal((await runDeliveryCheck({ argv: ['--send-authorized-test'], env: { RESEND_API_KEY: env.RESEND_API_KEY }, fetchImpl })).status, 'not_native_production_build');
  assert.equal((await runDeliveryCheck({ argv: ['--send-authorized-test'], env: { VERCEL: '1', VERCEL_ENV: 'production' }, fetchImpl })).status, 'missing_configuration');
  assert.equal(calls, 0);
});

test('one authorized POST uses the fixed sender/recipient/idempotency and harmless crypto code without any sensitive output', async () => {
  const requests = [];
  const report = await runDeliveryCheck({ argv: ['--send-authorized-test'], env, fetchImpl: async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ id: 'NEVER_OUTPUT_PROVIDER_ID' }), { status: 200 });
  } });
  assert.equal(requests.length, 1);
  const { url, options } = requests[0];
  assert.equal(url, 'https://api.resend.com/emails');
  assert.equal(options.method, 'POST');
  assert.equal(options.redirect, 'error');
  assert.equal(options.headers['Idempotency-Key'], 'nowis-security-otp-delivery-20261006');
  const body = JSON.parse(options.body);
  assert.equal(body.from, 'CRM NOWIS <noreply@nowis.store>');
  assert.deepEqual(body.to, ['simonmorin@nowis.store']);
  const code = body.text.match(/Code de test : (\d{6})/)[1];
  assert.ok(body.html.includes(code));
  assert.ok(body.text.includes('ne donne aucun accès'));
  assert.deepEqual(report, { status: 'api_accepted', attempted: true, accepted: true });
  for (const value of [code, env.RESEND_API_KEY, body.from, body.to[0], 'NEVER_OUTPUT_PROVIDER_ID']) assert.ok(!JSON.stringify(report).includes(value));
});

test('timeouts/errors/idempotency conflicts never retry, dump error bodies or claim delivery', async () => {
  for (const [fetchImpl, expected] of [
    [async () => new Response('NEVER_OUTPUT_RAW_BODY', { status: 409 }), 'idempotency_conflict'],
    [async () => { throw new Error('NEVER_OUTPUT_KEY_ADDRESS_ERROR'); }, 'provider_error'],
    [async () => new Response('NEVER_OUTPUT_RAW_BODY', { status: 429 }), 'rate_limited'],
  ]) {
    let calls = 0;
    const report = await runDeliveryCheck({ argv: ['--send-authorized-test'], env, fetchImpl: (...args) => { calls++; return fetchImpl(...args); } });
    assert.equal(calls, 1);
    assert.equal(report.status, expected);
    assert.equal(report.accepted, false);
    assert.ok(!JSON.stringify(report).includes('NEVER_OUTPUT'));
  }
  let calls = 0, aborted = false;
  const report = await runDeliveryCheck({ argv: ['--send-authorized-test'], env, timeoutMs: 20,
    fetchImpl: async (_url, options) => { calls++; options.signal.addEventListener('abort', () => { aborted = true; }); return new Promise(() => {}); } });
  assert.equal(calls, 1);
  assert.equal(aborted, true);
  assert.deepEqual(report, { status: 'timeout', attempted: true, accepted: false });
});

