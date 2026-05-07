import { Prisma } from '@prisma/client';
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
  const existing = await prisma.fileDocument.findFirst({
    where: { invoiceId: params.invoiceId },
    select: { id: true },
  });

  if (existing) return existing;

  try {
    return await prisma.fileDocument.create({
      data: {
        contactId: params.contactId,
        invoiceId: params.invoiceId,
        filename: `${params.invoiceNumber}.pdf`,
        originalName: `Facture ${params.invoiceNumber}`,
        mimeType: 'application/pdf',
        size: 0,
        storageKey: `invoices/${params.invoiceId}`,
        url: `/api/client-portal/invoices/${params.invoiceId}/pdf`,
        category: 'invoice',
        visibility: 'CLIENT_VISIBLE',
      },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const afterConflict = await prisma.fileDocument.findFirst({
        where: { invoiceId: params.invoiceId },
        select: { id: true },
      });
      if (afterConflict) return afterConflict;
    }
    throw error;
  }
}