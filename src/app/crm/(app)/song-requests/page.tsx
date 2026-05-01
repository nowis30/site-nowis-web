import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { SongRequestsPage } from '@/features/crm/components/song-requests/SongRequestsPage';

export default async function CrmSongRequestsPage() {
  await requireCrmSession();

  try {
    const items = await prisma.songRequest.findMany({
      include: {
        contact: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const mappedItems = items.map((item) => {
      if (!item.contact) {
        console.error('[SONG_REQUESTS_PAGE] Missing contact for song request:', item.id);
        return null;
      }
      return {
        id: String(item.id),
        title: item.title ?? 'Demande de chanson',
        language: item.language ?? 'Non précisée',
        theme: item.theme ?? 'Non précisé',
        fullName: item.fullName || '',
        email: item.email || '',
        songType: item.songType || '',
        eventType: item.eventType ?? item.occasion ?? '',
        status: item.status as 'NEW' | 'CONTACTED' | 'QUOTED' | 'IN_PROGRESS' | 'IN_PRODUCTION' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DELETED',
        createdAt: item.createdAt.toISOString(),
        contact: {
          id: String(item.contact.id),
          fullName: item.contact.fullName || '',
          email: item.contact.email || null,
        },
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    return <SongRequestsPage items={mappedItems} />;
  } catch (error) {
    console.error('[SONG_REQUESTS_PAGE_ERROR]', error);
    throw error;
  }
}
