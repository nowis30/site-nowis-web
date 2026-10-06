import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signClientPortalSession, signClientPortalMagicLink } from '@/features/client-portal/auth/session';
import { hasVerifiedContactRegistration } from '@/features/client-portal/auth/registration-security';
import { POST as register } from '@/app/api/client-auth/register/route';
import { POST as login } from '@/app/api/client-auth/login/route';
import { GET as verifyMagic } from '@/app/(client)/client/auth/verify/route';
import { POST as radioRegister } from '@/app/api/radio/account/route';
import { hashPassword, comparePassword } from '@/lib/auth';
import { withAuthDatabase, contactId, portalId } from './auth-test-database';
process.env.JWT_SECRET = 'isolated-registration-private-signing-fixture-key';
process.env.CLIENT_PORTAL_JWT_SECRET = process.env.JWT_SECRET;
process.env.DATABASE_URL = 'postgresql://isolated:isolated@localhost:1/test';
const request = (path: string, body: unknown, cookie = '') => new NextRequest('https://nowis.store'+path, {
  method: 'POST', headers: { origin: 'https://nowis.store', 'Content-Type': 'application/json', cookie }, body: JSON.stringify(body),
});

test('password login rejects archived and unverified accounts and preserves verified active login', async () => {
  await withAuthDatabase(async state => {
    state.portal.passwordHash = await hashPassword('IsolatedPassword1');
    const body = { email: state.portal.email, password: 'IsolatedPassword1' };
    state.contact.deletedAt = new Date();
    const archived = await login(request('/api/client-auth/login', body));
    assert.equal(archived.status, 401); assert.equal(archived.headers.has('set-cookie'), false);
    state.contact.deletedAt = null;
    const active = await login(request('/api/client-auth/login', body));
    assert.equal(active.status, 200); assert.match(active.headers.get('set-cookie') || '', /nowis_client_session=/);
    state.portal.emailVerifiedAt = null;
    const pending = await login(request('/api/client-auth/login', body));
    assert.equal(pending.status, 401); assert.equal((await pending.json()).code, 'EMAIL_VERIFICATION_REQUIRED');
    assert.equal(pending.headers.has('set-cookie'), false);
  });
});

test('signup cannot attach an unverified email to an existing CRM contact or mutate its dossier', async () => {
  await withAuthDatabase(async state => {
    state.users.splice(1, 1);
    const body = { fullName: 'Attacker', email: state.contact.email, phone: '555-0100', password: 'IsolatedPassword1' };
    const oldToken = jwt.sign({ contactId, tenantId: null, email: state.contact.email, fullName: 'Attacker', scope: 'client-dashboard', role: 'CLIENT' }, process.env.JWT_SECRET!);
    for (const cookie of ['', 'nowis_client_session='+oldToken]) {
      const response = await register(request('/api/client-auth/register', body, cookie));
      assert.equal(response.status, 403); assert.equal((await response.json()).code, 'EMAIL_VERIFICATION_REQUIRED');
      assert.equal(response.headers.has('set-cookie'), false); assert.equal(state.users.length, 1);
    }
    assert.equal(hasVerifiedContactRegistration(state.contact, { scope: 'client-dashboard', role: 'CLIENT', contactId, tenantId: null, email: state.contact.email.toUpperCase(), fullName: 'Owner' }), true);
    assert.equal(hasVerifiedContactRegistration({ ...state.contact, deletedAt: new Date() }, { scope: 'client-dashboard', role: 'CLIENT', contactId, tenantId: null, email: state.contact.email, fullName: 'Owner' }), false);
  });
});

test('emailed links cannot restore archived dossiers, changed email addresses or inactive accounts', async () => {
  for (const change of ['archived', 'changed-email', 'disabled']) await withAuthDatabase(async state => {
    const token = await signClientPortalMagicLink({ contactId, tenantId: null, email: state.portal.email, fullName: state.portal.fullName });
    if (change === 'archived') state.contact.deletedAt = new Date();
    if (change === 'changed-email') state.contact.email = 'changed@example.test';
    if (change === 'disabled') state.portal.isActive = false;
    const response = await verifyMagic(new NextRequest('https://nowis.store/client/auth/verify?token='+encodeURIComponent(token)));
    assert.match(response.headers.get('location') || '', /invalid-link/); assert.equal(response.headers.has('set-cookie'), false);
  });
  await withAuthDatabase(async state => {
    const token = await signClientPortalMagicLink({ contactId, tenantId: null, email: state.portal.email, fullName: state.portal.fullName });
    const valid = await verifyMagic(new NextRequest('https://nowis.store/client/auth/verify?token='+encodeURIComponent(token)));
    assert.match(valid.headers.get('location') || '', /client\/dashboard/); assert.equal(valid.headers.has('set-cookie'), true);
  });
});

test('actual radio signup requires email proof and never activates an attacker-chosen password', async () => {
  const oldFetch = globalThis.fetch, oldKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = 'isolated-email-test-placeholder';
  globalThis.fetch = (async () => new Response(JSON.stringify({ id: 'isolated-message' }), { status: 200, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;
  try {
    await withAuthDatabase(async state => {
      state.users.splice(1, 1);
      const oldCreate = prisma.user.create;
      (prisma.user as any).create = async ({ data }: any) => {
        const user = { ...data, id: portalId, authVersion: 0, contactId, emailVerifiedAt: null, isActive: true };
        delete user.contact; state.users.push(user); return user;
      };
      try {
        const response = await radioRegister(request('/api/radio/account', { fullName: 'Email Owner', email: state.contact.email, password: 'AttackerKnownPassword1', website: '' }));
        assert.equal(response.status, 201);
        assert.equal((await response.json()).verificationRequired, true);
        assert.equal(response.headers.has('set-cookie'), false);
        assert.equal(await comparePassword('AttackerKnownPassword1', state.users[1].passwordHash), false);
        assert.equal(state.users[1].emailVerifiedAt, null);
        assert.equal([...state.resets.values()][0].scope, 'client-verify');
      } finally { (prisma.user as any).create = oldCreate; }
    });
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey;
  }
});
