import assert from 'node:assert/strict';
import test from 'node:test';

process.env.PUBLIC_LINKS_JWT_SECRET = 'test-public-links-secret-that-is-long-enough';

async function loadPublicLinks() {
  return import('../src/lib/public-links');
}

test('compact public invoice token is short, signed and verifiable', async () => {
  const { signCompactPublicInvoiceToken, parseCompactPublicInvoiceToken, verifyCompactPublicInvoiceToken } = await loadPublicLinks();
  const token = signCompactPublicInvoiceToken({
    invoiceId: '11111111-1111-1111-1111-111111111111',
    invoiceNumber: 'FAC-20260825-001',
    contactId: '22222222-2222-2222-2222-222222222222',
  });

  assert.match(token, /^i1\.FAC-20260825-001\.[a-z0-9]+\.[A-Za-z0-9_-]{24}$/);
  assert.ok(token.length < 80);
  assert.equal(parseCompactPublicInvoiceToken(token)?.invoiceNumber, 'FAC-20260825-001');
  assert.equal(
    verifyCompactPublicInvoiceToken(token, {
      invoiceId: '11111111-1111-1111-1111-111111111111',
      invoiceNumber: 'FAC-20260825-001',
      contactId: '22222222-2222-2222-2222-222222222222',
    }),
    true,
  );
  assert.equal(
    verifyCompactPublicInvoiceToken(token, {
      invoiceId: '11111111-1111-1111-1111-111111111111',
      invoiceNumber: 'FAC-20260825-001',
      contactId: '33333333-3333-3333-3333-333333333333',
    }),
    false,
  );
});
