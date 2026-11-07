import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { asRoomState } from './logic';
import type { RoomState, Step } from './types';

const MISSING: Step = { ok: false, error: 'Cette salle n’existe plus.', state: null, dirty: false };

export type OuiLaStore = {
  insert(state: RoomState): Promise<'ok' | 'conflict'>;
  mutate(code: string, now: number, change: (state: RoomState) => Step): Promise<Step>;
};

const memoryRooms = new Map<string, RoomState>();
const memoryQueues = new Map<string, Promise<unknown>>();

function enqueue<T>(code: string, job: () => Promise<T>): Promise<T> {
  const previous = memoryQueues.get(code) ?? Promise.resolve();
  const run = previous.then(job, job);
  memoryQueues.set(code, run.then(() => undefined, () => undefined));
  return run;
}

export function resetOuiLaMemory(): void {
  memoryRooms.clear();
}

const memoryStore: OuiLaStore = {
  async insert(state) {
    if (memoryRooms.has(state.code)) return 'conflict';
    memoryRooms.set(state.code, state);
    return 'ok';
  },
  async mutate(code, now, change) {
    return enqueue(code, async () => {
      const current = memoryRooms.get(code);
      if (!current || current.expiresAt <= now) {
        memoryRooms.delete(code);
        return MISSING;
      }
      const step = change(current);
      if (step.dirty && step.state) memoryRooms.set(code, step.state);
      return step;
    });
  },
};

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "oui_la_rooms" (
          "code" TEXT NOT NULL,
          "state" JSONB NOT NULL,
          "expires_at" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "oui_la_rooms_pkey" PRIMARY KEY ("code")
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "oui_la_rooms_expires_at_idx" ON "oui_la_rooms" ("expires_at")
      `);
      await prisma.$executeRaw`DELETE FROM "oui_la_rooms" WHERE "expires_at" < NOW()`;
    })().catch((error: unknown) => {
      tableReady = null;
      throw error;
    });
  }
  return tableReady;
}

const postgresStore: OuiLaStore = {
  async insert(state) {
    await ensureTable();
    try {
      await prisma.ouiLaRoom.create({
        data: {
          code: state.code,
          state: state as unknown as Prisma.InputJsonValue,
          expiresAt: new Date(state.expiresAt),
        },
      });
      return 'ok';
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return 'conflict';
      throw error;
    }
  },
  async mutate(code, now, change) {
    await ensureTable();
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${code})::bigint)::text`;
      const row = await tx.ouiLaRoom.findUnique({ where: { code } });
      if (!row || row.expiresAt.getTime() <= now) {
        if (row) await tx.ouiLaRoom.delete({ where: { code } });
        return MISSING;
      }
      const current = asRoomState(row.state);
      if (!current) {
        await tx.ouiLaRoom.delete({ where: { code } });
        return MISSING;
      }
      const step = change(current);
      if (step.dirty && step.state) {
        await tx.ouiLaRoom.update({
          where: { code },
          data: {
            state: step.state as unknown as Prisma.InputJsonValue,
            expiresAt: new Date(step.state.expiresAt),
          },
        });
      }
      return step;
    });
  },
};

function databaseConfigured(): boolean {
  return [process.env.DATABASE_URL, process.env.DIRECT_URL, process.env.POSTGRES_URL, process.env.POSTGRES_PRISMA_URL]
    .some((value) => Boolean(value && value.trim()));
}

export function getOuiLaStore(): OuiLaStore {
  if (process.env.OUI_LA_STORE === 'memory' || !databaseConfigured()) return memoryStore;
  return postgresStore;
}
