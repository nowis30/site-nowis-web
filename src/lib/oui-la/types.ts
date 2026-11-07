export const CEILINGS = ['doux', 'party', 'ose', 'sans-filtre'] as const;

export type Ceiling = (typeof CEILINGS)[number];

export const CEILING_RANK: Record<Ceiling, number> = {
  doux: 0,
  party: 1,
  ose: 2,
  'sans-filtre': 3,
};

export const CEILING_LABEL: Record<Ceiling, string> = {
  doux: 'Doux',
  party: 'Party',
  ose: 'Osé',
  'sans-filtre': 'Sans filtre',
};

export type AnswerValue = 'oui' | 'non' | 'passe';

export type Player = {
  id: string;
  secret: string;
  name: string;
  ceiling: Ceiling;
  adult: boolean;
  seenAt: number;
};

export type Round = {
  id: string;
  mode: 'cible' | 'tous';
  text: string;
  level: Ceiling;
  authorId: string;
  authorName: string;
  targetIds: string[];
  deadline: number;
  answers: { playerId: string; value: AnswerValue }[];
  belief: { playerId: string; value: boolean }[];
  vetoes: string[];
  status: 'open' | 'reveal';
  revealedAt: number | null;
};

export type RoomState = {
  code: string;
  hostSecret: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  locked: boolean;
  notice: string | null;
  players: Player[];
  passesUsed: string[];
  seenQuestionIds: string[];
  askedAt: number[];
  round: Round | null;
};

export type PublicPlayer = {
  id: string;
  name: string;
  ceiling: Ceiling;
  adult: boolean;
  away: boolean;
};

export type PublicAnswer = {
  playerId: string;
  name: string;
  value: AnswerValue | 'silence';
};

export type PublicRoom = {
  code: string;
  locked: boolean;
  notice: string | null;
  phase: 'lobby' | 'question' | 'reveal';
  players: PublicPlayer[];
  adultCap: Ceiling;
  caps: { tous: Ceiling };
  host: boolean;
  you: {
    id: string;
    name: string;
    host: boolean;
    ceiling: Ceiling;
    adult: boolean;
    passeLeft: boolean;
  } | null;
  round: null | {
    id: string;
    mode: 'cible' | 'tous';
    text: string;
    level: Ceiling;
    authorName: string;
    targetIds: string[];
    deadline: number;
    revealedAt: number | null;
    answeredIds: string[];
    yourAnswer: AnswerValue | null;
    answers: PublicAnswer[] | null;
    belief: { yes: number; no: number; yours: boolean | null };
    vetoes: number;
  };
  serverNow: number;
};

export type GameAction =
  | { type: 'sync'; token: string | null; hostToken: string | null; now: number }
  | { type: 'join'; playerId: string; secret: string; name: string; ceiling: Ceiling; adult: boolean; now: number }
  | { type: 'profile'; token: string; ceiling: Ceiling; adult: boolean; now: number }
  | { type: 'lock'; hostToken: string; locked: boolean; now: number }
  | { type: 'kick'; hostToken: string; playerId: string; now: number }
  | { type: 'leave'; token: string; now: number }
  | { type: 'ask'; token: string | null; hostToken: string | null; mode: 'cible' | 'tous'; targetId?: string; text: string; level: Ceiling; roundId: string; now: number }
  | { type: 'draw'; token: string | null; hostToken: string | null; mode: 'cible' | 'tous'; targetId?: string; roundId: string; now: number; random: number }
  | { type: 'answer'; token: string; value: AnswerValue; now: number }
  | { type: 'believe'; token: string; value: boolean; now: number }
  | { type: 'veto'; token: string; now: number }
  | { type: 'reveal'; token: string | null; hostToken: string | null; now: number }
  | { type: 'next'; token: string | null; hostToken: string | null; now: number };

export type Step =
  | { ok: true; state: RoomState; dirty: boolean }
  | { ok: false; error: string; state: RoomState | null; dirty: boolean };

export function isCeiling(value: unknown): value is Ceiling {
  return typeof value === 'string' && (CEILINGS as readonly string[]).includes(value);
}
