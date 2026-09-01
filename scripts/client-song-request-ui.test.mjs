import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../src/app/(client)/client/song-requests/nouveau/page.tsx', import.meta.url), 'utf8');
const form = readFileSync(new URL('../src/components/forms/SongRequestForm.tsx', import.meta.url), 'utf8');

test('new song request page keeps billing gating and touch-friendly navigation', () => {
  assert.match(page, /isClientBillingComplete/);
  assert.match(page, /\/client\/facturation\?next=\/client\/song-requests\/nouveau/);
  assert.match(page, /min-h-11/);
  assert.match(page, /min-h-12/);
  assert.match(page, /motion-reduce:transition-none/);
  assert.match(page, /doit être complété avant de créer une demande/);
  assert.match(page, /Compléter mes informations/);
});

test('song request form is visually coherent with the dark client portal', () => {
  assert.match(form, /crm-surface/);
  assert.match(form, /bg-slate-950\/70/);
  assert.match(form, /border-primary-500\/15/);
  assert.doesNotMatch(form, /rounded-3xl bg-white/);
  assert.doesNotMatch(form, /bg-slate-50/);
});

test('song request form exposes accessible form states and mobile-friendly fields', () => {
  assert.match(form, /role="status"/);
  assert.match(form, /role="alert"/);
  assert.match(form, /aria-busy=\{isSubmitting \|\| uploadingFile\}/);
  assert.match(form, /aria-invalid=\{Boolean\(errors\.eventType\)\}/);
  assert.match(form, /autoComplete="name"/);
  assert.match(form, /autoComplete="email"/);
  assert.match(form, /autoComplete="tel"/);
  assert.match(form, /min-h-12/);
  assert.match(form, /h-5 w-5/);
});

test('song request interactions respect reduced motion and robust API parsing', () => {
  assert.match(form, /prefers-reduced-motion: reduce/);
  assert.match(form, /response\.json\(\)\.catch\(\(\) => null\)/);
  assert.match(form, /motion-reduce:transition-none/);
  assert.match(form, /Téléversement impossible/);
  assert.match(form, /Votre demande a été envoyée/);
});
