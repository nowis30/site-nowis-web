const { test, expect } = require('@playwright/test');
const { PrismaClient } = require('@prisma/client');
const CONSENT_KEY = 'nowis_cookie_consent_v2';
const baseURL = 'http://127.0.0.1:3000';
const consent = { version: 2, analytics: false, advertising: false, decidedAt: Date.now() };

async function refuseOnLoad(page) {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {key: CONSENT_KEY, value: consent});
}

test('presentation downloads only after a click', async ({page}) => {
  await refuseOnLoad(page);
  const videos = [];
  page.on('request', request => { if (/\.mp4(?:\?|$)/.test(request.url())) videos.push(request.url()); });
  await page.goto('/');
  await expect(page.getByRole('button', {name: 'Lire la présentation de Nowis avec le son'})).toBeVisible();
  expect(videos).toEqual([]);
  await page.getByRole('button', {name: 'Lire la présentation de Nowis avec le son'}).click();
  await expect(page.locator('video')).toHaveAttribute('src', '/videos/nowis-presentation-web.mp4');
  await expect.poll(() => videos.length).toBeGreaterThan(0);
  await expect.poll(() => page.locator('video').evaluate(video => video.currentTime)).toBeGreaterThan(0);
});

test('video failure offers a working retry', async ({page}) => {
  await refuseOnLoad(page);
  await page.route('**/videos/nowis-presentation-web.mp4', route => route.fulfill({status: 503, body: 'Temporary QA failure'}));
  await page.goto('/');
  await page.getByRole('button', {name: 'Lire la présentation de Nowis avec le son'}).click();
  await expect(page.getByText('La vidéo est indisponible pour le moment.', {exact: true})).toBeVisible();
  await page.unroute('**/videos/nowis-presentation-web.mp4');
  await page.getByRole('button', {name: 'Réessayer', exact: true}).click();
  await page.getByRole('button', {name: 'Lire la présentation de Nowis avec le son'}).click();
  await expect.poll(() => page.locator('video').evaluate(video => video.currentTime)).toBeGreaterThan(0);
});

test('music search, accents, empty state, filter and pagination', async ({page}) => {
  await refuseOnLoad(page);
  await page.goto('/musique');
  const cards = page.locator('main article');
  await expect(cards).toHaveCount(12);
  await page.getByRole('button', {name: 'Afficher 12 chansons supplémentaires'}).click();
  await expect(cards).toHaveCount(24);
  await page.getByLabel('Rechercher une chanson', {exact: true}).fill('LUMIERE TEMPETE');
  await expect(cards).toHaveCount(1);
  await expect(cards).toContainText('La lumière après la tempête');
  await page.getByLabel('Rechercher une chanson', {exact: true}).fill('zzzz-unmatched');
  await expect(cards).toHaveCount(0);
  await expect(page.getByText('Aucune chanson ne correspond', {exact: false})).toBeVisible();
  await page.getByRole('button', {name: 'Réinitialiser', exact: true}).click();
  await page.getByLabel('Plateforme d’écoute', {exact: true}).selectOption('spotify');
  await expect(cards).toHaveCount(12);
  await expect(cards.locator('a[href*="open.spotify.com"]')).toHaveCount(12);
});

