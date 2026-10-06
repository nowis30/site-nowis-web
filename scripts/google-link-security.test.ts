import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/lib/prisma';
import { canLinkExistingGoogleUser } from '../src/features/client-portal/auth/google-link-security';
import { signClientPortalSession } from '../src/features/client-portal/auth/session';

test('Google does not adopt a pre-created password account without its exact current portal session', async () => {
  const envNames = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'CLIENT_PORTAL_JWT_SECRET', 'RESEND_API_KEY'];
  const oldEnv = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  const originalFindAccount = prisma.clientOAuthAccount.findUnique;
  const originalTransaction = prisma.$transaction;
  Object.assign(process.env, { GOOGLE_CLIENT_ID: 'isolated-google-client', GOOGLE_CLIENT_SECRET: 'isolated-google-secret', CLIENT_PORTAL_JWT_SECRET: 'isolated-google-session-secret' });
  delete process.env.RESEND_API_KEY;
  const contact = { id: 'client-a', email: 'owner@example.test', fullName: 'Verified Owner', phone: null, notes: null, profileMeta: null, tags: [], source: 'radio', deletedAt: null,
    billingLegalName: null, billingEmail: null, billingAddressLine1: null, billingCity: null, billingState: null, billingPostalCode: null, billingCountry: null };
  const existingUser = { id: 'user-a', email: contact.email, fullName: contact.fullName, role: 'PORTAL_USER', isActive: true, contactId: contact.id, contact };
  let currentUser: typeof existingUser | null = existingUser;
  let linkedAccount: { id: string; user: typeof existingUser } | null = null;
  let updates = 0;
  let creations = 0;
  let bindings = 0;
  try {
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = String(input);
      if (url === 'https://oauth2.googleapis.com/token') return new Response(JSON.stringify({ access_token: 'isolated-access-token' }), { status: 200 });
      if (url === 'https://openidconnect.googleapis.com/v1/userinfo') return new Response(JSON.stringify({ sub: 'google-owner-subject', email: contact.email, name: contact.fullName, email_verified: true }), { status: 200 });
      throw new Error('Unexpected network request in isolated test');
    }) as typeof fetch;
    prisma.clientOAuthAccount.findUnique = (async () => linkedAccount) as typeof prisma.clientOAuthAccount.findUnique;
    prisma.$transaction = (async (callback: (tx: any) => Promise<unknown>) => callback({
      user: {
        findFirst: async () => currentUser,
        update: async () => { updates += 1; return existingUser; },
        create: async () => { creations += 1; return existingUser; },
      },
      contact: { findFirst: async () => null, update: async () => { updates += 1; return contact; }, create: async () => contact },
      clientOAuthAccount: { upsert: async () => { bindings += 1; return { id: 'new-binding' }; }, update: async () => ({ id: 'existing-binding' }) },
      activity: { create: async () => ({ id: 'activity' }) }, task: { create: async () => ({ id: 'task' }) },
    })) as typeof prisma.$transaction;
    const { GET } = await import('../src/app/api/client-auth/google/callback/route');
    const request = (portalCookie = '') => new NextRequest('https://nowis.store/api/client-auth/google/callback?state=isolated-state&code=isolated-code', {
      headers: { cookie: `nowis_client_google_state=isolated-state${portalCookie ? `; nowis_client_session=${portalCookie}` : ''}` },
    });
    const noSession = await GET(request());
    assert.match(noSession.headers.get('location') || '', /google-link-login-required/);
    assert.doesNotMatch(noSession.headers.get('set-cookie') || '', /nowis_client_session=/);
    assert.equal(updates, 0);
    assert.equal(bindings, 0);
    const unrelatedSession = signClientPortalSession({ contactId: 'other-client', tenantId: null, email: contact.email, fullName: 'Other client' });
    assert.match((await GET(request(unrelatedSession))).headers.get('location') || '', /google-link-login-required/);
    assert.equal(updates, 0);
    assert.equal(bindings, 0);

    const currentSession = signClientPortalSession({ contactId: contact.id, tenantId: null, email: contact.email, fullName: contact.fullName });
    const authenticated = await GET(request(currentSession));
    assert.match(authenticated.headers.get('location') || '', /client\/facturation/);
    assert.match(authenticated.headers.get('set-cookie') || '', /nowis_client_session=/);
    assert.equal(bindings, 1);

    linkedAccount = { id: 'existing-google-binding', user: existingUser };
    const returningGoogle = await GET(request());
    assert.match(returningGoogle.headers.get('set-cookie') || '', /nowis_client_session=/);
    assert.equal(bindings, 1);

    linkedAccount = null;
    currentUser = null;
    const newGoogle = await GET(request());
    assert.match(newGoogle.headers.get('set-cookie') || '', /nowis_client_session=/);
    assert.equal(creations, 1);
    assert.equal(bindings, 2);
    assert.equal(canLinkExistingGoogleUser({ ...existingUser, isActive: false }, { scope: 'client-dashboard', role: 'CLIENT', contactId: contact.id, tenantId: null, email: contact.email, fullName: contact.fullName }), false);
  } finally {
    globalThis.fetch = originalFetch;
    prisma.clientOAuthAccount.findUnique = originalFindAccount;
    prisma.$transaction = originalTransaction;
    for (const [name, value] of Object.entries(oldEnv)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    await prisma.$disconnect();
  }
});

test('an inactive password account cannot obtain a newly signed magic link', async () => {
  const originalFindContact = prisma.contact.findFirst;
  const originalSign = jwt.sign;
  const oldPortalSecret = process.env.CLIENT_PORTAL_JWT_SECRET;
  const oldResendKey = process.env.RESEND_API_KEY;
  let signedTokens = 0;
  try {
    process.env.CLIENT_PORTAL_JWT_SECRET = 'isolated-disabled-link-secret';
    delete process.env.RESEND_API_KEY;
    jwt.sign = (() => { signedTokens += 1; return 'isolated-unexpected-token'; }) as typeof jwt.sign;
    prisma.contact.findFirst = (async () => ({ id: 'disabled-client', fullName: 'Disabled Client', email: 'disabled@example.test', userAccount: { isActive: false } })) as typeof prisma.contact.findFirst;
    const { POST } = await import('../src/app/api/client-auth/request-link/route');
    const request = new NextRequest('https://nowis.store/api/client-auth/request-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'disabled@example.test' }) });
    const response = await POST(request);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
    assert.equal(signedTokens, 0);
  } finally {
    prisma.contact.findFirst = originalFindContact;
    jwt.sign = originalSign;
    if (oldPortalSecret === undefined) delete process.env.CLIENT_PORTAL_JWT_SECRET;
    else process.env.CLIENT_PORTAL_JWT_SECRET = oldPortalSecret;
    if (oldResendKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oldResendKey;
    await prisma.$disconnect();
  }
});
