import { SongRequestStatus } from '@prisma/client';
import Link from 'next/link';
import { Music2 } from 'lucide-react';

import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { EmptyState, ListToolbar, PageHeader, SectionCard, StatusBadge } from '@/features/client-portal/components/ui';
import { prisma } from '@/lib/prisma';

const statusLabels: Record<SongRequestStatus, string> = {
  NEW: 'Nouvelle',
  CONTACTED: 'Contactee',
  QUOTED: 'Devis envoye',
  IN_PROGRESS: 'En cours',
  IN_PRODUCTION: 'En production',
  DELIVERED: 'Livree',
  COMPLETED: 'Terminee',
  CANCELLED: 'Annulee',
  DELETED: 'Supprimee',
};

function statusTone(status: SongRequestStatus): 'warning' | 'info' | 'success' | 'danger' {
  if (status === 'NEW' || status === 'CONTACTED') return 'warning';
  if (status === 'IN_PROGRESS' || status === 'IN_PRODUCTION' || status === 'QUOTED') return 'info';
  if (status === 'DELIVERED' || status === 'COMPLETED') return 'success';
  return 'danger';
}

type SongRequestTab = 'all' | 'open' | 'done' | 'cancelled';

function parseTab(input?: string): SongRequestTab {
  if (input === 'open' || input === 'done' || input === 'cancelled') return input;
  return 'all';
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(value);
}

export default async function ClientSongRequestsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireClientPortalSession();
  const resolvedSearchParams = (await searchParams) || {};
  const tab = parseTab(typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : undefined);

  const requests = await prisma.songRequest.findMany({
    where: { contactId: session.contactId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      title: true,
      occasion: true,
      recipientName: true,
      status: true,
      budget: true,
      desiredDeadline: true,
      meetingDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const filteredRequests = requests.filter((request) => {
    if (tab === 'open') return request.status !== 'DELIVERED' && request.status !== 'COMPLETED' && request.status !== 'CANCELLED';
    if (tab === 'done') return request.status === 'DELIVERED' || request.status === 'COMPLETED';
    if (tab === 'cancelled') return request.status === 'CANCELLED';
    return true;
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Demandes chanson"
        subtitle="Suivez vos demandes musicales, consultez leur statut et ouvrez le détail de chaque dossier."
        actions={<Link href="/client/song-requests/nouveau" className="rounded-xl border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-100 transition hover:bg-primary-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">Nouvelle demande</Link>}
      />

      <SectionCard title="Historique" subtitle="Demandes filtrées sur votre dossier client uniquement.">
        <ListToolbar
          filters={[
            { label: 'Toutes', href: '/client/song-requests?tab=all', active: tab === 'all' },
            { label: 'En cours', href: '/client/song-requests?tab=open', active: tab === 'open' },
            { label: 'Terminées', href: '/client/song-requests?tab=done', active: tab === 'done' },
            { label: 'Annulées', href: '/client/song-requests?tab=cancelled', active: tab === 'cancelled' },
          ]}
          actions={[{ label: 'Nouvelle demande', href: '/client/song-requests/nouveau' }]}
        />

        {filteredRequests.length === 0 ? (
          <EmptyState icon={<Music2 size={18} />} title="Aucune demande de chanson" description="Commencez par créer votre première demande musicale." action={<Link href="/client/song-requests/nouveau" className="rounded-xl border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-100 transition hover:bg-primary-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">Nouvelle demande</Link>} />
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <Link
                key={request.id}
                href={`/client/song-requests/${request.id}`}
                className="block rounded-2xl border border-slate-800 bg-slate-950/45 p-4 sm:p-5 transition hover:border-primary-500/30 hover:bg-slate-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
              >
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-white">{request.title || request.occasion}</p>
                  <StatusBadge label={statusLabels[request.status]} tone={statusTone(request.status)} />
                </div>
                {request.recipientName ? (
                  <p className="mt-1 text-sm text-slate-400">Pour : <span className="text-slate-300">{request.recipientName}</span></p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">{formatDate(request.createdAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </section>
  );
}