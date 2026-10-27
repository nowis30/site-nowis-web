import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { signClientPortalSession, signClientPortalMagicLink } from '@/features/client-portal/auth/session';
import { hasVerifiedContactRegistration } from '@/features/client-portal/auth/registration-security';
import { POST as legacyRegister } from '@/app/api/auth/register/route';
import { POST as register } from '@/app/api/client-auth/register/route';
import { POST as login } from '@/app/api/client-auth/login/route';
import { GET as verifyMagic } from '@/app/(client)/client/auth/verify/route';
import { POST as radioRegister } from '@/app/api/radio/account/route';
import { hashPassword } from '@/lib/auth';
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

test('retired public registrations reject every request before reading a body or accessing the database', async () => {
  await withAuthDatabase(async state => {
    const before = JSON.stringify({ users: state.users, contact: state.contact });
    state.unavailable = true;
    for (const [handler, path] of [[register, '/api/client-auth/register'], [radioRegister, '/api/radio/account'], [legacyRegister, '/api/auth/register']] as const) {
      for (const body of [{}, { email: 'new@example.test', password: 'IsolatedPassword1' }]) {
        const req = request(path, body);
        const response = await handler(req);
        assert.equal(response.status, 410);
        assert.equal((await response.json()).code, 'REGISTRATION_CLOSED');
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.equal(response.headers.has('set-cookie'), false);
        assert.equal(req.bodyUsed, false);
      }
    }
    assert.equal(JSON.stringify({ users: state.users, contact: state.contact }), before);
    assert.equal(hasVerifiedContactRegistration(state.contact, { scope: 'client-dashboard', role: 'CLIENT', contactId, tenantId: null, email: state.contact.email, fullName: 'Owner' }), true);
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
