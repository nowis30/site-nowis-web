import { pickBankQuestion, normalizeName, normalizeQuestion } from './questions';
import {
  CEILING_RANK,
  type AnswerValue,
  type Ceiling,
  type GameAction,
  type Player,
  type PublicRoom,
  type RoomState,
  type Round,
  type Step,
} from './types';

export const IDLE_MS = 6 * 60 * 60 * 1000;
export const MAX_LIFE_MS = 12 * 60 * 60 * 1000;
export const QUESTION_MS = 30_000;
export const MAX_PLAYERS = 12;
export const AWAY_MS = 45_000;
export const SEEN_WRITE_MS = 8_000;
export const REVEAL_HOLD_MS = 1_200;
export const ASK_WINDOW_MS = 60_000;
export const ASK_LIMIT = 10;

export function tighter(left: Ceiling, right: Ceiling): Ceiling {
  return CEILING_RANK[left] <= CEILING_RANK[right] ? left : right;
}

export function adultCap(players: { adult: boolean }[]): Ceiling {
  if (!players.length || players.some((player) => !player.adult)) return 'party';
  return 'sans-filtre';
}

export function levelAllowed(level: Ceiling, targets: { ceiling: Ceiling }[], players: { adult: boolean }[]): boolean {
  let cap = adultCap(players);
  for (const target of targets) cap = tighter(cap, target.ceiling);
  return CEILING_RANK[level] <= CEILING_RANK[cap];
}

export function createRoom(input: {
  code: string;
  hostSecret: string;
  now: number;
  player?: { id: string; secret: string; name: string; ceiling: Ceiling; adult: boolean };
}): RoomState | { error: string } {
  const player = input.player
    ? {
        id: input.player.id,
        secret: input.player.secret,
        name: normalizeName(input.player.name) ?? '',
        ceiling: input.player.ceiling,
        adult: input.player.adult,
        seenAt: input.now,
      }
    : null;
  if (input.player && !player?.name) return { error: 'Choisis un nom de 2 à 18 lettres.' };
  return {
    code: input.code,
    hostSecret: input.hostSecret,
    createdAt: input.now,
    updatedAt: input.now,
    expiresAt: input.now + IDLE_MS,
    locked: false,
    notice: null,
    players: player ? [player] : [],
    passesUsed: [],
    seenQuestionIds: [],
    askedAt: [],
    round: null,
  };
}

function clone(input: RoomState): RoomState {
  return {
    ...input,
    players: input.players.map((player) => ({ ...player })),
    passesUsed: [...input.passesUsed],
    seenQuestionIds: [...input.seenQuestionIds],
    askedAt: [...input.askedAt],
    round: input.round
      ? {
          ...input.round,
          targetIds: [...input.round.targetIds],
          answers: input.round.answers.map((answer) => ({ ...answer })),
          belief: input.round.belief.map((belief) => ({ ...belief })),
          vetoes: [...input.round.vetoes],
        }
      : null,
  };
}

function playerBySecret(state: RoomState, token: string | null): Player | null {
  if (!token) return null;
  return state.players.find((player) => player.secret === token) ?? null;
}

function isHost(state: RoomState, hostToken: string | null): boolean {
  return Boolean(hostToken && hostToken === state.hostSecret);
}

function canSteer(state: RoomState, token: string | null, hostToken: string | null): boolean {
  return Boolean(playerBySecret(state, token) || isHost(state, hostToken));
}

function targetsFor(state: RoomState, mode: 'cible' | 'tous', targetId: string | undefined, actor: Player | null): { targets: Player[] } | { error: string } {
  if (!state.players.length) return { error: 'Attends qu’au moins une personne rejoigne la salle.' };
  if (mode === 'tous') return { targets: [...state.players] };
  if (!targetId) return { error: 'Choisis qui doit répondre.' };
  const target = state.players.find((player) => player.id === targetId);
  if (!target) return { error: 'Cette personne n’est plus dans la salle.' };
  if (actor && actor.id === target.id) return { error: 'Pose-la à quelqu’un d’autre.' };
  return { targets: [target] };
}

