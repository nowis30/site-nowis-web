import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { SubmissionsPage } from '@/features/crm/components/submissions/SubmissionsPage';

export default async function CrmSubmissionsRoutePage() {
  await requireCrmSession();

  const items = await prisma.inquiry.findMany({
    where: { submissionStatus: { not: 'SUPPRIME' } },
    include: {
      contact: { select: { id: true, fullName: true, email: true, phone: true } },
    },
    orderBy: [{ receivedAt: 'desc' }],
    take: 200,
  });

  return (
    <SubmissionsPage
      items={items.map((item) => ({
        id: item.id,
        subject: item.subject,
        message: item.message,
        source: item.source,
        submissionStatus: item.submissionStatus,
        receivedAt: item.receivedAt.toISOString(),
        contact: item.contact,
      }))}
    />
  );
}
