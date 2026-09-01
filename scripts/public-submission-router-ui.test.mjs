import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../src/app/soumission/nouvelle/page.tsx', import.meta.url), 'utf8');
const legacyApi = readFileSync(new URL('../src/app/api/public/submission-request/route.ts', import.meta.url), 'utf8');
const legacyClient = new URL('../src/app/soumission/nouvelle/SubmissionFormClient.tsx', import.meta.url);

test('public submission entry no longer posts to the disabled legacy API', () => {
  assert.doesNotMatch(page, /\/api\/public\/submission-request/);
  assert.doesNotMatch(page, /SubmissionFormClient/);
  assert.equal(existsSync(legacyClient), false);
  assert.match(legacyApi, /status: 410/);
});

test('song and workshop requests use the secure client portal routes', () => {
  assert.match(page, /SONG_REQUEST_NEXT_PATH/);
  assert.match(page, /WORKSHOP_REQUEST_NEXT_PATH/);
  assert.match(page, /ClientPortalRequestGate/);
  assert.match(page, /showBackToPortal/);
});

test('submission router follows the current NOWIS public visual system', () => {
  assert.match(page, /site-background/);
  assert.match(page, /section-soft/);
  assert.match(page, /brand-card/);
  assert.match(page, /brand-chip/);
  assert.match(page, /warm-spotlight-panel/);
  assert.doesNotMatch(page, /bg-slate-950/);
  assert.doesNotMatch(page, /text-slate-/);
});

test('request choices and actions are responsive and accessible', () => {
  assert.match(page, /aria-label="Choisir un type de demande"/);
  assert.match(page, /aria-current=\{active \? 'page' : undefined\}/);
  assert.match(page, /min-h-48/);
  assert.match(page, /min-h-12 w-full/);
  assert.match(page, /focus-visible:ring-2/);
  assert.match(page, /motion-reduce:transition-none/);
  assert.match(page, /sm:w-auto/);
});
