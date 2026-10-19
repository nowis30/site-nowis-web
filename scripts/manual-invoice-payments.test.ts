import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma, type PrismaClient } from '@prisma/client';
import { recordManualInvoicePayment } from '../src/lib/server/manual-invoice-payments';

function database(status = 'SENT', recorded = 0, history = 0, retryOnce = false) {
  const state = {
    invoice: { id: 'invoice', status, amount: new Prisma.Decimal(100), totalAmount: new Prisma.Decimal(100),
      paymentAmount: new Prisma.Decimal(recorded), paymentStatus: null, customerSnapshot: { companyName: 'Client historique' },
      issuerSnapshot: { displayName: 'Émetteur historique' }, paypalPaidAt: null },
    history, payments: [] as Record<string, unknown>[], attempts: 0,
  };
  const db = { $transaction: async (callback: (tx: unknown) => Promise<unknown>, options: { isolationLevel: string }) => {
    assert.equal(options.isolationLevel, 'Serializable');
    state.attempts++;
    if (retryOnce && state.attempts === 1) throw new Prisma.PrismaClientKnownRequestError('Concurrent update', { code: 'P2034', clientVersion: 'test' });
    const invoice = { ...state.invoice };
    const payments: Record<string, unknown>[] = [];
    const tx = {
      invoice: { findUnique: async () => invoice, update: async ({ data }: { data: object }) => Object.assign(invoice, data) },
      invoicePaymentHistory: {
        aggregate: async () => ({ _sum: { amount: new Prisma.Decimal(state.history) } }),
        create: async ({ data }: { data: Record<string, unknown> }) => { payments.push(data); return { id: 'payment', ...data }; },
      },
      fileDocument: { findUnique: async () => null },
    };
    const result = await callback(tx);
    state.invoice = invoice;
    state.payments.push(...payments);
    state.history += payments.reduce((sum, item) => sum + Number(item.amount), 0);
    return result;
  } } as unknown as PrismaClient;
  return { db, state };
}

test('règlement du solde : historique, statut et montant cohérents sans réécrire les profils', async () => {
  const { db, state } = database('SENT', 30, 10);
  await recordManualInvoicePayment(db, 'invoice', 'admin', { settleBalance: true, paymentMethod: 'TRANSFER', paidAt: '2026-10-19T12:00:00.000Z' });
  assert.equal(Number(state.payments[0].amount), 70);
  assert.equal(state.payments[0].createdById, 'admin');
  assert.equal(state.payments[0].paymentMethod, 'TRANSFER');
  assert.equal(state.invoice.status, 'PAID');
  assert.equal(Number(state.invoice.paymentAmount), 100);
  assert.deepEqual(state.invoice.customerSnapshot, { companyName: 'Client historique' });
  assert.deepEqual(state.invoice.issuerSnapshot, { displayName: 'Émetteur historique' });
  assert.equal(state.invoice.paypalPaidAt, null);
  const repeated = await recordManualInvoicePayment(db, 'invoice', 'admin', { settleBalance: true, paymentMethod: 'TRANSFER' });
  assert.equal(repeated.alreadyPaid, true);
  assert.equal(state.payments.length, 1);
});

test('paiement partiel suivi du solde : pas de double comptage', async () => {
  const { db, state } = database('DRAFT');
  await recordManualInvoicePayment(db, 'invoice', 'admin', { amount: 25.25, paymentMethod: 'CASH' });
  assert.equal(state.invoice.status, 'SENT');
  assert.equal(Number(state.invoice.paymentAmount), 25.25);
  await recordManualInvoicePayment(db, 'invoice', 'admin', { settleBalance: true, paymentMethod: 'TRANSFER' });
  assert.equal(Number(state.payments[1].amount), 74.75);
  assert.equal(Number(state.invoice.paymentAmount), 100);
  assert.equal(state.invoice.status, 'PAID');
});

test('un paiement invalide ou supérieur au solde ne modifie pas la facture', async () => {
  for (const amount of [0, -5, 1.001, 101]) {
    const { db, state } = database();
    await assert.rejects(recordManualInvoicePayment(db, 'invoice', 'admin', { amount, paymentMethod: 'OTHER' }));
    assert.equal(state.payments.length, 0);
    assert.equal(state.invoice.status, 'SENT');
  }
});

test('les factures annulées, archivées et supprimées ne peuvent pas être payées', async () => {
  for (const status of ['CANCELLED', 'ARCHIVED', 'DELETED']) {
    const { db, state } = database(status);
    await assert.rejects(recordManualInvoicePayment(db, 'invoice', 'admin', { settleBalance: true, paymentMethod: 'OTHER' }), /INVOICE_NOT_PAYABLE/);
    assert.equal(state.payments.length, 0);
  }
});

test('un conflit de transaction est rejoué et ne crée qu’un seul paiement', async () => {
  const { db, state } = database('SENT', 0, 0, true);
  await recordManualInvoicePayment(db, 'invoice', 'admin', { settleBalance: true, paymentMethod: 'OTHER' });
  assert.equal(state.attempts, 2);
  assert.equal(state.payments.length, 1);
});
