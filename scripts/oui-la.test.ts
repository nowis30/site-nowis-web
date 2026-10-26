import assert from 'node:assert/strict';
import test from 'node:test';
import { apply, createRoom, present } from '@/lib/oui-la/logic';
import { BANK, normalizeQuestion, questionIsBlocked } from '@/lib/oui-la/questions';
import { resetOuiLaMemory } from '@/lib/oui-la/store';
import type { RoomState } from '@/lib/oui-la/types';

process.env.OUI_LA_STORE = 'memory';

const NOW = 1_700_000_000_000;

function must<T extends { ok: true; state: RoomState }>(step: { ok: boolean; state: RoomState | null; error?: string }): T {
  if (!step.ok || !step.state) throw new Error(step.error || 'expected ok');
  return step as T;
}

function gang(): RoomState {
  const created = createRoom({
    code: 'ABCD',
    hostSecret: 'host-secret-host-secret-host',
    now: NOW,
    player: { id: 'alex', secret: 'secret-alex', name: 'Alex', ceiling: 'party', adult: true },
  });
  if ('error' in created) throw new Error(created.error);
  return must(apply(created, {
    type: 'join', playerId: 'sam', secret: 'secret-sam', name: 'Sam', ceiling: 'ose', adult: true, now: NOW,
  })).state;
}

test('two phones answer a targeted question and the wall sees it only at the reveal', () => {
  const state = gang();
  const asked = must(apply(state, {
    type: 'ask', token: 'secret-alex', hostToken: null, mode: 'cible', targetId: 'sam',
    text: 'Est-ce que tu embrasserais Alex ce soir?', level: 'ose', roundId: 'r1', now: NOW,
  }));
  const hidden = present(asked.state, 'secret-alex', null, NOW);
  assert.equal(hidden.phase, 'question');
  assert.equal(hidden.round?.answers, null);
  const revealed = must(apply(asked.state, { type: 'answer', token: 'secret-sam', value: 'oui', now: NOW + 1000 }));
  const wall = present(revealed.state, null, 'host-secret-host-secret-host', NOW + 1000);
  assert.equal(wall.phase, 'reveal');
  assert.equal(wall.host, true);
  assert.equal(wall.round?.answers?.[0]?.value, 'oui');
  assert.equal(wall.you, null);
});

test('a personal ceiling and a minor keep the spicier questions out', () => {
  const state = gang();
  const tooHotForAlex = apply(state, {
    type: 'ask', token: 'secret-sam', hostToken: null, mode: 'cible', targetId: 'alex',
    text: 'Est-ce que tu coucherais avec Sam?', level: 'sans-filtre', roundId: 'r2', now: NOW,
  });
  assert.equal(tooHotForAlex.ok, false);
  const minor = must(apply(state, { type: 'profile', token: 'secret-sam', ceiling: 'sans-filtre', adult: false, now: NOW }));
  const blocked = apply(minor.state, {
    type: 'draw', token: 'secret-alex', hostToken: null, mode: 'tous', roundId: 'r3', now: NOW, random: 0.99,
  });
  assert.equal(blocked.ok, true);
  if (blocked.ok) assert.ok(blocked.state.round && ['doux', 'party'].includes(blocked.state.round.level));
});

