import { prisma } from '@/lib/prisma';
import { resolveDocumentCategory } from '@/features/documents/document-categories';

type DbClient = typeof prisma;

export function isOwnedByContact(ownerContactId: string | null | undefined, sessionContactId: string) {
  return Boolean(ownerContactId) && ownerContactId === sessionContactId;
}

export async function canClientAccessSongRequest(params: {
  songRequestId: string;
  sessionContactId: string;
  db?: DbClient;
}) {
  const db = params.db ?? prisma;
  const request = await db.songRequest.findFirst({
    where: { id: params.songRequestId, contactId: params.sessionContactId },
    select: { id: true },
  });
  return Boolean(request);
}

export async function canClientAccessWorkshopRequest(params: {
  workshopRequestId: string;
  sessionContactId: string;
  db?: DbClient;
}) {
  const db = params.db ?? prisma;
  const request = await db.workshopRequest.findFirst({
    where: {
      id: params.workshopRequestId,
      OR: [
        { contactId: params.sessionContactId },
        { clientId: params.sessionContactId },
      ],
    },
    select: { id: true },
  });
  return Boolean(request);
}

export async function canClientAccessInvoice(params: {
  invoiceId: string;
  sessionContactId: string;
  db?: DbClient;
}) {
  const db = params.db ?? prisma;
  const invoice = await db.invoice.findFirst({
    where: { id: params.invoiceId, contactId: params.sessionContactId },
    select: { id: true },
  });
  return Boolean(invoice);
}

export async function canClientAccessCommercialQuote(params: {
  commercialQuoteId: string;
  sessionContactId: string;
  db?: DbClient;
}) {
  const db = params.db ?? prisma;
  const quote = await db.commercialQuote.findFirst({
    where: { id: params.commercialQuoteId, contactId: params.sessionContactId },
    select: { id: true },
  });
  return Boolean(quote);
}

type ClientFileDocumentAccessInput = {
  sessionContactId: string;
  visibility: 'ADMIN_ONLY' | 'CLIENT_VISIBLE' | null;
  category: string | null;
  contactId?: string | null;
  songRequestContactId?: string | null;
  workshopRequestContactId?: string | null;
  workshopRequestClientId?: string | null;
  invoiceContactId?: string | null;
  commercialQuoteContactId?: string | null;
};

export function canClientAccessFileDocument(input: ClientFileDocumentAccessInput) {
  if (input.visibility !== 'CLIENT_VISIBLE') return false;

  const resolvedCategory = resolveDocumentCategory({ category: input.category });
  if (resolvedCategory.category === 'admin-internal') return false;

  const ownerIds = [
    input.contactId,
    input.songRequestContactId,
    input.workshopRequestContactId,
    input.workshopRequestClientId,
    input.invoiceContactId,
    input.commercialQuoteContactId,
  ];

  return ownerIds.some((id) => id === input.sessionContactId);
}
