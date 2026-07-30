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

test('Header contains desktop rental button before portail client and secure external attributes', () => {
  assert.match(headerSource, /Logements a louer/);
  assert.match(headerSource, /target="_blank"/);
  assert.match(headerSource, /rel="noopener noreferrer"/);
  const rentalsIndex = headerSource.indexOf('Logements a louer');
  const portalIndex = headerSource.indexOf('Portail client');
  assert.ok(rentalsIndex > -1 && portalIndex > -1 && rentalsIndex < portalIndex, 'Le bouton logements doit apparaitre avant Portail client.');
});

test('Header contains mobile full-width rental button', () => {
  assert.match(headerSource, /Voir les logements a louer/);
  assert.match(headerSource, /w-full/);
  assert.match(headerSource, /setIsMenuOpen\(false\)/);
});

test('Home screen contains prominent rental feature block', () => {
  assert.match(homeSource, /Nouveau service/);
  assert.match(homeSource, /Vous cherchez un logement\?/);
  assert.match(homeSource, /Voir les logements disponibles/);
  assert.match(homeSource, /Service offert par Simon Morin — Agent de location/);
});

test('Home screen primary actions include external rental action card', () => {
  assert.match(homeSource, /title: 'Logements a louer'/);
  assert.match(homeSource, /external: true/);
  assert.match(homeSource, /trackRentalClick\('home_card'\)/);
  assert.match(homeSource, /target="_blank"/);
  assert.match(homeSource, /rel="noopener noreferrer"/);
});

test('Footer contains rental links and keeps legal links unchanged', () => {
  assert.match(footerSource, /Logements a louer/);
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
});

test('Client portal link remains present', () => {
  assert.match(headerSource, /Portail client/);
  assert.match(footerSource, /Portail client/);
});
