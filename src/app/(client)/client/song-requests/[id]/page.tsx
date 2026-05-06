import Link from 'next/link';
import { SongRequestStatus } from '@prisma/client';
import { Music2 } from 'lucide-react';

import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { EmptyState, PageHeader, SectionCard, StatusBadge } from '@/features/client-portal/components/ui';
import { ClientSongRequestInfoEditor } from '@/features/client-portal/components/song-requests/ClientSongRequestInfoEditor';
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

const CLIENT_EDITABLE_STATUSES = new Set<SongRequestStatus>(['NEW', 'CONTACTED', 'IN_PROGRESS', 'IN_PRODUCTION']);

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
      occasion: true,
      style: true,
      mood: true,
      description: true,
      lyrics: true,
      specialMessage: true,
      details: true,
      desiredDeadline: true,
      status: true,
      convertedInvoiceId: true,
      archivedAt: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
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

  const canEdit =
    CLIENT_EDITABLE_STATUSES.has(request.status)
    && !request.convertedInvoiceId
    && !request.archivedAt
    && !request.deletedAt;

  return (
    <section className="space-y-6">
      <PageHeader
        title={request.title || request.occasion}
        subtitle="Consultez et modifiez votre demande."
        actions={<Link href="/client/song-requests" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">Retour</Link>}
      />

      <SectionCard title="Statut" subtitle="Suivi de traitement">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-slate-300">
            <p>Creee le {formatDateTime(request.createdAt)}</p>
            <p>Modifiee le {formatDateTime(request.updatedAt)}</p>
          </div>
          <StatusBadge label={statusLabels[request.status]} tone={statusTone(request.status)} />
        </div>
      </SectionCard>

      <SectionCard title="Informations de la demande">
        <ClientSongRequestInfoEditor
          initial={{
            id: request.id,
            title: request.title,
            musicStyle: request.style,
            mood: request.mood,
            description: request.description,
            lyrics: request.lyrics,
            clientNotes: request.details,
            clientMessage: request.specialMessage,
            desiredDeadline: request.desiredDeadline ? new Date(String(request.desiredDeadline)).toISOString() : null,
          }}
          canEdit={canEdit}
        />
      </SectionCard>
    </section>
  );
}
