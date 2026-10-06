import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signClientPortalSession } from '@/features/client-portal/auth/session';
import { POST as workshop } from '@/app/api/workshop-requests/route';
import { POST as contact } from '@/app/api/contact/route';
import { POST as siteContact } from '@/app/api/site/contact/route';
import { submitSongRequestFromWebsite, SongRequestSessionError } from '@/lib/actions/song-request';

const email = 'shared-email@example.test';
const radioContact = '11111111-1111-4111-8111-111111111111';
const privateContact = '22222222-2222-4222-8222-222222222222';
const radioUser = '33333333-3333-4333-8333-333333333333';
const organizationId = '44444444-4444-4444-8444-444444444444';
const fixtureOrigin = 'https://dossier-isolation.example.test';
const fixtureEnvNames = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'NEXT_PUBLIC_SITE_URL', 'APP_URL', 'JWT_SECRET', 'CLIENT_PORTAL_JWT_SECRET'] as const;

const workshopInput = {
  organizationName: 'Organisation Test', contactName: 'Radio member', role: 'Coordination', email,
  phone: '8195551234', city: 'Drummondville', groupType: 'ECOLE', organizationType: 'SCHOOL', audienceType: 'ELEMENTARY',
  ageRange: '8-10 ans', estimatedParticipants: 25, workshopTheme: 'Atelier IA musique',
  objectives: 'Objectifs pédagogiques valides pour les tests automatiques atelier.',
  format: 'IN_PERSON', preferredDays: ['TUESDAY'],
};
const songInput: any = {
  fullName: 'Radio member', email, phone: '8195551234', title: 'Test song', songType: 'PERSONNALISEE',
  language: 'Français', occasion: 'DEMANDE_WEB', eventType: 'GENERAL', recipientName: 'Alice',
  style: 'Pop', mood: 'Joyful', tempo: 'MOYEN', theme: 'Amitié', description: 'A valid song description',
  inspirations: '', lyrics: '', structureVerse: 'Verse', structureChorus: 'Chorus', structureBridge: '',
  fileUrl: '', details: 'A valid song description', budget: '', desiredDeadline: '', source: 'website',
};

function matches(row: any, where: any): boolean {
  return Object.entries(where || {}).every(([key, value]: any) => {
    if (key === 'OR') return value.some((clause: any) => matches(row, clause));
    if (value && typeof value === 'object' && 'equals' in value) {
      return value.mode === 'insensitive' ? String(row[key]).toLowerCase() === String(value.equals).toLowerCase() : row[key] === value.equals;
    }
    return row[key] === value;
  });
}

