import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { signToken, verifyToken, getTokenFromCookie } from '@/lib/auth';
import {
  signCrmToken, verifyCrmToken, signCrmOtpToken, verifyCrmOtpToken,
  matchesCrmOtpCode, getCrmSessionFromCookieHeader,
} from '@/features/crm/auth/session';

const secret = 'test-only-session-security-secret-with-adequate-length';
process.env.JWT_SECRET = secret;
const crm = { sub: 'admin-a', role: 'ADMIN' as const, email: 'admin@example.test', fullName: 'Admin A' };
const owner = { id: 'owner-a', role: 'owner' as const, email: 'owner@example.test', name: 'Owner A', passwordHash: 'unused', createdAt: '2026-10-05T00:00:00Z' };

test('regular CRM and legacy owner sessions remain usable', () => {
  assert.deepEqual(verifyCrmToken(signCrmToken(crm)), crm);
  assert.deepEqual(verifyCrmToken(jwt.sign(crm, secret, { expiresIn: '30d' })), crm);
  assert.equal(verifyToken(signToken(owner))?.sub, owner.id);
  assert.equal(verifyToken(jwt.sign({ sub: owner.id, role: owner.role, email: owner.email, name: owner.name }, secret, { expiresIn: '30d' }))?.sub, owner.id);
});

test('moving an OTP token into the CRM session cookie cannot bypass SMS', () => {
  const challenge = signCrmOtpToken({ ...crm, otpCode: '123456' });
  assert.equal(verifyCrmToken(challenge), null);
  assert.equal(getCrmSessionFromCookieHeader(`crm_session=${challenge}`), null);
  assert.equal(verifyCrmToken(jwt.sign({ ...crm, otpCode: '123456' }, secret, { expiresIn: '10m' })), null);
});

test('OTP JWT exposes no code and its verifier cannot be checked without the server key', () => {
  const challenge = signCrmOtpToken({ ...crm, otpCode: '123456' });
  const decoded = jwt.decode(challenge) as jwt.JwtPayload;
  assert.equal(decoded.otpCode, undefined);
  assert.equal(decoded.scope, 'crm-otp');
  const payload = verifyCrmOtpToken(challenge);
  assert.ok(payload);
  assert.equal(matchesCrmOtpCode(payload, '123456'), true);
  assert.equal(matchesCrmOtpCode(payload, '654321'), false);
  assert.equal(matchesCrmOtpCode(payload, '1234567'), false);
  const other = verifyCrmOtpToken(signCrmOtpToken({ ...crm, otpCode: '123456' }));
  assert.ok(other);
  assert.notEqual(payload.otpVerifier, other.otpVerifier);
});

test('wrong token purposes, malformed roles and non-HS256 algorithms are rejected', () => {
  assert.equal(verifyCrmOtpToken(signCrmToken(crm)), null);
  assert.equal(verifyToken(signCrmToken(crm)), null);
  assert.equal(verifyCrmToken(signToken(owner)), null);
  assert.equal(verifyCrmToken(jwt.sign({ ...crm, scope: 'client-login' }, secret)), null);
  assert.equal(verifyCrmToken(jwt.sign({ ...crm, role: 'SUPERADMIN' }, secret)), null);
  assert.equal(verifyCrmToken(jwt.sign({ ...crm, sub: 42 }, secret)), null);
  assert.equal(verifyCrmToken(jwt.sign(crm, secret, { algorithm: 'HS384' })), null);
  assert.equal(verifyToken(jwt.sign({ sub: owner.id, role: 'root', email: owner.email, name: owner.name }, secret)), null);
});

test('cookie names must match exactly', () => {
  const token = signToken(owner);
  assert.equal(getTokenFromCookie(`fake_nowis_session=${token}`), null);
  assert.equal(getTokenFromCookie(`other=a; nowis_session=${token}`), token);
  assert.equal(getCrmSessionFromCookieHeader(`fake_crm_session=${signCrmToken(crm)}`), null);
});

test('production never falls back to a publicly known signing secret', () => {
  const oldMode = process.env.NODE_ENV;
  delete process.env.JWT_SECRET;
  process.env.NODE_ENV = 'production';
  try {
    assert.throws(() => signToken(owner), /JWT_SECRET/);
    assert.throws(() => signCrmToken(crm), /JWT_SECRET/);
    assert.equal(verifyToken(jwt.sign({ sub: owner.id, role: owner.role, email: owner.email, name: owner.name }, 'change-me-in-production')), null);
  } finally {
    process.env.JWT_SECRET = secret;
    process.env.NODE_ENV = oldMode;
  }
});
