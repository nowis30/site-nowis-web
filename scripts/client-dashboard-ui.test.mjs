import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dashboard = readFileSync(new URL('../src/app/(client)/client/dashboard/page.tsx', import.meta.url), 'utf8');

test('client dashboard uses corrected French copy and semantic contact details', () => {
  assert.match(dashboard, /Compléter votre profil/);
  assert.match(dashboard, /Vos coordonnées aident à traiter/);
  assert.match(dashboard, /téléphone, adresse de facturation/);
  assert.match(dashboard, /<dl className=/);
  assert.match(dashboard, /<dt className=.*Courriel/);
  assert.match(dashboard, /<dd className=/);
  assert.doesNotMatch(dashboard, /Completer votre profil/);
  assert.doesNotMatch(dashboard, /Fallback courriel/);
});

test('client dashboard actions meet touch and keyboard accessibility targets', () => {
  assert.match(dashboard, /min-h-11/);
  assert.match(dashboard, /focus-visible:ring-2/);
  assert.match(dashboard, /motion-reduce:transition-none/);
  assert.match(dashboard, /aria-labelledby="client-dashboard-error-title"/);
  assert.match(dashboard, /role="alert"/);
  assert.match(dashboard, /role="status"/);
});

test('client dashboard external actions and downloads are explicit and safe', () => {
  assert.match(dashboard, /rel="noopener noreferrer"/);
  assert.match(dashboard, /aria-label={`Télécharger \$\{document\.originalName\} dans un nouvel onglet`}/);
  assert.match(dashboard, /target="_blank"/);
  assert.match(dashboard, /Autre application de courriel/);
});

test('client dashboard remains responsive without shrinking primary controls', () => {
  assert.match(dashboard, /sm:grid-cols-2 xl:grid-cols-4/);
  assert.match(dashboard, /flex-col gap-2 sm:flex-row/);
  assert.match(dashboard, /min-h-12 flex-col/);
  assert.match(dashboard, /break-words/);
});
