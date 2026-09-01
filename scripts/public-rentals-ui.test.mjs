import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const indexPage = readFileSync(new URL('../src/app/logements/page.tsx', import.meta.url), 'utf8');
const detailPage = readFileSync(new URL('../src/app/logements/[slug]/page.tsx', import.meta.url), 'utf8');

test('rental pages follow the current NOWIS public surface system', () => {
  for (const source of [indexPage, detailPage]) {
    assert.match(source, /brand-/);
    assert.match(source, /text-\[color:var\(--site-/);
    assert.doesNotMatch(source, /bg-slate-50/);
    assert.doesNotMatch(source, /text-emerald-/);
  }

  assert.match(indexPage, /brand-card/);
  assert.match(detailPage, /warm-cta-panel/);
});

test('rental prices use Canadian dollars consistently', () => {
  for (const source of [indexPage, detailPage]) {
    assert.match(source, /currency: 'CAD'/);
    assert.doesNotMatch(source, /€/);
  }
});

test('rental actions and navigation are touch and keyboard friendly', () => {
  assert.match(indexPage, /min-h-12/);
  assert.match(indexPage, /w-full/);
  assert.match(detailPage, /min-h-11/);
  assert.match(detailPage, /focus-visible:ring-2/);
  assert.match(detailPage, /cta-primary/);
  assert.match(indexPage, /noopener noreferrer/);
  assert.match(detailPage, /noopener noreferrer/);
});

test('rental detail gallery is responsive and optimized', () => {
  assert.match(detailPage, /priority=\{index === 0\}/);
  assert.match(detailPage, /sizes=\{index === 0/);
  assert.match(detailPage, /sm:col-span-2/);
  assert.match(detailPage, /lg:sticky lg:top-24/);
});

test('rental copy uses corrected French accents and semantic summaries', () => {
  assert.match(indexPage, /Logements à louer/);
  assert.match(indexPage, /Réserver/);
  assert.match(detailPage, /Résumé/);
  assert.match(detailPage, /Meublé/);
  assert.match(detailPage, /Acceptés/);
  assert.match(detailPage, /Contacter le propriétaire/);
  assert.match(indexPage, /<dl/);
  assert.match(detailPage, /<dl/);
});
