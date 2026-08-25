import assert from 'node:assert/strict';
import test from 'node:test';

function buildOutlookUrl(input: { to: string; subject: string; body: string }) {
  const query = new URLSearchParams(input);
  return `https://outlook.office.com/mail/deeplink/compose?${query.toString()}`;
}

test('Outlook compose URL preserves recipient, subject and payment instructions', () => {
  const url = buildOutlookUrl({
    to: 'facturation@example.com',
    subject: 'Facture FAC-2026-001 - Simon Morin',
    body: 'Paiement par virement Interac à : paiement@example.com\nConsulter la facture : https://example.com/facture/token',
  });

  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://outlook.office.com');
  assert.equal(parsed.pathname, '/mail/deeplink/compose');
  assert.equal(parsed.searchParams.get('to'), 'facturation@example.com');
  assert.match(parsed.searchParams.get('subject') || '', /FAC-2026-001/);
  assert.match(parsed.searchParams.get('body') || '', /virement Interac/);
  assert.match(parsed.searchParams.get('body') || '', /\/facture\/token/);
});
