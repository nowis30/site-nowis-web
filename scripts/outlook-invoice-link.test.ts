import assert from 'node:assert/strict';
import test from 'node:test';

function buildMailtoUrl(input: { to: string; subject: string; body: string }) {
  return `mailto:${input.to}?subject=${encodeURIComponent(input.subject)}&body=${encodeURIComponent(input.body)}`;
}

test('MAILTO invoice compose preserves clean professional text without plus signs', () => {
  const url = buildMailtoUrl({
    to: 'facturation@example.com',
    subject: 'Facture FAC-2026-001 | Simon Morin - NOWIS',
    body: [
      'Bonjour Gestion ISR Inc.,',
      '',
      'Montant dû : 1 000,00 $',
      'Date d’échéance : 4 septembre 2026',
      '',
      'CONSULTER LA FACTURE',
      'https://example.com/facture/i1.FAC-2026-001.abc.signature',
      '',
      'MODE DE PAIEMENT',
      'Virement Interac : simonmorin@nowis.store',
    ].join('\n'),
  });

  assert.equal(url.includes('+'), false);
  assert.match(url, /%20/);

  const parsed = new URL(url);
  assert.equal(parsed.protocol, 'mailto:');
  assert.equal(parsed.pathname, 'facturation@example.com');
  assert.match(parsed.searchParams.get('subject') || '', /FAC-2026-001/);
  assert.match(parsed.searchParams.get('body') || '', /Gestion ISR Inc\./);
  assert.match(parsed.searchParams.get('body') || '', /simonmorin@nowis\.store/);
  assert.match(parsed.searchParams.get('body') || '', /CONSULTER LA FACTURE/);
});
