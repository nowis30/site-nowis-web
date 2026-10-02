import assert from 'node:assert/strict';
import radioTracks from '../src/data/radio-tracks.json';
import albumTracks from '../src/data/album-tracks.json';
import musicStore from '../src/data/music-store.json';
import { buildRadioQueue, buildSelectionQueue } from '../src/lib/radio-queue';
import { parseRadioSession } from '../src/lib/radio-session';

const catalog = [...radioTracks, ...albumTracks];
const ids = albumTracks.map(track => track.id);
const indices = albumTracks.map((_, index) => radioTracks.length + index);
assert.equal(albumTracks.length, 32);
assert.deepEqual(ids, musicStore.album.tracks.map(track => `album-${track.id}`));
assert.equal(new Set(catalog.map(track => track.id)).size, catalog.length);

const full = buildSelectionQueue(catalog, ids);
assert.deepEqual(full.selection, indices);
assert.deepEqual(full.queue, indices);
const nounours = buildSelectionQueue(catalog, ids, 'album-6817287629');
assert.deepEqual(nounours.selection, indices, 'Repeating the album retains every official track.');
assert.deepEqual(nounours.queue, indices.slice(1), 'Nounours continues in official album order.');
const last = buildSelectionQueue(catalog, ids, ids.at(-1));
assert.deepEqual(last.queue, indices.slice(-1));
assert.deepEqual(last.selection, indices, 'The next cycle restarts from the first album track.');
assert.deepEqual(buildSelectionQueue(catalog, [ids[0], 'missing', ids[0], ids[2]]).selection, [indices[0], indices[2]]);
assert.deepEqual(buildSelectionQueue(catalog, ids, 'missing').queue, indices);

for (const current of [0, radioTracks.length - 1, indices[1], indices.at(-1)!]) {
  const radio = buildRadioQueue(radioTracks.length, current);
  assert.equal(radio.length, 139);
  assert.deepEqual([...radio].sort((a, b) => a - b), radioTracks.map((_, index) => index));
}
const favorites = buildSelectionQueue(catalog, [radioTracks[1].id, radioTracks[4].id]);
assert.deepEqual(favorites.queue, [1, 4]);
assert.deepEqual(favorites.selection, [1, 4]);

const signature = JSON.stringify(catalog.map(({ id, src }) => [id, src]));
const session = { catalog: signature, current: indices[1], queue: indices.slice(2), position: 42, selection: indices, selectionLabel: 'L’amour de Nowis' };
assert.deepEqual(parseRadioSession(JSON.stringify(session), signature, catalog.length), session);
const finalTrackSession = { ...session, current: indices.at(-1)!, queue: [] };
const restoredFinal = parseRadioSession(JSON.stringify(finalTrackSession), signature, catalog.length);
assert.deepEqual(restoredFinal, finalTrackSession, 'An empty queue at track32 remains a valid paused session.');
assert.equal(restoredFinal!.selection![0], indices[0], 'Refilling the persisted selection restarts at track1.');
for (const selectionLabel of ['', '   ', 42, 'x'.repeat(81)]) {
  assert.equal(parseRadioSession(JSON.stringify({ ...session, selectionLabel }), signature, catalog.length), null);
}
assert.equal(parseRadioSession(JSON.stringify({ ...session, selection: undefined }), signature, catalog.length), null);
console.log('Album playback: official 32-track order, jumps, repeat, radio139, favorites and restored label passed.');
