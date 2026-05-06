import { notFound } from 'next/navigation';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { CommercialQuoteEditorPage } from '@/features/crm/components/commercial-quotes/CommercialQuoteEditorPage';
import { getCommercialQuoteEditorOptions, getCommercialQuoteTaxRates } from '@/features/crm/components/commercial-quotes/server-data';
import { LinkedDocumentsPanel } from '@/features/crm/components/documents/LinkedDocumentsPanel';

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

  const documentsWhere = quote.contactId
    ? {
        OR: [
          { commercialQuoteId: quote.id },
          { contactId: quote.contactId },
        ],
      }
    : { commercialQuoteId: quote.id };

  const linkedDocuments = await prisma.fileDocument.findMany({
    where: documentsWhere,
    orderBy: { createdAt: 'desc' },
    take: 80,
  });

  return (
    <>
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

      <LinkedDocumentsPanel
        title="Documents liés"
        subtitle="Documents du client et documents liés à cette soumission."
        items={linkedDocuments.map((file) => ({
          id: file.id,
          originalName: file.originalName,
          mimeType: file.mimeType,
          category: file.category,
          createdAtIso: file.createdAt.toISOString(),
          downloadUrl: `/api/crm/file-documents/${file.id}/download`,
          songRequestId: file.songRequestId,
          workshopRequestId: file.workshopRequestId,
          commercialQuoteId: file.commercialQuoteId,
          invoiceId: file.invoiceId,
          uploadedByUserId: file.uploadedByUserId,
          visibility: file.visibility,
        }))}
        quickLinks={[
          ...(quote.contactId ? [{ href: `/crm/contacts/${quote.contactId}`, label: 'Dossier client' }] : []),
          ...(quote.songRequestId ? [{ href: `/crm/song-requests/${quote.songRequestId}`, label: 'Dossier chanson' }] : []),
          ...(quote.workshopRequestId ? [{ href: `/crm/workshop-requests/${quote.workshopRequestId}`, label: 'Dossier atelier' }] : []),
          { href: `/crm/commercial-quotes/${quote.id}`, label: 'Dossier soumission' },
        ]}
      />
    </>
  );
}
