import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/app/inscription/page.tsx', import.meta.url), 'utf8');

test('registration page uses the current NOWIS public surface system', () => {
  assert.match(source, /warm-cta-panel/);
  assert.match(source, /brand-card/);
  assert.doesNotMatch(source, /bg-white\/90 backdrop-blur-md border border-gray-200/);
});

test('registration fields have explicit accessible labels and useful autocomplete hints', () => {
  for (const id of ['registration-full-name', 'registration-email', 'registration-phone', 'registration-password']) {
    assert.match(source, new RegExp(`htmlFor="${id}"`));
    assert.match(source, new RegExp(`id="${id}"`));
  }

  for (const value of ['name', 'email', 'tel', 'new-password']) {
    assert.match(source, new RegExp(`autoComplete="${value}"`));
  }
});

test('registration feedback and controls are touch and keyboard friendly', () => {
  assert.match(source, /role="alert"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /min-h-12/);
  assert.match(source, /focus-visible:ring-2/);
  assert.match(source, /aria-busy=\{isSubmitting\}/);
});

test('registration keeps safe redirects and tolerates malformed API responses', () => {
  assert.match(source, /sanitizeNextPath/);
  assert.match(source, /response\.json\(\)\.catch\(\(\) => \(\{\}\)\)/);
  assert.match(source, /encodeURIComponent\(nextPath\)/);
});
