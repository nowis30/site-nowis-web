import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { CalendarClock, FileText, Inbox, Sparkles } from 'lucide-react';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { EmptyState, PageHeader, PortalStatCard, QuickActions, SectionCard, StatusBadge } from '@/features/client-portal/components/ui';
import { isClientProfileIncomplete } from '@/features/client-portal/profile';
import { prisma } from '@/lib/prisma';

const OUTLOOK_MESSAGE_URL = 'https://outlook.office.com/mail/deeplink/compose?to=simonmorin@nowis.store&subject=Demande%20depuis%20le%20portail%20client';
const MAILTO_MESSAGE_URL = 'mailto:simonmorin@nowis.store?subject=Demande%20depuis%20le%20portail%20client';

const contactDashboardInclude = {
  appointments: {
    where: { status: { not: 'CANCELLED' as const } },
    orderBy: { startAt: 'asc' as const },
    take: 8,
  },
  invoices: { orderBy: { dueDate: 'asc' as const }, take: 8 },
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

export default async function ClientDashboardPage() {
  const session = await requireClientPortalSession();

  let contact: ContactDashboardRecord | null = null;
  let documents: Awaited<ReturnType<typeof prisma.fileDocument.findMany>> = [];

  try {
    contact = await prisma.contact.findUnique({ where: { id: session.contactId }, include: contactDashboardInclude });

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
          documents = [];
        } else {
          throw error;
        }
      }
    }
  } catch {
    return (
      <section className="space-y-4" aria-labelledby="client-dashboard-error-title">
        <div className="rounded-3xl border border-amber-500/35 bg-amber-500/10 p-5 shadow-lg shadow-black/10 sm:p-6" role="alert">
          <h2 id="client-dashboard-error-title" className="text-lg font-semibold text-white">Espace client temporairement indisponible</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-100">Une erreur serveur est survenue pendant le chargement du portail. Réessayez dans quelques instants.</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link href="/client/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-400/60 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 motion-reduce:transition-none">Réessayer</Link>
            <a href={OUTLOOK_MESSAGE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none">Envoyer un message</a>
          </div>
        </div>
      </section>
    );
  }

  if (!contact) {
    return (
      <section aria-labelledby="client-dashboard-missing-title">
        <div className="crm-surface p-6 sm:p-8" role="status">
          <h2 id="client-dashboard-missing-title" className="text-lg font-semibold text-white">Dossier client indisponible</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Votre dossier n’est pas disponible pour le moment. Réessayez plus tard ou communiquez avec Nowis.</p>
        </div>
      </section>
    );
  }

  const profileIncomplete = isClientProfileIncomplete({ phone: contact.phone, notes: contact.notes, profileMeta: contact.profileMeta });
  const upcomingAppointments = contact.appointments.filter((appointment) => appointment.startAt >= new Date());
  const recentDocuments = documents.slice(0, 5);
  const recentSongRequests = contact.songRequests.slice(0, 5);
  const nextAppointment = upcomingAppointments[0] || null;

  return (
    <section className="space-y-6">
      <PageHeader
        title={`Bonjour ${contact.fullName}`}
        subtitle="Portail client simplifié : vos actions essentielles, vos demandes, vos documents et vos rendez-vous."
      />

      <SectionCard title="Actions principales" subtitle="Un accès rapide aux actions utiles du portail.">
        <QuickActions
          items={[
            { label: 'Faire une demande', description: 'Nouvelle demande de chanson', href: '/client/song-requests/nouveau' },
            { label: 'Voir mes ateliers', description: 'Demandes et statuts ateliers', href: '/client/workshops' },
            { label: 'Voir mes documents', description: 'Contrats, factures et fichiers', href: '/client/documents' },
            { label: 'Voir mes rendez-vous', description: 'Prochains créneaux', href: '/client/appointments' },
            { label: 'Envoyer un message', description: 'Contacter Nowis par courriel', href: OUTLOOK_MESSAGE_URL },
          ]}
        />
        <div className="mt-3">
          <a href={MAILTO_MESSAGE_URL} className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-medium text-slate-400 underline-offset-2 transition hover:text-slate-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none">Si Outlook ne s’ouvre pas, utiliser votre application de courriel.</a>
        </div>
      </SectionCard>

      {profileIncomplete ? (
        <SectionCard title="Compléter votre profil" subtitle="Vos coordonnées aident à traiter vos demandes plus vite.">
          <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100" role="status">
            <p>Votre dossier est incomplet : téléphone, adresse de facturation ou adresse postale manquante.</p>
            <Link href="/client/profil" className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-300/50 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 motion-reduce:transition-none">Compléter mes informations</Link>
          </div>
        </SectionCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard label="Profil" value="Client" hint={contact.fullName || 'Suivi personnalisé'} />
        <PortalStatCard label="Prochain rendez-vous" value={nextAppointment ? formatDate(nextAppointment.startAt) : '—'} hint={nextAppointment ? nextAppointment.title : 'Aucun rendez-vous planifié'} />
        <PortalStatCard label="Documents" value={documents.length} hint="Contrats, factures et fichiers partagés" />
        <PortalStatCard label="Demandes" value={contact.songRequests.length} hint="Demandes suivies dans le portail" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          <SectionCard title="Résumé du dossier" subtitle="Coordonnées et informations de contact">
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <dt className="text-xs font-medium text-slate-500">Courriel</dt>
                <dd className="mt-2 break-words text-sm text-white">{contact.email || '—'}</dd>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <dt className="text-xs font-medium text-slate-500">Téléphone</dt>
                <dd className="mt-2 break-words text-sm text-white">{contact.phone || '—'}</dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard
            title="Documents récents"
            subtitle="Vos derniers fichiers disponibles"
            actions={<Link href="/client/documents" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none">Tout voir</Link>}
          >
            <div className="mt-6 space-y-3">
              {recentDocuments.length === 0 ? (
                <EmptyState icon={<FileText size={18} />} title="Aucun document disponible" description="Vos prochains documents apparaîtront ici." />
              ) : (
                recentDocuments.map((document) => (
                  <a
                    key={document.id}
                    href={`/api/client-portal/file-documents/${document.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Télécharger ${document.originalName} dans un nouvel onglet`}
                    className="flex min-h-12 flex-col items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="max-w-full break-words">{document.originalName}</span>
                    <span className="shrink-0 text-xs text-slate-500">{formatDate(document.createdAt)}</span>
                  </a>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Prochaines étapes" subtitle="Éléments à suivre dans votre dossier">
            <div className="mt-6 space-y-3">
              <article className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                <p className="text-sm font-medium text-white">Contact rapide</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Besoin d’un ajustement? Envoyez un courriel direct à Nowis.</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <a href={OUTLOOK_MESSAGE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary-500/40 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-100 transition hover:border-primary-400/60 hover:bg-primary-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none">Envoyer un message</a>
                  <a href={MAILTO_MESSAGE_URL} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none">Autre application de courriel</a>
                </div>
              </article>

              {recentSongRequests.length > 0 ? (
                <article className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-white">Demandes récentes</p>
                    <Link href="/client/song-requests" className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-medium text-primary-300 transition hover:text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none">Voir tout</Link>
                  </div>
                  <div className="mt-3 space-y-2">
                    {recentSongRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex flex-col items-start gap-1 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <span className="max-w-full break-words">{request.title || request.occasion}</span>
                        <span className="shrink-0 text-xs text-slate-500">{formatDate(request.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ) : (
                <EmptyState icon={<Inbox size={18} />} title="Aucune demande récente" description="Créez votre première demande pour démarrer." />
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Prochains rendez-vous"
            subtitle="Votre planning à venir"
            actions={<Link href="/client/appointments" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none">Tout voir</Link>}
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
                    {appointment.description ? <p className="mt-2 text-sm leading-6 text-slate-400">{appointment.description}</p> : null}
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard title="Mes ateliers" subtitle="Suivi rapide de vos demandes d’atelier.">
            <Link href="/client/workshops" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none">
              <Sparkles size={16} aria-hidden="true" /> Ouvrir mes ateliers
            </Link>
          </SectionCard>
        </div>
      </div>
    </section>
  );
}
