import { Prisma } from '@prisma/client';
import { can } from '@/features/crm/auth/permissions';
import { InvoicePaymentPanel } from '@/features/crm/components/invoices/InvoicePaymentPanel';
import { notFound } from 'next/navigation';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { InvoiceDetailPage } from '@/features/crm/components/invoices/InvoiceDetailPage';
import { InvoiceEmailPanel } from '@/features/crm/components/invoices/InvoiceEmailPanel';
import { getBillingIssuerSnapshot } from '@/lib/billing-profile';
import { getPayPalDiagnostics } from '@/lib/server/paypal';
import { LinkedDocumentsPanel } from '@/features/crm/components/documents/LinkedDocumentsPanel';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CrmInvoiceDetailRoute(props: PageProps) {
  const params = await props.params;
  const session = await requireCrmSession();

  const paypalConfigured = getPayPalDiagnostics().configured;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      paymentHistory: { orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }] },
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

  const serializedInvoice = {
    ...invoice,
    paymentHistory: undefined,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    amount: invoice.amount.toString(),
    isTest: invoice.isTest,
    paypalSentAt: invoice.paypalSentAt?.toISOString() || null,
    paypalPaidAt: invoice.paypalPaidAt?.toISOString() || null,
    paypalLastWebhookAt: invoice.paypalLastWebhookAt?.toISOString() || null,
    paymentAmount: invoice.paymentAmount?.toString() || null,
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <a href="/crm/invoices" className="text-sm font-medium text-primary-300">← Historique des factures</a>
        <span className="text-sm text-slate-300">Facture {invoice.number}</span>
      </div>
      <div className="mb-4 flex flex-wrap gap-3 print:hidden">
        <a href={`/api/crm/invoices/${invoice.id}/preview-pdf`} target="_blank" rel="noreferrer" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white">Voir le PDF</a>
        <a href={`/api/crm/invoices/${invoice.id}/preview-pdf?download=1`} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-white">Télécharger le PDF</a>
      </div>
      <InvoicePaymentPanel
        invoiceId={invoice.id}
        status={invoice.status}
        total={(invoice.totalAmount ?? invoice.amount).toString()}
        paid={Prisma.Decimal.max(invoice.paymentAmount ?? 0, invoice.paymentHistory.reduce((sum, payment) => sum.add(payment.amount), new Prisma.Decimal(0))).toString()}
        canUpdate={can(session.role, 'invoices', 'update')}
        history={invoice.paymentHistory.map((payment) => ({
          id: payment.id, amount: payment.amount.toString(), paidAt: payment.paidAt.toISOString(),
          paymentMethod: payment.paymentMethod, note: payment.note,
        }))}
      />
      <InvoiceEmailPanel
        invoice={{
          id: invoice.id,
          number: invoice.number,
          issueDate: invoice.issueDate.toISOString(),
          dueDate: invoice.dueDate.toISOString(),
          amount: invoice.amount.toString(),
          description: invoice.description,
          contact: {
            fullName: invoice.contact.fullName,
            email: invoice.contact.email,
            companyName: invoice.contact.companyName,
          },
        }}
        businessName={businessProfile.displayName}
        senderEmail={businessProfile.email || null}
        website={businessProfile.website || null}
      />

      <InvoiceDetailPage
        invoice={serializedInvoice}
        businessProfile={businessProfile}
        allowEmailSend={false}
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

