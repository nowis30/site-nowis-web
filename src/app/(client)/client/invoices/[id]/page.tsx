import { notFound } from 'next/navigation';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { prisma } from '@/lib/prisma';
import { InvoiceDetailPage } from '@/features/crm/components/invoices/InvoiceDetailPage';
import { getBillingIssuerSnapshot } from '@/lib/billing-profile';

interface PageProps {
  params: { id: string };
}

export default async function ClientPortalInvoiceDetailPage({ params }: PageProps) {
  const session = await requireClientPortalSession();
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, contactId: session.contactId },
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

  return (
    <InvoiceDetailPage
      invoice={{
        ...invoice,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        amount: invoice.amount.toString(),
        paypalSentAt: invoice.paypalSentAt?.toISOString() || null,
        paypalPaidAt: invoice.paypalPaidAt?.toISOString() || null,
        paypalLastWebhookAt: invoice.paypalLastWebhookAt?.toISOString() || null,
        paymentAmount: invoice.paymentAmount?.toString() || null,
      }}
      businessProfile={businessProfile}
      backHref="/client/dashboard"
      backLabel="Retour au portail client"
      subtitle="Version professionnelle consultable depuis votre portail sécurisé"
    />
  );
}
