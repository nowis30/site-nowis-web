import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseRadioSession } from '../src/lib/radio-session';
import tracks from '../src/data/radio-tracks.json';

async function main() {
  const catalog = JSON.stringify(tracks.map(({ id, src }) => [id, src]));
  const saved = { catalog, queue: [1, 3, 4], current: 2, position: 73.5 };
  assert.deepEqual(parseRadioSession(JSON.stringify(saved), catalog, tracks.length), saved);
  const selection = { ...saved, selection: [1, 2, 3, 4] };
  assert.deepEqual(parseRadioSession(JSON.stringify(selection), catalog, tracks.length), selection);
  for (const invalid of [[], [1, 3, 4], [2], [1, 2, 3, 3, 4], [1, 2, 3, 4, tracks.length]]) {
    assert.equal(parseRadioSession(JSON.stringify({ ...saved, selection: invalid }), catalog, tracks.length), null);
  }
  for (const change of [
    { catalog: 'outdated' }, { queue: [1, 1] }, { queue: [2] },
    { queue: [-1] }, { queue: [tracks.length] }, { current: -1 },
    { current: '2' }, { position: -1 }, { position: '73' },
  ]) assert.equal(parseRadioSession(JSON.stringify({ ...saved, ...change }), catalog, tracks.length), null);
  for (const raw of [null, '', '{', 'null', '[]']) assert.equal(parseRadioSession(raw, catalog, tracks.length), null);

  const deleted: string[] = [];
  const events: Record<string, (event?: { waitUntil: (task: Promise<void>) => void }) => void> = {};
  let claimed = false;
  let unregistered = false;
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: {
      addEventListener: (event: string, handler: typeof events[string]) => { events[event] = handler; },
      skipWaiting: async () => {},
      clients: { claim: async () => { claimed = true; } },
      registration: { unregister: async () => { unregistered = true; } },
    },
    caches: {
      keys: async () => ['creation-nowis-static-v1.0', 'creation-nowis-dynamic-v1.0', 'nowis-old', 'unrelated-cache'],
      delete: async (key: string) => { deleted.push(key); },
    },
  });
  let activation: Promise<void> | undefined;
  events.activate({ waitUntil: (task) => { activation = task; } });
  await activation;
  assert.deepEqual(deleted, ['creation-nowis-static-v1.0', 'creation-nowis-dynamic-v1.0', 'nowis-old']);
  assert.ok(claimed && unregistered);
  assert.equal(events.fetch, undefined);
  assert.equal(readFileSync('sw.js', 'utf8'), readFileSync('public/sw.js', 'utf8'));
  console.log('Radio session restore, corrupt storage and legacy cache retirement passed.');
}
void main();
