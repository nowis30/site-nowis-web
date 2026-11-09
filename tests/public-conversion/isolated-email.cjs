// Preloaded only by the isolated Playwright web server. No email leaves the runner.
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const captureDir = path.join(os.tmpdir(), 'nowis-public-qa-email');
function capturedEmailPath(email) {
  const key = createHash('sha256').update(email.toLowerCase()).digest('hex');
  return path.join(captureDir, `${key}.json`);
}

if (process.env.NOWIS_ISOLATED_PUBLIC_QA === 'true') {
  const database = new URL(process.env.DATABASE_URL || 'http://invalid');
  if (!['localhost', '127.0.0.1'].includes(database.hostname)
      || database.pathname !== '/nowis_public_qa'
      || process.env.NEXT_PUBLIC_SITE_URL !== 'http://127.0.0.1:3000'
      || process.env.RESEND_API_KEY !== 'isolated-email-test-placeholder'
      || process.env.NODE_ENV === 'production') {
    throw new Error('Email capture requires the isolated public QA database and placeholder key.');
  }
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.hostname !== 'api.resend.com') return originalFetch(input, init);
    const request = new Request(input, init);
    if (url.origin !== 'https://api.resend.com' || url.pathname !== '/emails' || request.method !== 'POST') {
      throw new Error('Unexpected email provider request in isolated QA.');
    }
    const payload = await request.json();
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    if (recipients.length === 0 || recipients.some(email => typeof email !== 'string')) {
      throw new Error('Invalid isolated email recipients.');
    }
    fs.mkdirSync(captureDir, { recursive: true });
    for (const email of recipients) {
      fs.writeFileSync(capturedEmailPath(email), JSON.stringify(payload), { mode: 0o600 });
    }
    return Response.json({ id: 'isolated-email-message' });
  };
}

module.exports = { capturedEmailPath };
