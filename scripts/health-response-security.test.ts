import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/health/db/route';

test('public health responses never reveal environment, server errors or database configuration', async () => {
  const databaseBefore = process.env.DATABASE_URL;
  const queryBefore = prisma.$queryRaw;
  const logBefore = console.error;
  console.error = () => {};
  try {
    delete process.env.DATABASE_URL;
    const missing = await GET();
    assert.equal(missing.status, 503);
    assert.deepEqual(await missing.json(), { ok: false, code: 'DB_FAIL', message: 'Database unreachable' });
    process.env.DATABASE_URL = 'postgresql://test:not-real@isolated.invalid/test';
    prisma.$queryRaw = (async () => [{ '?column?': 1 }]) as typeof queryBefore;
    const success = await GET();
    assert.equal(success.status, 200);
    assert.equal(success.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await success.json(), { ok: true, code: 'DB_OK', message: 'Database reachable' });
    prisma.$queryRaw = (async () => { throw new Error('Connection with internal-host and secret-password failed'); }) as typeof queryBefore;
    const failure = await GET();
    assert.equal(failure.status, 500);
    assert.equal(failure.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await failure.json(), { ok: false, code: 'DB_FAIL', message: 'Database unreachable' });
  } finally {
    prisma.$queryRaw = queryBefore;
    console.error = logBefore;
    if (databaseBefore === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = databaseBefore;
  }
});
