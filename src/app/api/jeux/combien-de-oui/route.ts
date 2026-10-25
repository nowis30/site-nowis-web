import { NextRequest } from 'next/server';
import { GameError } from '@/lib/yes-no-game/engine';
import { errorResponse, json, readJsonBody } from '@/lib/yes-no-game/http';
import { prismaRoomDb } from '@/lib/yes-no-game/prisma-db';
import { createGame, joinGame } from '@/lib/yes-no-game/service';
import { consumeRateLimit } from '@/lib/rate-limit';
import { getTrustedClientIp } from '@/lib/trusted-client-ip';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const LIMITS = {
  create: { limit: 12, windowMs: 10 * 60 * 1000 },
  join: { limit: 40, windowMs: 10 * 60 * 1000 },
};

/** Créer une partie ({ action: 'create', name, pack, totalRounds }) ou en rejoindre une ({ action: 'join', code, name }). */
export async function POST(request: NextRequest) {
  try {
    const body = (await readJsonBody(request)) as { action?: unknown; name?: unknown; code?: unknown; pack?: unknown; totalRounds?: unknown };
    const action = body.action === 'create' || body.action === 'join' ? body.action : null;
    if (!action) throw new GameError(400, 'Action inconnue.');

    const ip = getTrustedClientIp(request.headers) ?? 'unknown';
    const quota = consumeRateLimit(`yes-no-game:${action}:${ip}`, LIMITS[action].limit, LIMITS[action].windowMs);
    if (!quota.allowed) {
      return json({ error: 'Trop de tentatives. Patiente un peu avant de réessayer.' }, 429);
    }

    const result = action === 'create'
      ? await createGame(prismaRoomDb, { name: body.name, pack: body.pack, totalRounds: body.totalRounds })
      : await joinGame(prismaRoomDb, body.code, body.name);
    return json(result, action === 'create' ? 201 : 200);
  } catch (error) {
    return errorResponse(error);
  }
}
