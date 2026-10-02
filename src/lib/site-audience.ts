/** Server-only audience storage. No IP address, user agent or browser fingerprint. */
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  createSiteAudienceState,
  parseSiteAudienceFile,
  pruneSiteAudienceSessions,
  recordSiteAudienceSession,
  siteAudienceSnapshot,
  SITE_AUDIENCE_SESSION_TIMEOUT_MS,
  SITE_AUDIENCE_WINDOW_SECONDS,
  type SiteAudienceFile,
  type SiteAudienceScope,
  type SiteAudienceSnapshot,
} from '@/lib/site-audience-core';

export type { SiteAudienceScope, SiteAudienceSnapshot } from '@/lib/site-audience-core';
export { SITE_AUDIENCE_WINDOW_SECONDS } from '@/lib/site-audience-core';

const MAX_BODY_BYTES = 1024;
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
const postSchema = z.object({ sessionId: z.string().uuid(), analyticsConsent: z.literal(true) }).strict();
const localLocks = globalThis as typeof globalThis & { nowisAudienceLocks?: Map<string, Promise<void>> };
const fileLocks = localLocks.nowisAudienceLocks ??= new Map<string, Promise<void>>();

export class SiteAudienceRequestError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hashSiteAudienceSessionId(sessionId: string, namespace: string): string {
  return digest(`${namespace}:${sessionId.toLowerCase()}`);
}

export function getSiteAudienceContext(requestUrl: string, env: NodeJS.ProcessEnv = process.env): {
  namespace: string;
  scope: SiteAudienceScope;
  useLocalFile: boolean;
} {
  const url = new URL(requestUrl);
  const loopback = LOOPBACK_HOSTS.has(url.hostname);
  const useLocalFile = env.SITE_AUDIENCE_LOCAL_STORE === '1' && loopback && !env.VERCEL;
  if (loopback) return { namespace: `local:${digest(url.origin).slice(0, 32)}`, scope: 'local', useLocalFile };
  if (env.VERCEL_ENV === 'preview') {
    const preview = env.VERCEL_BRANCH_URL || env.VERCEL_URL || url.origin;
    return { namespace: `preview:${digest(preview).slice(0, 32)}`, scope: 'preview', useLocalFile: false };
  }
  const publicHosts = new Set(['nowis.store', 'www.nowis.store']);
  for (const candidate of [env.NEXT_PUBLIC_SITE_URL, env.APP_URL]) {
    if (!candidate) continue;
    try {
      const configured = new URL(candidate);
      if (configured.protocol === 'https:' && !LOOPBACK_HOSTS.has(configured.hostname)) publicHosts.add(configured.hostname);
    } catch { /* Invalid optional configuration cannot enable a public namespace. */ }
  }
  if (url.protocol === 'https:' && publicHosts.has(url.hostname)) {
    return { namespace: 'site', scope: 'site', useLocalFile: false };
  }
  return { namespace: `preview:${digest(url.origin).slice(0, 32)}`, scope: 'preview', useLocalFile: false };
}

/** Strict same-origin works for an explicitly enabled local next start too. */
export async function readSiteAudiencePost(request: Request): Promise<string> {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new SiteAudienceRequestError(403, 'Cette demande doit provenir de la même page Nowis.');
  }
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    throw new SiteAudienceRequestError(415, 'Le format JSON est requis.');
  }
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) throw new SiteAudienceRequestError(413, 'Demande trop volumineuse.');
  const reader = request.body?.getReader();
  if (!reader) throw new SiteAudienceRequestError(400, 'Demande vide.');
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new SiteAudienceRequestError(413, 'Demande trop volumineuse.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try {
    const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) throw new Error('Invalid audience payload.');
    return parsed.data.sessionId.toLowerCase();
  } catch {
    throw new SiteAudienceRequestError(400, 'Une session valide et votre accord de mesure d’audience sont requis.');
  }
}

async function withFileLock<T>(path: string, work: () => Promise<T>): Promise<T> {
  const previous = fileLocks.get(path) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => { release = resolve; });
  fileLocks.set(path, current);
  await previous;
  try { return await work(); }
  finally {
    release();
    if (fileLocks.get(path) === current) fileLocks.delete(path);
  }
}

