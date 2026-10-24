import assert from 'node:assert/strict';
import test from 'node:test';
import {
  accountantSummary,
  activityKeyForSaleCategory,
  buildAccountantCsv,
  monthlyEvolution,
  quebecTaxAmount,
  saleCategoryForActivity,
  simulateYear,
  splitQuebecTax,
  type LedgerLine,
} from '../src/features/crm/finance/activity';

function line(partial: Partial<LedgerLine> & Pick<LedgerLine, 'kind' | 'category' | 'totalAmount'>): LedgerLine {
  return {
    year: 2026,
    month: 0,
    quantity: 1,
    amountBeforeTax: partial.totalAmount,
    taxAmount: 0,
    status: 'PAID',
    ...partial,
  };
}

test('les activités regroupent chansons, spectacles, ateliers et clés USB', () => {
  assert.equal(activityKeyForSaleCategory('CUSTOM_SONG'), 'songs');
  assert.equal(activityKeyForSaleCategory('SHOW'), 'shows');
  assert.equal(activityKeyForSaleCategory('WORKSHOP'), 'workshops');
  assert.equal(activityKeyForSaleCategory('USB_2GB'), 'usb');
  assert.equal(activityKeyForSaleCategory('USB_16GB'), 'usb');
  assert.equal(activityKeyForSaleCategory('USB_KEY'), 'usb');
  assert.equal(activityKeyForSaleCategory('AI_VIDEO'), 'video');
  assert.equal(activityKeyForSaleCategory('MERCHANDISE'), 'other');
  assert.equal(saleCategoryForActivity('spectacles'), 'SHOW');
  assert.equal(saleCategoryForActivity('inconnu'), null);
});

test('la TPS et la TVQ sont ventilées seulement quand le taux combiné correspond', () => {
  const matched = splitQuebecTax(100, 14.98);
  assert.deepEqual(matched, { gst: 5, qst: 9.98, other: 0 });
  assert.equal(splitQuebecTax(100, 14.97).other, 0);
  const song = splitQuebecTax(30, quebecTaxAmount(30));
  assert.equal(song.other, 0);
  assert.equal(song.gst, 1.5);
  const custom = splitQuebecTax(100, 15);
  assert.deepEqual(custom, { gst: 0, qst: 0, other: 15 });
  assert.deepEqual(splitQuebecTax(0, 5), { gst: 0, qst: 0, other: 5 });
  assert.deepEqual(splitQuebecTax(40, 0), { gst: 0, qst: 0, other: 0 });
});

test('le sommaire exclut les ventes annulées et sépare les activités', () => {
  const summary = accountantSummary([
    line({ kind: 'SALE', category: 'CUSTOM_SONG', quantity: 2, amountBeforeTax: 60, taxAmount: quebecTaxAmount(60), totalAmount: 68.99, month: 2 }),
    line({ kind: 'SALE', category: 'SHOW', amountBeforeTax: 200, taxAmount: 0, totalAmount: 200, status: 'UNPAID', month: 3 }),
    line({ kind: 'SALE', category: 'USB_KEY', quantity: 3, amountBeforeTax: 60, taxAmount: 0, totalAmount: 60, month: 3 }),
    line({ kind: 'SALE', category: 'WORKSHOP', amountBeforeTax: 500, taxAmount: 0, totalAmount: 500, status: 'CANCELLED' }),
    line({ kind: 'EXPENSE', category: 'TRAVEL', totalAmount: 40, month: 3 }),
    line({ kind: 'SALE', category: 'SHOW', totalAmount: 999, year: 2025 }),
  ], 2026);

  const songs = summary.activities.find((item) => item.key === 'songs');
  const shows = summary.activities.find((item) => item.key === 'shows');
  const usb = summary.activities.find((item) => item.key === 'usb');
  const workshops = summary.activities.find((item) => item.key === 'workshops');
  assert.equal(songs?.quantity, 2);
  assert.equal(songs?.beforeTax, 60);
  assert.equal(shows?.total, 200);
  assert.equal(usb?.quantity, 3);
  assert.equal(workshops?.count, 0);
  assert.equal(summary.salesBeforeTax, 320);
  assert.equal(summary.salesTotal, 328.99);
  assert.equal(summary.expensesTotal, 40);
  assert.equal(summary.receivable, 200);
  assert.equal(summary.profit, 288.99);
  assert.equal(summary.gst, 3);
});

