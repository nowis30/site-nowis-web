import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const ASSISTANT_DAILY_LIMIT = 20;
export const ASSISTANT_TIME_ZONE = 'America/Toronto';
const SCOPE = 'site-assistant:daily';

export type AssistantQuota = { limit: number; remaining: number; resetAt: string; timeZone: string };
type QuotaRow = { allowed: boolean; count: number; resetAt: Date };
export type QuotaDatabase = { $queryRaw<T>(query: Prisma.Sql): Promise<T> };

/** The database clock defines the calendar day, including 23/25-hour DST days. */
function windowBounds(testTime?: Date) {
  const clock = testTime ? Prisma.sql`${testTime}::timestamptz` : Prisma.sql`CURRENT_TIMESTAMP`;
  return Prisma.sql`SELECT
    ((((${clock} AT TIME ZONE ${ASSISTANT_TIME_ZONE})::date)::timestamp
      AT TIME ZONE ${ASSISTANT_TIME_ZONE}) AT TIME ZONE 'UTC') AS "windowStart",
    ((((${clock} AT TIME ZONE ${ASSISTANT_TIME_ZONE})::date + 1)::timestamp
      AT TIME ZONE ${ASSISTANT_TIME_ZONE}) AT TIME ZONE 'UTC') AS "resetAt"`;
}

function result(row: QuotaRow) {
  return {
    allowed: row.allowed,
    quota: {
      limit: ASSISTANT_DAILY_LIMIT,
      remaining: Math.max(0, ASSISTANT_DAILY_LIMIT - row.count),
      resetAt: row.resetAt.toISOString(),
      timeZone: ASSISTANT_TIME_ZONE,
    } satisfies AssistantQuota,
  };
}

/** One guarded UPSERT locks the unique account/day row; parallel requests cannot pass 20. */
export async function consumeAssistantQuota(identifier: string, db: QuotaDatabase = prisma, testTime?: Date) {
  const rows = await db.$queryRaw<QuotaRow[]>(Prisma.sql`
    WITH bounds AS (${windowBounds(testTime)}), reserved AS (
      INSERT INTO "api_rate_limits"
        ("id", "scope", "identifier", "windowStart", "windowSeconds", "count", "resetAt", "createdAt", "updatedAt")
      SELECT ${randomUUID()}::uuid, ${SCOPE}, ${identifier}, "windowStart",
        EXTRACT(EPOCH FROM ("resetAt" - "windowStart"))::integer, 1, "resetAt", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM bounds WHERE true
      ON CONFLICT ("scope", "identifier", "windowStart") DO UPDATE
        SET "count" = "api_rate_limits"."count" + 1, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "api_rate_limits"."count" < ${ASSISTANT_DAILY_LIMIT}
      RETURNING "count", "resetAt"
    )
    SELECT true AS "allowed", "count", "resetAt" AT TIME ZONE 'UTC' AS "resetAt" FROM reserved
    UNION ALL
    SELECT false AS "allowed", ${ASSISTANT_DAILY_LIMIT}::integer AS "count", "resetAt" AT TIME ZONE 'UTC' AS "resetAt" FROM bounds
      WHERE NOT EXISTS (SELECT 1 FROM reserved)
  `);
  if (rows.length !== 1) throw new Error('ASSISTANT_QUOTA_UNAVAILABLE');
  return result(rows[0]);
}

export async function readAssistantQuota(identifier: string, db: QuotaDatabase = prisma, testTime?: Date) {
  const rows = await db.$queryRaw<QuotaRow[]>(Prisma.sql`
    WITH bounds AS (${windowBounds(testTime)})
    SELECT true AS "allowed", COALESCE(limits."count", 0)::integer AS "count", bounds."resetAt" AT TIME ZONE 'UTC' AS "resetAt"
    FROM bounds LEFT JOIN "api_rate_limits" limits ON limits."scope" = ${SCOPE}
      AND limits."identifier" = ${identifier} AND limits."windowStart" = bounds."windowStart"
  `);
  if (rows.length !== 1) throw new Error('ASSISTANT_QUOTA_UNAVAILABLE');
  return result(rows[0]).quota;
}
