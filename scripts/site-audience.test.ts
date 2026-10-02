import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import test from 'node:test';
import {
  createLocalSiteAudienceStore,
  getSiteAudienceContext,
  hashSiteAudienceSessionId,
  readSiteAudiencePost,
  retrySiteAudienceTransaction,
  SiteAudienceRequestError,
} from '@/lib/site-audience';
import {
  createSiteAudienceState,
  parseSiteAudienceFile,
  recordSiteAudienceSession,
  siteAudienceSnapshot,
  SITE_AUDIENCE_SESSION_TIMEOUT_MS,
} from '@/lib/site-audience-core';

const SESSION_A = '019a0421-1111-4111-8111-111111111111';
const SESSION_B = '019a0421-2222-4222-8222-222222222222';
const NAMESPACE = 'local:test';
const START = Date.parse('2026-10-01T12:00:00.000Z');
const hashA = hashSiteAudienceSessionId(SESSION_A, NAMESPACE);
const hashB = hashSiteAudienceSessionId(SESSION_B, NAMESPACE);

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost:3011/api/site-audience', {
    method: 'POST',
    headers: { origin: 'http://localhost:3011', 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function statusIs(status: number) {
  return (error: unknown) => error instanceof SiteAudienceRequestError && error.status === status;
}

test('session stable across heartbeats; exact 180 s expires online without adding a visit', () => {
  let state = recordSiteAudienceSession(createSiteAudienceState(START), hashA, START);
  state = recordSiteAudienceSession(state, hashA, START + 60_000);
  assert.equal(state.totalVisits, 1);
  assert.equal(siteAudienceSnapshot(state, START + 239_999, 'local').online, 1);
  assert.equal(siteAudienceSnapshot(state, START + 240_000, 'local').online, 0);
  state = recordSiteAudienceSession(state, hashA, START + 300_000);
  assert.equal(state.totalVisits, 1);
  assert.equal(siteAudienceSnapshot(state, START + 300_000, 'local').online, 1);
});

test('30 minutes of inactivity adds one visit and cleans expired sessions, retaining the total', () => {
  let state = recordSiteAudienceSession(createSiteAudienceState(START), hashA, START);
  state = recordSiteAudienceSession(state, hashB, START);
  state = recordSiteAudienceSession(state, hashA, START + SITE_AUDIENCE_SESSION_TIMEOUT_MS - 1);
  assert.equal(state.totalVisits, 2);
  assert.equal(Object.keys(state.sessions).length, 2);
  state = recordSiteAudienceSession(state, hashA, START + 2 * SITE_AUDIENCE_SESSION_TIMEOUT_MS - 1);
  assert.equal(state.totalVisits, 3);
  assert.deepEqual(Object.keys(state.sessions), [hashA]);
  assert.equal(state.startedAt, new Date(START).toISOString());
});

test('session hashes contain neither raw UUID nor cross-namespace linkage', () => {
  assert.match(hashA, /^[a-f0-9]{64}$/);
  assert.equal(hashSiteAudienceSessionId(SESSION_A.toUpperCase(), NAMESPACE), hashA);
  assert.notEqual(hashSiteAudienceSessionId(SESSION_A, 'site'), hashA);
  assert.equal(hashA.includes(SESSION_A), false);
});

test('file store persists real counts and serializes concurrent callers across instances', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'nowis-audience-test-'));
  t.after(async () => {
    assert.ok(resolve(directory).startsWith(`${resolve(tmpdir())}${sep}`));
    await rm(directory, { recursive: true, force: true });
  });
  const filePath = join(directory, 'site-audience.json');
  let now = START;
  const first = createLocalSiteAudienceStore(filePath, () => now);
  const second = createLocalSiteAudienceStore(filePath, () => now);
  const empty = await first.read(NAMESPACE);
  assert.equal(empty.totalVisits, 0);
  assert.equal(empty.scope, 'local');
  await Promise.all(Array.from({ length: 60 }, (_, index) => (index % 2 ? first : second).record(NAMESPACE, hashA)));
  assert.deepEqual(await second.read(NAMESPACE), { totalVisits: 1, online: 1, startedAt: new Date(START).toISOString(), windowSeconds: 180, scope: 'local' });
  await Promise.all(Array.from({ length: 20 }, (_, index) => (index % 2 ? first : second).record(NAMESPACE, hashB)));
  assert.equal((await first.read(NAMESPACE)).totalVisits, 2);
  assert.equal((await first.read(NAMESPACE)).online, 2);
  now += 180_000;
  assert.equal((await first.read(NAMESPACE)).online, 0);
  now = START + SITE_AUDIENCE_SESSION_TIMEOUT_MS;
  await second.record(NAMESPACE, hashA);
  const restarted = createLocalSiteAudienceStore(filePath, () => now);
  assert.equal((await restarted.read(NAMESPACE)).totalVisits, 3);
  const persisted = await readFile(filePath, 'utf8');
  assert.equal(persisted.includes(SESSION_A), false);
  assert.equal(persisted.includes(SESSION_B), false);
  const parsed = parseSiteAudienceFile(JSON.parse(persisted));
  assert.deepEqual(Object.keys(parsed.namespaces[NAMESPACE].sessions), [hashA]);
  assert.equal((await restarted.read('local:another-origin')).totalVisits, 0);
  assert.equal((await restarted.read(NAMESPACE)).totalVisits, 3);
});

