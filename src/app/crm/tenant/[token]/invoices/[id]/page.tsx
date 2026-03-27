import { notFound } from 'next/navigation';
import { verifyTenantPortalToken } from '@/lib/client-portal';
import { prisma } from '@/lib/prisma';
import { InvoiceDetailPage } from '@/features/crm/components/invoices/InvoiceDetailPage';
import { getInvoiceBusinessProfile } from '@/lib/invoice-profile';

interface PageProps {
  params: { token: string; id: string };
}

export default async function TenantPortalInvoicePage({ params }: PageProps) {
  const session = verifyTenantPortalToken(params.token);
  if (!session) notFound();

  const tenant = await prisma.tenant.findFirst({
    where: { id: session.tenantId, contactId: session.contactId },
    select: { id: true, contactId: true },
  });

  if (!tenant) notFound();

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: params.id,
      contactId: tenant.contactId,
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
          }}
          businessProfile={getInvoiceBusinessProfile()}
          backHref={`/crm/tenant/${params.token}`}
          backLabel="Retour au dossier locataire"
          subtitle="Version imprimable disponible même sans fichier PDF joint"
        />
      </div>
    </main>
  );
}