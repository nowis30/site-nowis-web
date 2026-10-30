import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import {
  GameError,
  createRoom,
  forceReveal,
  joinRoom,
  nextRound,
  normalizeQuestion,
  removePlayer,
  startGame,
  submitAnswer,
  suggestQuestion,
  viewFor,
  type RoomState,
} from '../src/lib/yes-no-game/engine';
import { actOnGame, createGame, joinGame, readGame, type RoomDb } from '../src/lib/yes-no-game/service';

let seed = 1;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

function threePlayerRoom(): RoomState {
  let state = createRoom({ code: 'ABCD', host: { id: 'h', tokenHash: 'th' }, hostName: 'Nowis', now: 1, totalRounds: 5 });
  state = joinRoom(state, { id: 'a', tokenHash: 'ta' }, 'Yemme', 2);
  state = joinRoom(state, { id: 'b', tokenHash: 'tb' }, 'SX', 3);
  return startGame(state, 'h', random);
}

test('une manche complète : total de oui, points exacts et à ±1', () => {
  let state = threePlayerRoom();
  assert.equal(state.phase, 'question');
  state = submitAnswer(state, 'h', true, 2);
  state = submitAnswer(state, 'a', true, 3);
  assert.equal(state.phase, 'question', 'la révélation attend tout le monde');
  state = submitAnswer(state, 'b', false, 0);
  assert.equal(state.phase, 'reveal');
  assert.deepEqual(state.round?.result?.points, { h: 3, a: 1, b: 0 });
  assert.equal(state.round?.result?.yesCount, 2);
  assert.deepEqual(state.players.map((p) => p.score), [3, 1, 0]);
});

test('la vue ne révèle jamais qui a dit oui ou non', () => {
  let state = threePlayerRoom();
  state = submitAnswer(state, 'h', true, 2);
  const duringOther = viewFor(state, 'a');
  assert.equal(duringOther.round?.myAnswer, null);
  assert.equal(duringOther.round?.submittedCount, 1);
  state = submitAnswer(state, 'a', false, 1);
  state = submitAnswer(state, 'b', false, 1);
  const serialized = JSON.stringify(viewFor(state, 'a'));
  assert.ok(!serialized.includes('"answers"'));
  assert.ok(!serialized.includes('tokenHash'));
  assert.equal(viewFor(state, 'h').round?.myAnswer, true);
  assert.equal(viewFor(state, 'a').round?.myAnswer, false);
});

test('les prédictions impossibles sont refusées', () => {
  const state = threePlayerRoom();
  assert.throws(() => submitAnswer(state, 'h', true, 0), GameError);
  assert.throws(() => submitAnswer(state, 'h', false, 3), GameError);
  assert.throws(() => submitAnswer(state, 'h', true, 4), GameError);
  assert.throws(() => submitAnswer(state, 'h', 'oui', 1), GameError);
});

test('seul l’hôte contrôle la partie; un joueur arrivé en cours attend la prochaine question', () => {
  let state = threePlayerRoom();
  assert.throws(() => forceReveal(state, 'a'), /hôte/);
  state = joinRoom(state, { id: 'c', tokenHash: 'tc' }, 'Retard', 4);
  assert.throws(() => submitAnswer(state, 'c', true, 1), /prochaine/);
  state = submitAnswer(state, 'h', true, 1);
  state = forceReveal(state, 'h');
  state = nextRound(state, 'h', random);
  assert.ok(state.round?.participants.includes('c'));
  assert.throws(() => nextRound(state, 'h', random), /Révèle/);
});

test('la partie se termine après le nombre de questions choisi', () => {
  let state = threePlayerRoom();
  for (let n = 1; n <= 5; n += 1) {
    assert.equal(state.round?.number, n);
    for (const id of ['h', 'a', 'b']) state = submitAnswer(state, id, false, 0);
    state = nextRound(state, 'h', random);
  }
  assert.equal(state.phase, 'finished');
  assert.equal(new Set(state.history.map((entry) => entry.question)).size, 5, 'pas de question répétée');
});

