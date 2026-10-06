import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { POST as login } from '@/app/api/crm/auth/login/route';
import { POST as verifyOtp } from '@/app/api/crm/auth/verify-sms/route';
import { matchesCrmOtpCode, verifyCrmOtpToken, verifyCrmToken } from '@/features/crm/auth/session';
import { withAuthDatabase } from './auth-test-database';
import { prisma } from '@/lib/prisma';
import { limitAuth } from '@/lib/auth-request-security';

const envNames = ['NODE_ENV', 'DATABASE_URL', 'JWT_SECRET', 'RESEND_API_KEY', 'CRM_OTP_PHONE', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_PHONE'];
const password = 'TestStaffPassword1';
const staffHash = bcrypt.hashSync(password, 4);

async function isolated(config: Record<string, string>, run: (state: any, sent: Array<{ url: string; init: RequestInit }>) => Promise<void>, delivery: 'ok' | 'rejected' | 'throw' = 'ok') {
  const previous = envNames.map(name => [name, process.env[name]] as const);
  const originalFetch = globalThis.fetch;
  const sent: Array<{ url: string; init: RequestInit }> = [];
  for (const name of envNames) delete process.env[name];
  Object.assign(process.env, { NODE_ENV: 'production', DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    JWT_SECRET: 'test-only-crm-mfa-key-with-adequate-length', ...config });
  globalThis.fetch = async (url, init = {}) => {
    sent.push({ url: String(url), init });
    if (delivery === 'throw') throw new DOMException('Test provider timed out', 'TimeoutError');
    if (delivery === 'rejected') return Response.json({ message: 'Mock provider rejected delivery', name: 'validation_error' }, { status: 503 });
    return Response.json({ id: 'mock-delivery', sid: 'mock-sms-delivery' });
  };
  try {
    await withAuthDatabase(async state => { state.admin.passwordHash = staffHash; await run(state, sent); });
  } finally {
    globalThis.fetch = originalFetch;
    for (const [name, value] of previous) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  }
}

function request(extra: Record<string, unknown> = {}) {
  return new NextRequest('https://nowis.store/api/crm/auth/login', { method: 'POST',
    headers: { Origin: 'https://nowis.store', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ' ADMIN@EXAMPLE.TEST ', password, ...extra }) });
}

function otpRequest(token: string, code: string) {
  return new NextRequest('https://nowis.store/api/crm/auth/verify-sms', { method: 'POST',
    headers: { Origin: 'https://nowis.store', 'Content-Type': 'application/json', Cookie: `crm_otp=${token}` }, body: JSON.stringify({ code }) });
}

function challenge(response: Response) {
  const cookies = response.headers.get('set-cookie') || '';
  assert.doesNotMatch(cookies, /crm_session=/);
  assert.match(cookies, /HttpOnly/);
  assert.match(cookies, /Secure/);
  assert.match(cookies, /Max-Age=600/);
  const token = cookies.match(/crm_otp=([^;]+)/)?.[1];
  assert.ok(token);
  const decoded = jwt.decode(token) as jwt.JwtPayload;
  assert.equal(decoded.scope, 'crm-otp');
  assert.equal(decoded.exp! - decoded.iat!, 600);
  assert.equal(decoded.otpCode, undefined);
  return token;
}

test('production falls back to the persisted staff email and never creates a session before one-time OTP validation', async () => {
  await isolated({ RESEND_API_KEY: 're_test_placeholder' }, async (state, sent) => {
    const response = await login(request({ otpEmail: 'attacker@example.test', to: 'attacker@example.test' }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { requiresOtp: true, otpChannel: 'email', message: 'Un code de vérification a été envoyé au courriel de votre compte.' });
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(sent.length, 1);
    assert.equal(sent[0].url, 'https://api.resend.com/emails');
    const delivery = JSON.parse(String(sent[0].init.body));
    assert.equal(delivery.to, state.admin.email);
    assert.equal(delivery.from, 'CRM NOWIS <noreply@nowis.store>');
    assert.doesNotMatch(JSON.stringify(delivery), /attacker@example/);
    const code = delivery.html.match(/<strong>(\d{6})<\/strong>/)?.[1];
    assert.ok(code);
    const token = challenge(response);
    const payload = await verifyCrmOtpToken(token);
    assert.ok(payload && matchesCrmOtpCode(payload, code));
    assert.equal(await verifyCrmToken(token), null);
    assert.equal(state.grants.size, 1);
    const verified = await verifyOtp(otpRequest(token, code));
    assert.equal(verified.status, 200);
    const session = verified.headers.get('set-cookie')?.match(/crm_session=([^;]+)/)?.[1];
    assert.ok(session);
    assert.equal((await verifyCrmToken(session))?.sub, state.admin.id);
    assert.equal((await verifyOtp(otpRequest(token, code))).status, 401);
  });
});

const smsConfig = { CRM_OTP_PHONE: '+15555550123', TWILIO_ACCOUNT_SID: 'test-account', TWILIO_AUTH_TOKEN: 'test-token', TWILIO_FROM_PHONE: '+15555550124' };
test('fully configured SMS takes priority and has a bounded transport without calling email', async () => {
  await isolated({ ...smsConfig, RESEND_API_KEY: 're_test_placeholder' }, async (_, sent) => {
    const response = await login(request());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).otpChannel, 'sms');
    assert.equal(sent.length, 1);
    assert.equal(sent[0].url, 'https://api.twilio.com/2010-04-01/Accounts/test-account/Messages.json');
    assert.ok(sent[0].init.signal instanceof AbortSignal);
    assert.equal(sent[0].init.signal?.aborted, false);
    const body = new URLSearchParams(String(sent[0].init.body));
    assert.equal(body.get('To'), smsConfig.CRM_OTP_PHONE);
    assert.equal(body.get('From'), smsConfig.TWILIO_FROM_PHONE);
    assert.match(body.get('Body') || '', /\d{6}.*10 minutes/);
    challenge(response);
  });
});

