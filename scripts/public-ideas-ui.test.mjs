import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/app/idees/page.tsx', import.meta.url), 'utf8');

test('ideas page uses the current NOWIS public surface system', () => {
  assert.match(source, /section-soft/);
  assert.match(source, /brand-card/);
  assert.match(source, /warm-cta-panel/);
  assert.doesNotMatch(source, /bg-slate-50/);
  assert.doesNotMatch(source, /text-emerald-600/);
});

test('idea collections use semantic ordered lists and labelled sections', () => {
  assert.match(source, /<ol className=/);
  assert.match(source, /<li/);
  assert.match(source, /aria-labelledby=\{headingId\}/);
  assert.match(source, /id="chansons"/);
  assert.match(source, /id="videos"/);
  assert.match(source, /id="ia"/);
});

test('ideas cards and CTAs are responsive, keyboard friendly and reduced-motion aware', () => {
  assert.match(source, /motion-safe:transition/);
  assert.match(source, /focus-visible:ring-2/);
  assert.match(source, /min-h-12/);
  assert.match(source, /w-full/);
  assert.match(source, /sm:w-auto/);
});

test('contact request is encoded instead of hard-coded percent escapes', () => {
  assert.match(source, /encodeURIComponent/);
  assert.match(source, /href=\{`\/contact\?message=\$\{contactMessage\}`\}/);
});
