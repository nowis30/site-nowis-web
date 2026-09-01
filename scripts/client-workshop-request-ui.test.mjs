import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../src/app/(client)/client/workshops/nouveau/page.tsx', import.meta.url), 'utf8');
const form = readFileSync(new URL('../src/features/workshops/components/WorkshopRequestForm.tsx', import.meta.url), 'utf8');

test('new workshop page preserves billing gating and the selected group type', () => {
  assert.match(page, /isClientBillingComplete/);
  assert.match(page, /nextAfterBilling/);
  assert.match(page, /encodeURIComponent\(nextAfterBilling\)/);
  assert.match(page, /initialGroupType=\{initialGroupType as/);
  assert.match(page, /min-h-11/);
  assert.match(page, /min-h-12/);
  assert.match(page, /Compléter mes informations/);
});

test('workshop request form uses portal surfaces and touch-friendly controls', () => {
  assert.match(form, /crm-surface/);
  assert.match(form, /bg-slate-950\/70/);
  assert.match(form, /border-primary-500\/15/);
  assert.match(form, /min-h-12/);
  assert.match(form, /min-h-11/);
  assert.match(form, /h-5 w-5/);
});

test('workshop request form exposes accessible errors and useful autocomplete', () => {
  assert.match(form, /role="alert"/);
  assert.match(form, /aria-live="assertive"/);
  assert.match(form, /aria-busy=\{isSubmitting\}/);
  assert.match(form, /aria-invalid=\{Boolean\(errors\.organizationName\)\}/);
  assert.match(form, /autoComplete="name"/);
  assert.match(form, /autoComplete="email"/);
  assert.match(form, /autoComplete="tel"/);
});

test('workshop request failures are robust and reduced-motion aware', () => {
  assert.match(form, /response\.json\(\)\.catch\(\(\) => null\)/);
  assert.match(form, /Connexion impossible au serveur/);
  assert.match(form, /prefers-reduced-motion: reduce/);
  assert.match(form, /motion-reduce:transition-none/);
  assert.match(form, /Demande envoyée/);
});
