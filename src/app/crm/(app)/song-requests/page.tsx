import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { SongRequestsPage } from '@/features/crm/components/song-requests/SongRequestsPage';

export default async function CrmSongRequestsPage() {
  await requireCrmSession();

  const items = await prisma.songRequest.findMany({
    include: {
      contact: {
        select: { id: true, fullName: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <SongRequestsPage
      items={items.map((item) => ({
        id: item.id,
        title: item.title ?? 'Demande de chanson',
        language: item.language ?? 'Non précisée',
        theme: item.theme ?? 'Non précisé',
        fullName: item.fullName,
        email: item.email,
        songType: item.songType,
        eventType: item.eventType ?? item.occasion,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        contact: item.contact,
      }))}
    />
  );
}