function rememberQuestion(state: RoomState, id: string | null, now: number) {
  state.askedAt = [...state.askedAt.filter((at) => now - at < ASK_WINDOW_MS), now];
  if (!id) return;
  state.seenQuestionIds = [...state.seenQuestionIds, id].slice(-48);
}

function openRound(state: RoomState, round: Round, now: number, bankId: string | null): Step {
  if (state.askedAt.filter((at) => now - at < ASK_WINDOW_MS).length >= ASK_LIMIT) {
    return { ok: false, error: 'Doucement. Laisse la salle répondre.', state: null, dirty: false };
  }
  state.round = round;
  state.notice = null;
  rememberQuestion(state, bankId, now);
  return commit(state, now);
}

function commit(state: RoomState, now: number): Step {
  state.updatedAt = now;
  state.expiresAt = Math.min(state.createdAt + MAX_LIFE_MS, now + IDLE_MS);
  return { ok: true, state, dirty: true };
}

function fail(error: string, state: RoomState | null, dirty: boolean, now: number): Step {
  if (state && dirty) {
    state.updatedAt = now;
    state.expiresAt = Math.min(state.createdAt + MAX_LIFE_MS, now + IDLE_MS);
  }
  return { ok: false, error, state: dirty ? state : null, dirty };
}

function dropMissingTargets(state: RoomState, now: number) {
  if (!state.round || state.round.status !== 'open') return;
  const ids = new Set(state.players.map((player) => player.id));
  state.round.targetIds = state.round.targetIds.filter((id) => ids.has(id));
  state.round.answers = state.round.answers.filter((answer) => ids.has(answer.playerId));
  if (!state.round.targetIds.length) {
    state.round = null;
    state.notice = 'La question est tombée : plus personne pour répondre.';
    return;
  }
  closeIfComplete(state, now);
}

function closeIfComplete(state: RoomState, now: number) {
  if (!state.round || state.round.status !== 'open') return;
  const done = new Set(state.round.answers.map((answer) => answer.playerId));
  if (state.round.targetIds.every((id) => done.has(id))) {
    state.round.status = 'reveal';
    state.round.revealedAt = now;
  }
}

