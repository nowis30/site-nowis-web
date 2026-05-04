import { notFound } from 'next/navigation';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { CommercialQuoteEditorPage } from '@/features/crm/components/commercial-quotes/CommercialQuoteEditorPage';
import { getCommercialQuoteEditorOptions, getCommercialQuoteTaxRates } from '@/features/crm/components/commercial-quotes/server-data';

export default async function CrmCommercialQuoteDetailPage({ params }: { params: { id: string } }) {
  await requireCrmSession();

  const [quote, options, taxRates] = await Promise.all([
    prisma.commercialQuote.findUnique({
      where: { id: params.id },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    getCommercialQuoteEditorOptions(),
    getCommercialQuoteTaxRates(),
  ]);

  if (!quote) notFound();

  return (
    <CommercialQuoteEditorPage
      mode="detail"
      quoteId={quote.id}
      initialForm={{
        title: quote.title,
        description: quote.description || '',
        contactId: quote.contactId || '',
        organizationId: quote.organizationId || '',
        workshopRequestId: quote.workshopRequestId || '',
        songRequestId: quote.songRequestId || '',
        appointmentId: quote.appointmentId || '',
        currency: quote.currency,
        validUntil: quote.validUntil ? new Date(quote.validUntil.getTime() - quote.validUntil.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        notes: quote.notes || '',
        internalNotes: quote.internalNotes || '',
        status: quote.status,
        quoteNumber: quote.quoteNumber,
        convertedToInvoiceId: quote.convertedToInvoiceId,
      }}
      initialLines={quote.lines.map((line) => ({
        id: line.id,
        title: line.title,
        description: line.description || '',
        quantity: line.quantity.toString(),
        unitPrice: line.unitPrice.toString(),
        taxable: line.taxable,
        sortOrder: line.sortOrder,
      }))}
      contactOptions={options.contactOptions}
      organizationOptions={options.organizationOptions}
      workshopOptions={options.workshopOptions}
      songOptions={options.songOptions}
      appointmentOptions={options.appointmentOptions}
      taxRates={taxRates}
    />
  );
}
