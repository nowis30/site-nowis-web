import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const forgotSource = readFileSync(new URL('../src/app/mot-de-passe-oublie/page.tsx', import.meta.url), 'utf8');
const resetSource = readFileSync(new URL('../src/app/reinitialiser-mot-de-passe/page.tsx', import.meta.url), 'utf8');

test('password recovery pages use the current NOWIS surface system', () => {
  for (const source of [forgotSource, resetSource]) {
    assert.match(source, /warm-cta-panel/);
    assert.match(source, /brand-card/);
    assert.doesNotMatch(source, /bg-white\/90 backdrop-blur-md border border-gray-200/);
  }
});

test('forgot-password form exposes accessible browser and feedback semantics', () => {
  assert.match(forgotSource, /htmlFor="forgot-password-email"/);
  assert.match(forgotSource, /id="forgot-password-email"/);
  assert.match(forgotSource, /autoComplete="email"/);
  assert.match(forgotSource, /inputMode="email"/);
  assert.match(forgotSource, /aria-busy=\{loading\}/);
  assert.match(forgotSource, /role="alert"/);
  assert.match(forgotSource, /role="status"/);
  assert.match(forgotSource, /readApiJson/);
  assert.match(forgotSource, /getApiErrorMessage/);
});

test('reset-password form documents the complete password policy and valid link states', () => {
  assert.match(resetSource, /Au moins 8 caractères/);
  assert.match(resetSource, /lettre majuscule et une lettre minuscule/);
  assert.match(resetSource, /Au moins un chiffre/);
  assert.match(resetSource, /minLength=\{8\}/);
  assert.match(resetSource, /autoComplete="new-password"/);
  assert.match(resetSource, /aria-describedby="password-requirements"/);
  assert.match(resetSource, /token === null/);
  assert.match(resetSource, /token === ''/);
  assert.match(resetSource, /Demander un nouveau lien/);
});

test('password recovery controls are touch, keyboard and reduced-motion friendly', () => {
  for (const source of [forgotSource, resetSource]) {
    assert.match(source, /min-h-12/);
    assert.match(source, /min-h-11/);
    assert.match(source, /focus-visible:ring-2/);
    assert.match(source, /motion-safe:transition/);
    assert.match(source, /motion-reduce:transition-none/);
  }

  assert.match(resetSource, /readApiJson/);
  assert.match(resetSource, /getApiErrorMessage/);
});