export function apply(input: RoomState, action: GameAction): Step {
  const state = clone(input);
  let dirty = false;
  if (state.round?.status === 'open' && action.now >= state.round.deadline) {
    state.round = { ...state.round, status: 'reveal', revealedAt: action.now };
    dirty = true;
  }

  switch (action.type) {
    case 'sync': {
      const player = playerBySecret(state, action.token);
      if (player && action.now - player.seenAt >= SEEN_WRITE_MS) {
        player.seenAt = action.now;
        dirty = true;
      }
      return dirty ? commit(state, action.now) : { ok: true, state: input, dirty: false };
    }
    case 'join': {
      if (state.locked) return fail('La salle est barrée.', state, dirty, action.now);
      if (state.players.length >= MAX_PLAYERS) return fail('La salle est pleine.', state, dirty, action.now);
      const name = normalizeName(action.name);
      if (!name) return fail('Choisis un nom de 2 à 18 lettres.', state, dirty, action.now);
      if (state.players.some((player) => player.name.localeCompare(name, 'fr', { sensitivity: 'base' }) === 0)) {
        return fail('Ce nom est déjà pris.', state, dirty, action.now);
      }
      state.players.push({
        id: action.playerId,
        secret: action.secret,
        name,
        ceiling: action.ceiling,
        adult: action.adult,
        seenAt: action.now,
      });
      return commit(state, action.now);
    }
    case 'profile': {
      const player = playerBySecret(state, action.token);
      if (!player) return fail('Rejoins la salle pour changer ton plafond.', state, dirty, action.now);
      player.ceiling = action.ceiling;
      player.adult = action.adult;
      player.seenAt = action.now;
      return commit(state, action.now);
    }
    case 'lock': {
      if (!isHost(state, action.hostToken)) return fail('Seul l’écran de la salle peut barrer la porte.', state, dirty, action.now);
      state.locked = action.locked;
      return commit(state, action.now);
    }
    case 'kick': {
      if (!isHost(state, action.hostToken)) return fail('Seul l’écran de la salle peut retirer quelqu’un.', state, dirty, action.now);
      const before = state.players.length;
      state.players = state.players.filter((player) => player.id !== action.playerId);
      if (state.players.length === before) return fail('Cette personne n’est plus là.', state, dirty, action.now);
      dropMissingTargets(state, action.now);
      return commit(state, action.now);
    }
    case 'leave': {
      const player = playerBySecret(state, action.token);
      if (!player) return fail('Tu n’es déjà plus dans la salle.', state, dirty, action.now);
      state.players = state.players.filter((item) => item.id !== player.id);
      dropMissingTargets(state, action.now);
      return commit(state, action.now);
    }
    case 'ask':
    case 'draw': {
      if (state.round) return fail('Une question est déjà en cours.', state, dirty, action.now);
      if (!canSteer(state, action.token, action.hostToken)) return fail('Rejoins la salle pour poser une question.', state, dirty, action.now);
      const actor = playerBySecret(state, action.token);
      const picked = targetsFor(state, action.mode, action.targetId, actor);
      if ('error' in picked) return fail(picked.error, state, dirty, action.now);
      const drawn = action.type === 'draw'
        ? pickBankQuestion(capFor(picked.targets, state.players), state.seenQuestionIds, action.random)
        : null;
      if (action.type === 'draw' && !drawn) return fail('Aucune question ne passe le plafond de la tablée.', state, dirty, action.now);
      const text = action.type === 'draw' ? drawn!.text : normalizeQuestion(action.text);
      if (action.type === 'ask' && !('text' in (text as object) && (text as { ok: boolean }).ok)) {
        return fail((text as { error: string }).error, state, dirty, action.now);
      }
      const level = action.type === 'draw' ? drawn!.level : action.level;
      const question = action.type === 'draw' ? drawn!.text : (text as { text: string }).text;
      if (!levelAllowed(level, picked.targets, state.players)) {
        return fail('Cette question dépasse le plafond autorisé.', state, dirty, action.now);
      }
      const round: Round = {
        id: action.roundId,
        mode: action.mode,
        text: question,
        level,
        authorId: actor?.id ?? '',
        authorName: actor?.name ?? 'Le mur',
        targetIds: picked.targets.map((target) => target.id),
        deadline: action.now + QUESTION_MS,
        answers: [],
        belief: [],
        vetoes: [],
        status: 'open',
        revealedAt: null,
      };
      return openRound(state, round, action.now, drawn?.id ?? null);
    }
    case 'answer': {
      const player = playerBySecret(state, action.token);
      if (!player || !state.round || state.round.status !== 'open') {
        return fail('Aucune question ne t’attend.', state, dirty, action.now);
      }
      if (!state.round.targetIds.includes(player.id)) return fail('Cette question ne t’est pas adressée.', state, dirty, action.now);
      if (state.round.answers.some((answer) => answer.playerId === player.id)) {
        return fail('Ta réponse est déjà entrée.', state, dirty, action.now);
      }
      if (action.value === 'passe' && state.passesUsed.includes(player.id)) {
        return fail('Ton passe de la soirée est déjà utilisé.', state, dirty, action.now);
      }
      state.round.answers.push({ playerId: player.id, value: action.value });
      if (action.value === 'passe') state.passesUsed.push(player.id);
      player.seenAt = action.now;
      closeIfComplete(state, action.now);
      return commit(state, action.now);
    }
    case 'believe': {
      const player = playerBySecret(state, action.token);
      if (!player || !state.round || state.round.status !== 'reveal' || state.round.mode !== 'cible') {
        return fail('Le vote est fermé.', state, dirty, action.now);
      }
      if (state.round.belief.some((belief) => belief.playerId === player.id)) {
        return fail('Ton vote est déjà compté.', state, dirty, action.now);
      }
      state.round.belief.push({ playerId: player.id, value: action.value });
      player.seenAt = action.now;
      return commit(state, action.now);
    }
    case 'veto': {
      const player = playerBySecret(state, action.token);
      if (!player || !state.round || state.round.status !== 'open') return fail('Rien à retirer.', state, dirty, action.now);
      if (!state.round.vetoes.includes(player.id)) state.round.vetoes.push(player.id);
      player.seenAt = action.now;
      if (state.round.vetoes.length >= 2) {
        state.round = null;
        state.notice = 'Deux joueurs ont retiré la question.';
      }
      return commit(state, action.now);
    }
    case 'reveal': {
      if (!canSteer(state, action.token, action.hostToken)) return fail('Rejoins la salle pour révéler.', state, dirty, action.now);
      if (!state.round || state.round.status !== 'open') return dirty ? commit(state, action.now) : { ok: true, state: input, dirty: false };
      state.round.status = 'reveal';
      state.round.revealedAt = action.now;
      return commit(state, action.now);
    }
    case 'next': {
      if (!canSteer(state, action.token, action.hostToken)) return fail('Rejoins la salle pour continuer.', state, dirty, action.now);
      if (!state.round || state.round.status !== 'reveal') return fail('Aucune réponse à passer.', state, dirty, action.now);
      if (state.round.revealedAt && action.now - state.round.revealedAt < REVEAL_HOLD_MS) {
        return fail('Laisse la réponse atterrir une seconde.', state, dirty, action.now);
      }
      state.round = null;
      return commit(state, action.now);
    }
  }
}