test('one passe lasts the night, two vetoes pull the question, and the deadline reveals silence', () => {
  let state = gang();
  state = must(apply(state, {
    type: 'ask', token: 'secret-alex', hostToken: null, mode: 'tous', text: 'As-tu déjà stalké quelqu’un ici?', level: 'party', roundId: 'r4', now: NOW,
  })).state;
  state = must(apply(state, { type: 'answer', token: 'secret-sam', value: 'passe', now: NOW + 10 })).state;
  state = must(apply(state, { type: 'answer', token: 'secret-alex', value: 'non', now: NOW + 20 })).state;
  assert.equal(state.round?.status, 'reveal');
  state = must(apply(state, { type: 'next', token: 'secret-alex', hostToken: null, now: NOW + 2000 })).state;
  const second = must(apply(state, {
    type: 'ask', token: 'secret-alex', hostToken: null, mode: 'cible', targetId: 'sam', text: 'Est-ce que Sam t’a déjà fait rougir?', level: 'party', roundId: 'r5', now: NOW + 3000,
  }));
  const noPasse = apply(second.state, { type: 'answer', token: 'secret-sam', value: 'passe', now: NOW + 3100 });
  assert.equal(noPasse.ok, false);

  let veto = must(apply(second.state, { type: 'veto', token: 'secret-sam', now: NOW + 3200 })).state;
  assert.ok(veto.round);
  veto = must(apply(veto, { type: 'veto', token: 'secret-alex', now: NOW + 3300 })).state;
  assert.equal(veto.round, null);
  assert.match(veto.notice || '', /retir/);

  const quiet = must(apply(state, {
    type: 'ask', token: null, hostToken: 'host-secret-host-secret-host', mode: 'cible', targetId: 'sam',
    text: 'Est-ce que tu es du genre à arriver en retard?', level: 'doux', roundId: 'r6', now: NOW + 4000,
  }));
  const late = must(apply(quiet.state, { type: 'sync', token: null, hostToken: 'host-secret-host-secret-host', now: NOW + 4000 + 30_000 }));
  assert.equal(late.state.round?.status, 'reveal');
  assert.equal(present(late.state, 'secret-sam', null, NOW + 40_000).round?.answers?.[0]?.value, 'silence');
});

test('blocked questions stay out and harmless ones stay in', () => {
  assert.equal(questionIsBlocked('As-tu déjà eu un enfant?'), false);
  assert.equal(normalizeQuestion('As-tu déjà eu un enfant?').ok, true);
  assert.equal(questionIsBlocked('As-tu déjà eu un rapport sexuel avec un enfant?'), true);
  assert.equal(questionIsBlocked('question sexuelle sur un mineur de 15 ans'), true);
  const state = gang();
  const refused = apply(state, {
    type: 'ask', token: 'secret-alex', hostToken: null, mode: 'tous',
    text: 'As-tu déjà eu un rapport sexuel avec un enfant?', level: 'doux', roundId: 'r7', now: NOW,
  });
  assert.equal(refused.ok, false);
  assert.equal(BANK[0]?.level, 'doux');
});

test('http room survives a join, a secret answer and a reveal', async () => {
  resetOuiLaMemory();
  const { POST } = await import('@/app/api/jeux/oui-la/route');
  const send = async (body: Record<string, unknown>) => {
    const response = await POST(new Request('https://nowis.store/api/jeux/oui-la', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }));
    return response.json() as Promise<{ ok: boolean; error?: string; code?: string; token?: string; hostToken?: string; room?: { phase: string; you: { id: string } | null; round: { answers: { value: string }[] | null } | null } }>;
  };
  const wall = await send({ action: 'create', mode: 'mur' });
  assert.equal(wall.ok, true);
  assert.equal(wall.room?.you, null);
  const sam = await send({ action: 'join', code: wall.code, name: 'Sam', ceiling: 'ose', adult: true });
  const duplicate = await send({ action: 'join', code: wall.code, name: 'sam', ceiling: 'party', adult: true });
  assert.equal(duplicate.ok, false);
  const asked = await send({
    action: 'ask', code: wall.code, token: sam.token, mode: 'tous', level: 'party', text: 'As-tu déjà stalké quelqu’un qui est ici?',
  });
  assert.equal(asked.ok, true, asked.error);
  assert.equal(asked.room?.round?.answers, null);
  const answered = await send({ action: 'answer', code: wall.code, token: sam.token, value: 'non' });
  assert.equal(answered.room?.phase, 'reveal');
  assert.equal(answered.room?.round?.answers?.[0]?.value, 'non');
});
