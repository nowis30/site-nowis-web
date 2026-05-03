import Link from 'next/link';
import { SongRequestStatus } from '@prisma/client';

import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { EmptyState, PageHeader, SectionCard, StatusBadge } from '@/features/client-portal/components/ui';
import { ClientSongRequestEditor } from '@/features/client-portal/components/song-requests/ClientSongRequestEditor';
import { ClientSongRequestInfoEditor } from '@/features/client-portal/components/song-requests/ClientSongRequestInfoEditor';
import { SongRequestFilesPanel } from '@/features/crm/components/song-requests/SongRequestFilesPanel';
import { prisma } from '@/lib/prisma';

const statusLabels: Record<SongRequestStatus, string> = {
  NEW: 'Nouvelle',
  CONTACTED: 'Contactée',
  QUOTED: 'Devis envoyé',
  IN_PROGRESS: 'En cours',
  IN_PRODUCTION: 'En production',
  DELIVERED: 'Livrée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  DELETED: 'Supprimée',
};

function statusTone(status: SongRequestStatus): 'warning' | 'info' | 'success' | 'danger' {
  if (status === 'NEW' || status === 'CONTACTED') return 'warning';
  if (status === 'IN_PROGRESS' || status === 'IN_PRODUCTION' || status === 'QUOTED') return 'info';
  if (status === 'DELIVERED' || status === 'COMPLETED') return 'success';
  return 'danger';
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

export default async function ClientSongRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClientPortalSession();
  const { id } = await params;

  const request = await prisma.songRequest.findFirst({
    where: {
      id,
      contactId: session.contactId,
    },
    select: {
      id: true,
      title: true,
      fullName: true,
      email: true,
      phone: true,
      songType: true,
      language: true,
      occasion: true,
      recipientName: true,
      style: true,
      mood: true,
      description: true,
      details: true,
      budget: true,
      desiredDeadline: true,
      meetingDate: true,
      startAt: true,
      endAt: true,
      durationMinutes: true,
      meetingType: true,
      location: true,
      meetingNotes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      fileDocuments: {
        where: { visibility: 'CLIENT_VISIBLE' },
        orderBy: { createdAt: 'desc' },
        take: 60,
      },
    },
  });

  if (!request) {
    return (
      <section className="space-y-6">
        <PageHeader title="Détail de demande" subtitle="Cette demande n'existe pas ou n'est pas liée à votre dossier." />
        <SectionCard>
          <EmptyState
            icon={<Music2 size={18} />}
            title="Demande introuvable"
            description="Vérifiez votre historique ou revenez à la liste des demandes."
            action={<Link href="/client/song-requests" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">Retour à la liste</Link>}
          />
        </SectionCard>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={request.title || request.occasion}
        subtitle="Détail complet de votre demande de chanson."
        actions={<Link href="/client/song-requests" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">Retour</Link>}
      />

      <SectionCard title="Statut" subtitle="Suivi de traitement">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-300">Mis à jour le {formatDateTime(request.updatedAt)}</p>
          <StatusBadge label={statusLabels[request.status]} tone={statusTone(request.status)} />
        </div>
      </SectionCard>

      <SectionCard title="Informations de la demande">
        <ClientSongRequestInfoEditor
          initial={{
            id: request.id,
            status: request.status,
            title: request.title,
            recipientName: request.recipientName,
            occasion: request.occasion,
            style: request.style,
            mood: request.mood,
            language: request.language,
            description: request.description,
            details: request.details,
            desiredDeadline: request.desiredDeadline ? new Date(String(request.desiredDeadline)).toISOString() : null,
          }}
          canEdit={!['QUOTED', 'DELIVERED', 'COMPLETED', 'DELETED'].includes(request.status)}
        />
      </SectionCard>

      <SectionCard title="Rencontre chanson" subtitle="Proposez une date et des détails de rencontre tant que la demande est modifiable.">
        <div className="mb-3 rounded-xl border border-slate-800 bg-slate-950/45 p-3 text-sm text-slate-300">
          Date de rencontre: {request.meetingDate ? formatDateTime(request.meetingDate) : 'Aucune date enregistree'}
        </div>
        <ClientSongRequestEditor
          initialItem={{
            id: request.id,
            status: request.status,
            title: request.title,
            description: request.description,
            details: request.details,
            meetingDate: request.meetingDate ? new Date(String(request.meetingDate)).toISOString() : null,
            startAt: request.startAt ? new Date(String(request.startAt)).toISOString() : null,
            endAt: request.endAt ? new Date(String(request.endAt)).toISOString() : null,
            durationMinutes: request.durationMinutes,
            meetingType: request.meetingType,
            location: request.location,
            meetingNotes: request.meetingNotes,
          }}
          canEditInitially={!['QUOTED', 'DELIVERED', 'COMPLETED', 'DELETED'].includes(request.status)}
        />
      </SectionCard>

      <SectionCard title="Fichiers du projet" subtitle="Deposez vos paroles, poemes, notes, demos et documents lies a cette demande.">
        <SongRequestFilesPanel
          mode="client"
          songRequestId={request.id}
          contactId={session.contactId}
          files={request.fileDocuments.map((file) => ({
            id: file.id,
            filename: file.filename,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            url: file.url,
            category: file.category,
            visibility: file.visibility,
            createdAt: file.createdAt.toISOString(),
          }))}
        />
      </SectionCard>
    </section>
  );
}
