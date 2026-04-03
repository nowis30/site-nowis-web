import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { CalendarClock, FileText, Inbox, MessagesSquare } from 'lucide-react';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { EmptyState, PageHeader, PortalStatCard, QuickActions, SectionCard, StatusBadge } from '@/features/client-portal/components/ui';
import { safeListMessages } from '@/lib/messages-store';
import { prisma } from '@/lib/prisma';

const contactDashboardInclude = {
  appointments: {
    where: { status: { not: 'CANCELLED' as const } },
    orderBy: { startAt: 'asc' as const },
    take: 8,
  },
  invoices: { orderBy: { dueDate: 'asc' as const }, take: 8 },
  activities: { orderBy: { createdAt: 'desc' as const }, take: 12 },
  songRequests: { orderBy: { createdAt: 'desc' as const }, take: 6 },
} satisfies Prisma.ContactInclude;

type ContactDashboardRecord = Prisma.ContactGetPayload<{
  include: typeof contactDashboardInclude;
}>;

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

  let contact: ContactDashboardRecord | null = null;
  let messages: Awaited<ReturnType<typeof safeListMessages>> = [];
  let documents: Awaited<ReturnType<typeof prisma.fileDocument.findMany>> = [];

  try {
    [contact, messages] = await Promise.all([
      prisma.contact.findUnique({ where: { id: session.contactId }, include: contactDashboardInclude }),
      safeListMessages(session.contactId),
    ]);

    if (contact) {
      try {
        documents = await prisma.fileDocument.findMany({
          where: {
            contactId: contact.id,
            visibility: 'CLIENT_VISIBLE',
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
          // Compatibilite temporaire: certaines DB n'ont pas encore la table file_documents.
          documents = [];
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    const prismaCode = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
    console.error('[CLIENT_DASHBOARD]', {
      message: 'Failed to load client dashboard data',
      contactId: session.contactId,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      prismaCode,
      safeMessage: error instanceof Error ? error.message : 'Unexpected error',
    });

    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-amber-700/50 bg-amber-950/20 p-6">
          <h2 className="text-lg font-semibold text-white">Espace client temporairement indisponible</h2>
          <p className="mt-2 text-sm text-amber-100">
            Une erreur serveur est survenue pendant le chargement de votre tableau de bord. Réessayez dans quelques instants.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/client/dashboard" className="rounded-lg border border-amber-500/60 px-3 py-2 text-sm text-amber-100 hover:bg-amber-500/15">
              Réessayer
            </Link>
            <Link href="/client/messages" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/60">
              Ouvrir mes messages
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!contact) {
    return <div className="crm-surface p-8 text-sm text-slate-300">Votre dossier n'est pas disponible.</div>;
  }

  const unreadPortalMessages = messages.filter((item) => item.senderType === 'ADMIN' && !item.isRead).length;
  const upcomingAppointments = contact.appointments.filter((appointment) => appointment.startAt >= new Date());
  const recentMessages = messages.slice(0, 5);
  const recentDocuments = documents.slice(0, 5);
  const recentSongRequests = contact.songRequests.slice(0, 5);
  const nextAppointment = upcomingAppointments[0] || null;

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
            { label: 'Télécharger mes documents', description: 'Contrats, factures et fichiers partagés', href: '/client/documents' },
          ]}
        />
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-4">
        <PortalStatCard
          label="Profil"
          value="Client"
          hint={contact.fullName || 'Suivi personnalisé'}
        />
        <PortalStatCard
          label="Prochain rendez-vous"
          value={nextAppointment ? formatDate(nextAppointment.startAt) : '—'}
          hint={nextAppointment ? nextAppointment.title : 'Aucun rendez-vous planifié'}
        />
        <PortalStatCard label="Documents" value={documents.length} hint="Contrats, factures et fichiers partagés" />
        <PortalStatCard label="Demandes" value={contact.songRequests.length} hint="Demandes créatives suivies dans le portail" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          <SectionCard title="Résumé du dossier" subtitle="Coordonnées et informations de contact">
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <p className="text-xs text-slate-500">Email</p>
                <p className="mt-2 text-sm text-white">{contact.email || '—'}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <p className="text-xs text-slate-500">Téléphone</p>
                <p className="mt-2 text-sm text-white">{contact.phone || '—'}</p>
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
                  <a key={document.id} href={document.url} target="_blank" rel="noreferrer" className="flex flex-col items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 sm:flex-row sm:items-center sm:justify-between">
                    <span className="break-all">{document.originalName}</span>
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
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
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
              <article className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <p className="text-sm font-medium text-white">Messages non lus</p>
                <p className="mt-2 text-sm text-slate-300">{unreadPortalMessages > 0 ? `${unreadPortalMessages} message(s) Nowis à lire.` : 'Aucun message en attente.'}</p>
              </article>

              {recentSongRequests.length > 0 ? (
                <article className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-white">Demandes de chanson récentes</p>
                    <Link href="/client/song-requests" className="text-xs font-medium text-primary-300 hover:text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">Voir tout</Link>
                  </div>
                  <div className="mt-3 space-y-2">
                    {recentSongRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex flex-col items-start gap-1 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <span className="max-w-full break-words">{request.title || request.occasion}</span>
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
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
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