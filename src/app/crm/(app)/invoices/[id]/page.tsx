import { notFound } from 'next/navigation';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { InvoiceDetailPage } from '@/features/crm/components/invoices/InvoiceDetailPage';
import { getInvoiceBusinessProfile } from '@/lib/invoice-profile';

interface PageProps {
  params: { id: string };
  searchParams?: { compose?: string };
}

export default async function CrmInvoiceDetailRoute({ params, searchParams }: PageProps) {
  await requireCrmSession();

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

  return (
    <InvoiceDetailPage
      invoice={{
        ...invoice,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        amount: invoice.amount.toString(),
      }}
      businessProfile={getInvoiceBusinessProfile()}
      allowEmailSend
      initialComposeOpen={searchParams?.compose === '1'}
    />
  );
}
