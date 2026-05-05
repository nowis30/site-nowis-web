import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createWithSequentialDocumentNumber,
  nextCommercialQuoteNumber,
  nextInvoiceNumber,
} from '@/features/crm/server/document-numbers';

function createMockDb(params?: { quoteNumbers?: string[]; invoiceNumbersByCall?: string[][] }) {
  let invoiceCall = 0;
  const quoteNumbers = params?.quoteNumbers ?? [];
  const invoiceNumbersByCall = params?.invoiceNumbersByCall ?? [[]];

  return {
    commercialQuote: {
      findMany: async () => quoteNumbers.map((quoteNumber) => ({ quoteNumber })),
    },
    invoice: {
      findMany: async () => {
        const index = Math.min(invoiceCall, invoiceNumbersByCall.length - 1);
        const numbers = invoiceNumbersByCall[index] ?? [];
        invoiceCall += 1;
        return numbers.map((number) => ({ number }));
      },
    },
  };
}

test('generation DEV sequentielle: saute les trous et prend max+1', async () => {
  const date = new Date('2026-05-05T10:00:00.000Z');
  const db = createMockDb({
    quoteNumbers: ['DEV-20260505-001', 'DEV-20260505-003', 'DEV-20260505-ABC'],
  });

  const next = await nextCommercialQuoteNumber(date, db);
  assert.equal(next, 'DEV-20260505-004');
});

test('generation FAC sequentielle: incremente correctement', async () => {
  const date = new Date('2026-05-05T10:00:00.000Z');
  const db = createMockDb({
    invoiceNumbersByCall: [['FAC-20260505-001']],
  });

  const next = await nextInvoiceNumber(date, db);
  assert.equal(next, 'FAC-20260505-002');
});

test('collision P2002: retry au lieu d echec silencieux', async () => {
  const date = new Date('2026-05-05T10:00:00.000Z');
  const db = createMockDb({
    invoiceNumbersByCall: [
      ['FAC-20260505-001'],
      ['FAC-20260505-001', 'FAC-20260505-002'],
    ],
  });

  let attempts = 0;
  const result = await createWithSequentialDocumentNumber({
    type: 'invoice',
    date,
    db,
    create: async (number) => {
      attempts += 1;
      if (attempts === 1) {
        throw {
          code: 'P2002',
          meta: { target: ['number'] },
        };
      }
      return { number };
    },
  });

  assert.equal(attempts, 2);
  assert.equal(result.number, 'FAC-20260505-003');
});