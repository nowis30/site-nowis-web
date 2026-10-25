// Couche serveur de « Combien de Oui? » : persistance d'une salle par ligne,
// verrouillée (SELECT ... FOR UPDATE) pendant chaque action pour éviter que
// deux joueurs qui répondent en même temps s'écrasent.

import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import {
  GameError,
  backToLobby,
  createRoom,
  endGame,
  forceReveal,
  generateRoomCode,
  joinRoom,
  nextRound,
  normalizeRoomCode,
  parseRoomState,
  removePlayer,
  skipQuestion,
  startGame,
  submitAnswer,
  suggestQuestion,
  updateSettings,
  viewFor,
  type RoomState,
  type RoomView,
} from './engine';

export type SqlQuery = <R = Record<string, unknown>>(sql: string, params: unknown[]) => Promise<R[]>;

export interface RoomDb {
  transaction<T>(fn: (query: SqlQuery) => Promise<T>): Promise<T>;
}

export const ROOM_TTL_HOURS = 6; // une salle inactive disparaît après 6 h
// Prisma enregistre les DateTime en UTC dans des colonnes TIMESTAMP sans fuseau :
// on calcule donc l'heure côté SQL, en UTC, peu importe le fuseau de la session.
const NOW_UTC = `(NOW() AT TIME ZONE 'UTC')`;
const EXPIRES_UTC = `(NOW() AT TIME ZONE 'UTC' + INTERVAL '${ROOM_TTL_HOURS} hours')`;
export const MAX_ACTIVE_ROOMS = 2000;

const random = () => randomInt(0, 1_000_000) / 1_000_000;

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function newPlayerCredentials() {
  const token = randomBytes(24).toString('base64url');
  return { id: randomUUID(), token, tokenHash: hashToken(token) };
}

function findPlayerId(state: RoomState, token: string | null): string | null {
  if (!token || token.length > 100) return null;
  const tokenHash = hashToken(token);
  return state.players.find((player) => player.tokenHash === tokenHash)?.id ?? null;
}

function requireCode(value: unknown): string {
  const code = normalizeRoomCode(value);
  if (!code) throw new GameError(404, 'Code de partie invalide.');
  return code;
}

type RoomRow = { state: unknown; version: number };

async function lockRoom(query: SqlQuery, code: string): Promise<RoomRow> {
  const rows = await query<RoomRow>(
    `SELECT "state", "version" FROM "yes_no_rooms" WHERE "code" = $1 AND "expiresAt" > ${NOW_UTC} FOR UPDATE`,
    [code],
  );
  if (!rows[0]) throw new GameError(404, 'Cette partie n’existe pas ou est expirée.');
  return rows[0];
}

async function saveRoom(query: SqlQuery, code: string, state: RoomState): Promise<number> {
  const rows = await query<{ version: number }>(
    `UPDATE "yes_no_rooms" SET "state" = $2::jsonb, "version" = "version" + 1, "updatedAt" = ${NOW_UTC}, "expiresAt" = ${EXPIRES_UTC} WHERE "code" = $1 RETURNING "version"`,
    [code, JSON.stringify(state)],
  );
  return Number(rows[0]?.version ?? 0);
}

export type SessionResult = { playerId: string; token: string; version: number; room: RoomView };

export async function createGame(db: RoomDb, input: { name: unknown; pack?: unknown; totalRounds?: unknown }): Promise<SessionResult> {
  const host = newPlayerCredentials();
  return db.transaction(async (query) => {
    const now = new Date();
    // Ménage : les salles expirées sont supprimées au passage.
    await query(`WITH removed AS (DELETE FROM "yes_no_rooms" WHERE "expiresAt" < ${NOW_UTC} RETURNING 1) SELECT COUNT(*)::int AS n FROM removed`, []);
    const [{ n: active }] = await query<{ n: number }>('SELECT COUNT(*)::int AS n FROM "yes_no_rooms"', []);
    if (Number(active) >= MAX_ACTIVE_ROOMS) throw new GameError(503, 'Trop de parties en cours. Réessaie dans quelques minutes.');

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const code = generateRoomCode(random);
      const state = createRoom({ code, host, hostName: input.name, pack: input.pack, totalRounds: input.totalRounds, now: now.getTime() });
      const inserted = await query<{ version: number }>(
        `INSERT INTO "yes_no_rooms" ("code", "state", "version", "createdAt", "updatedAt", "expiresAt") VALUES ($1, $2::jsonb, 1, ${NOW_UTC}, ${NOW_UTC}, ${EXPIRES_UTC}) ON CONFLICT ("code") DO NOTHING RETURNING "version"`,
        [code, JSON.stringify(state)],
      );
      if (inserted[0]) {
        return { playerId: host.id, token: host.token, version: Number(inserted[0].version), room: viewFor(state, host.id) };
      }
    }
    throw new GameError(503, 'Impossible de créer une partie pour le moment. Réessaie.');
  });
}