for (const path of ['/portfolio', '/shop']) {
  test(`self canonical ${path}`, async ({page}) => {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${baseURL}${path}`);
    await expect(page.locator('main')).toHaveCount(1);
  });
}

test('commercial calls to action lead to anonymous forms', async ({page}) => {
  await refuseOnLoad(page);
  for (const path of ['/musique', '/services', '/ateliers', '/creations', '/artistes']) {
    await page.goto(path);
    await expect(page.locator('main a[href*="/api/client-auth/google/start"]')).toHaveCount(0);
  }
  await page.goto('/ateliers');
  await page.locator('main a[href="/ateliers/demande"]').first().click();
  await expect(page.getByRole('button', {name: 'Envoyer ma demande sans compte'})).toBeVisible();
});

test('game starts after iframe load precedes delayed hydration, reload and navigation', async ({page}) => {
  await refuseOnLoad(page);
  await page.route('**/_next/static/**/*.js*', async route => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.goto('/jeux/tic-tac-toe');
  const frame = page.frameLocator('iframe[title="Morpion"]');
  await expect(frame.getByRole('button', {name: 'Commencer', exact: true})).toBeVisible();
  await expect(page.getByLabel('Chargement du jeu')).toHaveCount(0);
  await frame.getByRole('button', {name: 'Commencer', exact: true}).click();
  await expect(frame.getByRole('grid')).toBeVisible();
  await page.reload();
  await expect(frame.getByRole('button', {name: 'Commencer', exact: true})).toBeVisible();
  await page.getByRole('link', {name: 'Retour aux jeux', exact: true}).click();
  await expect(page).toHaveURL(/\/jeux$/);
  await page.goBack();
  await expect(frame.getByRole('button', {name: 'Commencer', exact: true})).toBeVisible();
});

for (const width of [390, 768, 900, 1199, 1200, 1440]) {
  test(`home hierarchy and no horizontal overflow at ${width}px`, async ({page}, testInfo) => {
    await page.setViewportSize({width, height: 900});
    await refuseOnLoad(page);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    const video = page.locator('.nowis-home-video');
    await expect(video).toBeVisible();
    if (width < 1200) {
      const titleBox = await page.locator('h1').boundingBox();
      const videoBox = await video.boundingBox();
      expect(titleBox.y + titleBox.height).toBeLessThan(videoBox.y);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
    await expect(page.locator('video')).toHaveCount(0);
    expect(errors).toEqual([]);
    await page.screenshot({path: testInfo.outputPath(`home-${width}.png`), fullPage: true});
  });
}

for (const path of ['/contact', '/commander-une-chanson', '/ateliers/demande?groupType=ECOLE']) {
  test(`anonymous entry ${path}`, async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await refuseOnLoad(page);
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('button', {name: 'Envoyer ma demande sans compte'})).toBeVisible();
    expect(page.url()).not.toContain('/api/client-auth/google');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  });
}

test('no Google before consent; refusal hides banner and restores assistant area', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  const google = [];
  page.on('request', request => { if (/google(tagmanager|analytics|adservices)\.com/.test(request.url())) google.push(request.url()); });
  await page.goto('/');
  await expect(page.locator('[data-cookie-banner="open"]')).toBeVisible();
  await expect(page.locator('.nowis-site-assistant')).toBeHidden();
  expect(google).toEqual([]);
  await page.getByRole('button', {name: 'Tout refuser', exact: true}).click();
  await expect(page.locator('[data-cookie-banner="open"]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-cookie-banner="open"]')).toHaveCount(0);
  await expect(page.locator('#nowis-consented-google-tag')).toHaveCount(0);
  expect(google).toEqual([]);
});

test('analytics-only choice, reopen preferences and withdraw', async ({page}) => {
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({contentType: 'application/javascript', body: '/* isolated QA mock: no external tracking */'}));
  await page.goto('/');
  await page.getByRole('button', {name: 'Personnaliser mes choix'}).click();
  await page.getByRole('checkbox', {name: /Google Analytics/}).check();
  await page.getByRole('button', {name: 'Enregistrer mes choix'}).click();
  await expect(page.locator('#nowis-consented-google-tag')).toHaveCount(1);
  const configured = await page.evaluate(() => (window.dataLayer || []).map(args => Array.from(args)).filter(args => args[0] === 'config').map(args => args[1]));
  expect(configured).toContain('G-NOWISQA01');
  expect(configured).not.toContain('AW-123456789');
  await page.getByRole('button', {name: 'Gérer mes cookies'}).click();
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', {name: 'Tout refuser', exact: true}).click()]);
  await expect(page.locator('#nowis-consented-google-tag')).toHaveCount(0);
});

test('inquiry validation, save and independent CRM records — isolated database only', async ({page, request}) => {
  if (!/^postgresql:\/\/nowis_test:nowis_test@localhost:5432\/nowis_public_qa(?:\?|$)/.test(process.env.DATABASE_URL || '')) {
    throw new Error('Refusing to submit tests against a non-local database');
  }
  const prisma = new PrismaClient();
  try {
    const existingContacts = await prisma.contact.count();
    const payload = {name: 'Test public QA', email: 'public-qa@example.invalid', serviceType: 'chanson', message: 'Ceci est un test isolé de la demande publique.', privacyAcknowledged: true, website: ''};
    const denied = await request.post('/api/public-inquiries', {headers: {Origin: 'https://attacker.example'}, data: payload});
    expect(denied.status()).toBe(403);
    const invalid = await request.post('/api/public-inquiries', {headers: {Origin: baseURL}, data: {...payload, email: 'invalid'}});
    expect(invalid.status()).toBe(400);
    const portal = await request.post('/api/contact', {headers: {Origin: baseURL}, data: payload});
    expect(portal.status()).toBe(401);
    const before = await prisma.inquiry.count();
    const honeypot = await request.post('/api/public-inquiries', {headers: {Origin: baseURL}, data: {...payload, website: 'spam'}});
    expect(honeypot.status()).toBe(200);
    expect(await prisma.inquiry.count()).toBe(before);
    await refuseOnLoad(page);
    await page.goto('/contact');
    await page.getByLabel('Votre nom', {exact: true}).fill(payload.name);
    await page.getByLabel('Votre courriel', {exact: true}).fill(payload.email);
    await page.getByLabel('Type de projet', {exact: true}).selectOption('chanson');
    await page.getByLabel('Votre message', {exact: true}).fill(payload.message);
    await page.locator('input[name="privacyAcknowledged"]').check();
    await page.getByRole('button', {name: 'Envoyer ma demande sans compte'}).click();
    await expect(page.getByRole('heading', {name: 'Votre demande est enregistrée.'})).toBeVisible();
    const inquiry = await prisma.inquiry.findFirst({where: {source: 'public-inquiry'}, orderBy: {createdAt: 'desc'}});
    expect(inquiry).not.toBeNull();
    expect(inquiry.contactId).toBeNull();
    expect(inquiry.message).toContain(payload.email);
    expect(await prisma.contact.count()).toBe(existingContacts);
    expect(await prisma.task.count({where: {description: {contains: inquiry.id}}})).toBe(1);
  } finally { await prisma.$disconnect(); }
});
