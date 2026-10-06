import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest } from 'next/server';
import type { User } from '../src/types';

test('listing endpoints hide unpublished data and prevent owner self-approval using persisted identities', async () => {
  const oldDbPath = process.env.DB_FILE_PATH;
  const oldJwtSecret = process.env.JWT_SECRET;
  const temporaryRoot = path.join(process.cwd(), 'tmp');
  await mkdir(temporaryRoot, { recursive: true });
  const directory = await mkdtemp(path.join(temporaryRoot, 'listing-security-'));
  process.env.DB_FILE_PATH = path.join(directory, 'db.json');
  process.env.JWT_SECRET = 'listing-security-isolated-secret';
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
    const request = (method: string, user?: User, body?: unknown) => new NextRequest('http://localhost:3000/api/logements', {
      method, headers: { ...(user ? { cookie: `nowis_session=${signToken(user)}` } : {}), 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const response = await POST(request('POST', owner, { title: 'Private listing', status: 'approved' }));
    assert.equal(response.status, 200);
    const { listing } = await response.json();
    assert.equal(listing.status, 'pending');
    const params = { params: { slug: listing.slug } };
    assert.equal((await GET(request('GET'), params)).status, 404);
    assert.equal((await GET(request('GET', stranger), params)).status, 404);
    assert.equal((await GET(request('GET', owner), params)).status, 200);
    assert.equal((await GET(request('GET', admin), params)).status, 200);
    assert.equal((await PUT(request('PUT', stranger, { status: 'approved' }), params)).status, 403);
    const forgedRole = { ...owner, role: 'admin' as const };
    const ownerEdit = await PUT(request('PUT', forgedRole, { status: 'approved' }), params);
    assert.equal(ownerEdit.status, 200);
    assert.equal((await ownerEdit.json()).listing.status, 'pending');
    assert.equal((await PUT(request('PUT', admin, { status: 'approved' }), params)).status, 200);
    assert.equal((await GET(request('GET'), params)).status, 200);
    const publishedEdit = await PUT(request('PUT', owner, { title: 'Edited published content' }), params);
    assert.equal((await publishedEdit.json()).listing.status, 'pending');
    assert.equal((await GET(request('GET'), params)).status, 404);
    assert.equal((await DELETE(request('DELETE', stranger), params)).status, 403);
    const deletedUser = makeUser('deleted-user');
    assert.equal((await POST(request('POST', deletedUser, { title: 'Invalid owner' }))).status, 401);
    assert.equal((await DELETE(request('DELETE', admin), params)).status, 200);
    assert.equal(await getListingBySlug(listing.slug), undefined);
  } finally {
    if (oldDbPath === undefined) delete process.env.DB_FILE_PATH;
    else process.env.DB_FILE_PATH = oldDbPath;
    if (oldJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldJwtSecret;
    await rm(directory, { recursive: true, force: true });
  }
});
