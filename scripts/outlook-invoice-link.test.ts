import assert from 'node:assert/strict';
import test from 'node:test';

function buildMailtoUrl(input: { to: string; subject: string; body: string }) {
  const query = new URLSearchParams({
    subject: input.subject,
    body: input.body,
  });
  return `mailto:${input.to}?${query.toString()}`;
}

test('MAILTO invoice compose preserves recipient, subject and payment instructions', () => {
  const url = buildMailtoUrl({
    to: 'facturation@example.com',
    subject: 'Facture FAC-2026-001 - Simon Morin',
    body: 'Paiement par virement Interac à : paiement@example.com\nConsulter la facture : https://example.com/facture/token',
  });

  const parsed = new URL(url);
  assert.equal(parsed.protocol, 'mailto:');
  assert.equal(parsed.pathname, 'facturation@example.com');
  assert.match(parsed.searchParams.get('subject') || '', /FAC-2026-001/);
  assert.match(parsed.searchParams.get('body') || '', /virement Interac/);
  assert.match(parsed.searchParams.get('body') || '', /\/facture\/token/);
});
