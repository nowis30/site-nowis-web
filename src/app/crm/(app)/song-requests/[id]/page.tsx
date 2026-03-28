import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { SongRequestDetailPage } from '@/features/crm/components/song-requests/SongRequestDetailPage';
import { buildClientPortalUrl, signClientPortalToken } from '@/lib/client-portal';

interface PageProps {
  params: { id: string };
}

export default async function CrmSongRequestDetailPage({ params }: PageProps) {
  await requireCrmSession();

  const item = await prisma.songRequest.findUnique({
    where: { id: params.id },
    include: {
      contact: { select: { id: true, fullName: true, email: true, phone: true } },
      fileDocuments: {
        orderBy: { createdAt: 'desc' },
        take: 60,
      },
      activities: {
        include: { user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
      tasks: {
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      },
    },
  });

  if (!item) notFound();

  const clientPortalToken = signClientPortalToken({
    contactId: String(item.contact.id),
    email: item.email,
    fullName: item.fullName,
  });

  return (
    <SongRequestDetailPage
      item={{
        id: String(item.id),
        fullName: item.fullName || '',
        email: item.email || '',
        phone: item.phone || '',
        title: item.title ?? 'Demande de chanson',
        language: item.language ?? 'Non précisée',
        songType: item.songType || '',
        tempo: (item.tempo === 'LENT' || item.tempo === 'RAPIDE' ? item.tempo : 'MOYEN'),
        occasion: item.occasion || '',
        eventType: item.eventType ?? item.occasion ?? '',
        recipientName: item.recipientName || '',
        specialMessage: item.specialMessage,
        style: item.style || '',
        mood: item.mood || '',
        theme: item.theme ?? 'Non précisé',
        description: item.description ?? item.details ?? '',
        inspirations: item.inspirations,
        lyrics: item.lyrics,
        structureVerse: item.structureVerse ?? '—',
        structureChorus: item.structureChorus ?? '—',
        structureBridge: item.structureBridge,
        fileUrl: item.fileUrl,
        details: item.details || '',
        budget: item.budget?.toString() ?? null,
        desiredDeadline: item.desiredDeadline?.toISOString() ?? null,
        source: item.source || '',
        status: item.status as 'NEW' | 'CONTACTED' | 'QUOTED' | 'IN_PROGRESS' | 'IN_PRODUCTION' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED',
        convertedAppointmentId: item.convertedAppointmentId ? String(item.convertedAppointmentId) : null,
        convertedInvoiceId: item.convertedInvoiceId ? String(item.convertedInvoiceId) : null,
        createdAt: item.createdAt.toISOString(),
        contact: {
          id: String(item.contact.id),
          fullName: item.contact.fullName || '',
          email: item.contact.email || null,
          phone: item.contact.phone || null,
        },
        activities: item.activities.map((activity) => ({
          id: String(activity.id),
          type: activity.type,
          title: activity.title || '',
          description: activity.description,
          createdAt: activity.createdAt.toISOString(),
          user: activity.user ? {
            fullName: activity.user.fullName || '',
          } : null,
        })),
        tasks: item.tasks.map((task) => ({
          id: String(task.id),
          title: task.title || '',
          description: task.description,
          status: task.status as 'TODO' | 'IN_PROGRESS' | 'DONE',
          priority: task.priority as 'LOW' | 'MEDIUM' | 'HIGH',
          dueDate: task.dueDate?.toISOString() ?? null,
        })),
        files: item.fileDocuments.map((file) => ({
          id: String(file.id),
          filename: file.filename || '',
          originalName: file.originalName || '',
          mimeType: file.mimeType || '',
          size: file.size ?? 0,
          url: file.url || '',
          category: file.category || '',
          visibility: file.visibility as 'ADMIN_ONLY' | 'CLIENT_VISIBLE',
          createdAt: file.createdAt.toISOString(),
        })),
      }}
      clientPortalUrl={buildClientPortalUrl(clientPortalToken)}
    />
  );
}
