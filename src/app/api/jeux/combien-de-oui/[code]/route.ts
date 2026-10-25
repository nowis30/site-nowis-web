import { NextRequest } from 'next/server';
import { errorResponse, json, playerToken, readJsonBody } from '@/lib/yes-no-game/http';
import { prismaRoomDb } from '@/lib/yes-no-game/prisma-db';
import { actOnGame, parseAction, readGame } from '@/lib/yes-no-game/service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ code: string }> };

/** État de la partie vu par le joueur. ?v=<version> renvoie room=null si rien n'a changé. */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;
    const rawVersion = request.nextUrl.searchParams.get('v');
    const knownVersion = rawVersion && /^\d{1,9}$/.test(rawVersion) ? Number(rawVersion) : undefined;
    return json(await readGame(prismaRoomDb, code, playerToken(request), knownVersion));
  } catch (error) {
    return errorResponse(error);
  }
}

/** Action d'un joueur : répondre, lancer, révéler, question suivante, etc. */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;
    const action = parseAction(await readJsonBody(request));
    return json(await actOnGame(prismaRoomDb, code, playerToken(request), action));
  } catch (error) {
    return errorResponse(error);
  }
}