async function withDatabase(run: (state: any) => Promise<void>, options: { users?: boolean; deleted?: boolean } = {}) {
  // Older CRM victim record appears first, reproducing the real ambiguity of OR id/email searches.
  const contacts: any[] = [
    { id: privateContact, email, fullName: 'Private CRM client', type: 'CLIENT', phone: 'private-phone', source: 'CRM', tags: [], notes: 'Private notes', authVersion: 0, deletedAt: null },
    { id: radioContact, email, fullName: 'Radio member', type: 'PARTICIPANT', phone: null, source: 'radio', tags: [], notes: null, authVersion: 0, deletedAt: options.deleted ? new Date() : null },
  ];
  const users: any[] = options.users === false ? [] : [{ id: radioUser, contactId: radioContact, email, role: 'PORTAL_USER', isActive: true, authVersion: 0, passwordHash: 'test-placeholder', emailVerifiedAt: new Date('2026-01-01') }];
  const org = { id: organizationId, name: 'Organisation Test', city: 'Drummondville', email: 'private-org@example.test', phone: 'private-org-phone', status: 'CLIENT' };
  const links: any[] = [{ id: 'private-org-link', organizationId, contactId: privateContact, email, fullName: 'Private CRM client' }];
  const grants = new Map<string, any>();
  const writes: any[] = [];
  const events: any[] = [];
  const tasks: any[] = [];
  const makeRecord = (kind: string) => async ({ data }: any) => { const row = { id: `${kind}-${events.length + 1}`, ...data }; events.push({ kind, ...row }); return row; };
  const db: any = {
    authGrant: {
      create: async ({ data }: any) => { const row = { usedAt: null, revokedAt: null, ...data }; grants.set(row.tokenHash, row); return row; },
      findUnique: async ({ where }: any) => grants.get(where.tokenHash) || null,
    },
    contact: {
      findFirst: async ({ where }: any) => contacts.find(row => matches(row, where)) || null,
      findUnique: async ({ where }: any) => { const row = contacts.find(row => matches(row, where)); return row ? { ...row, userAccount: users.find(user => user.contactId === row.id) || null } : null; },
      update: async ({ where, data }: any) => { writes.push({ kind: 'contact', id: where.id }); const row = contacts.find(value => value.id === where.id); Object.assign(row, data); return row; },
      create: async () => { throw new Error('Authenticated forms must not create a fallback dossier'); },
    },
    user: {
      findFirst: async ({ where }: any) => users.find(row => matches(row, where)) || null,
      create: async ({ data }: any) => { const row = { id: radioUser, ...data }; users.push(row); return row; },
      update: async ({ where, data }: any) => { writes.push({ kind: 'user', id: where.id }); const row = users.find(value => value.id === where.id); Object.assign(row, data); return row; },
    },
    organization: { findFirst: async () => org, update: async ({ data }: any) => { writes.push({ kind: 'organization' }); Object.assign(org, data); return org; } },
    organizationContact: {
      findFirst: async ({ where }: any) => links.find(row => matches(row, where)) || null,
      update: async ({ where, data }: any) => { writes.push({ kind: 'organizationContact', id: where.id }); const row = links.find(value => value.id === where.id); Object.assign(row, data); return row; },
      create: async ({ data }: any) => { const row = { id: 'new-org-link', ...data }; links.push(row); return row; },
    },
    task: { findFirst: async () => null, create: async ({ data }: any) => { const row = { id: `task-${tasks.length + 1}`, ...data }; tasks.push(row); return row; } },
    activity: { create: makeRecord('activity') }, inquiry: { create: makeRecord('inquiry') },
    message: { create: makeRecord('message') }, workshopRequest: { create: makeRecord('workshop') }, songRequest: { create: makeRecord('song') },
    apiRateLimit: { findUnique: async () => null, create: async ({ data }: any) => ({ id: 'counter', ...data }), deleteMany: async () => ({ count: 0 }) },
  };
  const originalTransaction = prisma.$transaction;
  const originals: Array<[any, string, any]> = [];
  for (const [name, methods] of Object.entries(db)) {
    const delegate = (prisma as any)[name];
    for (const [method, implementation] of Object.entries(methods as any)) {
      originals.push([delegate, method, delegate[method]]); delegate[method] = implementation;
    }
  }
  (prisma as any).$transaction = async (callback: any) => callback(db);
  const oldEnv = fixtureEnvNames.map(name => [name, process.env[name]] as const);
  for (const name of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']) delete process.env[name];
  // Test origins and signing keys are scoped to this mock database. Inherited
  // CI localhost origins must not change which security boundary this test covers.
  process.env.NEXT_PUBLIC_SITE_URL = fixtureOrigin;
  process.env.APP_URL = fixtureOrigin;
  process.env.JWT_SECRET = 'test-only-dossier-isolation-server-key';
  process.env.CLIENT_PORTAL_JWT_SECRET = 'test-only-dossier-isolation-portal-key';
  try { await run({ contacts, users, org, links, writes, events, tasks }); }
  finally {
    (prisma as any).$transaction = originalTransaction;
    for (const [delegate, method, value] of originals) delegate[method] = value;
    for (const [name, value] of oldEnv) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  }
}

async function request(pathname: string, body: unknown, dossier = radioContact, origin = fixtureOrigin) {
  let token: string;
  try { token = await signClientPortalSession({ contactId: dossier, email, fullName: 'Radio member', tenantId: null }); }
  catch { token = 'pre-migration-invalid-token'; }
  return new NextRequest(`${fixtureOrigin}${pathname}`, { method: 'POST', headers: {
    cookie: `nowis_client_session=${token}`, origin, 'content-type': 'application/json',
  }, body: JSON.stringify(body) });
}

test('radio account cannot adopt an older CRM dossier sharing its declared email via an atelier request', async () => {
  await withDatabase(async state => {
    const response = await workshop(await request('/api/workshop-requests', workshopInput));
    assert.equal(response.status, 201);
    assert.equal((await response.json()).contactId, radioContact);
    assert.equal(state.contacts[0].fullName, 'Private CRM client');
    assert.equal(state.contacts[0].phone, 'private-phone');
    assert.equal(state.users[0].contactId, radioContact);
    assert.equal(state.links[0].contactId, privateContact);
    assert.equal(state.org.email, 'private-org@example.test');
    assert.equal(state.writes.some((row: any) => row.kind === 'user'), false);
    assert.equal(state.events.find((row: any) => row.kind === 'workshop').contactId, radioContact);
  });
});

test('both contact endpoints attach messages only to the signed dossier when two records share an email', async () => {
  for (const [path, handler, body] of [
    ['/api/contact', contact, { name: 'Radio member', message: 'A sufficiently long contact message.', serviceType: 'autre' }],
    ['/api/site/contact', siteContact, { fullName: 'Radio member', message: 'A sufficiently long contact message.' }],
  ] as const) {
    await withDatabase(async state => {
      const response = await handler(await request(path, body));
      assert.equal(response.status, 200);
      assert.equal((await response.json()).contactId, radioContact);
      assert.equal(state.contacts[0].fullName, 'Private CRM client');
      assert.equal(state.events.filter((row: any) => row.contactId).every((row: any) => row.contactId === radioContact), true);
    });
  }
});

test('authenticated dossier forms reject foreign origins before business writes', async () => {
  for (const [path, handler, body] of [
    ['/api/workshop-requests', workshop, workshopInput],
    ['/api/contact', contact, { name: 'Radio member', message: 'A sufficiently long contact message.', serviceType: 'autre' }],
    ['/api/site/contact', siteContact, { fullName: 'Radio member', message: 'A sufficiently long contact message.' }],
  ] as const) {
    await withDatabase(async state => {
      const response = await handler(await request(path, body, radioContact, 'https://foreign-origin.example.test'));
      assert.equal(response.status, 403);
      assert.equal(typeof (await response.json()).error, 'string');
      assert.equal(state.writes.length, 0);
      assert.equal(state.events.length, 0);
      assert.equal(state.tasks.length, 0);
    });
  }
});

test('mock dossier fixture restores inherited environment after success and failure', async () => {
  const inherited = fixtureEnvNames.map(name => [name, process.env[name]] as const);
  const assertRestored = () => {
    for (const [name, value] of inherited) assert.equal(process.env[name], value, `Environment restored: ${name}`);
  };
  await withDatabase(async () => {
    assert.equal(process.env.NEXT_PUBLIC_SITE_URL, fixtureOrigin);
    assert.equal(process.env.APP_URL, fixtureOrigin);
  });
  assertRestored();
  await assert.rejects(withDatabase(async () => { throw new Error('Intentional fixture failure'); }), /Intentional fixture failure/);
  assertRestored();
});

test('verified magic-link clients sharing an email with another account can submit without moving that password account', async () => {
  await withDatabase(async state => {
    const response = await workshop(await request('/api/workshop-requests', workshopInput, privateContact));
    assert.equal(response.status, 201);
    assert.equal((await response.json()).contactId, privateContact);
    assert.equal(state.users[0].contactId, radioContact);
    assert.equal(state.events.find((row: any) => row.kind === 'activity').userId, null);
  });
  await withDatabase(async state => {
    const result = await submitSongRequestFromWebsite(songInput, { contactId: privateContact });
    assert.equal(result.contactId, privateContact);
    assert.equal(result.userId, null);
    assert.equal(state.users[0].contactId, radioContact);
    assert.equal(state.writes.some((row: any) => row.kind === 'user'), false);
  });
});

test('normal account and magic-link dossier without a User still create songs and ateliers successfully', async () => {
  for (const users of [true, false]) {
    await withDatabase(async state => {
      const response = await workshop(await request('/api/workshop-requests', workshopInput));
      assert.equal(response.status, 201);
      assert.equal(state.users[0].contactId, radioContact);
    }, { users });
    await withDatabase(async state => {
      const result = await submitSongRequestFromWebsite(songInput, { contactId: radioContact });
      assert.equal(result.contactId, radioContact);
      assert.equal(result.userId, radioUser);
      assert.equal(state.users[0].contactId, radioContact);
    }, { users });
  }
});

test('deleted or missing signed dossier is rejected before business writes; email never repairs the missing identity', async () => {
  for (const dossier of [radioContact, '55555555-5555-4555-8555-555555555555']) {
    for (const [path, handler, body] of [
      ['/api/workshop-requests', workshop, workshopInput],
      ['/api/contact', contact, { name: 'Radio member', message: 'A sufficiently long contact message.', serviceType: 'autre' }],
      ['/api/site/contact', siteContact, { fullName: 'Radio member', message: 'A sufficiently long contact message.' }],
    ] as const) {
      await withDatabase(async state => {
        assert.equal((await handler(await request(path, body, dossier))).status, 401);
        assert.equal(state.writes.length, 0); assert.equal(state.events.length, 0);
      }, { deleted: true });
    }
    await withDatabase(async state => {
      await assert.rejects(submitSongRequestFromWebsite(songInput, { contactId: dossier }), SongRequestSessionError);
      assert.equal(state.writes.length, 0);
    }, { deleted: true });
  }
  await withDatabase(async state => {
    await assert.rejects(submitSongRequestFromWebsite(songInput), SongRequestSessionError);
    assert.equal(state.writes.length, 0);
  });
});
