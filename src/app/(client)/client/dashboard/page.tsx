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
      <section className="space-y-4">
        <div className="rounded-2xl border border-amber-700/50 bg-amber-950/20 p-6">
          <h2 className="text-lg font-semibold text-white">Espace client temporairement indisponible</h2>
          <p className="mt-2 text-sm text-amber-100">Une erreur serveur est survenue pendant le chargement du portail. Réessayez dans quelques instants.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/client/dashboard" className="rounded-lg border border-amber-500/60 px-3 py-2 text-sm text-amber-100 hover:bg-amber-500/15">Réessayer</Link>
            <a href={OUTLOOK_MESSAGE_URL} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/60">Envoyer un message</a>
          </div>
        </div>
      </section>
    );
  }

  if (!contact) {
    return <div className="crm-surface p-8 text-sm text-slate-300">Votre dossier n'est pas disponible.</div>;
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
        subtitle="Portail client simplifié: vos actions essentielles, vos demandes, vos documents et vos rendez-vous."
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
          <a href={MAILTO_MESSAGE_URL} className="text-xs text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline">Si Outlook ne s’ouvre pas, utilisez le courriel de secours.</a>
        </div>
      </SectionCard>

      {profileIncomplete ? (
        <SectionCard title="Completer votre profil" subtitle="Vos coordonnees aident a traiter vos demandes plus vite.">
          <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            <p>Votre dossier est incomplet: telephone, adresse de facturation ou adresse postale manquante.</p>
            <Link href="/client/profil" className="mt-3 inline-flex rounded-xl border border-amber-300/50 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/20 hover:text-white">Completer mes informations</Link>
          </div>
        </SectionCard>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <PortalStatCard label="Profil" value="Client" hint={contact.fullName || 'Suivi personnalisé'} />
        <PortalStatCard label="Prochain rendez-vous" value={nextAppointment ? formatDate(nextAppointment.startAt) : '—'} hint={nextAppointment ? nextAppointment.title : 'Aucun rendez-vous planifié'} />
        <PortalStatCard label="Documents" value={documents.length} hint="Contrats, factures et fichiers partagés" />
        <PortalStatCard label="Demandes" value={contact.songRequests.length} hint="Demandes suivies dans le portail" />
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
                  <a key={document.id} href={`/api/client-portal/file-documents/${document.id}/download`} target="_blank" rel="noreferrer" className="flex flex-col items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 sm:flex-row sm:items-center sm:justify-between">
                    <span className="break-all">{document.originalName}</span>
                    <span className="text-xs text-slate-500">{formatDate(document.createdAt)}</span>
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
                <p className="mt-2 text-sm text-slate-300">Besoin d’un ajustement? Envoyez un courriel direct à Nowis.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={OUTLOOK_MESSAGE_URL} target="_blank" rel="noreferrer" className="rounded-lg border border-primary-500/40 bg-primary-500/10 px-3 py-2 text-xs font-medium text-primary-100">Envoyer un message</a>
                  <a href={MAILTO_MESSAGE_URL} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">Fallback courriel</a>
                </div>
              </article>

              {recentSongRequests.length > 0 ? (
                <article className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-white">Demandes récentes</p>
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
              ) : (
                <EmptyState icon={<Inbox size={18} />} title="Aucune demande récente" description="Créez votre première demande pour démarrer." />
              )}
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

          <SectionCard title="Mes ateliers" subtitle="Suivi rapide de vos demandes d’atelier.">
            <Link href="/client/workshops" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-primary-500/40 hover:text-white">
              <Sparkles size={16} /> Ouvrir mes ateliers
            </Link>
          </SectionCard>
        </div>
      </div>
    </section>
  );
}
