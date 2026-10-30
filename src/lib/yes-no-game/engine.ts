// Moteur pur de « Combien de Oui? » : aucune dépendance serveur, testable seul.
// Règle d'or : on ne révèle JAMAIS qui a répondu oui ou non, seulement le total.

import { isQuestionPackId, questionsForPack, type QuestionPackId } from './questions';

export const MAX_PLAYERS = 16;
export const MIN_PLAYERS_TO_START = 2;
export const NAME_MAX_LENGTH = 20;
export const QUESTION_MIN_LENGTH = 5;
export const QUESTION_MAX_LENGTH = 140;
export const MAX_CUSTOM_QUESTIONS = 40;
export const ROUND_OPTIONS = [5, 10, 15, 20] as const;
export const POINTS_EXACT = 3;
export const POINTS_CLOSE = 1;

export type Phase = 'lobby' | 'question' | 'reveal' | 'finished';

export type Player = {
  id: string;
  name: string;
  tokenHash: string;
  score: number;
  exactCount: number;
  joinedAt: number;
};

export type Round = {
  number: number;
  question: string;
  custom: boolean;
  participants: string[];
  answers: Record<string, boolean>;
  guesses: Record<string, number>;
  result: RoundResult | null;
};

export type RoundResult = {
  yesCount: number;
  answeredCount: number;
  points: Record<string, number>;
};

export type HistoryEntry = {
  number: number;
  question: string;
  yesCount: number;
  answeredCount: number;
};

export type RoomState = {
  v: 1;
  code: string;
  hostId: string;
  phase: Phase;
  pack: QuestionPackId;
  totalRounds: number;
  players: Player[];
  round: Round | null;
  history: HistoryEntry[];
  usedQuestions: string[];
  customQueue: string[];
  createdAt: number;
};

export class GameError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'GameError';
  }
}

export type RandomSource = () => number;

// ---------- Validation ----------

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Retire les caractères de contrôle et compresse les espaces.
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function normalizeName(value: unknown): string {
  const name = cleanText(value).slice(0, NAME_MAX_LENGTH).trim();
  if (!name) throw new GameError(400, 'Choisis un nom pour jouer.');
  return name;
}

export function normalizeQuestion(value: unknown): string {
  let question = cleanText(value);
  if (question.length < QUESTION_MIN_LENGTH) throw new GameError(400, 'La question est trop courte.');
  if (question.length > QUESTION_MAX_LENGTH) throw new GameError(400, `La question doit faire au plus ${QUESTION_MAX_LENGTH} caractères.`);
  if (!/[?？]$/.test(question)) question = `${question}?`;
  return question.charAt(0).toUpperCase() + question.slice(1);
}

export function normalizeTotalRounds(value: unknown): number {
  const rounds = Number(value);
  return (ROUND_OPTIONS as readonly number[]).includes(rounds) ? rounds : 10;
}