test('corrupt local files fail without replacing the existing count', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'nowis-audience-test-'));
  t.after(async () => {
    assert.ok(resolve(directory).startsWith(`${resolve(tmpdir())}${sep}`));
    await rm(directory, { recursive: true, force: true });
  });
  const filePath = join(directory, 'site-audience.json');
  const original = '{"version":1,"namespaces":{"local:test":{"totalVisits":42}}}';
  await writeFile(filePath, original);
  await assert.rejects(createLocalSiteAudienceStore(filePath).record(NAMESPACE, hashA));
  assert.equal(await readFile(filePath, 'utf8'), original);
});

test('local file requires flag + loopback + absence of Vercel; SQL namespaces stay isolated', () => {
  const local = getSiteAudienceContext('http://localhost:3011/api/site-audience', { SITE_AUDIENCE_LOCAL_STORE: '1', NODE_ENV: 'production' });
  assert.equal(local.useLocalFile, true);
  assert.equal(local.scope, 'local');
  assert.equal(getSiteAudienceContext('http://localhost:3011/api/site-audience', {}).useLocalFile, false);
  assert.equal(getSiteAudienceContext('http://localhost:3011/api/site-audience', { SITE_AUDIENCE_LOCAL_STORE: '1', VERCEL: '1' }).useLocalFile, false);
  const site = getSiteAudienceContext('https://nowis.store/api/site-audience', { SITE_AUDIENCE_LOCAL_STORE: '1' });
  assert.equal(site.useLocalFile, false);
  assert.equal(site.scope, 'site');
  assert.notEqual(local.namespace, site.namespace);
  const preview = getSiteAudienceContext('https://nowis-abc.vercel.app/api/site-audience', { VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_BRANCH_URL: 'nowis-feature.vercel.app' });
  assert.equal(preview.scope, 'preview');
  assert.notEqual(preview.namespace, site.namespace);
  assert.equal(preview.namespace, getSiteAudienceContext('https://nowis-another.vercel.app/api/site-audience', { VERCEL_ENV: 'preview', VERCEL_BRANCH_URL: 'nowis-feature.vercel.app' }).namespace);
  assert.equal(getSiteAudienceContext('https://staging.example.com/api/site-audience', {}).scope, 'preview');
});

test('POST requires strict same origin, valid UUID and explicit audience consent', async () => {
  assert.equal(await readSiteAudiencePost(post({ sessionId: SESSION_A, analyticsConsent: true })), SESSION_A);
  await assert.rejects(readSiteAudiencePost(post({ sessionId: SESSION_A, analyticsConsent: true }, { origin: 'http://localhost:3012' })), statusIs(403));
  await assert.rejects(readSiteAudiencePost(post({ sessionId: SESSION_A, analyticsConsent: true }, { origin: 'https://evil.example' })), statusIs(403));
  await assert.rejects(readSiteAudiencePost(post({ sessionId: SESSION_A, analyticsConsent: true }, { 'sec-fetch-site': 'cross-site' })), statusIs(403));
  await assert.rejects(readSiteAudiencePost(post({ sessionId: SESSION_A, analyticsConsent: false })), statusIs(400));
  await assert.rejects(readSiteAudiencePost(post({ sessionId: 'not-a-uuid', analyticsConsent: true })), statusIs(400));
  await assert.rejects(readSiteAudiencePost(post({ sessionId: SESSION_A, analyticsConsent: true, timestamp: 9999999999999 })), statusIs(400));
  await assert.rejects(readSiteAudiencePost(post('invalid JSON')), statusIs(400));
  await assert.rejects(readSiteAudiencePost(post({ sessionId: SESSION_A, analyticsConsent: true }, { 'content-type': 'text/plain' })), statusIs(415));
});

test('actual body size is bounded even if Content-Length understates it', async () => {
  await assert.rejects(readSiteAudiencePost(post(' '.repeat(1025), { 'content-length': '1' })), statusIs(413));
  await assert.rejects(readSiteAudiencePost(post('{}', { 'content-length': '1025' })), statusIs(413));
});

test('SQL retry only handles transaction/unique conflicts, with a bounded attempt count', async () => {
  let calls = 0;
  const result = await retrySiteAudienceTransaction(async () => {
    calls += 1;
    if (calls === 1) throw { code: 'P2034' };
    if (calls === 2) throw { code: 'P2002' };
    return 'committed';
  }, async () => {});
  assert.equal(result, 'committed');
  assert.equal(calls, 3);
  calls = 0;
  await assert.rejects(retrySiteAudienceTransaction(async () => { calls += 1; throw { code: 'P2021' }; }, async () => {}));
  assert.equal(calls, 1);
  calls = 0;
  await assert.rejects(retrySiteAudienceTransaction(async () => { calls += 1; throw { code: 'P2034' }; }, async () => {}));
  assert.equal(calls, 6);
});
