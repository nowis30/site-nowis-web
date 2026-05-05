import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function ensureQuoteFileDocument(params: {
  quoteId: string;
  quoteNumber: string;
  contactId: string;
}) {
  const existing = await prisma.fileDocument.findFirst({
    where: { commercialQuoteId: params.quoteId },
    select: { id: true },
  });

  if (existing) return existing;

  try {
    return await prisma.fileDocument.create({
      data: {
        contactId: params.contactId,
        commercialQuoteId: params.quoteId,
        filename: `${params.quoteNumber}.pdf`,
        originalName: `Devis ${params.quoteNumber}`,
        mimeType: 'application/pdf',
        size: 0,
        storageKey: `quotes/${params.quoteId}`,
        url: `/api/crm/commercial-quotes/${params.quoteId}/pdf`,
        category: 'quote',
        visibility: 'CLIENT_VISIBLE',
      },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const afterConflict = await prisma.fileDocument.findFirst({
        where: { commercialQuoteId: params.quoteId },
        select: { id: true },
      });
      if (afterConflict) return afterConflict;
    }
    throw error;
  }
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