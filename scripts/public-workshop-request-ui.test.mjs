import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const requestPage = readFileSync(new URL('../src/app/ateliers/demande/page.tsx', import.meta.url), 'utf8');

test('workshop request page follows the current NOWIS public surface system', () => {
  assert.match(requestPage, /warm-cta-panel/);
  assert.match(requestPage, /brand-card/);
  assert.match(requestPage, /brand-metal-text/);
  assert.match(requestPage, /px-4 py-12/);
  assert.doesNotMatch(requestPage, /bg-white\/70/);
});

test('workshop request actions are touch and keyboard friendly', () => {
  assert.match(requestPage, /min-h-12/);
  assert.match(requestPage, /w-full/);
  assert.match(requestPage, /sm:w-auto/);
  assert.match(requestPage, /focus-visible:ring-2/);
  assert.match(requestPage, /motion-safe:transition/);
  assert.match(requestPage, /aria-labelledby="workshop-request-title"/);
});

test('group type forwarding stays explicitly whitelisted and encoded', () => {
  assert.match(requestPage, /GROUP_LABELS/);
  assert.match(requestPage, /Object\.prototype\.hasOwnProperty\.call/);
  assert.match(requestPage, /encodeURIComponent\(groupType\)/);
  assert.match(requestPage, /encodeURIComponent\(nextPath\)/);
  assert.match(requestPage, /Groupe sélectionné/);
});

test('workshop request copy uses corrected French accents', () => {
  assert.match(requestPage, /espace client sécurisé/);
  assert.match(requestPage, /Vous préférez une adresse courriel/);
  assert.doesNotMatch(requestPage, /a partir du portail client/);
  assert.doesNotMatch(requestPage, /methode/);
  assert.doesNotMatch(requestPage, /securise/);
});
