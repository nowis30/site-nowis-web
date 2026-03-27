import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { ActivitiesPage } from '@/features/crm/components/activities/ActivitiesPage';

export default async function CrmActivitiesPage() {
  await requireCrmSession();

  const [activities, contacts] = await Promise.all([
    prisma.activity.findMany({
      include: {
        contact: { select: { fullName: true } },
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.contact.findMany({
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    }),
  ]);

  return (
    <ActivitiesPage
      activities={activities.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        createdAt: item.createdAt.toISOString(),
        contact: item.contact,
        user: item.user,
      }))}
      contacts={contacts}
    />
  );
}
