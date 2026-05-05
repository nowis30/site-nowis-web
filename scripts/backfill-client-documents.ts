import { Prisma } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

async function ensureQuoteDocuments() {
  const quotes = await prisma.commercialQuote.findMany({
    where: { contactId: { not: null } },
    select: { id: true, quoteNumber: true, contactId: true },
  });

  const quoteIds = quotes.map((quote) => quote.id);
  const existingDocs = quoteIds.length
    ? await prisma.fileDocument.findMany({
        where: { commercialQuoteId: { in: quoteIds } },
        select: { commercialQuoteId: true },
      })
    : [];

  const existingQuoteIds = new Set(
    existingDocs
      .map((document) => document.commercialQuoteId)
      .filter((value): value is string => Boolean(value)),
  );

  let created = 0;
  for (const quote of quotes) {
    if (!quote.contactId || existingQuoteIds.has(quote.id)) continue;

    try {
      await prisma.fileDocument.create({
        data: {
          contactId: quote.contactId,
          commercialQuoteId: quote.id,
          filename: `${quote.quoteNumber}.pdf`,
          originalName: `Devis ${quote.quoteNumber}`,
          mimeType: 'application/pdf',
          size: 0,
          storageKey: `quotes/${quote.id}`,
          url: `/api/crm/commercial-quotes/${quote.id}/pdf`,
          category: 'quote',
          visibility: 'CLIENT_VISIBLE',
        },
      });
      created += 1;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
        throw error;
      }
    }
  }

  return { total: quotes.length, created };
}

async function ensureInvoiceDocuments() {
  const invoices = await prisma.invoice.findMany({
    where: { contactId: { not: null } },
    select: { id: true, number: true, contactId: true },
  });

  const invoiceIds = invoices.map((invoice) => invoice.id);
  const existingDocs = invoiceIds.length
    ? await prisma.fileDocument.findMany({
        where: { invoiceId: { in: invoiceIds } },
        select: { invoiceId: true },
      })
    : [];

  const existingInvoiceIds = new Set(
    existingDocs
      .map((document) => document.invoiceId)
      .filter((value): value is string => Boolean(value)),
  );

  let created = 0;
  for (const invoice of invoices) {
    if (!invoice.contactId || existingInvoiceIds.has(invoice.id)) continue;

    try {
      await prisma.fileDocument.create({
        data: {
          contactId: invoice.contactId,
          invoiceId: invoice.id,
          filename: `${invoice.number}.pdf`,
          originalName: `Facture ${invoice.number}`,
          mimeType: 'application/pdf',
          size: 0,
          storageKey: `invoices/${invoice.id}`,
          url: `/api/client-portal/invoices/${invoice.id}/pdf`,
          category: 'invoice',
          visibility: 'CLIENT_VISIBLE',
        },
      });
      created += 1;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
        throw error;
      }
    }
  }

  return { total: invoices.length, created };
}

async function main() {
  const [quotes, invoices] = await Promise.all([
    ensureQuoteDocuments(),
    ensureInvoiceDocuments(),
  ]);

  console.log('[documents:backfill] quotes_total=', quotes.total);
  console.log('[documents:backfill] quotes_created=', quotes.created);
  console.log('[documents:backfill] invoices_total=', invoices.total);
  console.log('[documents:backfill] invoices_created=', invoices.created);
}

main()
  .catch((error) => {
    console.error('[documents:backfill] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });