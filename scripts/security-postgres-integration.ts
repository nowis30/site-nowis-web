import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

async function main() {
  // This test deliberately requires an isolated database. Refuse an accidental
  // production URL BEFORE importing Prisma or executing any database operation.
  const url = new URL(process.env.DATABASE_URL || 'https://missing.invalid');
  if (process.env.NOWIS_ISOLATED_SECURITY_DB !== 'true'
    || !['postgres:', 'postgresql:'].includes(url.protocol)
    || !['127.0.0.1', 'localhost'].includes(url.hostname)
    || url.pathname !== '/nowis_security_ci' || url.username !== 'nowis_security_ci') {
    throw new Error('This test requires the disposable nowis_security_ci database on localhost.');
  }
  const { prisma } = await import('@/lib/prisma');
  const { signCrmToken, verifyCrmToken, signCrmOtpToken, verifyCrmOtpToken } = await import('@/features/crm/auth/session');
  const { signClientPortalSession, verifyClientPortalSession } = await import('@/features/client-portal/auth/session');
  const { consumeAuthGrant, revokeAuthGrant } = await import('@/lib/auth-grants');
  const { getAssistantIdentity } = await import('@/lib/site-assistant-identity');
  const { createAssistantHandlers } = await import('@/lib/site-assistant-handler');
  const { consumeAssistantQuota, readAssistantQuota } = await import('@/lib/site-assistant-quota');
  const suffix = randomUUID();
  try {
    const admin = await prisma.user.create({ data: { email: `admin-${suffix}@invalid.test`, fullName: 'Isolated admin',
      passwordHash: 'isolated-not-a-login-password', role: 'ADMIN', emailVerifiedAt: new Date() } });
    const identity = { sub: admin.id, role: 'ADMIN' as const, email: admin.email, fullName: admin.fullName };
    const token = await signCrmToken(identity);
    assert.equal((await verifyCrmToken(token))?.sub, admin.id);
    await revokeAuthGrant(token);
    assert.equal(await verifyCrmToken(token), null);
    const beforePassword = await signCrmToken(identity);
    await prisma.user.update({ where: { id: admin.id }, data: { passwordHash: 'new-isolated-password-hash' } });
    assert.equal(await verifyCrmToken(beforePassword), null);
    const beforeRole = await signCrmToken(identity);
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'ASSISTANT' } });
    assert.equal(await verifyCrmToken(beforeRole), null);
    const assistantIdentity = { ...identity, role: 'ASSISTANT' as const };
    const challenge = await signCrmOtpToken({ ...assistantIdentity, otpCode: '123456' });
    assert.ok(await verifyCrmOtpToken(challenge));
    const winners = await Promise.all(Array.from({ length: 20 }, () => consumeAuthGrant(challenge, 'crm-otp')));
    assert.equal(winners.filter(Boolean).length, 1);
    assert.equal(await verifyCrmOtpToken(challenge), null);
    const beforeInactive = await signCrmToken(assistantIdentity);
    await prisma.user.update({ where: { id: admin.id }, data: { isActive: false } });
    assert.equal(await verifyCrmToken(beforeInactive), null);
    console.log('PASS: actual Prisma session revocation and one-time concurrent OTP claim');

    const contact = await prisma.contact.create({ data: { fullName: 'Isolated portal', type: 'CLIENT',
      tags: [], email: `portal-${suffix}@invalid.test` } });
    await prisma.user.create({ data: { fullName: contact.fullName, email: contact.email!, passwordHash: 'isolated-no-login',
      role: 'PORTAL_USER', contactId: contact.id, emailVerifiedAt: new Date() } });
    const portal = await signClientPortalSession({ contactId: contact.id, tenantId: null, email: contact.email!, fullName: contact.fullName });
    assert.ok(await verifyClientPortalSession(portal));
    const cookie = `nowis_client_session=${portal}`;
    let calls = 0;
    const handlers = createAssistantHandlers({ identity: getAssistantIdentity,
      consume: id => consumeAssistantQuota(id), read: id => readAssistantQuota(id),
      reply: async () => { calls++; return 'Isolated answer'; }, fallback: () => 'Isolated navigation' });
    const request = () => new Request('http://127.0.0.1:3000/api/site-assistant/chat', {
      method: 'POST', headers: { origin: 'http://127.0.0.1:3000', cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Où écouter la radio ?' }], pathname: '/' }),
    });
    const results = await Promise.all(Array.from({ length: 50 }, () => handlers.POST(request())));
    assert.equal(results.filter(result => result.status === 200).length, 20);
    assert.equal(results.filter(result => result.status === 429).length, 30);
    assert.equal(calls, 20);
    assert.equal((await readAssistantQuota(`contact:${contact.id}`)).remaining, 0);
    await prisma.contact.update({ where: { id: contact.id }, data: { email: `changed-${suffix}@invalid.test` } });
    assert.equal(await verifyClientPortalSession(portal), null);
    assert.equal((await handlers.POST(request())).status, 401);
    assert.equal(calls, 20);
    console.log('PASS: actual Prisma account identity, 50 concurrent requests / 20 commands, email change revokes access');
  } finally {
    // Disposable database destroyed by the CI service lifecycle. Never execute
    // broad deletes or migrate reset against a user-provided database.
    await prisma.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
