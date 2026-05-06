import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ensureInvoiceFileDocument, ensureQuoteFileDocument } from '@/features/crm/server/file-document-links';
import { getDefaultCategoryForUpload } from '@/features/documents/document-categories';

type DbClient = Prisma.TransactionClient | typeof prisma;

export type CreateDocumentRecordInput = {
  contactId: string;
  songRequestId?: string | null;
  workshopRequestId?: string | null;
  invoiceId?: string | null;
  commercialQuoteId?: string | null;
  uploadedByUserId?: string | null;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  url: string;
  category?: string;
  visibility?: 'ADMIN_ONLY' | 'CLIENT_VISIBLE';
};

export async function createDocumentRecord(input: CreateDocumentRecordInput, db: DbClient = prisma) {
  return db.fileDocument.create({
    data: {
      contactId: input.contactId,
      songRequestId: input.songRequestId ?? null,
      workshopRequestId: input.workshopRequestId ?? null,
      invoiceId: input.invoiceId ?? null,
      commercialQuoteId: input.commercialQuoteId ?? null,
      uploadedByUserId: input.uploadedByUserId ?? null,
      filename: input.filename,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      storageKey: input.storageKey,
      url: input.url,
      category: input.category ?? getDefaultCategoryForUpload({ context: 'general' }),
      visibility: input.visibility ?? 'CLIENT_VISIBLE',
    },
  });
}

export async function linkQuoteToClientDocuments(params: {
  quoteId: string;
  quoteNumber: string;
  contactId: string;
}) {
  return ensureQuoteFileDocument(params);
}

export async function linkInvoiceToClientDocuments(params: {
  invoiceId: string;
  invoiceNumber: string;
  contactId: string;
}) {
  return ensureInvoiceFileDocument(params);
}

export async function getClientDocumentLibrary(contactId: string, db: DbClient = prisma) {
  return db.fileDocument.findMany({
    where: { contactId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export async function getSongDocumentLibrary(songRequestId: string, db: DbClient = prisma) {
  const songRequest = await db.songRequest.findUnique({
    where: { id: songRequestId },
    select: { id: true, contactId: true },
  });

  if (!songRequest) {
    return [];
  }

  return db.fileDocument.findMany({
    where: {
      contactId: songRequest.contactId,
      OR: [
        { songRequestId: songRequest.id },
        { commercialQuote: { songRequestId: songRequest.id } },
        { invoice: { convertedFromQuote: { songRequestId: songRequest.id } } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export async function getWorkshopDocumentLibrary(workshopRequestId: string, db: DbClient = prisma) {
  const workshop = await db.workshopRequest.findUnique({
    where: { id: workshopRequestId },
    select: { id: true, contactId: true },
  });

  if (!workshop || !workshop.contactId) {
    return [];
  }

  return db.fileDocument.findMany({
    where: {
      contactId: workshop.contactId,
      OR: [
        { workshopRequestId: workshop.id },
        { commercialQuote: { workshopRequestId: workshop.id } },
        { invoice: { convertedFromQuote: { workshopRequestId: workshop.id } } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}
