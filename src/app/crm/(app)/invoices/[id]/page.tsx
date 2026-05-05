import { notFound } from 'next/navigation';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { InvoiceDetailPage } from '@/features/crm/components/invoices/InvoiceDetailPage';
import { getBillingIssuerSnapshot } from '@/lib/billing-profile';
import { getPayPalDiagnostics } from '@/lib/server/paypal';

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
      allowEmailSend
      initialComposeOpen={searchParams?.compose === '1'}
      allowPayPalActions
      paypalConfigured={paypalConfigured}
      missingPayPalConfigMessage="PayPal n’est pas encore configuré. Ajoute les variables PayPal dans Vercel ou Render."
    />
  );
}
