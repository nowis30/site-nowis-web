const { defineConfig } = require('@playwright/test');
const path = require('node:path');
module.exports = defineConfig({
  testDir: __dirname,
  testMatch: ['public-conversion.spec.cjs', 'radio-community.spec.cjs'],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', {outputFolder: 'public-conversion-report', open: 'never'}]],
  use: { baseURL: 'http://127.0.0.1:3000', browserName: 'chromium', channel: 'chrome', timezoneId: 'America/Toronto', trace: 'retain-on-failure', screenshot: 'only-on-failure', navigationTimeout: 90_000 },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3000', reuseExistingServer: false, timeout: 180_000,
    env: {
      NOWIS_ISOLATED_PUBLIC_QA: 'true',
      RESEND_API_KEY: 'isolated-email-test-placeholder',
      NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --require ${JSON.stringify(path.join(__dirname, 'isolated-email.cjs'))}`.trim(),
    },
  },
});
