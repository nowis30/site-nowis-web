import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const loginSource = readFileSync(new URL('../src/app/connexion/page.tsx', import.meta.url), 'utf8');
const googleSource = readFileSync(
  new URL('../src/features/client-portal/components/GoogleClientAuthCard.tsx', import.meta.url),
  'utf8',
);

test('login page uses the current NOWIS surface system without legacy glass cards', () => {
  assert.match(loginSource, /warm-cta-panel/);
  assert.match(loginSource, /brand-card/);
  assert.doesNotMatch(loginSource, /glass-panel-(?:soft|strong)/);
});

test('login fields and feedback expose accessible browser semantics', () => {
  for (const id of ['login-email', 'login-password']) {
    assert.match(loginSource, new RegExp(`htmlFor="${id}"`));
    assert.match(loginSource, new RegExp(`id="${id}"`));
  }

  assert.match(loginSource, /autoComplete="email"/);
  assert.match(loginSource, /autoComplete="current-password"/);
  assert.match(loginSource, /aria-busy=\{isSubmitting\}/);
  assert.match(loginSource, /role="alert"/);
  assert.match(loginSource, /aria-live="polite"/);
});

test('login controls are touch and keyboard friendly and keep safe redirects', () => {
  assert.match(loginSource, /min-h-12/);
  assert.match(loginSource, /min-h-11/);
  assert.match(loginSource, /focus-visible:ring-2/);
  assert.match(loginSource, /sanitizeNextPath/);
  assert.match(loginSource, /encodeURIComponent\(nextPath\)/);
});

test('Google auth card respects reduced motion and exposes a clear focus state', () => {
  assert.match(googleSource, /warm-spotlight-panel/);
  assert.match(googleSource, /motion-safe:transition/);
  assert.match(googleSource, /motion-reduce:transition-none/);
  assert.match(googleSource, /focus-visible:ring-2/);
  assert.match(googleSource, /focusable="false"/);
  assert.doesNotMatch(googleSource, /role="img"/);
});
