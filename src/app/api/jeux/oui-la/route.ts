import { randomBytes, randomInt } from 'node:crypto';
import { apply, createRoom, isAnswerValue, present } from '@/lib/oui-la/logic';
import { getOuiLaStore } from '@/lib/oui-la/store';
import { isCeiling, type Ceiling, type GameAction, type PublicRoom } from '@/lib/oui-la/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const buckets = new Map<string, { count: number; reset: number }>();

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip')?.trim() || 'local';
}

function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 4000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.reset < now) buckets.delete(bucketKey);
    }
  }
  const current = buckets.get(key);
  if (!current || current.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

function code(): string {
  return Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
}

function secret(): string {
  return randomBytes(18).toString('hex');
}

function cleanCode(value: unknown): string {
  return String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function ceilingOf(value: unknown, fallback: Ceiling = 'party'): Ceiling {
  return isCeiling(value) ? value : fallback;
}

function roomBody(room: PublicRoom, extra: Record<string, unknown> = {}, status = 200) {
  return json({ ok: true, room, ...extra }, status);
}

function fail(error: string, status = 400, room?: PublicRoom) {
  return json({ ok: false, error, ...(room ? { room } : {}) }, status);
}

export async function POST(request: Request) {
  let raw = '';
  try {
    raw = await request.text();
  } catch {
    return fail('La requête est illisible.');
  }
  if (raw.length > 8000) return fail('Le message est trop gros.');
  let payload: Record<string, unknown> | null = null;
  try {
    payload = asRecord(JSON.parse(raw));
  } catch {
    payload = null;
  }
  if (!payload || typeof payload.action !== 'string') return fail('Action manquante.');

  const action = payload.action;
  const ip = clientIp(request);
  const now = Date.now();
  const store = getOuiLaStore();
  const roomCode = cleanCode(payload.code);
  const token = typeof payload.token === 'string' ? payload.token.slice(0, 80) : null;
  const hostToken = typeof payload.hostToken === 'string' ? payload.hostToken.slice(0, 80) : null;

  try {
    if (action === 'create') {
      if (!allow(`create:${ip}`, 20, 10 * 60 * 1000)) return fail('Trop de salles ouvertes depuis ici. Réessaie dans quelques minutes.', 429);
      const mode = payload.mode === 'mur' ? 'mur' : 'joueur';
      const hostSecret = secret();
      const player = mode === 'joueur'
        ? {
            id: secret(),
            secret: secret(),
            name: String(payload.name ?? ''),
            ceiling: ceilingOf(payload.ceiling),
            adult: payload.adult === true,
          }
        : undefined;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const nextCode = code();
        const created = createRoom({ code: nextCode, hostSecret, now, player });
        if ('error' in created) return fail(created.error);
        const inserted = await store.insert(created);
        if (inserted === 'conflict') continue;
        return roomBody(present(created, player?.secret ?? null, hostSecret, now), {
          code: nextCode,
          token: player?.secret ?? null,
          hostToken: hostSecret,
        });
      }
      return fail('Impossible d’ouvrir une salle pour le moment.', 503);
    }

    if (roomCode.length !== 4) return fail('Le code de salle a 4 caractères.');

    if (action === 'join') {
      if (!allow(`join:${ip}`, 60, 10 * 60 * 1000)) return fail('Trop de tentatives. Réessaie dans quelques minutes.', 429);
      const playerSecret = secret();
      const step = await store.mutate(roomCode, now, (state) => apply(state, {
        type: 'join',
        playerId: secret(),
        secret: playerSecret,
        name: String(payload?.name ?? ''),
        ceiling: ceilingOf(payload?.ceiling),
        adult: payload?.adult === true,
        now,
      }));
      if (!step.ok || !step.state) {
        const message = step.ok ? 'La salle est introuvable.' : step.error;
        return fail(message, message.includes('existe plus') ? 404 : 400);
      }
      const keptHost = hostToken && hostToken === step.state.hostSecret ? hostToken : null;
      return roomBody(present(step.state, playerSecret, keptHost, now), {
        code: roomCode,
        token: playerSecret,
        hostToken: keptHost,
      });
    }

    if (!allow(`play:${ip}`, 2000, 60 * 1000)) return fail('Trop d’activité. Réessaie dans une minute.', 429);

    const game = gameAction(action, payload, token, hostToken, now);
    if (!game) return fail('Action inconnue.');
    const step = await store.mutate(roomCode, now, (state) => apply(state, game));
    if (!step.ok) {
      const room = step.state ? present(step.state, token, hostToken, now) : undefined;
      return fail(step.error, step.error.includes('existe plus') ? 404 : 400, room);
    }
    return roomBody(present(step.state, token, hostToken, now), { code: roomCode });
  } catch (error) {
    console.error('oui-la', error instanceof Error ? error.name : 'error');
    return fail('La salle est indisponible pour le moment.', 503);
  }
}

function gameAction(
  action: string,
  payload: Record<string, unknown>,
  token: string | null,
  hostToken: string | null,
  now: number,
): GameAction | null {
  if (action === 'sync') return { type: 'sync', token, hostToken, now };
  if (action === 'profile') return { type: 'profile', token: token ?? '', ceiling: ceilingOf(payload.ceiling), adult: payload.adult === true, now };
  if (action === 'lock') return { type: 'lock', hostToken: hostToken ?? '', locked: payload.locked === true, now };
  if (action === 'kick') return { type: 'kick', hostToken: hostToken ?? '', playerId: String(payload.playerId ?? '').slice(0, 80), now };
  if (action === 'leave') return { type: 'leave', token: token ?? '', now };
  if (action === 'answer' && isAnswerValue(payload.value)) return { type: 'answer', token: token ?? '', value: payload.value, now };
  if (action === 'believe') return { type: 'believe', token: token ?? '', value: payload.value === true, now };
  if (action === 'veto') return { type: 'veto', token: token ?? '', now };
  if (action === 'reveal') return { type: 'reveal', token, hostToken, now };
  if (action === 'next') return { type: 'next', token, hostToken, now };
  const mode = payload.mode === 'cible' ? 'cible' : payload.mode === 'tous' ? 'tous' : null;
  if (!mode) return null;
  const targetId = typeof payload.targetId === 'string' ? payload.targetId.slice(0, 80) : undefined;
  const roundId = secret();
  if (action === 'draw') return { type: 'draw', token, hostToken, mode, targetId, roundId, now, random: Math.random() };
  if (action === 'ask') {
    return {
      type: 'ask',
      token,
      hostToken,
      mode,
      targetId,
      text: String(payload.text ?? '').slice(0, 240),
      level: ceilingOf(payload.level, 'doux'),
      roundId,
      now,
    };
  }
  return null;
}
