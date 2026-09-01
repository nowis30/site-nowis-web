import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const musicPage = readFileSync(new URL('../src/app/musique/page.tsx', import.meta.url), 'utf8');
const videosPage = readFileSync(new URL('../src/app/videos/page.tsx', import.meta.url), 'utf8');
const songCard = readFileSync(new URL('../src/components/music/SongCard.tsx', import.meta.url), 'utf8');
const videoCard = readFileSync(new URL('../src/components/videos/VideoCard.tsx', import.meta.url), 'utf8');

test('music and video indexes use the current NOWIS public surface system', () => {
  for (const source of [musicPage, videosPage]) {
    assert.match(source, /section-soft/);
    assert.match(source, /brand-card/);
    assert.match(source, /aria-labelledby=/);
    assert.match(source, /px-4 sm:px-6/);
    assert.doesNotMatch(source, /bg-slate-50/);
    assert.doesNotMatch(source, /text-slate-950/);
  }
});

test('video copy is accented and contact text is safely encoded', () => {
  assert.match(videosPage, /eyebrow: 'Vidéos'/);
  assert.match(videosPage, /compléments visuels/);
  assert.match(videosPage, /encodeURIComponent/);
  assert.doesNotMatch(videosPage, /Des options visuelles et videos IA/);
});

test('media cards stay server rendered and optimize responsive images', () => {
  for (const source of [songCard, videoCard]) {
    assert.doesNotMatch(source, /'use client'/);
    assert.match(source, /sizes="\(min-width: 1280px\) 30vw, \(min-width: 768px\) 45vw, 100vw"/);
    assert.match(source, /brand-card/);
    assert.match(source, /motion-safe:transition/);
    assert.match(source, /motion-safe:group-hover:scale-105/);
  }
});

test('media actions are touch friendly and keyboard visible', () => {
  for (const source of [songCard, videoCard]) {
    assert.match(source, /min-h-12/);
    assert.match(source, /w-full/);
    assert.match(source, /sm:w-auto/);
    assert.match(source, /focus-visible:ring-2/);
    assert.match(source, /nouvel onglet/);
  }
});
