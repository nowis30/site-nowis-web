import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { signClientPortalSession } from '../src/features/client-portal/auth/session';
import { signClientPortalMagicLink } from '../src/features/client-portal/auth/session';
import { hasVerifiedContactRegistration } from '../src/features/client-portal/auth/registration-security';
import { POST } from '../src/app/api/client-auth/register/route';
import { hashPassword } from '../src/lib/auth';

test('password login refuses an archived dossier even with valid credentials, and preserves active login', async () => {
  const names = ['DATABASE_URL', 'CLIENT_PORTAL_JWT_SECRET'];
  const originalEnv = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const originalFindUser = prisma.user.findFirst;
  Object.assign(process.env, { DATABASE_URL: 'postgresql://isolated:isolated@localhost:1/test', CLIENT_PORTAL_JWT_SECRET: 'isolated-password-login-secret' });
  try {
    const user = { id: 'isolated-login-user', email: 'archived-login@example.test', contactId: 'isolated-login-contact', role: 'PORTAL_USER', isActive: true,
      passwordHash: await hashPassword('IsolatedPassword1'), contact: { id: 'isolated-login-contact', email: 'archived-login@example.test', fullName: 'Isolated Client', deletedAt: new Date() as Date | null } };
    prisma.user.findFirst = (async () => user) as typeof prisma.user.findFirst;
    const { POST: login } = await import('../src/app/api/client-auth/login/route');
    const request = () => new NextRequest('https://nowis.store/api/client-auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'IsolatedPassword1' }) });
    const archived = await login(request());
    assert.equal(archived.status, 401);
    assert.equal(archived.headers.has('set-cookie'), false);
    user.contact.deletedAt = null;
    const active = await login(request());
    assert.equal(active.status, 200);
    assert.match(active.headers.get('set-cookie') || '', /nowis_client_session=/);
  } finally {
    prisma.user.findFirst = originalFindUser;
    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
    await prisma.$disconnect();
  }
});

test('signup cannot attach an unverified email to an existing CRM contact or change its dossier', async () => {
  const oldSecret = process.env.CLIENT_PORTAL_JWT_SECRET;
  process.env.CLIENT_PORTAL_JWT_SECRET = 'registration-security-isolated-secret';
  const originalFindUser = prisma.user.findFirst;
  const originalTransaction = prisma.$transaction;
  let contactChanges = 0;
  let createdUsers = 0;
  const contact = { id: 'existing-private-client', email: 'existing-client@example.test' };
  try {
    prisma.user.findFirst = (async () => null) as typeof prisma.user.findFirst;
    prisma.$transaction = (async (callback: (tx: any) => Promise<unknown>) => callback({
      contact: {
        findFirst: async () => contact,
        update: async () => { contactChanges += 1; throw new Error('Unexpected private dossier change'); },
      },
      user: { create: async () => { createdUsers += 1; throw new Error('Unexpected private account claim'); } },
    })) as typeof prisma.$transaction;
    const body = { fullName: 'Attacker', email: contact.email, phone: '555-0100', password: 'IsolatedPassword1' };
    const request = (cookie = '') => new NextRequest('http://localhost:3000/api/client-auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify(body),
    });
    const anonymous = await POST(request());
    assert.equal(anonymous.status, 403);
    assert.equal((await anonymous.json()).code, 'EMAIL_VERIFICATION_REQUIRED');
    assert.equal(anonymous.headers.has('set-cookie'), false);
    const unrelated = signClientPortalSession({ contactId: 'other-contact', tenantId: null, email: contact.email, fullName: 'Unrelated client' });
    assert.equal((await POST(request(`nowis_client_session=${unrelated}`))).status, 403);
    const wrongEmail = signClientPortalSession({ contactId: contact.id, tenantId: null, email: 'other@example.test', fullName: 'Unrelated email' });
    assert.equal((await POST(request(`nowis_client_session=${wrongEmail}`))).status, 403);
    assert.equal(contactChanges, 0);
    assert.equal(createdUsers, 0);
    assert.equal(hasVerifiedContactRegistration(contact, { scope: 'client-dashboard', role: 'CLIENT', contactId: contact.id, tenantId: null, email: contact.email.toUpperCase(), fullName: 'Verified owner' }), true);
    assert.equal(hasVerifiedContactRegistration({ ...contact, deletedAt: new Date() }, { scope: 'client-dashboard', role: 'CLIENT', contactId: contact.id, tenantId: null, email: contact.email, fullName: 'Archived owner' }), false);
  } finally {
    prisma.user.findFirst = originalFindUser;
    prisma.$transaction = originalTransaction;
    if (oldSecret === undefined) delete process.env.CLIENT_PORTAL_JWT_SECRET;
    else process.env.CLIENT_PORTAL_JWT_SECRET = oldSecret;
    await prisma.$disconnect();
  }
});

test('an emailed login link does not restore an archived dossier or a changed email address', async () => {
  const oldSecret = process.env.CLIENT_PORTAL_JWT_SECRET;
  const originalFindContact = prisma.contact.findUnique;
  process.env.CLIENT_PORTAL_JWT_SECRET = 'magic-link-security-isolated-secret';
  try {
    const { GET } = await import('../src/app/(client)/client/auth/verify/route');
    const identity = { contactId: 'existing-client', tenantId: null, email: 'owner@example.test', fullName: 'Verified owner' };
    const token = signClientPortalMagicLink(identity);
    const request = () => new NextRequest(`http://localhost:3000/client/auth/verify?token=${encodeURIComponent(token)}`);
    let contact = { id: identity.contactId, email: identity.email, fullName: identity.fullName, deletedAt: new Date() as Date | null, userAccount: null as { isActive: boolean } | null };
    prisma.contact.findUnique = (async () => contact) as typeof prisma.contact.findUnique;
    const archived = await GET(request());
    assert.match(archived.headers.get('location') || '', /account-not-found/);
    assert.equal(archived.headers.has('set-cookie'), false);
    contact = { ...contact, email: 'changed@example.test', deletedAt: null };
    const changed = await GET(request());
    assert.match(changed.headers.get('location') || '', /account-not-found/);
    assert.equal(changed.headers.has('set-cookie'), false);
    contact = { ...contact, email: identity.email, userAccount: { isActive: false } };
    const disabled = await GET(request());
    assert.match(disabled.headers.get('location') || '', /account-not-found/);
    assert.equal(disabled.headers.has('set-cookie'), false);
    contact = { ...contact, userAccount: null };
    const valid = await GET(request());
    assert.match(valid.headers.get('location') || '', /client\/dashboard/);
    assert.equal(valid.headers.has('set-cookie'), true);
    assert.equal(valid.headers.get('cache-control'), 'no-store');
  } finally {
    prisma.contact.findUnique = originalFindContact;
    if (oldSecret === undefined) delete process.env.CLIENT_PORTAL_JWT_SECRET;
    else process.env.CLIENT_PORTAL_JWT_SECRET = oldSecret;
    await prisma.$disconnect();
  }
});