export function normalizePack(value: unknown): QuestionPackId {
  return isQuestionPackId(value) ? value : 'mix';
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // sans I, L, O : faciles à confondre

export function generateRoomCode(random: RandomSource): string {
  let code = '';
  for (let i = 0; i < 4; i += 1) code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return code;
}

export function normalizeRoomCode(value: unknown): string | null {
  const code = cleanText(value).toUpperCase();
  return /^[A-Z]{4}$/.test(code) ? code : null;
}

function uniqueName(players: Player[], wanted: string): string {
  const taken = new Set(players.map((player) => player.name.toLocaleLowerCase('fr')));
  if (!taken.has(wanted.toLocaleLowerCase('fr'))) return wanted;
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${wanted.slice(0, NAME_MAX_LENGTH - 3)} ${n}`;
    if (!taken.has(candidate.toLocaleLowerCase('fr'))) return candidate;
  }
  return wanted;
}

// ---------- Création et lobby ----------

export type NewPlayer = { id: string; tokenHash: string };

export function createRoom(input: {
  code: string;
  host: NewPlayer;
  hostName: unknown;
  pack?: unknown;
  totalRounds?: unknown;
  now: number;
}): RoomState {
  return {
    v: 1,
    code: input.code,
    hostId: input.host.id,
    phase: 'lobby',
    pack: normalizePack(input.pack),
    totalRounds: normalizeTotalRounds(input.totalRounds),
    players: [
      { id: input.host.id, tokenHash: input.host.tokenHash, name: normalizeName(input.hostName), score: 0, exactCount: 0, joinedAt: input.now },
    ],
    round: null,
    history: [],
    usedQuestions: [],
    customQueue: [],
    createdAt: input.now,
  };
}

export function joinRoom(state: RoomState, player: NewPlayer, name: unknown, now: number): RoomState {
  const cleanName = normalizeName(name);
  if (state.players.length >= MAX_PLAYERS) throw new GameError(409, `La partie est pleine (${MAX_PLAYERS} joueurs maximum).`);
  if (state.phase === 'finished') throw new GameError(409, 'Cette partie est terminée.');
  const next = structuredClone(state);
  next.players.push({ id: player.id, tokenHash: player.tokenHash, name: uniqueName(next.players, cleanName), score: 0, exactCount: 0, joinedAt: now });
  return next;
}

function requirePlayer(state: RoomState, playerId: string): Player {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new GameError(403, 'Tu ne fais plus partie de cette partie.');
  return player;
}

function requireHost(state: RoomState, playerId: string) {
  requirePlayer(state, playerId);
  if (state.hostId !== playerId) throw new GameError(403, 'Seul l’hôte peut faire ça.');
}

export function updateSettings(state: RoomState, playerId: string, settings: { pack?: unknown; totalRounds?: unknown }): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'lobby') throw new GameError(409, 'La partie est déjà commencée.');
  const next = structuredClone(state);
  if (settings.pack !== undefined) next.pack = normalizePack(settings.pack);
  if (settings.totalRounds !== undefined) next.totalRounds = normalizeTotalRounds(settings.totalRounds);
  return next;
}

export function suggestQuestion(state: RoomState, playerId: string, question: unknown): RoomState {
  requirePlayer(state, playerId);
  if (state.phase === 'finished') throw new GameError(409, 'Cette partie est terminée.');
  const clean = normalizeQuestion(question);
  if (state.customQueue.length >= MAX_CUSTOM_QUESTIONS) throw new GameError(409, 'Il y a déjà beaucoup de questions en attente. Joue-les d’abord!');
  const next = structuredClone(state);
  next.customQueue.push(clean);
  return next;
}

// ---------- Déroulement ----------

function pickQuestion(state: RoomState, random: RandomSource): { question: string; custom: boolean } {
  if (state.customQueue.length > 0) {
    // Les questions des joueurs sortent dans un ordre aléatoire, pour rester anonymes.
    const index = Math.floor(random() * state.customQueue.length);
    const [question] = state.customQueue.splice(index, 1);
    return { question, custom: true };
  }
  const bank = questionsForPack(state.pack);
  let available = bank.filter((question) => !state.usedQuestions.includes(question));
  if (available.length === 0) {
    state.usedQuestions = [];
    available = bank;
  }
  const question = available[Math.floor(random() * available.length)];
  state.usedQuestions.push(question);
  return { question, custom: false };
}

function openRound(state: RoomState, number: number, random: RandomSource) {
  const { question, custom } = pickQuestion(state, random);
  state.phase = 'question';
  state.round = {
    number,
    question,
    custom,
    participants: state.players.map((player) => player.id),
    answers: {},
    guesses: {},
    result: null,
  };
}

export function startGame(state: RoomState, playerId: string, random: RandomSource): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'lobby') throw new GameError(409, 'La partie est déjà commencée.');
  if (state.players.length < MIN_PLAYERS_TO_START) throw new GameError(409, `Il faut au moins ${MIN_PLAYERS_TO_START} joueurs pour commencer.`);
  const next = structuredClone(state);
  next.history = [];
  for (const player of next.players) {
    player.score = 0;
    player.exactCount = 0;
  }
  openRound(next, 1, random);
  return next;
}

function scoreRound(state: RoomState) {
  const round = state.round;
  if (!round) return;
  const answered = round.participants.filter((id) => typeof round.answers[id] === 'boolean');
  const yesCount = answered.filter((id) => round.answers[id]).length;
  const points: Record<string, number> = {};
  for (const id of round.participants) {
    const guess = round.guesses[id];
    if (typeof guess !== 'number') continue;
    const diff = Math.abs(guess - yesCount);
    const earned = diff === 0 ? POINTS_EXACT : diff === 1 ? POINTS_CLOSE : 0;
    points[id] = earned;
    const player = state.players.find((candidate) => candidate.id === id);
    if (player) {
      player.score += earned;
      if (diff === 0) player.exactCount += 1;
    }
  }
  round.result = { yesCount, answeredCount: answered.length, points };
  state.history.push({ number: round.number, question: round.question, yesCount, answeredCount: answered.length });
  state.phase = 'reveal';
}

function everyoneSubmitted(state: RoomState): boolean {
  const round = state.round;
  if (!round) return false;
  const present = round.participants.filter((id) => state.players.some((player) => player.id === id));
  return present.length > 0 && present.every((id) => typeof round.answers[id] === 'boolean' && typeof round.guesses[id] === 'number');
}

export function submitAnswer(state: RoomState, playerId: string, answer: unknown, guess: unknown): RoomState {
  requirePlayer(state, playerId);
  const round = state.round;
  if (state.phase !== 'question' || !round) throw new GameError(409, 'Il n’y a pas de question en cours.');
  if (!round.participants.includes(playerId)) throw new GameError(409, 'Tu embarques à la prochaine question!');
  if (typeof answer !== 'boolean') throw new GameError(400, 'Réponds oui ou non.');
  const max = round.participants.length;
  const guessNumber = Number(guess);
  if (!Number.isInteger(guessNumber) || guessNumber < 0 || guessNumber > max) {
    throw new GameError(400, `Ta prédiction doit être entre 0 et ${max}.`);
  }
  // Ta propre réponse fait partie du total : prédire 0 en disant oui est impossible.
  if (answer && guessNumber === 0) throw new GameError(400, 'Tu as dit oui : il y a au moins 1 oui!');
  if (!answer && guessNumber === max) throw new GameError(400, 'Tu as dit non : tout le monde ne peut pas avoir dit oui!');
  const next = structuredClone(state);
  next.round!.answers[playerId] = answer;
  next.round!.guesses[playerId] = guessNumber;
  if (everyoneSubmitted(next)) scoreRound(next);
  return next;
}

export function forceReveal(state: RoomState, playerId: string): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'question' || !state.round) throw new GameError(409, 'Il n’y a pas de question en cours.');
  if (Object.keys(state.round.answers).length === 0) throw new GameError(409, 'Personne n’a encore répondu.');
  const next = structuredClone(state);
  scoreRound(next);
  return next;
}

export function skipQuestion(state: RoomState, playerId: string, random: RandomSource): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'question' || !state.round) throw new GameError(409, 'Il n’y a pas de question en cours.');
  const next = structuredClone(state);
  openRound(next, state.round.number, random);
  return next;
}

export function nextRound(state: RoomState, playerId: string, random: RandomSource): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'reveal' || !state.round) throw new GameError(409, 'Révèle d’abord la réponse.');
  const next = structuredClone(state);
  if (state.round.number >= state.totalRounds) {
    next.phase = 'finished';
    return next;
  }
  openRound(next, state.round.number + 1, random);
  return next;
}

export function endGame(state: RoomState, playerId: string): RoomState {
  requireHost(state, playerId);
  if (state.phase === 'lobby') throw new GameError(409, 'La partie n’est pas commencée.');
  const next = structuredClone(state);
  next.phase = 'finished';
  return next;
}

export function backToLobby(state: RoomState, playerId: string): RoomState {
  requireHost(state, playerId);
  if (state.phase !== 'finished') throw new GameError(409, 'Termine la partie avant de recommencer.');
  const next = structuredClone(state);
  next.phase = 'lobby';
  next.round = null;
  next.history = [];
  for (const player of next.players) {
    player.score = 0;
    player.exactCount = 0;
  }
  return next;
}

function removeFromRound(state: RoomState, playerId: string) {
  const round = state.round;
  if (!round || state.phase !== 'question') return;
  round.participants = round.participants.filter((id) => id !== playerId);
  delete round.answers[playerId];
  delete round.guesses[playerId];
  // Les prédictions au-dessus du nouveau maximum ne sont plus possibles : on les retire.
  for (const [id, guess] of Object.entries(round.guesses)) {
    if (guess > round.participants.length) {
      delete round.guesses[id];
      delete round.answers[id];
    }
  }
  if (everyoneSubmitted(state)) scoreRound(state);
}

export function removePlayer(state: RoomState, actorId: string, targetId: string): RoomState {
  requirePlayer(state, actorId);
  if (actorId !== targetId) requireHost(state, actorId);
  requirePlayer(state, targetId);
  const next = structuredClone(state);
  next.players = next.players.filter((player) => player.id !== targetId);
  if (next.players.length > 0 && next.hostId === targetId) {
    // L'hôte part : le joueur arrivé le plus tôt prend le relais.
    next.hostId = [...next.players].sort((a, b) => a.joinedAt - b.joinedAt)[0].id;
  }
  removeFromRound(next, targetId);
  if (next.round && next.phase === 'question' && next.round.participants.length === 0) {
    next.phase = next.players.length > 0 ? 'lobby' : next.phase;
    next.round = null;
  }
  return next;
}

// ---------- Vue envoyée à un joueur ----------

export type PlayerView = {
  id: string;
  name: string;
  score: number;
  exactCount: number;
  isHost: boolean;
  isYou: boolean;
  hasSubmitted: boolean;
  isParticipant: boolean;
};

export type RoomView = {
  code: string;
  phase: Phase;
  pack: QuestionPackId;
  totalRounds: number;
  you: { id: string; isHost: boolean } | null;
  players: PlayerView[];
  pendingCustomQuestions: number;
  round: null | {
    number: number;
    question: string;
    custom: boolean;
    participantCount: number;
    submittedCount: number;
    isParticipant: boolean;
    myAnswer: boolean | null;
    myGuess: number | null;
    result: null | {
      yesCount: number;
      noCount: number;
      answeredCount: number;
      guesses: { playerId: string; name: string; guess: number; points: number }[];
    };
  };
  history: HistoryEntry[];
};

export function viewFor(state: RoomState, playerId: string | null): RoomView {
  const round = state.round;
  const you = playerId ? state.players.find((player) => player.id === playerId) ?? null : null;
  const submitted = (id: string) => Boolean(round && typeof round.answers[id] === 'boolean' && typeof round.guesses[id] === 'number');

  return {
    code: state.code,
    phase: state.phase,
    pack: state.pack,
    totalRounds: state.totalRounds,
    you: you ? { id: you.id, isHost: state.hostId === you.id } : null,
    players: [...state.players]
      .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
      .map((player) => ({
        id: player.id,
        name: player.name,
        score: player.score,
        exactCount: player.exactCount,
        isHost: state.hostId === player.id,
        isYou: player.id === you?.id,
        hasSubmitted: state.phase === 'question' ? submitted(player.id) : false,
        isParticipant: round ? round.participants.includes(player.id) : false,
      })),
    pendingCustomQuestions: state.customQueue.length,
    round: round && state.phase !== 'lobby'
      ? {
          number: round.number,
          question: round.question,
          custom: round.custom,
          participantCount: round.participants.length,
          submittedCount: round.participants.filter(submitted).length,
          isParticipant: Boolean(you && round.participants.includes(you.id)),
          // Seul le joueur lui-même voit sa propre réponse.
          myAnswer: you && typeof round.answers[you.id] === 'boolean' ? round.answers[you.id] : null,
          myGuess: you && typeof round.guesses[you.id] === 'number' ? round.guesses[you.id] : null,
          result: round.result
            ? {
                yesCount: round.result.yesCount,
                noCount: round.result.answeredCount - round.result.yesCount,
                answeredCount: round.result.answeredCount,
                // Les prédictions sont publiques au dévoilement; les réponses oui/non, jamais.
                guesses: round.participants
                  .filter((id) => typeof round.guesses[id] === 'number')
                  .map((id) => ({
                    playerId: id,
                    name: state.players.find((player) => player.id === id)?.name ?? 'Joueur parti',
                    guess: round.guesses[id],
                    points: round.result?.points[id] ?? 0,
                  }))
                  .sort((a, b) => b.points - a.points || a.guess - b.guess),
              }
            : null,
        }
      : null,
    history: state.history,
  };
}

export function parseRoomState(value: unknown): RoomState {
  const state = value as RoomState;
  if (!state || typeof state !== 'object' || state.v !== 1 || !Array.isArray(state.players)) {
    throw new GameError(500, 'Partie illisible.');
  }
  return state;
}
