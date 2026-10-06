const { test } = require('node:test');
const assert = require('node:assert/strict');
const config = require('../next.config.js');

test('private account and document route families forbid response storage and referrer disclosure', async () => {
  const rules = await config.headers();
  for (const source of [
    '/facture/:path*', '/soumission/:path*', '/facturation/:path*',
    '/crm/:path*', '/client/:path*', '/api/crm/:path*', '/api/client/:path*',
    '/api/client-portal/:path*', '/api/client-auth/:path*', '/api/auth/:path*', '/api/public/:path*',
  ]) {
    const headers = rules.filter(rule => rule.source === source).flatMap(rule => rule.headers);
    assert.equal(headers.find(header => header.key === 'Cache-Control')?.value, 'private, no-store', source);
    assert.equal(headers.find(header => header.key === 'Referrer-Policy')?.value, 'no-referrer', source);
  }
  for (const source of ['/audio/:path*', '/images/:path*', '/_next/static/:path*']) {
    assert.equal(rules.some(rule => rule.source === source && rule.headers.some(header => header.value === 'private, no-store')), false);
  }
});