test('l’évolution mensuelle additionne revenus et dépenses du bon mois', () => {
  const months = monthlyEvolution([
    line({ kind: 'SALE', category: 'SHOW', totalAmount: 100, month: 0 }),
    line({ kind: 'EXPENSE', category: 'TRAVEL', totalAmount: 25, month: 0 }),
    line({ kind: 'SALE', category: 'SHOW', totalAmount: 50, status: 'CANCELLED', month: 0 }),
    line({ kind: 'SALE', category: 'WORKSHOP', totalAmount: 80, month: 5 }),
  ], 2026);
  assert.equal(months.length, 12);
  assert.equal(months[0].label, 'Janvier');
  assert.equal(months[0].revenue, 100);
  assert.equal(months[0].expenses, 25);
  assert.equal(months[0].profit, 75);
  assert.equal(months[5].revenue, 80);
  assert.equal(months[11].revenue, 0);
});

test('la simulation ajoute un scénario sans modifier le sommaire réel', () => {
  const summary = accountantSummary([
    line({ kind: 'SALE', category: 'CUSTOM_SONG', totalAmount: 30 }),
    line({ kind: 'EXPENSE', category: 'MATERIAL', totalAmount: 10 }),
  ], 2026);
  const before = summary.salesTotal;
  const projected = simulateYear(summary, {
    songCount: 2,
    songPrice: 30,
    showCount: 1,
    showPrice: 200,
    workshopCount: 1,
    workshopPrice: 500,
    usb2Count: 1,
    usb2Price: 20,
    usb16Count: 1,
    usb16Price: 40,
    extraExpenses: 15,
    applyQuebecTax: true,
  });
  assert.equal(summary.salesTotal, before);
  assert.equal(projected.addedBeforeTax, 820);
  assert.equal(projected.addedTax, quebecTaxAmount(820));
  assert.equal(projected.addedExpenses, 15);
  assert.equal(projected.projectedRevenue, roundExpected(before + projected.addedRevenue));
  assert.equal(projected.projectedProfit, roundExpected(projected.projectedRevenue - 25));
  const withoutTax = simulateYear(summary, {
    songCount: 1,
    songPrice: 30,
    showCount: 0,
    showPrice: 0,
    workshopCount: 0,
    workshopPrice: 0,
    usb2Count: 0,
    usb2Price: 0,
    usb16Count: 0,
    usb16Price: 0,
    extraExpenses: Number.NaN,
    applyQuebecTax: false,
  });
  assert.equal(withoutTax.addedTax, 0);
  assert.equal(withoutTax.addedExpenses, 0);
  assert.equal(withoutTax.projectedRevenue, roundExpected(before + 30));
});

test('le rendu comptable est en français et ne mélange pas les colonnes', () => {
  const summary = accountantSummary([
    line({ kind: 'SALE', category: 'CUSTOM_SONG', amountBeforeTax: 30, taxAmount: quebecTaxAmount(30), totalAmount: 34.49 }),
  ], 2026);
  const csv = buildAccountantCsv(summary, [{
    kind: 'SALE',
    date: '2026-03-02',
    counterparty: 'Client; "Studio"',
    category: 'CUSTOM_SONG',
    description: 'Chanson souvenir',
    quantity: 1,
    amountBeforeTax: 30,
    taxAmount: quebecTaxAmount(30),
    totalAmount: 34.49,
    paymentMethod: 'Comptant',
    status: 'Payé',
    invoiceNumber: 'FAC-1',
  }], 2026);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /Revenus avant taxes/);
  assert.match(csv, /Chansons vendues/);
  assert.match(csv, /TPS 5 %/);
  assert.match(csv, /"Client; ""Studio"""/);
  assert.match(csv, /Chanson personnalisée;Chanson souvenir;1;30,00;1,50;/);
});

function roundExpected(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
