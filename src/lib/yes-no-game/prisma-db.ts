import type { RoomDb, SqlQuery } from './service';

function databaseConfigured() {
  return ['DATABASE_URL', 'DIRECT_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL', 'POSTGRES_URL_NON_POOLING']
    .some((key) => Boolean(process.env[key]?.trim()));
}

// Même SQL que la migration Prisma (idempotent) : le jeu fonctionne dès le déploiement,
// même si « prisma migrate deploy » n'a pas encore été lancé sur la base.
const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS "yes_no_rooms" (
    "code" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "yes_no_rooms_pkey" PRIMARY KEY ("code")
  )`,
  `CREATE INDEX IF NOT EXISTS "yes_no_rooms_expiresAt_idx" ON "yes_no_rooms"("expiresAt")`,
];

let schemaReady: Promise<void> | null = null;

async function ensureSchema() {
  const { prisma } = await import('@/lib/prisma');
  const [{ exists }] = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(`SELECT to_regclass('public.yes_no_rooms') IS NOT NULL AS "exists"`);
  if (exists) return;
  for (const sql of SCHEMA_SQL) await prisma.$executeRawUnsafe(sql);
}

/** Base de données du site (Postgres via Prisma), requêtes toujours paramétrées. */
export const prismaRoomDb: RoomDb = {
  async transaction(fn) {
    if (!databaseConfigured()) throw new Error('Game database is unavailable.');
    schemaReady ??= ensureSchema().catch((error) => { schemaReady = null; throw error; });
    await schemaReady;
    const { prisma } = await import('@/lib/prisma');
    return prisma.$transaction(async (tx) => {
      const query: SqlQuery = (sql, params) => tx.$queryRawUnsafe(sql, ...params);
      return fn(query);
    }, { timeout: 10_000, maxWait: 5_000 });
  },
};

export const yesNoSchemaSqlForTests = SCHEMA_SQL;
