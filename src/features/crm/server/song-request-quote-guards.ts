import { prisma } from '@/lib/prisma';
import { CommercialQuoteStatus } from '@prisma/client';

const BLOCKING_QUOTE_STATUSES: CommercialQuoteStatus[] = ['ACCEPTED', 'CONVERTED'];

export const SONG_REQUEST_BLOCKING_MESSAGE =
  'Une soumission acceptée existe déjà pour cette chanson. Vous pouvez maintenant créer ou envoyer une facture.';

type GuardDbClient = {
  commercialQuote: Pick<typeof prisma.commercialQuote, 'findFirst'>;
  songRequest: Pick<typeof prisma.songRequest, 'findUnique'>;
  invoice: Pick<typeof prisma.invoice, 'findUnique'>;
};

export class SongRequestQuoteGuardError extends Error {
  status: number;
  quoteId?: string;
  quoteNumber?: string;

  constructor(message: string, options?: { quoteId?: string; quoteNumber?: string }) {
    super(message);
    this.name = 'SongRequestQuoteGuardError';
    this.status = 409;
    this.quoteId = options?.quoteId;
    this.quoteNumber = options?.quoteNumber;
  }
}

export async function findBlockingAcceptedQuoteForSongRequest(
  songRequestId: string,
  excludeQuoteId?: string,
  db: GuardDbClient = prisma,
) {
  return db.commercialQuote.findFirst({
    where: {
      songRequestId,
      status: { in: BLOCKING_QUOTE_STATUSES },
      ...(excludeQuoteId ? { id: { not: excludeQuoteId } } : {}),
    },
    select: {
      id: true,
      quoteNumber: true,
      status: true,
      convertedToInvoiceId: true,
    },
  });
}

export async function assertCanCreateQuoteForSongRequest(
  songRequestId: string,
  excludeQuoteId?: string,
  db: GuardDbClient = prisma,
) {
  const blockingQuote = await findBlockingAcceptedQuoteForSongRequest(songRequestId, excludeQuoteId, db);
  if (blockingQuote) {
    throw new SongRequestQuoteGuardError(SONG_REQUEST_BLOCKING_MESSAGE, {
      quoteId: blockingQuote.id,
      quoteNumber: blockingQuote.quoteNumber,
    });
  }
}

export async function assertCanSendQuoteForSongRequest(
  songRequestId: string,
  quoteId: string,
  db: GuardDbClient = prisma,
) {
  const blockingQuote = await findBlockingAcceptedQuoteForSongRequest(songRequestId, quoteId, db);
  if (blockingQuote) {
    throw new SongRequestQuoteGuardError(SONG_REQUEST_BLOCKING_MESSAGE, {
      quoteId: blockingQuote.id,
      quoteNumber: blockingQuote.quoteNumber,
    });
  }
}

export async function findExistingInvoiceForSongRequest(songRequestId: string, db: GuardDbClient = prisma) {
  const songRequest = await db.songRequest.findUnique({
    where: { id: songRequestId },
    select: { convertedInvoiceId: true },
  });

  const songRequestInvoiceId = songRequest?.convertedInvoiceId;

  if (songRequestInvoiceId) {
    const invoice = await db.invoice.findUnique({
      where: { id: songRequestInvoiceId },
      select: { id: true, number: true, status: true },
    });
    if (invoice) return invoice;
  }

  const convertedQuote = await db.commercialQuote.findFirst({
    where: {
      songRequestId,
      status: { in: BLOCKING_QUOTE_STATUSES },
    },
    select: {
      id: true,
      quoteNumber: true,
      status: true,
      convertedToInvoiceId: true,
    },
  });

  const convertedQuoteInvoiceId = convertedQuote?.convertedToInvoiceId;
  if (!convertedQuoteInvoiceId) return null;

  return db.invoice.findUnique({
    where: { id: convertedQuoteInvoiceId },
    select: { id: true, number: true, status: true },
  });
}

export async function resolveExistingInvoiceForQuoteConversion(params: {
  quoteConvertedToInvoiceId?: string | null;
  songRequestId?: string | null;
  db?: GuardDbClient;
}) {
  const db = params.db ?? prisma;

  if (params.quoteConvertedToInvoiceId) {
    const invoice = await db.invoice.findUnique({
      where: { id: params.quoteConvertedToInvoiceId },
      select: { id: true, number: true, status: true },
    });
    if (invoice) {
      return {
        invoice,
        reason: 'quote_already_converted' as const,
      };
    }
  }

  if (!params.songRequestId) return null;

  const invoice = await findExistingInvoiceForSongRequest(params.songRequestId, db);
  if (!invoice) return null;

  return {
    invoice,
    reason: 'song_request_already_has_invoice' as const,
  };
}