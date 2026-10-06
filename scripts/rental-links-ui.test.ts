import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();

const headerPath = join(repoRoot, 'src/components/layout/Header.tsx');
const homePath = join(repoRoot, 'src/screens/HomeScreen.tsx');
const footerPath = join(repoRoot, 'src/components/layout/Footer.tsx');
const envExamplePath = join(repoRoot, '.env.example');

const headerSource = readFileSync(headerPath, 'utf8');
const homeSource = readFileSync(homePath, 'utf8');
const footerSource = readFileSync(footerPath, 'utf8');
const envSource = readFileSync(envExamplePath, 'utf8');
const explorerSource = readFileSync(join(repoRoot, 'src/app/explorer/page.tsx'), 'utf8');

test('Current desktop navigation retains Explorer access to the rental service', () => {
  assert.match(headerSource, /label: 'Explorer', href: '\/explorer'/);
  assert.match(headerSource, /nm-desktop-nav/);
  assert.match(headerSource, /primary\.map/);
});

test('The mobile menu retains the same navigation and closes on selection', () => {
  assert.match(headerSource, /id="mobile-main-menu"/);
  assert.match(headerSource, /setOpen\(false\)/);
  assert.equal((headerSource.match(/primary\.map/g) ?? []).length, 2);
});

test('Home screen retains the album and the current Explorer route', () => {
  assert.match(homeSource, /href="\/album"/);
  assert.match(homeSource, /href="\/explorer"/);
});

test('Explorer exposes the rental destination with safe new-tab attributes', () => {
  assert.match(explorerSource, /Logements à louer/);
  assert.match(explorerSource, /href=\{rentalsPublicUrl\}/);
  assert.match(explorerSource, /target="_blank"/);
  assert.match(explorerSource, /rel="noopener noreferrer"/);
});

test('Footer contains rental links and keeps legal links unchanged', () => {
  assert.match(footerSource, /Logements à louer/);
  assert.match(footerSource, /Voir les logements disponibles →/);
  assert.match(footerSource, /target="_blank"/);
  assert.match(footerSource, /rel="noopener noreferrer"/);
  assert.match(footerSource, /Mentions légales/);
  assert.match(footerSource, /Politique de confidentialité/);
  assert.match(footerSource, /Conditions de vente/);
});

test('Environment example documents NEXT_PUBLIC_RENTALS_URL', () => {
  assert.match(envSource, /NEXT_PUBLIC_RENTALS_URL=/);
});

test('Rentals URL constant supports default and custom domain', async () => {
  const modulePath = join(repoRoot, 'src/lib/rentals-url.ts');
  const mod = await import(pathToFileURL(modulePath).href);

  assert.equal(
    mod.resolveRentalsPublicUrl(undefined),
    'https://simon-morin-agent-location.onrender.com',
  );

  assert.equal(
    mod.resolveRentalsPublicUrl('https://logements.nowis.store'),
    'https://logements.nowis.store',
  );
  for (const unsafe of ['javascript:alert(1)', 'data:text/html,<script>', 'http://example.com', '//evil.test', '/connexion', 'https://user:pass@example.com']) {
    assert.equal(mod.resolveRentalsPublicUrl(unsafe), mod.resolveRentalsPublicUrl(undefined));
  }
  assert.equal(mod.resolveRentalsPublicUrl('  https://logements.nowis.store  '), 'https://logements.nowis.store');
});

test('Client portal link remains present', () => {
  assert.match(headerSource, /Portail client/);
  assert.match(footerSource, /Portail client/);
});
