import { notFound } from 'next/navigation';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { prisma } from '@/lib/prisma';
import { InvoiceDetailPage } from '@/features/crm/components/invoices/InvoiceDetailPage';
import { getInvoiceBusinessProfile } from '@/lib/invoice-profile';

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

  return (
    <InvoiceDetailPage
      invoice={{
        ...invoice,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        amount: invoice.amount.toString(),
      }}
      businessProfile={getInvoiceBusinessProfile()}
      backHref="/client/dashboard"
      backLabel="Retour au portail client"
      subtitle="Version professionnelle consultable depuis votre portail sécurisé"
    />
  );
}