/** Local review only: one Node process, a real persistent file and atomic replacement. */
export function createLocalSiteAudienceStore(filePath: string, clock: () => number = Date.now) {
  async function access(namespace: string, sessionHash?: string): Promise<SiteAudienceSnapshot> {
    return withFileLock(filePath, async () => {
      let file: SiteAudienceFile;
      try { file = parseSiteAudienceFile(JSON.parse(await readFile(filePath, 'utf8'))); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        file = { version: 1, namespaces: {} };
      }
      const now = clock();
      const previous = file.namespaces[namespace] ?? createSiteAudienceState(now);
      const state = sessionHash
        ? recordSiteAudienceSession(previous, sessionHash, now)
        : pruneSiteAudienceSessions(previous, now);
      file.namespaces[namespace] = state;
      await mkdir(dirname(filePath), { recursive: true });
      const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporaryPath, JSON.stringify(file), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
        await rename(temporaryPath, filePath);
      } finally { await unlink(temporaryPath).catch(() => undefined); }
      return siteAudienceSnapshot(state, now, 'local');
    });
  }
  return {
    read: (namespace: string) => access(namespace),
    record: (namespace: string, sessionHash: string) => access(namespace, sessionHash),
  };
}

export async function retrySiteAudienceTransaction<T>(work: () => Promise<T>, pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try { return await work(); }
    catch (error) {
      const code = (error as { code?: unknown })?.code;
      if (!['P2034', 'P2002'].includes(String(code)) || attempt >= 5) throw error;
      await pause(Math.min(200, 10 * 2 ** attempt) + Math.floor(Math.random() * 10));
    }
  }
}

function safeCounterNumber(value: bigint): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Audience counter exceeds the JSON integer range.');
  return Number(value);
}

async function accessSqlAudience(context: ReturnType<typeof getSiteAudienceContext>, sessionHash?: string): Promise<SiteAudienceSnapshot> {
  const databaseConfigured = ['DATABASE_URL', 'DIRECT_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL', 'POSTGRES_URL_NON_POOLING']
    .some((key) => Boolean(process.env[key]?.trim()));
  if (!databaseConfigured) throw new Error('Audience database is unavailable.');
  const { prisma } = await import('@/lib/prisma');
  return retrySiteAudienceTransaction(() => prisma.$transaction(async (tx) => {
    const now = new Date();
    const expiration = new Date(now.getTime() - SITE_AUDIENCE_SESSION_TIMEOUT_MS);
    let counter = await tx.siteAudienceCounter.upsert({
      where: { namespace: context.namespace },
      create: { namespace: context.namespace, startedAt: now },
      update: {},
    });
    if (sessionHash) {
      const key = { namespace: context.namespace, sessionHash };
      const existing = await tx.siteAudienceSession.findUnique({ where: { namespace_sessionHash: key } });
      if (!existing || existing.lastSeenAt <= expiration) {
        counter = await tx.siteAudienceCounter.update({
          where: { namespace: context.namespace },
          data: { totalVisits: { increment: 1 } },
        });
      }
      const lastSeenAt = existing && existing.lastSeenAt > now ? existing.lastSeenAt : now;
      await tx.siteAudienceSession.upsert({
        where: { namespace_sessionHash: key },
        create: { ...key, lastSeenAt },
        update: { lastSeenAt },
      });
    }
    await tx.siteAudienceSession.deleteMany({ where: { namespace: context.namespace, lastSeenAt: { lte: expiration } } });
    const online = await tx.siteAudienceSession.count({
      where: { namespace: context.namespace, lastSeenAt: { gt: new Date(now.getTime() - SITE_AUDIENCE_WINDOW_SECONDS * 1000) } },
    });
    return {
      totalVisits: safeCounterNumber(counter.totalVisits), online, startedAt: counter.startedAt.toISOString(),
      windowSeconds: SITE_AUDIENCE_WINDOW_SECONDS, scope: context.scope,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
}

async function accessSiteAudience(requestUrl: string, sessionId?: string): Promise<SiteAudienceSnapshot> {
  const context = getSiteAudienceContext(requestUrl);
  const sessionHash = sessionId ? hashSiteAudienceSessionId(sessionId, context.namespace) : undefined;
  if (context.useLocalFile) {
    const store = createLocalSiteAudienceStore(join(process.cwd(), '.local-review', 'site-audience.json'));
    return sessionHash ? store.record(context.namespace, sessionHash) : store.read(context.namespace);
  }
  // A SQL failure propagates. It must never switch to a local counter.
  return accessSqlAudience(context, sessionHash);
}

export function readSiteAudience(requestUrl: string): Promise<SiteAudienceSnapshot> {
  return accessSiteAudience(requestUrl);
}

export function recordSiteAudience(requestUrl: string, sessionId: string): Promise<SiteAudienceSnapshot> {
  return accessSiteAudience(requestUrl, sessionId);
}
