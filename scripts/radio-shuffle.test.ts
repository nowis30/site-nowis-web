import assert from 'node:assert/strict';
import { shuffleTracks } from '../src/lib/radio-shuffle';

let seed = 123456;
const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
let previous = -1;
for (let cycle = 0; cycle < 100; cycle++) {
  const queue = shuffleTracks(141, previous, random);
  assert.equal(queue.length, 141);
  assert.equal(new Set(queue).size, 141);
  assert.deepEqual([...queue].sort((a,b)=>a-b), Array.from({length:141},(_,i)=>i));
  assert.notEqual(queue[0], previous);
  previous = queue.at(-1)!;
}
assert.deepEqual(shuffleTracks(0), []);
assert.deepEqual(shuffleTracks(1, 0), [0]);
assert.notEqual(shuffleTracks(2, 0, () => 0.999)[0], 0);
console.log('Radio shuffle: 100 complete cycles, unique tracks and cycle boundaries passed.');
