import Link from 'next/link';
import { SongRequestStatus } from '@prisma/client';
import { FileMusic, Music2 } from 'lucide-react';

import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { EmptyState, PageHeader, SectionCard, StatusBadge } from '@/features/client-portal/components/ui';
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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(value);
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

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Informations principales">
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <p className="break-words rounded-xl border border-slate-800 bg-slate-950/45 p-3">Destinataire: <span className="font-medium text-slate-100">{request.recipientName}</span></p>
            <p className="break-words rounded-xl border border-slate-800 bg-slate-950/45 p-3">Type: <span className="font-medium text-slate-100">{request.songType}</span></p>
            <p className="break-words rounded-xl border border-slate-800 bg-slate-950/45 p-3">Occasion: <span className="font-medium text-slate-100">{request.occasion}</span></p>
            <p className="break-words rounded-xl border border-slate-800 bg-slate-950/45 p-3">Style: <span className="font-medium text-slate-100">{request.style}</span></p>
            <p className="break-words rounded-xl border border-slate-800 bg-slate-950/45 p-3">Ambiance: <span className="font-medium text-slate-100">{request.mood}</span></p>
            <p className="break-words rounded-xl border border-slate-800 bg-slate-950/45 p-3">Langue: <span className="font-medium text-slate-100">{request.language || '—'}</span></p>
            <p className="break-words rounded-xl border border-slate-800 bg-slate-950/45 p-3">Budget: <span className="font-medium text-slate-100">{request.budget ? Number(request.budget).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }) : '—'}</span></p>
            <p className="break-words rounded-xl border border-slate-800 bg-slate-950/45 p-3">Date souhaitée: <span className="font-medium text-slate-100">{request.desiredDeadline ? formatDate(request.desiredDeadline) : '—'}</span></p>
          </div>
        </SectionCard>

        <SectionCard title="Coordonnées de la demande">
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <p className="break-words rounded-xl border border-slate-800 bg-slate-950/45 p-3">Nom: <span className="font-medium text-slate-100">{request.fullName}</span></p>
            <p className="break-words rounded-xl border border-slate-800 bg-slate-950/45 p-3">Email: <span className="font-medium break-all text-slate-100">{request.email}</span></p>
            <p className="break-words rounded-xl border border-slate-800 bg-slate-950/45 p-3">Téléphone: <span className="font-medium text-slate-100">{request.phone}</span></p>
            <p className="break-words rounded-xl border border-slate-800 bg-slate-950/45 p-3">Créée le: <span className="font-medium text-slate-100">{formatDateTime(request.createdAt)}</span></p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Brief">
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 text-sm leading-7 text-slate-300">
          <div className="mb-1 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-slate-400">
            <FileMusic size={14} /> Dossier créatif
          </div>
          {request.description ? <p>{request.description}</p> : null}
          {request.details ? <p>{request.details}</p> : null}
          {!request.description && !request.details ? <EmptyState icon={<Music2 size={18} />} title="Aucun brief fourni" description="Aucun détail supplémentaire n'a été saisi pour cette demande." /> : null}
        </div>
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
