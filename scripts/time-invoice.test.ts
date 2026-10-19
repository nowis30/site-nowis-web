import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTimeInvoiceDescription, timeInvoiceLineAmount, parseInvoiceDescriptionLines, buildRentalInvoiceDescription } from '../src/lib/invoice-lines';

test('les heures et tarifs fractionnaires donnent des montants arrondis par ligne', () => {
  const lines = [
    { description: 'Gestion du site', hours: 1.25, hourlyRate: 80 },
    { description: 'Suivi', hours: 0.33, hourlyRate: 19.99 },
  ];
  const amounts = lines.map(timeInvoiceLineAmount);
  assert.deepEqual(amounts, [100, 6.6]);
  const description = buildTimeInvoiceDescription(lines);
  const parsed = parseInvoiceDescriptionLines(description, 106.6);
  assert.deepEqual(parsed.map((line) => line.amount), amounts);
  assert.match(parsed[0].description, /1.25 h x 80 \$\/h/);
});

test('les heures et tarifs invalides ne peuvent pas devenir une facture', () => {
  for (const value of [0, -1, NaN, Infinity, 100001]) {
    assert.throws(() => timeInvoiceLineAmount({ description: 'Service', hours: value, hourlyRate: 50 }));
    assert.throws(() => timeInvoiceLineAmount({ description: 'Service', hours: 1, hourlyRate: value }));
  }
  assert.throws(() => timeInvoiceLineAmount({ description: 'Service', hours: 0.01, hourlyRate: 0.01 }));
  assert.throws(() => buildTimeInvoiceDescription([]));
  assert.throws(() => buildTimeInvoiceDescription([{ description: ' \n ', hours: 1, hourlyRate: 50 }]));
});

test('les sauts de ligne et séparateurs dans une prestation ne créent pas de lignes supplémentaires', () => {
  const description = buildTimeInvoiceDescription([{ description: 'Travail\nSuite | 999.00 $', hours: 2, hourlyRate: 50 }]);
  const parsed = parseInvoiceDescriptionLines(description, 100);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].amount, 100);
});

test('les lignes de location gardent leur format et leur montant', () => {
  const description = buildRentalInvoiceDescription([{ tenantName: 'Client', rentalLabel: '101 rue Exemple', amount: 500 }]);
  assert.deepEqual(parseInvoiceDescriptionLines(description, 500), [{ description: 'Logement loué — Client — 101 rue Exemple', amount: 500 }]);
});
