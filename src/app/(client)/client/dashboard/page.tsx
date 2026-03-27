import Link from 'next/link';
import { CalendarClock, FileText, Inbox, MessagesSquare } from 'lucide-react';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { EmptyState, PageHeader, PortalStatCard, QuickActions, SectionCard, StatusBadge } from '@/features/client-portal/components/ui';
import { safeListMessages } from '@/lib/messages-store';
import { prisma } from '@/lib/prisma';

function formatDate(value: Date | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(value);
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(value));
}

export default async function ClientDashboardPage() {
  const session = await requireClientPortalSession();

  const [contact, messages] = await Promise.all([
    prisma.contact.findUnique({
    where: { id: session.contactId },
    include: {
      tenantProfile: {
        include: {
          unit: { include: { property: true } },
          leases: { orderBy: { startDate: 'desc' }, take: 5 },
          payments: { orderBy: { dueDate: 'asc' }, take: 8 },
        },
      },
      appointments: {
        where: { status: { not: 'CANCELLED' } },
        orderBy: { startAt: 'asc' },
        take: 8,
      },
      invoices: { orderBy: { dueDate: 'asc' }, take: 8 },
      activities: { orderBy: { createdAt: 'desc' }, take: 12 },
      songRequests: { orderBy: { createdAt: 'desc' }, take: 6 },
    },
    }),
    safeListMessages(session.contactId),
  ]);

  if (!contact) {
    return <div className="crm-surface p-8 text-sm text-slate-300">Votre dossier n'est pas disponible.</div>;
  }

  const documents = await prisma.fileDocument.findMany({
    where: {
      contactId: contact.id,
      visibility: 'CLIENT_VISIBLE',
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const nextPayment = contact.tenantProfile?.payments.find((payment) => payment.status === 'PENDING' || payment.status === 'LATE') || null;
  const unreadPortalMessages = messages.filter((item) => item.senderType === 'ADMIN' && !item.isRead).length;
  const upcomingAppointments = contact.appointments.filter((appointment) => appointment.startAt >= new Date());
  const recentMessages = messages.slice(0, 5);
  const recentDocuments = documents.slice(0, 5);
  const recentSongRequests = contact.songRequests.slice(0, 5);

  return (
    <section className="space-y-6">
      <PageHeader
        title={`Bonjour ${contact.fullName}`}
        subtitle="Bienvenue dans votre espace client. Cette page centralise les prochaines étapes, votre suivi musical, vos rendez-vous, vos messages et vos documents."
      />

      <SectionCard title="Actions rapides" subtitle="Accéder immédiatement aux fonctions principales du portail.">
        <QuickActions
          items={[
            { label: 'Voir mes demandes de chanson', description: 'Historique et statuts', href: '/client/song-requests' },
            { label: 'Voir mes rendez-vous', description: 'Planning à venir et passé', href: '/client/appointments' },
            { label: 'M\'envoyer un message', description: 'Contacter directement Nowis', href: '/client/messages' },
            { label: 'Télécharger mes documents', description: 'Baux, factures, pièces', href: '/client/documents' },
          ]}
        />
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-4">
        <PortalStatCard
          label="Dossier"
          value={contact.tenantProfile?.unit ? contact.tenantProfile.unit.unitNumber : 'Client'}
          hint={contact.tenantProfile?.unit?.property?.name || 'Suivi personnalisé'}
        />
        <PortalStatCard
          label="Prochain paiement"
          value={nextPayment ? formatMoney(Number(nextPayment.amount)) : '—'}
          hint={nextPayment ? `Échéance ${formatDate(nextPayment.dueDate)}` : 'Aucun paiement en attente'}
        />
        <PortalStatCard label="Documents" value={documents.length} hint="Bail, factures et pièces de dossier" />
        <PortalStatCard label="Rendez-vous" value={contact.appointments.length} hint="Événements planifiés avec Nowis" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          <SectionCard title="Résumé du dossier" subtitle="Coordonnées et affectation actuelle">
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <p className="text-xs text-slate-500">Email</p>
                <p className="mt-2 text-sm text-white">{contact.email || '—'}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <p className="text-xs text-slate-500">Téléphone</p>
                <p className="mt-2 text-sm text-white">{contact.phone || '—'}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <p className="text-xs text-slate-500">Immeuble</p>
                <p className="mt-2 text-sm text-white">{contact.tenantProfile?.unit?.property?.name || '—'}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <p className="text-xs text-slate-500">Unité</p>
                <p className="mt-2 text-sm text-white">{contact.tenantProfile?.unit?.unitNumber || '—'}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Documents récents"
            subtitle="Vos derniers fichiers disponibles"
            actions={<Link href="/client/documents" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">Tout voir</Link>}
          >
            <div className="mt-6 space-y-3">
              {recentDocuments.length === 0 ? (
                <EmptyState icon={<FileText size={18} />} title="Aucun document disponible" description="Vos prochains documents apparaîtront ici." />
              ) : (
                recentDocuments.map((document) => (
                  <a key={document.id} href={document.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">
                    <span>{document.originalName}</span>
                    <span className="text-xs text-slate-500">{formatDate(document.createdAt)}</span>
                  </a>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Derniers messages"
            subtitle="Votre conversation avec Nowis"
            actions={
              <Link href="/client/messages" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">
                Ouvrir
                {unreadPortalMessages > 0 ? <StatusBadge label={`${unreadPortalMessages} non lus`} tone="warning" /> : null}
              </Link>
            }
          >
            <div className="mt-6 space-y-3">
              {recentMessages.length === 0 ? (
                <EmptyState icon={<MessagesSquare size={18} />} title="Aucun message" description="Envoyez un premier message à votre gestionnaire Nowis." />
              ) : (
                [...recentMessages.map((item) => ({
                  id: item.id,
                  title: item.senderType === 'ADMIN' ? 'Message Nowis' : 'Votre message',
                  body: item.content,
                  date: item.createdAt,
                  kind: item.senderType === 'ADMIN' ? 'Nowis' : 'Client',
                  isRead: item.isRead,
                })), ...contact.activities.filter((item) => item.type === 'MESSAGE').map((item) => ({
                  id: `activity-${item.id}`,
                  title: item.title,
                  body: item.description || '',
                  date: item.createdAt,
                  kind: item.type,
                  isRead: true,
                }))].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 12).map((entry) => (
                  <article key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{entry.title}</p>
                      <span className="text-xs text-slate-500">{formatDateTime(entry.date)}</span>
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{entry.kind}</p>
                    {entry.body ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{entry.body}</p> : null}
                    {!entry.isRead && entry.kind === 'Nowis' ? <div className="mt-2"><StatusBadge label="Non lu" tone="warning" /></div> : null}
                  </article>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Prochaines étapes" subtitle="Éléments à suivre dans votre dossier">
            <div className="mt-6 space-y-3">
              {nextPayment ? (
                <article className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                  <p className="text-sm font-medium text-white">Prochain paiement</p>
                  <p className="mt-2 text-sm text-slate-300">{formatMoney(Number(nextPayment.amount))} · échéance {formatDate(nextPayment.dueDate)}</p>
                </article>
              ) : (
                <article className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                  <p className="text-sm font-medium text-white">Paiements</p>
                  <p className="mt-2 text-sm text-slate-300">Aucun paiement en attente.</p>
                </article>
              )}

              {recentSongRequests.length > 0 ? (
                <article className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">Demandes de chanson récentes</p>
                    <Link href="/client/song-requests" className="text-xs font-medium text-primary-300 hover:text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">Voir tout</Link>
                  </div>
                  <div className="mt-3 space-y-2">
                    {recentSongRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex items-center justify-between gap-3 text-sm text-slate-300">
                        <span className="truncate">{request.title || request.occasion}</span>
                        <span className="text-xs text-slate-500">{formatDate(request.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title="Prochains rendez-vous"
            subtitle="Votre planning à venir"
            actions={<Link href="/client/appointments" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">Tout voir</Link>}
          >
            <div className="mt-6 space-y-3">
              {upcomingAppointments.length === 0 ? (
                <EmptyState icon={<CalendarClock size={18} />} title="Aucun rendez-vous à venir" description="Les prochains créneaux apparaîtront ici." />
              ) : (
                upcomingAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{appointment.title}</p>
                      <StatusBadge label={appointment.status} tone={appointment.status === 'CONFIRMED' ? 'success' : 'info'} />
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{formatDateTime(appointment.startAt)}</p>
                    {appointment.description ? <p className="mt-2 text-sm text-slate-400">{appointment.description}</p> : null}
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </section>
  );
}