test('les questions des joueurs passent en premier et sont normalisées', () => {
  let state = createRoom({ code: 'ABCD', host: { id: 'h', tokenHash: 'th' }, hostName: 'Nowis', now: 1 });
  state = joinRoom(state, { id: 'a', tokenHash: 'ta' }, 'Yemme', 2);
  state = suggestQuestion(state, 'a', '  as-tu déjà   vu un fantôme ');
  assert.equal(normalizeQuestion('as-tu faim'), 'As-tu faim?');
  state = startGame(state, 'h', random);
  assert.equal(state.round?.question, 'As-tu déjà vu un fantôme?');
  assert.equal(state.round?.custom, true);
});

test('le départ d’un joueur débloque la manche et transfère l’hôte', () => {
  let state = threePlayerRoom();
  state = submitAnswer(state, 'a', true, 1);
  state = submitAnswer(state, 'b', false, 1);
  state = removePlayer(state, 'h', 'h');
  assert.equal(state.hostId, 'a');
  assert.equal(state.phase, 'reveal');
  assert.throws(() => removePlayer(state, 'b', 'a'), /hôte/);
});

async function pgliteDb() {
  const database = new PGlite();
  const root = path.resolve('prisma/migrations');
  for (const entry of readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    await database.exec(readFileSync(path.join(root, entry.name, 'migration.sql'), 'utf8'));
  }
  const db: RoomDb = {
    transaction: (fn) => database.transaction(async (tx) => fn(async (sql, params) => (await tx.query(sql, params)).rows as never)),
  };
  return { database, db };
}

test('partie complète à trois cellulaires contre une vraie base PostgreSQL', async () => {
  const { database, db } = await pgliteDb();
  try {
    const host = await createGame(db, { name: 'Nowis', pack: 'quebec', totalRounds: 5 });
    const code = host.room.code;
    assert.match(code, /^[A-Z]{4}$/);
    const yemme = await joinGame(db, code.toLowerCase(), 'Yemme');
    const sx = await joinGame(db, code, 'SX');
    await assert.rejects(actOnGame(db, code, yemme.token, { type: 'start' }), /hôte/);
    await assert.rejects(actOnGame(db, code, 'jeton-inconnu-1234567890', { type: 'start' }), /plus partie/);

    let read = await actOnGame(db, code, host.token, { type: 'start' });
    assert.equal(read.room?.phase, 'question');
    const unchanged = await readGame(db, code, sx.token, read.version);
    assert.equal(unchanged.room, null, 'le polling ne renvoie rien si rien n’a changé');

    await actOnGame(db, code, host.token, { type: 'answer', answer: true, guess: 2 });
    await actOnGame(db, code, yemme.token, { type: 'answer', answer: true, guess: 2 });
    read = await actOnGame(db, code, sx.token, { type: 'answer', answer: false, guess: 1 });
    assert.equal(read.room?.phase, 'reveal');
    assert.equal(read.room?.round?.result?.yesCount, 2);
    assert.equal(read.room?.players.find((p) => p.isYou)?.score, 1);

    const spectator = await readGame(db, code, null);
    assert.equal(spectator.room?.you, null);
    const stored = (await database.query<{ state: string }>('SELECT state::text FROM yes_no_rooms')).rows[0].state;
    assert.ok(!stored.includes(host.token), 'les jetons ne sont jamais stockés en clair');

    await assert.rejects(joinGame(db, 'ZZZZ', 'Personne'), /n’existe pas/);
    await database.query(`UPDATE yes_no_rooms SET "expiresAt" = (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 minute'`);
    await assert.rejects(readGame(db, code, host.token), /expirée/);
    await createGame(db, { name: 'Autre' });
    const remaining = (await database.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM yes_no_rooms')).rows[0].n;
    assert.equal(remaining, 1, 'les salles expirées sont nettoyées');
  } finally {
    await database.close();
  }
});

test('la table se crée toute seule et la migration Prisma passe ensuite sans erreur', async () => {
  const { yesNoSchemaSqlForTests } = await import('../src/lib/yes-no-game/prisma-db');
  const database = new PGlite();
  try {
    for (const sql of yesNoSchemaSqlForTests) await database.exec(sql);
    await database.exec(readFileSync('prisma/migrations/20261025030000_yes_no_game/migration.sql', 'utf8'));
    const rows = (await database.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM yes_no_rooms`)).rows;
    assert.equal(rows[0].n, 0);
  } finally {
    await database.close();
  }
});
