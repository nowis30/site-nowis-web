import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertCanCreateQuoteForSongRequest,
  assertCanSendQuoteForSongRequest,
  resolveExistingInvoiceForQuoteConversion,
  SONG_REQUEST_BLOCKING_MESSAGE,
  SongRequestQuoteGuardError,
} from '@/features/crm/server/song-request-quote-guards';

type BlockingQuote = {
  id: string;
  quoteNumber: string;
  status: string;
  convertedToInvoiceId: string | null;
};

function createMockDb(params?: {
  blockingQuote?: BlockingQuote | null;
  songConvertedInvoiceId?: string | null;
  invoicesById?: Record<string, { id: string; number: string; status: string }>;
}) {
  const invoices = params?.invoicesById ?? {};
  return {
    commercialQuote: {
      findFirst: async (args: { where: { id?: { not: string } } }) => {
        const quote = params?.blockingQuote ?? null;
        if (!quote) return null;
        if (args.where.id?.not && args.where.id.not === quote.id) {
          return null;
        }
        return quote;
      },
    },
    songRequest: {
      findUnique: async () => ({ convertedInvoiceId: params?.songConvertedInvoiceId ?? null }),
    },
    invoice: {
      findUnique: async (args: { where: { id: string } }) => invoices[args.where.id] ?? null,
    },
  };
}

test('SongRequest sans quote acceptee: creation de quote autorisee', async () => {
  const db = createMockDb({ blockingQuote: null }) as any;
  await assert.doesNotReject(() => assertCanCreateQuoteForSongRequest('song-1', undefined, db));
});

test('SongRequest avec quote ACCEPTED: creation bloquee', async () => {
  const db = createMockDb({
    blockingQuote: {
      id: 'quote-a',
      quoteNumber: 'DEV-20260505-001',
      status: 'ACCEPTED',
      convertedToInvoiceId: null,
    },
  }) as any;

  await assert.rejects(
    () => assertCanCreateQuoteForSongRequest('song-1', undefined, db),
    (error: unknown) => error instanceof SongRequestQuoteGuardError && error.message === SONG_REQUEST_BLOCKING_MESSAGE,
  );
});

test('SongRequest avec quote CONVERTED: creation bloquee', async () => {
  const db = createMockDb({
    blockingQuote: {
      id: 'quote-b',
      quoteNumber: 'DEV-20260505-004',
      status: 'CONVERTED',
      convertedToInvoiceId: 'inv-4',
    },
  }) as any;

  await assert.rejects(
    () => assertCanCreateQuoteForSongRequest('song-2', undefined, db),
    (error: unknown) => error instanceof SongRequestQuoteGuardError,
  );
});

test('SongRequest avec quote DECLINED: creation autorisee', async () => {
  const db = createMockDb({ blockingQuote: null }) as any;
  await assert.doesNotReject(() => assertCanCreateQuoteForSongRequest('song-3', undefined, db));
});

test('Conversion quote deja convertie: retourne invoice existante', async () => {
  const db = createMockDb({
    songConvertedInvoiceId: null,
    invoicesById: {
      'inv-1': { id: 'inv-1', number: 'FAC-20260505-001', status: 'DRAFT' },
    },
  }) as any;

  const existing = await resolveExistingInvoiceForQuoteConversion({
    quoteConvertedToInvoiceId: 'inv-1',
    songRequestId: 'song-4',
    db,
  });

  assert.equal(existing?.reason, 'quote_already_converted');
  assert.equal(existing?.invoice.id, 'inv-1');
});

test('SongRequest avec facture existante: pas de deuxieme facture', async () => {
  const db = createMockDb({
    songConvertedInvoiceId: 'inv-2',
    invoicesById: {
      'inv-2': { id: 'inv-2', number: 'FAC-20260505-002', status: 'SENT' },
    },
  }) as any;

  const existing = await resolveExistingInvoiceForQuoteConversion({
    quoteConvertedToInvoiceId: null,
    songRequestId: 'song-5',
    db,
  });

  assert.equal(existing?.reason, 'song_request_already_has_invoice');
  assert.equal(existing?.invoice.number, 'FAC-20260505-002');
});

test('Message de blocage envoi est explicite', async () => {
  const db = createMockDb({
    blockingQuote: {
      id: 'quote-z',
      quoteNumber: 'DEV-20260505-009',
      status: 'ACCEPTED',
      convertedToInvoiceId: null,
    },
  }) as any;

  await assert.rejects(
    () => assertCanSendQuoteForSongRequest('song-6', 'quote-current', db),
    (error: unknown) => error instanceof SongRequestQuoteGuardError && error.message === SONG_REQUEST_BLOCKING_MESSAGE,
  );
});