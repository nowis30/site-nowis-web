const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const config = require('../next.config.js');

const GAME_FILES = [
  'public/jeux/a-deux-au-galop/index.html',
  'public/jeux/a-deux-au-galop/assets/index-BSYulcqk.js',
  'public/jeux/a-deux-au-galop/assets/index-DUAbpgDr.css',
  'public/jeux/a-deux-au-galop/vignette.webp',
];

function headerValue(rules, source, key) {
  const matches = rules.filter((rule) => rule.source === source);
  const header = matches.flatMap((rule) => rule.headers).find((item) => item.key === key);
  return header ? header.value : undefined;
}

test('À deux au galop is a static build opened from the games card', () => {
  for (const file of GAME_FILES) assert.equal(fs.existsSync(file), true, file);

  const html = fs.readFileSync('public/jeux/a-deux-au-galop/index.html', 'utf8');
  assert.match(html, /src="\/jeux\/a-deux-au-galop\/assets\/index-BSYulcqk\.js"/);
  assert.match(html, /href="\/jeux\/a-deux-au-galop\/assets\/index-DUAbpgDr\.css"/);
  assert.match(html, /<title>À deux au galop<\/title>/);

  const screen = fs.readFileSync('src/components/jeux/GamesScreen.tsx', 'utf8');
  assert.match(screen, /name: 'À deux au galop'/);
  assert.match(screen, /Retrouve Noisette sur le domaine, soigne-la, monte-la et gagne tes écus, directement dans ton navigateur\./);
  assert.match(screen, /href: '\/jeux\/a-deux-au-galop'/);
  assert.match(screen, /\/jeux\/a-deux-au-galop\/vignette\.webp/);
  assert.match(screen, /Parchési des Arcanes/);
  assert.match(screen, /Combien de Oui\?/);

  const playPage = fs.readFileSync('src/app/jeux/a-deux-au-galop/page.tsx', 'utf8');
  const shell = fs.readFileSync('src/components/jeux/a-deux-au-galop/GalopGame.tsx', 'utf8');
  assert.match(playPage, /GalopGame/);
  assert.match(shell, /src=\{GALOP_STATIC_URL\}/);
  assert.match(shell, /GALOP_STATIC_URL = '\/jeux\/a-deux-au-galop\/index\.html'/);
  assert.match(shell, /allow="fullscreen; gamepad"/);
  assert.match(shell, /Plein écran/);
  assert.match(shell, /Nouvel onglet/);
  assert.match(shell, /target="_blank"/);
});

test('À deux au galop CSP stays on the static document and the CRM proxy ignores it', async () => {
  const rules = await config.headers();
  const sources = rules.map((rule) => rule.source);
  assert.ok(sources.indexOf('/(.*)') < sources.indexOf('/jeux/a-deux-au-galop/index.html'));

  const cache = headerValue(rules, '/jeux/a-deux-au-galop/index.html', 'Cache-Control');
  assert.match(cache, /no-store/);
  assert.doesNotMatch(cache, /immutable/);
  assert.match(headerValue(rules, '/jeux/a-deux-au-galop/assets/:path*', 'Cache-Control'), /immutable/);

  const gamePolicy = headerValue(rules, '/jeux/a-deux-au-galop/index.html', 'Content-Security-Policy');
  assert.match(gamePolicy, /script-src 'self'/);
  assert.match(gamePolicy, /frame-src 'self'/);
  assert.match(gamePolicy, /child-src 'self'/);
  assert.match(gamePolicy, /frame-ancestors 'self'/);
  assert.doesNotMatch(gamePolicy, /unpkg\.com|jsdelivr\.net|peerjs\.com|googletagmanager\.com/);

  const permissions = headerValue(rules, '/jeux/a-deux-au-galop/index.html', 'Permissions-Policy');
  assert.match(permissions, /fullscreen=\(self\)/);
  assert.doesNotMatch(permissions, /vibrate|gamepad/);

  const sitePolicy = headerValue(rules, '/(.*)', 'Content-Security-Policy');
  assert.match(sitePolicy, /frame-src 'self'/);
  assert.match(sitePolicy, /script-src 'self'/);

  const redirects = await config.redirects();
  assert.equal(
    redirects.some((rule) => String(rule.source).includes('a-deux-au-galop')),
    false,
    'the play route must stay on the Next page instead of redirecting away from the shell',
  );

  const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const vercelCache = vercel.headers
    .find((rule) => rule.source === '/jeux/a-deux-au-galop/index.html')
    ?.headers.find((header) => header.key === 'Cache-Control')?.value;
  assert.match(vercelCache, /no-store/);
  const assetCache = vercel.headers
    .find((rule) => rule.source === '/jeux/a-deux-au-galop/assets/(.*)')
    ?.headers.find((header) => header.key === 'Cache-Control')?.value;
  assert.match(assetCache, /immutable/);

  const proxy = fs.readFileSync('src/proxy.ts', 'utf8');
  const matcher = proxy.slice(proxy.indexOf('matcher:'));
  assert.doesNotMatch(matcher, /jeux|a-deux-au-galop/);
});
