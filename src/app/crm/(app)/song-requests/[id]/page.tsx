import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { SongRequestDetailPage } from '@/features/crm/components/song-requests/SongRequestDetailPage';
import { buildClientPortalUrl, signClientPortalToken } from '@/lib/client-portal';
import { Prisma } from '@prisma/client';

type SongRequestDetailRecord = Prisma.SongRequestGetPayload<{
  include: {
    organization: { select: { id: true; name: true } };
    contact: { select: { id: true; fullName: true; email: true; phone: true } };
    appointments: true;
    fileDocuments: true;
    activities: { include: { user: { select: { id: true; fullName: true } } } };
    tasks: true;
  };
}>;

interface PageProps {
  params: { id: string };
}

export default async function CrmSongRequestDetailPage({ params }: PageProps) {
  await requireCrmSession();

  const item = await prisma.songRequest.findUnique({
    where: { id: params.id },
    include: {
      organization: { select: { id: true, name: true } },
      contact: { select: { id: true, fullName: true, email: true, phone: true } },
      appointments: {
        orderBy: { startAt: 'asc' },
        take: 20,
      },
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
  const song: SongRequestDetailRecord = item;

  const clientPortalToken = signClientPortalToken({
    contactId: String(song.contact.id),
    email: song.email,
    fullName: song.fullName,
  });

  return (
    <SongRequestDetailPage
      item={{
        id: String(song.id),
        fullName: song.fullName || '',
        email: song.email || '',
        phone: song.phone || '',
        title: song.title ?? 'Demande de chanson',
        language: song.language ?? 'Non précisée',
        songType: song.songType || '',
        tempo: (song.tempo === 'LENT' || song.tempo === 'RAPIDE' ? song.tempo : 'MOYEN'),
        occasion: song.occasion || '',
        eventType: song.eventType ?? song.occasion ?? '',
        recipientName: song.recipientName || '',
        specialMessage: song.specialMessage,
        style: song.style || '',
        mood: song.mood || '',
        theme: song.theme ?? 'Non précisé',
        description: song.description ?? song.details ?? '',
        inspirations: song.inspirations,
        lyrics: song.lyrics,
        structureVerse: song.structureVerse ?? '—',
        structureChorus: song.structureChorus ?? '—',
        structureBridge: song.structureBridge,
        fileUrl: song.fileUrl,
        details: song.details || '',
        budget: song.budget?.toString() ?? null,
        desiredDeadline: song.desiredDeadline?.toISOString() ?? null,
        meetingDate: song.meetingDate?.toISOString() ?? null,
        scheduledAt: song.scheduledAt?.toISOString() ?? null,
        startAt: song.startAt?.toISOString() ?? null,
        endAt: song.endAt?.toISOString() ?? null,
        durationMinutes: song.durationMinutes ?? null,
        meetingType: song.meetingType ?? null,
        location: song.location ?? null,
        meetingNotes: song.meetingNotes ?? null,
        source: song.source || '',
        status: song.status as 'NEW' | 'CONTACTED' | 'QUOTED' | 'IN_PROGRESS' | 'IN_PRODUCTION' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED',
        convertedAppointmentId: song.convertedAppointmentId ? String(song.convertedAppointmentId) : null,
        convertedInvoiceId: song.convertedInvoiceId ? String(song.convertedInvoiceId) : null,
        createdAt: song.createdAt.toISOString(),
        contact: {
          id: String(song.contact.id),
          fullName: song.contact.fullName || '',
          email: song.contact.email || null,
          phone: song.contact.phone || null,
        },
        organization: song.organization ? { id: song.organization.id, name: song.organization.name } : null,
        appointments: song.appointments.map((appointment) => ({
          id: String(appointment.id),
          title: appointment.title,
          startAt: appointment.startAt.toISOString(),
          endAt: appointment.endAt.toISOString(),
          status: appointment.status,
          type: appointment.type,
          location: appointment.location,
        })),
        activities: song.activities.map((activity) => ({
          id: String(activity.id),
          type: activity.type,
          title: activity.title || '',
          description: activity.description,
          createdAt: activity.createdAt.toISOString(),
          user: activity.user ? {
            fullName: activity.user.fullName || '',
          } : null,
        })),
        tasks: song.tasks.map((task) => ({
          id: String(task.id),
          title: task.title || '',
          description: task.description,
          status: task.status as 'TODO' | 'IN_PROGRESS' | 'DONE',
          priority: task.priority as 'LOW' | 'MEDIUM' | 'HIGH',
          dueDate: task.dueDate?.toISOString() ?? null,
        })),
        files: song.fileDocuments.map((file) => ({
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
