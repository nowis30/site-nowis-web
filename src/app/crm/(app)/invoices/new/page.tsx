import { requireCrmSession } from '@/features/crm/auth/session';
import { DirectInvoiceCreatePage } from '@/features/crm/components/invoices/DirectInvoiceCreatePage';
import { prisma } from '@/lib/prisma';

export default async function CrmDirectInvoiceCreatePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  await requireCrmSession();

  const contacts = await prisma.contact.findMany({
    where: { crmStatus: { not: 'DELETED' } },
    select: { id: true, fullName: true, companyName: true },
    orderBy: [{ companyName: 'asc' }, { fullName: 'asc' }],
  });

  return (
    <DirectInvoiceCreatePage
      contacts={contacts}
      initialForm={{
        contactId: typeof searchParams?.contactId === 'string' ? searchParams.contactId : undefined,
        description: typeof searchParams?.description === 'string' ? searchParams.description : undefined,
        amount: typeof searchParams?.amount === 'string' ? searchParams.amount : undefined,
        sourceWorkshopRequestId:
          typeof searchParams?.sourceWorkshopRequestId === 'string' ? searchParams.sourceWorkshopRequestId : undefined,
        sourceSongRequestId:
          typeof searchParams?.sourceSongRequestId === 'string' ? searchParams.sourceSongRequestId : undefined,
      }}
    />
  );
}
