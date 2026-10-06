import { createHash, randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Database = { $queryRaw<T>(query: Prisma.Sql): Promise<T> };
const scope = 'paypal:webhook-receipt';
const hash = (id: string) => createHash('sha256').update(id).digest('hex');
export type WebhookClaim = { state: 'claimed'; owner: string } | { state: 'completed' } | { state: 'pending' };

/** One unique receipt per event, independent of transmission ID and server instance. */
export function createPayPalWebhookReceipts(db: Database = prisma) {
  return {
    async claim(eventId: string): Promise<WebhookClaim> {
      const owner = randomUUID(), identifier = hash(eventId);
      const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        INSERT INTO api_rate_limits (id, scope, identifier, "windowStart", "windowSeconds", count, "resetAt", "createdAt", "updatedAt")
        VALUES (${owner}::uuid, ${scope}, ${identifier}, '1970-01-01'::timestamp, 600, 0, CURRENT_TIMESTAMP + interval '10 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (scope, identifier, "windowStart") DO UPDATE SET id = EXCLUDED.id, "resetAt" = EXCLUDED."resetAt", "updatedAt" = CURRENT_TIMESTAMP
          WHERE api_rate_limits.count = 0 AND api_rate_limits."resetAt" <= CURRENT_TIMESTAMP
        RETURNING id`);
      if (rows.length === 1) return { state: 'claimed', owner };
      const existing = await db.$queryRaw<Array<{ count: number }>>(Prisma.sql`SELECT count FROM api_rate_limits WHERE scope = ${scope} AND identifier = ${identifier} AND "windowStart" = '1970-01-01'::timestamp`);
      return { state: existing[0]?.count === 1 ? 'completed' : 'pending' };
    },
    async complete(owner: string) {
      const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`UPDATE api_rate_limits SET count = 1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ${owner}::uuid AND scope = ${scope} AND count = 0 RETURNING id`);
      if (rows.length !== 1) throw new Error('WEBHOOK_LEASE_LOST');
    },
    async release(owner: string) {
      await db.$queryRaw(Prisma.sql`UPDATE api_rate_limits SET "resetAt" = '1970-01-01'::timestamp, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ${owner}::uuid AND scope = ${scope} AND count = 0 RETURNING id`);
    },
  };
}
