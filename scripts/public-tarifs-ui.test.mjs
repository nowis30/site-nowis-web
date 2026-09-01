import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const pageSource = readFileSync(join(process.cwd(), 'src/app/tarifs/page.tsx'), 'utf8');

test('Tarifs keeps mobile-first calls to action and project guidance', () => {
  assert.match(pageSource, /href="\/ateliers\/demande"/);
  assert.match(pageSource, /href="\/contact"/);
  assert.match(pageSource, /href="\/avant-de-mecrire"/);
  assert.match(pageSource, /cta-primary w-full justify-center/);
  assert.match(pageSource, /cta-secondary w-full justify-center/);
});

test('Tarifs uses semantic responsive summary instead of a wide table', () => {
  assert.match(pageSource, /<dl className="mt-8 grid gap-3 sm:grid-cols-2">/);
  assert.doesNotMatch(pageSource, /<table/);
  assert.doesNotMatch(pageSource, /overflow-x-auto/);
});

test('Tarifs avoids legacy glass panels and gates card motion safely', () => {
  assert.doesNotMatch(pageSource, /glass-panel-/);
  assert.match(pageSource, /motion-safe:transition-transform/);
  assert.match(pageSource, /motion-safe:hover:-translate-y-1/);
});

test('Tarifs keeps pricing sourced from shared regular prices', () => {
  assert.match(pageSource, /REGULAR_PRICES\.hourly/);
  assert.match(pageSource, /REGULAR_PRICES\.groupFromPerPerson/);
  assert.match(pageSource, /REGULAR_PRICES\.songs\.memorySong/);
  assert.match(pageSource, /REGULAR_PRICES\.songs\.videoWithSong/);
});
