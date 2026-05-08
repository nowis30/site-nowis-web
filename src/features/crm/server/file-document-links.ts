import { prisma } from '@/lib/prisma';

export async function ensureQuoteFileDocument(params: {
  quoteId: string;
  quoteNumber: string;
  contactId: string;
}) {
  void params.quoteNumber;
  void params.contactId;

  const existing = await prisma.fileDocument.findFirst({
    where: { commercialQuoteId: params.quoteId },
    select: { id: true },
  });

  if (existing) return existing;

  // Ne pas créer de faux PDF de soumission.
  // Les soumissions client sont consultables via /client/soumissions/[id].
  return null;
}

export async function ensureInvoiceFileDocument(params: {
  invoiceId: string;
  invoiceNumber: string;
  contactId: string;
}) {
  void params.invoiceNumber;
  void params.contactId;

  const existing = await prisma.fileDocument.findFirst({
    where: { invoiceId: params.invoiceId },
    select: { id: true },
  });

  if (existing) return existing;

  // Ne pas créer de faux PDF de facture. Les factures client sont consultables via /client/invoices/[id].
  return null;
}