export async function joinGame(db: RoomDb, rawCode: unknown, name: unknown): Promise<SessionResult> {
  const code = requireCode(rawCode);
  const player = newPlayerCredentials();
  return db.transaction(async (query) => {
    const row = await lockRoom(query, code);
    const state = joinRoom(parseRoomState(row.state), player, name, Date.now());
    const version = await saveRoom(query, code, state);
    return { playerId: player.id, token: player.token, version, room: viewFor(state, player.id) };
  });
}

export type ReadResult = { version: number; room: RoomView | null };

/** Lecture seule (pas de verrou). Renvoie room=null si la version n'a pas changé. */
export async function readGame(db: RoomDb, rawCode: unknown, token: string | null, knownVersion?: number): Promise<ReadResult> {
  const code = requireCode(rawCode);
  return db.transaction(async (query) => {
    const rows = await query<RoomRow>(`SELECT "state", "version" FROM "yes_no_rooms" WHERE "code" = $1 AND "expiresAt" > ${NOW_UTC}`, [code]);
    if (!rows[0]) throw new GameError(404, 'Cette partie n’existe pas ou est expirée.');
    const version = Number(rows[0].version);
    if (knownVersion !== undefined && knownVersion === version) return { version, room: null };
    const state = parseRoomState(rows[0].state);
    return { version, room: viewFor(state, findPlayerId(state, token)) };
  });
}

export type GameAction =
  | { type: 'settings'; pack?: unknown; totalRounds?: unknown }
  | { type: 'start' }
  | { type: 'answer'; answer: unknown; guess: unknown }
  | { type: 'reveal' }
  | { type: 'skip' }
  | { type: 'next' }
  | { type: 'end' }
  | { type: 'restart' }
  | { type: 'suggest'; question: unknown }
  | { type: 'kick'; playerId: unknown }
  | { type: 'leave' };

function applyAction(state: RoomState, playerId: string, action: GameAction): RoomState {
  switch (action.type) {
    case 'settings': return updateSettings(state, playerId, action);
    case 'start': return startGame(state, playerId, random);
    case 'answer': return submitAnswer(state, playerId, action.answer, action.guess);
    case 'reveal': return forceReveal(state, playerId);
    case 'skip': return skipQuestion(state, playerId, random);
    case 'next': return nextRound(state, playerId, random);
    case 'end': return endGame(state, playerId);
    case 'restart': return backToLobby(state, playerId);
    case 'suggest': return suggestQuestion(state, playerId, action.question);
    case 'kick':
      if (typeof action.playerId !== 'string') throw new GameError(400, 'Joueur invalide.');
      return removePlayer(state, playerId, action.playerId);
    case 'leave': return removePlayer(state, playerId, playerId);
    default: throw new GameError(400, 'Action inconnue.');
  }
}

const ACTION_TYPES = new Set<GameAction['type']>(['settings', 'start', 'answer', 'reveal', 'skip', 'next', 'end', 'restart', 'suggest', 'kick', 'leave']);

export function parseAction(body: unknown): GameAction {
  if (!body || typeof body !== 'object') throw new GameError(400, 'Requête invalide.');
  const type = (body as { type?: unknown }).type;
  if (typeof type !== 'string' || !ACTION_TYPES.has(type as GameAction['type'])) throw new GameError(400, 'Action inconnue.');
  return body as GameAction;
}

export async function actOnGame(db: RoomDb, rawCode: unknown, token: string | null, action: GameAction): Promise<ReadResult> {
  const code = requireCode(rawCode);
  return db.transaction(async (query) => {
    const row = await lockRoom(query, code);
    const state = parseRoomState(row.state);
    const playerId = findPlayerId(state, token);
    if (!playerId) throw new GameError(403, 'Tu ne fais plus partie de cette partie.');
    const next = applyAction(state, playerId, action);
    const version = await saveRoom(query, code, next);
    const stillPlaying = next.players.some((player) => player.id === playerId);
    return { version, room: viewFor(next, stillPlaying ? playerId : null) };
  });
}
