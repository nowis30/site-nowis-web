import assert from 'node:assert/strict';
import test from 'node:test';
import { buildInvoicePdfBuffer } from '../src/lib/invoice-pdf';
import {
  chargeableTaxRates,
  csvCell,
  currentQuarterBounds,
  normalizeGstNumber,
  normalizeNeq,
  normalizeQstNumber,
  presentInvoiceTaxes,
  priceWithQuebecTaxes,
  quebecPartnerReadiness,
  quebecPeriodRange,
  QuebecRegistrationError,
  splitConsumptionTaxes,
  summarizeQuebecTaxes,
} from '../src/lib/quebec-fiscal';

test('la TPS et la TVQ sont arrondies séparément sur le montant hors taxes', () => {
  const taxes = splitConsumptionTaxes(100, 0.05, 0.09975);
  assert.deepEqual(taxes, { taxableBase: 100, gstAmount: 5, qstAmount: 9.98, taxAmount: 14.98 });
  const small = splitConsumptionTaxes(0.1, 0.05, 0.09975);
  assert.equal(small.gstAmount, 0.01);
  assert.equal(small.qstAmount, 0.01);
  assert.equal(small.taxAmount, 0.02);
});

test('aucune taxe n’est ajoutée sans numéro de TPS ou de TVQ', () => {
  const blocked = priceWithQuebecTaxes(100, { taxesEnabled: true, taxRateGst: 0.05, taxRateQst: 0.09975 });
  assert.equal(blocked.total, 100);
  assert.equal(blocked.taxesEnabled, false);

  const gstOnly = priceWithQuebecTaxes(100, {
    taxesEnabled: true,
    taxRateGst: 0.05,
    taxRateQst: 0.09975,
    gstNumber: '123456789 RT0001',
  });
  assert.equal(gstOnly.gstAmount, 5);
  assert.equal(gstOnly.qstAmount, 0);
  assert.equal(gstOnly.total, 105);
});

test('les numéros NEQ, TPS et TVQ ont une forme canonique', () => {
  assert.equal(normalizeNeq('2264 731 649'), '2264731649');
  assert.equal(normalizeGstNumber('123456789rt0001'), '123456789 RT0001');
  assert.equal(normalizeQstNumber('1234567890-tq0001'), '1234567890 TQ0001');
  assert.equal(normalizeGstNumber('123'), null);
  assert.throws(() => normalizeQstNumber('mauvais', true), QuebecRegistrationError);
});

test('une facture mixte répartit la taxe déjà enregistrée sans l’inventer', () => {
  const plain = presentInvoiceTaxes({ amount: 100, subtotal: 100, taxAmount: 0, taxRateGst: 0.05, taxRateQst: 0.09975 });
  assert.equal(plain.showBreakdown, false);
  assert.equal(plain.total, 100);

  const taxed = presentInvoiceTaxes({ amount: 114.98, subtotal: 100, taxAmount: 14.98, totalAmount: 114.98, taxRateGst: 0.05, taxRateQst: 0.09975 });
  assert.equal(taxed.gstAmount, 5);
  assert.equal(taxed.qstAmount, 9.98);

  const mixed = presentInvoiceTaxes({ amount: 214.98, subtotal: 200, taxAmount: 14.98, totalAmount: 214.98, taxRateGst: 0.05, taxRateQst: 0.09975 });
  assert.equal(mixed.gstAmount, 5);
  assert.equal(mixed.qstAmount, 9.98);
  assert.equal(mixed.taxableBase, 100.03);
});

test('le sommaire ignore les brouillons et les essais', () => {
  const summary = summarizeQuebecTaxes([
    { number: 'FAC-1', issueDate: new Date('2026-10-02T16:00:00Z'), status: 'SENT', amount: 114.98, subtotal: 100, taxAmount: 14.98, totalAmount: 114.98, taxRateGst: 0.05, taxRateQst: 0.09975 },
    { number: 'FAC-2', issueDate: new Date('2026-10-03T16:00:00Z'), status: 'DRAFT', amount: 50, subtotal: 50, taxAmount: 0, taxRateGst: 0, taxRateQst: 0 },
    { number: 'FAC-3', issueDate: new Date('2026-10-03T16:00:00Z'), status: 'PAID', isTest: true, amount: 10, subtotal: 10, taxAmount: 0, taxRateGst: 0, taxRateQst: 0 },
  ]);
  assert.equal(summary.invoiceCount, 1);
  assert.equal(summary.gstCollected, 5);
  assert.equal(summary.qstCollected, 9.98);
  assert.equal(summary.taxableSupplies, 100);
});

test('la période fiscale suit le calendrier de Toronto', () => {
  const quarter = currentQuarterBounds(new Date('2026-10-24T12:00:00Z'));
  assert.deepEqual(quarter, { from: '2026-10-01', to: '2026-12-31' });
  const range = quebecPeriodRange('2026-01-15', '2026-01-15');
  assert.equal(range.start.toISOString(), '2026-01-15T05:00:00.000Z');
  assert.equal(range.end.toISOString(), '2026-01-16T05:00:00.000Z');
  const summer = quebecPeriodRange('2026-07-01', '2026-07-01');
  assert.equal(summer.start.toISOString(), '2026-07-01T04:00:00.000Z');
  assert.throws(() => quebecPeriodRange('2026-02-01', '2026-01-01'), /date de fin/);
});

test('le profil incomplet reste visible dans la liste de préparation', () => {
  const items = quebecPartnerReadiness({
    companyName: 'Création Nowis',
    email: 'simonmorin@nowis.store',
    addressLine1: '4667, rue Traversy',
    city: 'Drummondville',
    postalCode: 'J2A 2G2',
    neq: '2264731649',
    taxesEnabled: true,
    taxRateGst: 0.05,
    taxRateQst: 0.09975,
  });
  assert.equal(items.find((item) => item.id === 'neq')?.ok, true);
  assert.equal(items.find((item) => item.id === 'qst')?.ok, false);
  const rates = chargeableTaxRates({ taxesEnabled: false, taxRateGst: 0.05, taxRateQst: 0.09975, gstNumber: '123456789 RT0001' });
  assert.equal(rates.taxesEnabled, false);
});

test('le PDF de facture accepte les accents et les numéros de taxes', async () => {
  const pdf = await buildInvoicePdfBuffer({
    number: 'FAC-1',
    issueDate: new Date('2026-10-24T16:00:00Z'),
    dueDate: new Date('2026-11-08T16:00:00Z'),
    amount: 114.98,
    subtotal: 100,
    taxAmount: 14.98,
    totalAmount: 114.98,
    taxRateGst: 0.05,
    taxRateQst: 0.09975,
    description: 'Chanson personnalisée | 100.00 $',
    contact: { fullName: 'Élise Côté', email: 'elise@example.com', city: 'Montréal', postalCode: 'H2X 1Y4', country: 'Canada' },
  }, {
    displayName: 'Création Nowis',
    companyName: 'Création Nowis',
    email: 'simonmorin@nowis.store',
    neq: '2264731649',
    gstNumber: '123456789 RT0001',
    qstNumber: '1234567890 TQ0001',
    paymentTerms: 'Paiement à réception.',
  });
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
});

test('une cellule CSV ne peut pas lancer une formule', () => {
  assert.equal(csvCell('=CMD()'), "'=CMD()");
  assert.equal(csvCell('client, "A"'), '"client, ""A"""');
});