test('incomplete or whitespace-only SMS configuration selects email rather than password-only login', async () => {
  await isolated({ ...smsConfig, TWILIO_AUTH_TOKEN: ' ', RESEND_API_KEY: 're_test_placeholder' }, async (_, sent) => {
    const response = await login(request());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).otpChannel, 'email');
    assert.equal(sent[0].url, 'https://api.resend.com/emails');
    challenge(response);
  });
});

for (const [name, config, delivery] of [
  ['email provider rejection', { RESEND_API_KEY: 're_test_placeholder' }, 'rejected'],
  ['email transport timeout', { RESEND_API_KEY: 're_test_placeholder' }, 'throw'],
  ['missing email provider', {}, 'ok'],
  ['SMS provider rejection', { ...smsConfig, RESEND_API_KEY: 're_test_placeholder' }, 'rejected'],
  ['SMS transport timeout', smsConfig, 'throw'],
] as const) {
  test(name + ' fails closed with 503 and no authentication cookie or grant', async () => {
    await isolated(config, async (state, sent) => {
      const response = await login(request());
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('set-cookie'), null);
      assert.equal(state.grants.size, 0);
      assert.ok(sent.length <= 1, 'SMS failure must not silently switch channels');
    }, delivery);
  });
}

test('invalid credentials and disabled staff never send any verification code', async () => {
  await isolated({ RESEND_API_KEY: 're_test_placeholder' }, async (state, sent) => {
    assert.equal((await login(request({ password: 'WrongPassword1' }))).status, 401);
    state.admin.isActive = false;
    assert.equal((await login(request())).status, 401);
    assert.deepEqual(sent, []);
    assert.equal(state.grants.size, 0);
  });
});

test('password-only login is available only with an explicitly development environment', async () => {
  await isolated({ NODE_ENV: 'development' }, async (state, sent) => {
    const response = await login(request());
    assert.equal(response.status, 200);
    const token = response.headers.get('set-cookie')?.match(/crm_session=([^;]+)/)?.[1];
    assert.ok(token);
    assert.equal((await verifyCrmToken(token))?.sub, state.admin.id);
    assert.deepEqual(sent, []);
  });
  await isolated({ NODE_ENV: 'test' }, async state => {
    const response = await login(request());
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(state.grants.size, 0);
  });
});

test('blocked IPs are refused before creating account counters for email variants', async () => {
  await isolated({ RESEND_API_KEY: 're_test_placeholder' }, async (state, sent) => {
    const originalFind = prisma.apiRateLimit.findUnique;
    const queriedScopes: string[] = [];
    (prisma.apiRateLimit as any).findUnique = async ({ where }: any) => {
      queriedScopes.push(where.scope_identifier_windowStart.scope);
      return { id: 'blocked-ip', count: 30, resetAt: new Date(Date.now() + 60_000) };
    };
    try {
      for (let index = 0; index < 3; index++) assert.equal((await login(request({ email: `variant-${index}@example.test` }))).status, 429);
      assert.deepEqual(queriedScopes, ['crm:login:ip', 'crm:login:ip', 'crm:login:ip']);
      queriedScopes.length = 0;
      for (let index = 0; index < 3; index++) await assert.rejects(limitAuth(request(), 'register', `variant-${index}@example.test`), { status: 429 });
      assert.deepEqual(queriedScopes, ['auth:ip', 'auth:ip', 'auth:ip']);
      assert.equal(state.rateLimits.size, 0);
      assert.equal(state.grants.size, 0);
      assert.deepEqual(sent, []);
    } finally { (prisma.apiRateLimit as any).findUnique = originalFind; }
  });
});
