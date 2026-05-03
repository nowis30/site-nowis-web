import { notFound } from 'next/navigation';
import { verifyClientPortalToken } from '@/lib/client-portal';
import { prisma } from '@/lib/prisma';
import { InvoiceDetailPage } from '@/features/crm/components/invoices/InvoiceDetailPage';
import { getInvoiceBusinessProfile } from '@/lib/invoice-profile';

interface PageProps {
  params: { token: string; id: string };
}

export default async function ClientPortalInvoicePage({ params }: PageProps) {
  const session = verifyClientPortalToken(params.token);
  if (!session) notFound();

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: params.id,
      contactId: session.contactId,
    },
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
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
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
          businessProfile={getInvoiceBusinessProfile()}
          backHref={`/crm/client/${params.token}`}
          backLabel="Retour au dossier client"
          subtitle="Version imprimable disponible même sans fichier PDF joint"
        />
      </div>
    </main>
  );
}