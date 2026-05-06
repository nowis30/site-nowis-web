import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { CalendarClock, Sparkles } from 'lucide-react';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { EmptyState, ListToolbar, PageHeader, SectionCard, StatusBadge } from '@/features/client-portal/components/ui';
import { prisma } from '@/lib/prisma';

const OUTLOOK_MESSAGE_URL = 'https://outlook.office.com/mail/deeplink/compose?to=simonmorin@nowis.store&subject=Demande%20depuis%20le%20portail%20client';
const MAILTO_MESSAGE_URL = 'mailto:simonmorin@nowis.store?subject=Demande%20depuis%20le%20portail%20client';

function formatDate(value: Date | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(value);
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

const CLIENT_EDITABLE_STATUSES = new Set(['BROUILLON', 'NEW', 'CONTACTED', 'EN_ATTENTE_RDV', 'RDV_PLANIFIE', 'SCHEDULED']);

export default async function ClientWorkshopsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = (await searchParams) || {};
  const deleted = typeof resolvedSearchParams.deleted === 'string' ? resolvedSearchParams.deleted : undefined;
  const session = await requireClientPortalSession();

  let requests = [] as Array<{
    id: string;
    title: string;
    workshopTheme: string;
    status: string;
    scheduledAt: Date | null;
    requestedDate: Date | null;
    requestedTime: string | null;
    format: string;
    organization: { name: string } | null;
    organizationName: string | null;
    appointments: Array<{ id: string; title: string; startAt: Date; status: string; location: string | null }>;
  }>;

  try {
    requests = await prisma.workshopRequest.findMany({
      where: {
        OR: [
          { contactId: session.contactId },
          { clientId: session.contactId },
        ],
      },
      include: {
        organization: { select: { name: true } },
        appointments: {
          select: { id: true, title: true, startAt: true, status: true, location: true },
          orderBy: { startAt: 'asc' },
          take: 6,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021')) {
      throw error;
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Ateliers" subtitle="Suivez vos demandes d’atelier, les rendez-vous confirmés et les prochaines étapes avec Nowis." />

      {deleted === '1' ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Demande supprimée avec succès.
        </div>
      ) : null}

      <SectionCard title="Actions" subtitle="Démarrer une nouvelle demande d'atelier depuis votre portail sécurisé.">
        <ListToolbar
          filters={[{ label: 'Toutes les demandes', href: '/client/workshops', active: true }]}
          actions={[
            { label: 'Demander un atelier', href: '/client/workshops/nouveau' },
            { label: 'Voir mes rendez-vous', href: '/client/appointments' },
          ]}
        />
      </SectionCard>

      <SectionCard title="Mes demandes d’atelier" subtitle="Historique des demandes et statut actuel.">
        {requests.length === 0 ? (
          <EmptyState icon={<Sparkles size={18} />} title="Aucune demande d’atelier" description="Vos demandes d’atelier apparaîtront ici dès leur création." />
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{request.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{request.organization?.name || request.organizationName || 'Atelier'} · {request.workshopTheme}</p>
                  </div>
                  <StatusBadge label={request.status} tone={request.status === 'COMPLETED' ? 'success' : request.status === 'CANCELLED' ? 'danger' : 'info'} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-slate-300">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Date souhaitée</p>
                    <p className="mt-1">{formatDate(request.requestedDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Plage</p>
                    <p className="mt-1">{request.requestedTime || 'À confirmer'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Format</p>
                    <p className="mt-1">{request.format}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/35 p-3 text-sm text-slate-300">
                  {request.scheduledAt
                    ? `Date prevue: ${formatDateTime(request.scheduledAt)}`
                    : 'En attente de planification'}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/client/workshops/${request.id}`} className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white">Voir</Link>
                  {CLIENT_EDITABLE_STATUSES.has(request.status) ? (
                    <Link href={`/client/workshops/${request.id}`} className="rounded-xl border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-100 transition hover:bg-primary-500/20">Modifier</Link>
                  ) : (
                    <a href={OUTLOOK_MESSAGE_URL} target="_blank" rel="noreferrer" className="rounded-xl border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-100 transition hover:bg-primary-500/20">Envoyer un message</a>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rendez-vous liés</p>
                  {request.appointments.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-400">Aucun rendez-vous atelier confirmé pour le moment.</div>
                  ) : request.appointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-white">{appointment.title}</p>
                        <StatusBadge label={appointment.status} tone={appointment.status === 'CONFIRMED' || appointment.status === 'DONE' ? 'success' : 'info'} />
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{formatDateTime(appointment.startAt)}</p>
                      {appointment.location ? <p className="mt-1 text-sm text-slate-400">{appointment.location}</p> : null}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Besoin d’ajuster un atelier" subtitle="Utilisez le courriel direct pour demander un changement de groupe, d’objectif ou de date.">
        <div className="rounded-2xl border border-primary-500/25 bg-primary-500/10 p-4">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <CalendarClock className="text-primary-200" size={18} />
              <p className="text-sm text-primary-50">Pour toute mise à jour logistique, envoyez un courriel à Nowis. Outlook est prioritaire et un lien mailto est disponible en secours.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={OUTLOOK_MESSAGE_URL} target="_blank" rel="noreferrer" className="rounded-xl border border-primary-400/40 bg-primary-400/15 px-3 py-2 text-xs font-medium text-primary-100 transition hover:bg-primary-400/25">Envoyer un message</a>
              <a href={MAILTO_MESSAGE_URL} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200 transition hover:border-primary-500/40 hover:text-white">Fallback courriel</a>
            </div>
          </div>
        </div>
      </SectionCard>
    </section>
  );
}