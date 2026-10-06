import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumeAuthGrant, revokeAuthGrant } from '@/lib/auth-grants';
import { signCrmToken, verifyCrmToken, signCrmOtpToken, verifyCrmOtpToken } from '@/features/crm/auth/session';
import { signClientPortalSession, verifyClientPortalSession, signClientPortalMagicLink, verifyClientPortalMagicLink } from '@/features/client-portal/auth/session';
import { adoptVerifiedPortalUser } from '@/lib/verified-account';
import { completePasswordReset, InvalidPasswordReset } from '@/lib/complete-password-reset';
import { comparePassword } from '@/lib/auth';
import { readAuthJson, assertAuthOrigin } from '@/lib/auth-request-security';
import { getAssistantIdentity } from '@/lib/site-assistant-identity';
import { adminId, contactId, withAuthDatabase } from './auth-test-database';
import { getAuthSigningSecret } from '@/lib/auth-signing-secret';
import { GET as redeemMagicLink } from '@/app/(client)/client/auth/verify/route';

const secret = 'test-only-persistent-auth-secret-with-adequate-length';
process.env.JWT_SECRET = secret;
process.env.CLIENT_PORTAL_JWT_SECRET = secret;
const crm = { sub: adminId, role: 'ADMIN' as const, email: 'admin@example.test', fullName: 'Admin Test' };
const portal = { contactId, tenantId: null, email: 'portal@example.test', fullName: 'Portal Test' };

test('sessions require persisted grants and reject every pre-migration JWT and wrong token scope', async () => {
  await withAuthDatabase(async () => {
    assert.equal(await verifyCrmToken(jwt.sign(crm, secret, { expiresIn: '30d' })), null);
    assert.equal(await verifyClientPortalSession(jwt.sign({ ...portal, scope: 'client-dashboard', role: 'CLIENT' }, secret)), null);
    const token = await signCrmToken(crm);
    assert.equal((await verifyCrmToken(token))?.sub, adminId);
    assert.equal(await verifyClientPortalSession(token), null);
    assert.equal(await verifyCrmToken(await signCrmOtpToken({ ...crm, otpCode: '123456' })), null);
  });
});

test('logout, password, email, role, disable, deletion and contact archival invalidate sessions immediately', async () => {
  for (const change of ['logout', 'password', 'email', 'role', 'disabled', 'deleted', 'version']) {
    await withAuthDatabase(async state => {
      const token = await signCrmToken(crm);
      if (change === 'logout') await revokeAuthGrant(token);
      if (change === 'password') state.admin.passwordHash = 'changed-test-placeholder';
      if (change === 'email') state.admin.email = 'changed@example.test';
      if (change === 'role') state.admin.role = 'ASSISTANT';
      if (change === 'disabled') state.admin.isActive = false;
      if (change === 'deleted') state.users.splice(0, 1);
      if (change === 'version') state.admin.authVersion++;
      assert.equal(await verifyCrmToken(token), null, change);
    });
  }
  await withAuthDatabase(async state => {
    const token = await signClientPortalSession(portal);
    state.contact.deletedAt = new Date();
    assert.equal(await verifyClientPortalSession(token), null);
  });
});

test('temporary OTP and magic links persist single-use consumption under concurrent redemption', async () => {
  await withAuthDatabase(async () => {
    for (const [scope, token] of [
      ['crm-otp', await signCrmOtpToken({ ...crm, otpCode: '123456' })],
      ['client-login', await signClientPortalMagicLink(portal)],
    ]) {
      const results = await Promise.all(Array.from({ length: 20 }, () => consumeAuthGrant(token, scope)));
      assert.equal(results.filter(Boolean).length, 1);
      assert.equal(scope === 'crm-otp' ? await verifyCrmOtpToken(token) : await verifyClientPortalMagicLink(token), null);
    }
  });
});

test('changing an account between OTP validation and session exchange cannot mint a fresh authorized session', async () => {
  await withAuthDatabase(async state => {
    const otp = await verifyCrmOtpToken(await signCrmOtpToken({ ...crm, otpCode: '123456' }));
    assert.ok(otp);
    state.admin.authVersion++;
    await assert.rejects(signCrmToken({ ...crm, authIdentityHash: otp.authIdentityHash }), /AUTH_IDENTITY_CHANGED/);
  });
});

test('email proof adopts pending signups with a new unknowable password and invalidates old sessions and links', async () => {
  await withAuthDatabase(async state => {
    const previous = await signClientPortalSession(portal);
    state.portal.emailVerifiedAt = null;
    state.portal.passwordHash = 'attacker-password-placeholder';
    const magic = await signClientPortalMagicLink(portal);
    await adoptVerifiedPortalUser(prisma as any, state.portal.id, 0);
    assert.ok(state.portal.emailVerifiedAt);
    assert.equal(state.portal.authVersion, 1);
    assert.equal(await comparePassword('AttackerKnownPassword1', state.portal.passwordHash), false);
    assert.equal(await verifyClientPortalSession(previous), null);
    assert.equal(await verifyClientPortalMagicLink(magic), null);
    assert.equal(state.removedOauth, 1);
    assert.ok(await verifyClientPortalSession(await signClientPortalSession({ ...portal, authVersion: 1 })));
  });
});

