import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { InvoicesPage } from '@/features/crm/components/invoices/InvoicesPage';

export default async function CrmInvoicesPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  await requireCrmSession();

  const songRequestId = typeof searchParams?.songRequestId === 'string' ? searchParams.songRequestId : undefined;
  const workshopRequestId = typeof searchParams?.workshopId === 'string' ? searchParams.workshopId : undefined;

  const songRequest = songRequestId
    ? await prisma.songRequest.findUnique({
        where: { id: songRequestId },
        select: {
          id: true,
          title: true,
          description: true,
          details: true,
          budget: true,
          contactId: true,
        },
      })
    : null;

  const workshopRequest = workshopRequestId
    ? await prisma.workshopRequest.findUnique({
        where: { id: workshopRequestId },
        select: {
          id: true,
          title: true,
          workshopTheme: true,
          groupType: true,
          residenceName: true,
          coordinatorName: true,
          estimatedParticipants: true,
          requestedDate: true,
          finalPrice: true,
          contactId: true,
        },
      })
    : null;

  const [invoices, contacts, stats] = await Promise.all([
    prisma.invoice.findMany({
      include: { contact: { select: { fullName: true, email: true } } },
      orderBy: { issueDate: 'desc' },
    }),
    prisma.contact.findMany({
      where: { crmStatus: { not: 'DELETED' } },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true },
    }),
  ]);

  return (
    <InvoicesPage
      invoices={invoices.map((item) => ({
        id: item.id,
        number: item.number,
        contactId: item.contactId,
        issueDate: item.issueDate.toISOString(),
        dueDate: item.dueDate.toISOString(),
        amount: item.amount.toString(),
        status: item.status,
        description: item.description,
        contact: item.contact,
      }))}
      contacts={contacts}
      stats={stats.map((row) => ({
        status: row.status,
        _count: row._count,
        _sum: { amount: row._sum.amount?.toString() ?? null },
      }))}
      initialForm={{
        contactId: typeof searchParams?.contactId === 'string' ? searchParams.contactId : songRequest?.contactId,
        description:
          typeof searchParams?.description === 'string'
            ? searchParams.description
            : workshopRequest
              ? [
                  `Atelier · ${workshopRequest.title || 'Demande atelier'}`,
                  workshopRequest.groupType ? `Catégorie ${workshopRequest.groupType}` : '',
                  workshopRequest.workshopTheme ? `Thème ${workshopRequest.workshopTheme}` : '',
                  workshopRequest.residenceName ? `Résidence ${workshopRequest.residenceName}` : '',
                  workshopRequest.coordinatorName ? `Coordination ${workshopRequest.coordinatorName}` : '',
                  workshopRequest.requestedDate ? `Date ${new Intl.DateTimeFormat('fr-CA').format(workshopRequest.requestedDate)}` : '',
                  workshopRequest.estimatedParticipants ? `${workshopRequest.estimatedParticipants} participants` : '',
                ].filter(Boolean).join(' · ')
            : songRequest
              ? `Chanson personnalisée · ${songRequest.title || 'Demande client'}${songRequest.description || songRequest.details ? ` · ${(songRequest.description || songRequest.details || '').slice(0, 220)}` : ''}`
              : undefined,
        amount: typeof searchParams?.amount === 'string' ? searchParams.amount : workshopRequest?.finalPrice?.toString() || songRequest?.budget?.toString(),
        sourceWorkshopRequestId: workshopRequest?.id,
        sourceSongRequestId: songRequest?.id,
      }}
    />
  );
}
