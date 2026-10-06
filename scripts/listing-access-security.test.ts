import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest } from 'next/server';
import type { User } from '../src/types';
import jwt from 'jsonwebtoken';
import { withAuthDatabase } from './auth-test-database';

test('listing endpoints hide unpublished data and prevent owner self-approval using persisted identities', async () => {
  const oldDbPath = process.env.DB_FILE_PATH;
  const oldJwtSecret = process.env.JWT_SECRET;
  const temporaryRoot = path.join(process.cwd(), 'tmp');
  await mkdir(temporaryRoot, { recursive: true });
  const directory = await mkdtemp(path.join(temporaryRoot, 'listing-security-'));
  process.env.DB_FILE_PATH = path.join(directory, 'db.json');
  process.env.JWT_SECRET = 'listing-security-isolated-secret';
  await withAuthDatabase(async () => {
  try {
    const { signToken } = await import('../src/lib/auth');
    const { writeDatabase, getListingBySlug } = await import('../src/lib/db');
    const { POST } = await import('../src/app/api/logements/route');
    const { GET, PUT, DELETE } = await import('../src/app/api/logements/slug/[slug]/route');
    const makeUser = (id: string, role: User['role'] = 'owner'): User => ({ id, name: id, email: `${id}@example.test`, role, passwordHash: 'unused-test-hash', createdAt: new Date().toISOString() });
    const owner = makeUser('owner-a');
    const stranger = makeUser('owner-b');
    const admin = makeUser('admin', 'admin');
    await writeDatabase({ users: [owner, stranger, admin], listings: [] });
    const request = async (method: string, user?: User, body?: unknown) => {
      let token = ''; if (user) { try { token = await signToken(user); } catch { token = jwt.sign({ sub: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET!); } }
      return new NextRequest('http://localhost:3000/api/logements', {
      method, headers: { ...(user ? { cookie: `nowis_session=${token}` } : {}), origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }); };
    const response = await POST(await request('POST', owner, { title: 'Private listing', status: 'approved' }));
    assert.equal(response.status, 200);
    const { listing } = await response.json();
    assert.equal(listing.status, 'pending');
    const params = { params: Promise.resolve({ slug: listing.slug }) };
    assert.equal((await GET(await request('GET'), params)).status, 404);
    assert.equal((await GET(await request('GET', stranger), params)).status, 404);
    assert.equal((await GET(await request('GET', owner), params)).status, 200);
    assert.equal((await GET(await request('GET', admin), params)).status, 200);
    assert.equal((await PUT(await request('PUT', stranger, { status: 'approved' }), params)).status, 403);
    const forgedRole = { ...owner, role: 'admin' as const };
    const ownerEdit = await PUT(await request('PUT', forgedRole, { status: 'approved' }), params);
    assert.equal(ownerEdit.status, 401);
    const legitimateOwnerEdit = await PUT(await request('PUT', owner, { status: 'approved' }), params);
    assert.equal(legitimateOwnerEdit.status, 200);
    assert.equal((await legitimateOwnerEdit.json()).listing.status, 'pending');
    assert.equal((await PUT(await request('PUT', admin, { status: 'approved' }), params)).status, 200);
    assert.equal((await GET(await request('GET'), params)).status, 200);
    const publishedEdit = await PUT(await request('PUT', owner, { title: 'Edited published content' }), params);
    assert.equal((await publishedEdit.json()).listing.status, 'pending');
    assert.equal((await GET(await request('GET'), params)).status, 404);
    assert.equal((await DELETE(await request('DELETE', stranger), params)).status, 403);
    const deletedUser = makeUser('deleted-user');
    assert.equal((await POST(await request('POST', deletedUser, { title: 'Invalid owner' }))).status, 401);
    assert.equal((await DELETE(await request('DELETE', admin), params)).status, 200);
    assert.equal(await getListingBySlug(listing.slug), undefined);
  } finally {
    if (oldDbPath === undefined) delete process.env.DB_FILE_PATH;
    else process.env.DB_FILE_PATH = oldDbPath;
    if (oldJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldJwtSecret;
    await rm(directory, { recursive: true, force: true });
  }
  });
});
