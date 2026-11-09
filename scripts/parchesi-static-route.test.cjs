const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const config = require('../next.config.js');

const GAME_FILES = [
  'public/jeux/parchesi/index.html',
  'public/jeux/parchesi/sw.js',
  'public/jeux/parchesi/manifest.webmanifest',
  'public/jeux/parchesi/icons/icon-192.png',
  'public/jeux/parchesi/icons/icon-512.png',
  'public/jeux/parchesi/icons/icon-maskable-512.png',
  'public/jeux/parchesi/icons/apple-touch-icon.png',
];

function headerValue(rules, source, key) {
  const matches = rules.filter((rule) => rule.source === source);
  const header = matches.flatMap((rule) => rule.headers).find((item) => item.key === key);
  return header ? header.value : undefined;
}

test('Parchési des Arcanes is a static game reached from the clean URL', async () => {
  for (const file of GAME_FILES) assert.equal(fs.existsSync(file), true, file);

  const html = fs.readFileSync('public/jeux/parchesi/index.html', 'utf8');
  assert.match(html, /navigator\.serviceWorker\.register\('sw\.js'\)/);
  assert.doesNotMatch(html, /serviceWorker\.register\([^)]*scope\s*:\s*['"]\/['"]/);

  const worker = fs.readFileSync('public/jeux/parchesi/sw.js', 'utf8');
  assert.match(worker, /parchesi-arcanes-v4-/);
  assert.doesNotMatch(worker, /Service-Worker-Allowed|scope\s*=\s*['"]\/['"]/);

  const redirects = await config.redirects();
  for (const source of ['/jeux/parchesi', '/jeux/parchesi/']) {
    assert.equal(
      redirects.some((rule) => rule.source === source && rule.destination === '/jeux/parchesi/index.html'),
      true,
      source,
    );
  }

  const screen = fs.readFileSync('src/components/jeux/GamesScreen.tsx', 'utf8');
  assert.match(screen, /Parchési des Arcanes/);
  assert.match(screen, /3 dés et 8 pitons/);
  assert.match(screen, /chacun sur son cellulaire/);
  assert.match(screen, /href: '\/jeux\/parchesi'/);
  assert.match(screen, /\/jeux\/parchesi\/icons\/icon-512\.png/);
});

test('Parchési cache and CSP stay on the game path and do not widen the site policy', async () => {
  const rules = await config.headers();
  const sources = rules.map((rule) => rule.source);
  assert.ok(sources.indexOf('/(.*)') < sources.indexOf('/jeux/parchesi/index.html'));
  assert.ok(sources.indexOf('/(.*)') < sources.indexOf('/jeux/parchesi/sw.js'));

  for (const source of ['/jeux/parchesi/index.html', '/jeux/parchesi/sw.js', '/jeux/parchesi/manifest.webmanifest']) {
    const cache = headerValue(rules, source, 'Cache-Control');
    assert.match(cache, /no-store/, source);
    assert.doesNotMatch(cache, /immutable/, source);
  }

  const gamePolicy = headerValue(rules, '/jeux/parchesi/index.html', 'Content-Security-Policy');
  assert.match(gamePolicy, /https:\/\/unpkg\.com/);
  assert.match(gamePolicy, /https:\/\/cdn\.jsdelivr\.net/);
  assert.match(gamePolicy, /https:\/\/fonts\.googleapis\.com/);
  assert.match(gamePolicy, /https:\/\/fonts\.gstatic\.com/);
  assert.match(gamePolicy, /https:\/\/0\.peerjs\.com/);
  assert.match(gamePolicy, /wss:\/\/0\.peerjs\.com/);
  assert.match(gamePolicy, /\sstun:(?:\s|;|$)/);
  assert.doesNotMatch(gamePolicy, /stun:[a-z0-9]/);
  assert.equal(headerValue(rules, '/jeux/parchesi/sw.js', 'Content-Security-Policy'), gamePolicy);

  const permissions = headerValue(rules, '/jeux/parchesi/index.html', 'Permissions-Policy');
  assert.match(permissions, /fullscreen=\(self\)/);
  // Chrome logs "Unrecognized feature: vibrate" and ignores it. Omitting the
  // token leaves the Vibration API on its default same-origin allowlist.
  assert.doesNotMatch(permissions, /vibrate/);
  assert.equal(headerValue(rules, '/jeux/parchesi/sw.js', 'Service-Worker-Allowed'), undefined);
  assert.equal(headerValue(rules, '/jeux/parchesi/index.html', 'Service-Worker-Allowed'), undefined);

  const sitePolicy = headerValue(rules, '/(.*)', 'Content-Security-Policy');
  assert.doesNotMatch(sitePolicy, /unpkg\.com|jsdelivr\.net|peerjs\.com|fonts\.googleapis\.com/);
  assert.match(sitePolicy, /default-src 'self'/);

  const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const allowedWide = vercel.headers.filter((rule) => rule.headers.some((header) => header.key === 'Service-Worker-Allowed'));
  assert.deepEqual(allowedWide.map((rule) => rule.source), ['/sw.js']);
  for (const source of ['/jeux/parchesi/index.html', '/jeux/parchesi/sw.js']) {
    const cache = vercel.headers.find((rule) => rule.source === source)?.headers.find((header) => header.key === 'Cache-Control')?.value;
    assert.match(cache, /no-store/, source);
  }

  // The private-page proxy replaces CSP for its matcher only. The game must
  // stay outside that matcher so the document policy above is the one served.
  const proxy = fs.readFileSync('src/proxy.ts', 'utf8');
  const matcher = proxy.slice(proxy.indexOf('matcher:'));
  assert.doesNotMatch(matcher, /jeux/);
});
