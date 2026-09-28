import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCookieConsent } from '../src/lib/cookie-consent';
import { publicInquiryHref, SONG_REQUEST_GOOGLE_AUTH_URL } from '../src/lib/client-portal-routes';
import { getAllSongs } from '../src/data/songs';
import { getYouTubeSelections, youtubeSelectionSnapshot } from '../src/data/youtubeSelections';
import { PUBLIC_INQUIRY_MAX_BYTES, publicInquiryOriginAllowed, readPublicInquiryBody } from '../src/lib/public-inquiry-security';

async function main() {
  const selections = getYouTubeSelections(await getAllSongs());
  for (const kind of ['latest', 'popular'] as const) {
    assert.equal(selections[kind].length, 10, `All ten ${kind} songs must resolve after catalogue deduplication`);
    assert.equal(new Set(selections[kind].map(({ song }) => song.youtubeVideoId)).size, 10);
    assert.deepEqual(selections[kind].map(({ song }) => song.youtubeVideoId), youtubeSelectionSnapshot[kind].map(({ videoId }) => videoId));
  }
  assert.ok(selections.popular.every((entry, index, entries) => index === 0 || entry.viewCount <= entries[index - 1].viewCount));
  assert.ok(selections.latest.every(({ song }, index, entries) => Boolean(song.publishedAt) && (index === 0 || Date.parse(song.publishedAt!) <= Date.parse(entries[index - 1].song.publishedAt!))));
  console.log('PASS: ten recent songs, ten popular songs, complete detail links and verified ordering');
  assert.equal(publicInquiryHref(SONG_REQUEST_GOOGLE_AUTH_URL), '/commander-une-chanson#demande');
  assert.equal(publicInquiryHref('/api/client-auth/google/start?next=%2Fclient%2Fworkshops%2Fnouveau%3FgroupType%3DECOLE'), '/ateliers/demande?groupType=ECOLE');
  assert.equal(publicInquiryHref('/api/client-auth/google/start?next=/client'), '/api/client-auth/google/start?next=/client');
  assert.equal(publicInquiryHref('https://example.com/api/client-auth/google/start?next=/client/song-requests/nouveau'), 'https://example.com/api/client-auth/google/start?next=/client/song-requests/nouveau');
  console.log('PASS: legacy commercial links and private login boundaries');
  const production = { NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://nowis.store' } as NodeJS.ProcessEnv;
  for (const origin of [null, 'null', 'https://attacker.example', 'https://nowis.store.attacker.example', 'http://nowis.store', 'https://nowis.store/path']) {
    assert.equal(publicInquiryOriginAllowed(origin, production), false, `Reject ${origin}`);
  }
  assert.equal(publicInquiryOriginAllowed('https://nowis.store', production), true);
  assert.equal(publicInquiryOriginAllowed('https://www.nowis.store', production), true);
  const preview = { ...production, VERCEL_ENV: 'preview', VERCEL_URL: 'exact-preview.vercel.app' };
  assert.equal(publicInquiryOriginAllowed('https://exact-preview.vercel.app', preview), true);
  assert.equal(publicInquiryOriginAllowed('https://other-preview.vercel.app', preview), false);
  assert.equal(publicInquiryOriginAllowed('http://localhost:3000', { NODE_ENV: 'development' } as NodeJS.ProcessEnv), true);
  console.log('PASS: explicit origins and exact preview host');

  const now = Date.now();
  const accepted = JSON.stringify({ version: 2, analytics: true, advertising: false, decidedAt: now });
  assert.equal(parseCookieConsent(accepted, now)?.analytics, true);
  for (const value of [null, 'accepted', 'declined', '{}', '[]', 'null', 'invalid', JSON.stringify({version: 2, analytics: 'yes', advertising: false, decidedAt: now}), JSON.stringify({version: 2, analytics: true, advertising: true, decidedAt: now + 1000})]) {
    assert.equal(parseCookieConsent(value, now), null);
  }
  assert.equal(parseCookieConsent(accepted, now + 181 * 86_400_000), null);
  console.log('PASS: consent version, expiry and malformed values');

  assert.equal(await readPublicInquiryBody(new Request('https://nowis.store/api/public-inquiries', {method: 'POST', body: 'Bonjour é'})), 'Bonjour é');
  await assert.rejects(readPublicInquiryBody(new Request('https://nowis.store/api/public-inquiries', {method: 'POST', body: 'x'.repeat(PUBLIC_INQUIRY_MAX_BYTES + 1)})), RangeError);
  await assert.rejects(readPublicInquiryBody(new Request('https://nowis.store/api/public-inquiries', {method: 'POST', headers: {'Content-Length': '999999'}, body: '{}'})), RangeError);
  console.log('PASS: actual byte and declared body limits');

  const read = (path: string) => readFileSync(path, 'utf8');
  const endpoint = read('src/app/api/public-inquiries/route.ts');
  assert.ok(!/tx\.contact\.|tx\.message\./.test(endpoint));
  assert.ok(endpoint.includes('tx.inquiry.create'));
  assert.ok(endpoint.includes('tx.task.create'));
  assert.ok(!/return json\(\{[^}]*contactId/.test(endpoint));
  assert.ok(read('src/app/api/contact/route.ts').includes("code: 'AUTH_REQUIRED'"));
  for (const path of ['src/app/contact/page.tsx', 'src/app/commander-une-chanson/page.tsx', 'src/app/ateliers/demande/page.tsx']) {
    const source = read(path);
    assert.ok(source.includes('<PublicInquiryForm'));
    assert.ok(!source.includes('<main'));
    assert.ok(!source.includes('SONG_REQUEST_GOOGLE_AUTH_URL'));
  }
  const home = read('src/screens/HomeScreen.tsx');
  assert.ok(home.indexOf('<h1') < home.indexOf('<HeroVideoPlaceholder'));
  assert.ok(!/<HeroVideoPlaceholder[^>]*autoPlay/.test(home));
  assert.ok(!read('src/app/layout.tsx').includes('googletagmanager.com'));
  console.log('PASS: public forms, protected portal, hero order and consent-only tag loading');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
