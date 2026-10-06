import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { signToken, verifyToken, getTokenFromCookie } from '@/lib/auth';
import {
  signCrmToken, verifyCrmToken, signCrmOtpToken, verifyCrmOtpToken,
  matchesCrmOtpCode, getCrmSessionFromCookieHeader,
} from '@/features/crm/auth/session';
import { adminId, withAuthDatabase } from './auth-test-database';

const secret = 'test-only-session-security-secret-with-adequate-length';
process.env.JWT_SECRET = secret;
const crm = { sub: adminId, role: 'ADMIN' as const, email: 'admin@example.test', fullName: 'Admin Test' };
const owner = { id: 'owner-a', role: 'owner' as const, email: 'owner@example.test', name: 'Owner A', passwordHash: 'unused', createdAt: '2026-10-05T00:00:00Z' };

test('new CRM sessions are persisted and pre-upgrade stateless sessions are invalidated', async () => {
  await withAuthDatabase(async () => {
    assert.equal((await verifyCrmToken(await signCrmToken(crm)))?.sub, adminId);
    assert.equal(await verifyCrmToken(jwt.sign(crm, secret, { expiresIn: '30d' })), null);
    assert.equal(await verifyToken(jwt.sign({ sub: owner.id, role: owner.role, email: owner.email, name: owner.name }, secret, { expiresIn: '30d' })), null);
  });
});

test('moving an OTP token into the CRM session cookie cannot bypass SMS', async () => {
  await withAuthDatabase(async () => {
    const challenge = await signCrmOtpToken({ ...crm, otpCode: '123456' });
    assert.equal(await verifyCrmToken(challenge), null);
    assert.equal(await getCrmSessionFromCookieHeader(`crm_session=${challenge}`), null);
    assert.equal(await verifyCrmToken(jwt.sign({ ...crm, otpCode: '123456' }, secret, { expiresIn: '10m' })), null);
  });
});

test('OTP JWT exposes no code and its verifier cannot be checked without the server key', async () => {
  await withAuthDatabase(async () => {
    const challenge = await signCrmOtpToken({ ...crm, otpCode: '123456' });
    const decoded = jwt.decode(challenge) as jwt.JwtPayload;
    assert.equal(decoded.otpCode, undefined);
    assert.equal(decoded.scope, 'crm-otp');
    const payload = await verifyCrmOtpToken(challenge);
    assert.ok(payload);
    assert.equal(matchesCrmOtpCode(payload, '123456'), true);
    assert.equal(matchesCrmOtpCode(payload, '654321'), false);
    assert.equal(matchesCrmOtpCode(payload, '1234567'), false);
    const other = await verifyCrmOtpToken(await signCrmOtpToken({ ...crm, otpCode: '123456' }));
    assert.ok(other);
    assert.notEqual(payload.otpVerifier, other.otpVerifier);
  });
});

test('wrong token purposes, malformed roles and non-HS256 algorithms are rejected', async () => {
  await withAuthDatabase(async () => {
    assert.equal(await verifyCrmOtpToken(await signCrmToken(crm)), null);
    assert.equal(await verifyToken(await signCrmToken(crm)), null);
    for (const token of [
      jwt.sign({ ...crm, scope: 'client-login' }, secret), jwt.sign({ ...crm, role: 'SUPERADMIN' }, secret),
      jwt.sign({ ...crm, sub: 42 }, secret), jwt.sign(crm, secret, { algorithm: 'HS384' }),
    ]) assert.equal(await verifyCrmToken(token), null);
  });
});

test('cookie names must match exactly and duplicate cookies are refused', async () => {
  assert.equal(getTokenFromCookie('fake_nowis_session=test'), null);
  assert.equal(getTokenFromCookie('other=a; nowis_session=test'), 'test');
  assert.equal(getTokenFromCookie('nowis_session=a; nowis_session=b'), null);
  assert.equal(await getCrmSessionFromCookieHeader('fake_crm_session=test'), null);
});

test('production never falls back to public secrets or legacy repository credentials', async () => {
  const oldMode = process.env.NODE_ENV;
  delete process.env.JWT_SECRET;
  process.env.NODE_ENV = 'production';
  try {
    await assert.rejects(signToken(owner), /JWT_SECRET/);
    await assert.rejects(signCrmToken(crm), /JWT_SECRET/);
    assert.equal(await verifyToken(jwt.sign({ sub: owner.id, role: owner.role, email: owner.email, name: owner.name }, 'change-me-in-production')), null);
  } finally {
    process.env.JWT_SECRET = secret;
    if (oldMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldMode;
  }
});