function capFor(targets: { ceiling: Ceiling }[], players: { adult: boolean }[]): Ceiling {
  let cap = adultCap(players);
  for (const target of targets) cap = tighter(cap, target.ceiling);
  return cap;
}

export function present(state: RoomState, token: string | null, hostToken: string | null, now: number): PublicRoom {
  const you = playerBySecret(state, token);
  const host = isHost(state, hostToken) || Boolean(you && hostToken && hostToken === state.hostSecret);
  const round = state.round;
  const yourAnswer = round?.answers.find((answer) => answer.playerId === you?.id)?.value ?? null;
  const names = new Map(state.players.map((player) => [player.id, player.name]));
  return {
    code: state.code,
    locked: state.locked,
    notice: state.notice,
    phase: round ? (round.status === 'open' ? 'question' : 'reveal') : 'lobby',
    players: state.players.map((player) => ({
      id: player.id,
      name: player.name,
      ceiling: player.ceiling,
      adult: player.adult,
      away: now - player.seenAt > AWAY_MS,
    })),
    adultCap: adultCap(state.players),
    caps: { tous: capFor(state.players, state.players) },
    host,
    you: you
      ? {
          id: you.id,
          name: you.name,
          host,
          ceiling: you.ceiling,
          adult: you.adult,
          passeLeft: !state.passesUsed.includes(you.id),
        }
      : null,
    round: round
      ? {
          id: round.id,
          mode: round.mode,
          text: round.text,
          level: round.level,
          authorName: round.authorName,
          targetIds: round.targetIds,
          deadline: round.deadline,
          revealedAt: round.revealedAt,
          answeredIds: round.answers.map((answer) => answer.playerId),
          yourAnswer,
          answers: round.status === 'reveal'
            ? round.targetIds.map((id) => ({
                playerId: id,
                name: names.get(id) ?? 'Quelqu’un',
                value: round.answers.find((answer) => answer.playerId === id)?.value ?? 'silence',
              }))
            : null,
          belief: {
            yes: round.belief.filter((belief) => belief.value).length,
            no: round.belief.filter((belief) => !belief.value).length,
            yours: round.belief.find((belief) => belief.playerId === you?.id)?.value ?? null,
          },
          vetoes: round.vetoes.length,
        }
      : null,
    serverNow: now,
  };
}

export function asRoomState(value: unknown): RoomState | null {
  if (!value || typeof value !== 'object') return null;
  const room = value as RoomState;
  if (typeof room.code !== 'string' || typeof room.hostSecret !== 'string' || !Array.isArray(room.players)) return null;
  if (!Array.isArray(room.passesUsed) || !Array.isArray(room.seenQuestionIds) || !Array.isArray(room.askedAt)) return null;
  if (typeof room.createdAt !== 'number' || typeof room.expiresAt !== 'number') return null;
  return room;
}

export function isAnswerValue(value: unknown): value is AnswerValue {
  return value === 'oui' || value === 'non' || value === 'passe';
}
