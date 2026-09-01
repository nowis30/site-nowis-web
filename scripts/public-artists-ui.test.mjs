import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const artistsPage = readFileSync(new URL('../src/app/artistes/page.tsx', import.meta.url), 'utf8');
const artistCard = readFileSync(new URL('../src/components/artists/ArtistCard.tsx', import.meta.url), 'utf8');
const artistProfile = readFileSync(new URL('../src/components/artists/ArtistProfilePage.tsx', import.meta.url), 'utf8');

test('artists index follows the current NOWIS public surface system', () => {
  assert.match(artistsPage, /section-soft/);
  assert.match(artistsPage, /brand-card/);
  assert.match(artistsPage, /aria-labelledby="artist-vision-title"/);
  assert.match(artistsPage, /px-4 py-14 sm:px-6/);
  assert.match(artistsPage, /encodeURIComponent/);
  assert.doesNotMatch(artistsPage, /glass-panel/);
  assert.doesNotMatch(artistsPage, /text-slate-950/);
  assert.doesNotMatch(artistsPage, /bg-slate-50/);
});

test('artist cards expose identity and responsive imagery', () => {
  assert.match(artistCard, /artist\.name/);
  assert.match(artistCard, /artist\.role/);
  assert.match(artistCard, /sizes="\(min-width: 1024px\) 45vw, 100vw"/);
  assert.match(artistCard, /motion-safe:group-hover:scale-105/);
  assert.match(artistCard, /focus-visible:ring-2/);
  assert.match(artistCard, /aria-hidden="true"/);
});

test('artist profile navigation and actions are keyboard and touch friendly', () => {
  assert.match(artistProfile, /aria-label="Navigation dans le profil de l’artiste"/);
  assert.match(artistProfile, /scroll-mt-28/);
  assert.match(artistProfile, /min-h-12/);
  assert.match(artistProfile, /w-full/);
  assert.match(artistProfile, /sm:w-auto/);
  assert.match(artistProfile, /focus-visible:ring-2/);
  assert.match(artistProfile, /motion-safe:transition/);
});

test('artist profile uses responsive media and safe external embeds', () => {
  assert.match(artistProfile, /sizes="\(min-width: 1024px\) 42vw, 100vw"/);
  assert.match(artistProfile, /loading="lazy"/);
  assert.match(artistProfile, /referrerPolicy="strict-origin-when-cross-origin"/);
  assert.match(artistProfile, /nouvel onglet/);
  assert.match(artistProfile, /brand-card/);
  assert.doesNotMatch(artistProfile, /glass-panel-soft/);
  assert.doesNotMatch(artistProfile, /bg-red-50/);
  assert.doesNotMatch(artistProfile, /bg-emerald-50/);
  assert.doesNotMatch(artistProfile, /text-slate-950/);
});
