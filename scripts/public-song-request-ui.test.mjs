import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../src/app/commander-une-chanson/page.tsx', import.meta.url), 'utf8');

test('song request page follows the current NOWIS public surface system', () => {
  assert.match(page, /brand-card/);
  assert.match(page, /brand-chip/);
  assert.match(page, /warm-spotlight-panel/);
  assert.match(page, /text-\[color:var\(--site-/);
  assert.doesNotMatch(page, /glass-panel-soft/);
  assert.doesNotMatch(page, /text-emerald-/);
});

test('song request actions are mobile and keyboard friendly', () => {
  assert.match(page, /cta-primary min-h-12 w-full/);
  assert.match(page, /cta-secondary min-h-12 w-full/);
  assert.match(page, /min-h-11 w-full/);
  assert.match(page, /sm:w-auto/);
  assert.match(page, /aria-labelledby="song-request-portal-title"/);
  assert.match(page, /scroll-mt-24/);
});

test('song request funnel preserves the secure portal flow', () => {
  assert.match(page, /href=\{SONG_REQUEST_GOOGLE_AUTH_URL\}/);
  assert.match(page, /ClientPortalRequestGate nextPath="\/client\/song-requests\/nouveau" showBackToPortal/);
  assert.match(page, /legalLinks\.terms/);
  assert.match(page, /legalLinks\.privacy/);
});

test('song request page has one portal anchor and corrected French copy', () => {
  assert.equal((page.match(/id="acces-portail"/g) || []).length, 1);
  assert.match(page, /Chanson personnalisée/);
  assert.match(page, /Une chanson sur mesure à partir de votre histoire/);
  assert.match(page, /L’objectif/);
  assert.match(page, /Autre méthode/);
  assert.match(page, /Étape/);
  assert.doesNotMatch(page, /getAdminSectionVisualStyle/);
});