test('pending accounts cannot sign sessions, disabled accounts cannot adopt email proof, reset proves email and revokes old credentials', async () => {
  await withAuthDatabase(async state => {
    const previous = await signClientPortalSession(portal);
    state.portal.emailVerifiedAt = null;
    await assert.rejects(signClientPortalSession(portal), /AUTH_IDENTITY_UNAVAILABLE/);
    const raw = 'a'.repeat(64), tokenHash = createHash('sha256').update(raw).digest('hex');
    state.resets.set(tokenHash, { id: 'reset-test', userId: state.portal.id, authVersion: 0, scope: 'client-verify',
      usedAt: null, expiresAt: new Date(Date.now() + 60_000) });
    await completePasswordReset('client', raw, 'OwnerChosenPassword1');
    assert.equal(await comparePassword('OwnerChosenPassword1', state.portal.passwordHash), true);
    assert.ok(state.portal.emailVerifiedAt);
    assert.equal(await verifyClientPortalSession(previous), null);
    await assert.rejects(completePasswordReset('client', raw, 'AnotherPassword1'), InvalidPasswordReset);
    state.portal.isActive = false;
    await assert.rejects(adoptVerifiedPortalUser(prisma as any, state.portal.id), /AUTH_IDENTITY_UNAVAILABLE/);
  });
});

test('DB outage fails closed; session renewal keeps the server quota identity stable', async () => {
  await withAuthDatabase(async state => {
    const token = await signClientPortalSession(portal);
    // The quota mapper deliberately does a second current identity lookup.
    const oldFind = prisma.user.findFirst;
    (prisma.user as any).findFirst = async () => ({ id: state.portal.id, contactId });
    try {
      assert.equal(await getAssistantIdentity(new Request('https://nowis.store/api/site-assistant/chat', { headers: { cookie: `nowis_client_session=${token}` } })), `contact:${contactId}`);
      await revokeAuthGrant(token);
      const renewed = await signClientPortalSession(portal);
      assert.equal(await getAssistantIdentity(new Request('https://nowis.store/api/site-assistant/chat', { headers: { cookie: `nowis_client_session=${renewed}` } })), `contact:${contactId}`);
      state.unavailable = true;
      await assert.rejects(verifyClientPortalSession(renewed), /database unavailable/);
    } finally { (prisma.user as any).findFirst = oldFind; }
  });
});

test('auth POSTs require same-site origin and bounded JSON', async () => {
  assert.throws(() => assertAuthOrigin(new Request('https://nowis.store/api/client-auth/login')), /provenir/);
  await assert.rejects(readAuthJson(new NextRequest('https://nowis.store/api/client-auth/login', { method: 'POST', headers: {
    origin: 'https://attacker.example', 'content-type': 'application/json' }, body: '{}' })), /provenir/);
  await assert.rejects(readAuthJson(new NextRequest('https://nowis.store/api/client-auth/login', { method: 'POST', headers: {
    origin: 'https://nowis.store', 'content-type': 'application/json' }, body: JSON.stringify({ password: 'x'.repeat(20_000) }) })), /volumineuse/);
});

test('production refuses missing, short and published signing keys even when explicitly configured', () => {
  const oldMode = process.env.NODE_ENV, oldSecret = process.env.JWT_SECRET;
  process.env.NODE_ENV = 'production';
  try {
    for (const key of ['', 'short-private-value', 'change-me-in-production', 'dev-only-secret-must-change-before-prod', 'dev-only-portal-secret-must-change']) {
      process.env.JWT_SECRET = key;
      assert.throws(() => getAuthSigningSecret(['JWT_SECRET'], 'public-development-fallback'), /signature invalide/);
    }
    process.env.JWT_SECRET = 'adequately-long-private-fixture-for-production-tests';
    assert.equal(getAuthSigningSecret(['JWT_SECRET'], 'unused'), process.env.JWT_SECRET);
  } finally {
    if (oldMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldMode;
    if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret;
  }
});

test('actual magic-link route adopts an unverified account, sets a persisted session and refuses replay', async () => {
  await withAuthDatabase(async state => {
    state.portal.emailVerifiedAt = null;
    state.portal.passwordHash = 'pre-registered-attacker-placeholder';
    const magic = await signClientPortalMagicLink(portal);
    const request = () => new NextRequest(`https://nowis.store/client/auth/verify?token=${encodeURIComponent(magic)}`);
    const response = await redeemMagicLink(request());
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get('location')!).pathname, '/client/dashboard');
    const cookie = response.headers.get('set-cookie')?.match(/nowis_client_session=([^;]+)/)?.[1];
    assert.ok(cookie);
    assert.equal((await verifyClientPortalSession(cookie))?.contactId, contactId);
    assert.equal(state.portal.authVersion, 1);
    assert.ok(state.portal.emailVerifiedAt);
    const replay = await redeemMagicLink(request());
    assert.equal(replay.headers.get('set-cookie'), null);
    assert.equal(new URL(replay.headers.get('location')!).searchParams.get('error'), 'invalid-link');
  });
});

test('magic-only clients can log in without a User while inactive accounts and stale links cannot issue cookies', async () => {
  await withAuthDatabase(async state => {
    state.users.splice(1, 1);
    const magic = await signClientPortalMagicLink(portal);
    const response = await redeemMagicLink(new NextRequest(`https://nowis.store/client/auth/verify?token=${encodeURIComponent(magic)}`));
    const cookie = response.headers.get('set-cookie')?.match(/nowis_client_session=([^;]+)/)?.[1];
    assert.ok(cookie);
    assert.equal((await verifyClientPortalSession(cookie))?.contactId, contactId);
  });
  await withAuthDatabase(async state => {
    const magic = await signClientPortalMagicLink(portal);
    state.portal.isActive = false;
    const response = await redeemMagicLink(new NextRequest(`https://nowis.store/client/auth/verify?token=${encodeURIComponent(magic)}`));
    assert.equal(response.headers.get('set-cookie'), null);
  });
});
