const { test, expect } = require('@playwright/test');
const { PrismaClient } = require('@prisma/client');
const CONSENT_KEY = 'nowis_cookie_consent_v2';
const baseURL = 'http://127.0.0.1:3000';
const consent = { version: 2, analytics: false, advertising: false, decidedAt: Date.now() };

async function refuseOnLoad(page) {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {key: CONSENT_KEY, value: consent});
}

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
    await expect(page.locator('video')).not.toHaveAttribute('autoplay');
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
