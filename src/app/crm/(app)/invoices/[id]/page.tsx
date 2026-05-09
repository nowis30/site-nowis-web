import { notFound } from 'next/navigation';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { InvoiceDetailPage } from '@/features/crm/components/invoices/InvoiceDetailPage';
import { getBillingIssuerSnapshot } from '@/lib/billing-profile';
import { getPayPalDiagnostics } from '@/lib/server/paypal';
import { LinkedDocumentsPanel } from '@/features/crm/components/documents/LinkedDocumentsPanel';

interface PageProps {
  params: { id: string };
  searchParams?: { compose?: string };
}

export default async function CrmInvoiceDetailRoute({ params, searchParams }: PageProps) {
  await requireCrmSession();

  const paypalConfigured = getPayPalDiagnostics().configured;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      contact: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          companyName: true,
        },
      },
    },
  });

  if (!invoice) notFound();

  const businessProfile = await getBillingIssuerSnapshot();

  const linkedDocuments = await prisma.fileDocument.findMany({
    where: {
      OR: [
        { invoiceId: invoice.id },
        { contactId: invoice.contactId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 80,
  });

  const visibleLinkedDocuments = linkedDocuments.filter((file) => {
    const isInvoicePlaceholder = Boolean(file.invoiceId) && file.size === 0 && file.storageKey.startsWith('invoices/');
    return !isInvoicePlaceholder;
  });

  return (
    <>
      <InvoiceDetailPage
        invoice={{
        ...invoice,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        amount: invoice.amount.toString(),
        isTest: invoice.isTest,
        paypalSentAt: invoice.paypalSentAt?.toISOString() || null,
        paypalPaidAt: invoice.paypalPaidAt?.toISOString() || null,
        paypalLastWebhookAt: invoice.paypalLastWebhookAt?.toISOString() || null,
        paymentAmount: invoice.paymentAmount?.toString() || null,
      }}
      businessProfile={businessProfile}
      allowEmailSend
      initialComposeOpen={searchParams?.compose === '1'}
      allowPayPalActions
      paypalConfigured={paypalConfigured}
        missingPayPalConfigMessage="PayPal n’est pas encore configuré. Ajoute les variables PayPal dans Vercel ou Render."
      />

      <LinkedDocumentsPanel
        title="Documents liés"
        subtitle="Documents du client et documents liés à cette facture."
        items={visibleLinkedDocuments.map((file) => ({
          id: file.id,
          originalName: file.originalName,
          mimeType: file.mimeType,
          category: file.category,
          createdAtIso: file.createdAt.toISOString(),
          downloadUrl: `/api/crm/file-documents/${file.id}/download`,
          size: file.size,
          storageKey: file.storageKey,
          songRequestId: file.songRequestId,
          workshopRequestId: file.workshopRequestId,
          commercialQuoteId: file.commercialQuoteId,
          invoiceId: file.invoiceId,
          uploadedByUserId: file.uploadedByUserId,
          visibility: file.visibility,
        }))}
        quickLinks={[
          { href: `/crm/contacts/${invoice.contactId}`, label: 'Dossier client' },
          { href: `/crm/invoices/${invoice.id}`, label: 'Voir la facture CRM' },
        ]}
      />
    </>
  );
}
