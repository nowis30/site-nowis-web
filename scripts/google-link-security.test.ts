import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { GET as callback } from '@/app/api/client-auth/google/callback/route';
import { POST as requestLink } from '@/app/api/client-auth/request-link/route';
import { signClientPortalSession, verifyClientPortalSession } from '@/features/client-portal/auth/session';
import { canLinkExistingGoogleUser } from '@/features/client-portal/auth/google-link-security';
import { hashPassword, comparePassword } from '@/lib/auth';
import { withAuthDatabase, contactId } from './auth-test-database';

process.env.JWT_SECRET = 'isolated-google-private-signing-fixture-at-least-32-bytes';
process.env.CLIENT_PORTAL_JWT_SECRET = process.env.JWT_SECRET;
async function withGoogle(run: () => Promise<void>) {
  const names = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'RESEND_API_KEY'];
  const before = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const oldFetch = globalThis.fetch;
  process.env.GOOGLE_CLIENT_ID = 'isolated-google-client';
  process.env.GOOGLE_CLIENT_SECRET = 'isolated-google-secret';
  delete process.env.RESEND_API_KEY;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    if (url === 'https://oauth2.googleapis.com/token') return new Response(JSON.stringify({ access_token: 'isolated-access-token' }), { status: 200 });
    if (url === 'https://openidconnect.googleapis.com/v1/userinfo') return new Response(JSON.stringify({ sub: 'google-owner-subject', email: 'portal@example.test', name: 'Portal Test', email_verified: true }), { status: 200 });
    throw new Error('Unexpected external request in isolated test');
  }) as typeof fetch;
  try { await run(); } finally {
    globalThis.fetch = oldFetch;
    for (const [name, value] of Object.entries(before)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  }
}
const request = (session = '') => new NextRequest('https://nowis.store/api/client-auth/google/callback?state=isolated-state&code=isolated-code', {
  headers: { cookie: 'nowis_client_google_state=isolated-state'+(session ? '; nowis_client_session='+session : '') },
});
async function withBindings(state: any, run: (binding: any) => Promise<void>) {
  const oldAccount = prisma.clientOAuthAccount.findUnique, oldUpsert = prisma.clientOAuthAccount.upsert;
  const oldContactUpdate = prisma.contact.update, oldRequiredUser = prisma.user.findUniqueOrThrow;
  const binding: any = { current: null, count: 0, missing: false };
  (prisma.clientOAuthAccount as any).findUnique = async () => {
    if (binding.missing) throw new Prisma.PrismaClientKnownRequestError('Isolated schema missing', { code: 'P2021', clientVersion: 'test' });
    return binding.current;
  };
  (prisma.clientOAuthAccount as any).upsert = async () => { binding.count++; binding.current = { id: 'isolated-binding', user: { ...state.portal, contact: state.contact } }; return binding.current; };
  (prisma.contact as any).update = async ({ data }: any) => { Object.assign(state.contact, data); return state.contact; };
  (prisma.user as any).findUniqueOrThrow = async ({ where }: any) => {
    const user = await prisma.user.findUnique({ where }); if (!user) throw new Error('Isolated missing user'); return user;
  };
  try { await run(binding); } finally {
    (prisma.clientOAuthAccount as any).findUnique = oldAccount; (prisma.clientOAuthAccount as any).upsert = oldUpsert;
    (prisma.contact as any).update = oldContactUpdate; (prisma.user as any).findUniqueOrThrow = oldRequiredUser;
  }
}

test('verified Google ownership adopts pending signups only after replacing prior passwords, sessions and provider bindings', async () => {
  await withGoogle(async () => withAuthDatabase(async state => withBindings(state, async binding => {
    state.contact.tags = []; state.portal.passwordHash = await hashPassword('AttackerKnownPassword1');
    const oldSession = await signClientPortalSession({ contactId, tenantId: null, email: state.portal.email, fullName: state.portal.fullName });
    state.portal.emailVerifiedAt = null;
    const response = await callback(request());
    const cookie = response.headers.get('set-cookie')?.match(/nowis_client_session=([^;]+)/)?.[1];
    assert.ok(cookie, response.headers.get('location') || '');
    assert.equal((await verifyClientPortalSession(cookie))?.contactId, contactId);
    assert.equal(state.portal.authVersion, 1); assert.ok(state.portal.emailVerifiedAt);
    assert.equal(await comparePassword('AttackerKnownPassword1', state.portal.passwordHash), false);
    assert.equal(await verifyClientPortalSession(oldSession), null); assert.equal(state.removedOauth, 1);
    assert.equal(binding.count, 1);
    const returning = await callback(request());
    assert.match(returning.headers.get('set-cookie') || '', /nowis_client_session=/);
  })));
});

test('first Google linking of a verified password account requires its exact session and missing OAuth storage fails closed', async () => {
  await withGoogle(async () => withAuthDatabase(async state => withBindings(state, async binding => {
    state.contact.tags = [];
    const denied = await callback(request());
    assert.match(denied.headers.get('location') || '', /google-link-login-required/);
    assert.doesNotMatch(denied.headers.get('set-cookie') || '', /nowis_client_session=/);
    assert.equal(binding.count, 0);
    const session = await signClientPortalSession({ contactId, tenantId: null, email: state.portal.email, fullName: state.portal.fullName });
    const linked = await callback(request(session));
    assert.match(linked.headers.get('set-cookie') || '', /nowis_client_session=/); assert.equal(binding.count, 1);
    binding.missing = true;
    const missing = await callback(request());
    assert.doesNotMatch(missing.headers.get('set-cookie') || '', /nowis_client_session=/);
    assert.equal(binding.count, 1);
    assert.equal(canLinkExistingGoogleUser({ ...state.portal, contact: state.contact, isActive: false }, { scope: 'client-dashboard', role: 'CLIENT', contactId, tenantId: null, email: state.portal.email, fullName: state.portal.fullName }), false);
  })));
});

test('inactive password accounts cannot receive a new magic link or persisted grant', async () => {
  await withAuthDatabase(async state => {
    state.portal.isActive = false;
    const response = await requestLink(new NextRequest('https://nowis.store/api/client-auth/request-link', { method: 'POST',
      headers: { origin: 'https://nowis.store', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: state.portal.email }) }));
    assert.equal(response.status, 200); assert.equal((await response.json()).ok, true);
    assert.equal(state.grants.size, 0);
  });
});
