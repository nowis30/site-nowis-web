import Link from 'next/link';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { EmptyState, ListToolbar, PageHeader, SectionCard, StatusBadge } from '@/features/client-portal/components/ui';
import { CalendarClock } from 'lucide-react';
import { prisma } from '@/lib/prisma';

type AppointmentsTab = 'all' | 'upcoming' | 'past';

function parseTab(input?: string): AppointmentsTab {
  return input === 'upcoming' || input === 'past' ? input : 'all';
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

const BOOKING_BASE_URL = process.env.NEXT_PUBLIC_BOOKING_CALENDAR_URL?.trim() || 'https://cal.com/simon-nowis-morin/30min';
const BOOKING_URL = BOOKING_BASE_URL.includes('?') ? `${BOOKING_BASE_URL}&embed=true` : `${BOOKING_BASE_URL}?embed=true`;

export default async function ClientAppointmentsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireClientPortalSession();
  const now = new Date();
  const resolvedSearchParams = (await searchParams) || {};
  const tab = parseTab(typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : undefined);

  const appointments = await prisma.appointment.findMany({
    where: {
      contactId: session.contactId,
      status: { not: 'CANCELLED' },
    },
    orderBy: { startAt: 'asc' },
    take: 100,
  });

  const upcoming = appointments.filter((appointment) => appointment.startAt >= now);
  const past = appointments.filter((appointment) => appointment.startAt < now).reverse();

  return (
    <section className="space-y-6">
      <PageHeader title="Rendez-vous" subtitle="Retrouvez vos rendez-vous à venir et l'historique passé." />

      <SectionCard title="Planning" subtitle="Filtrez rapidement pour voir uniquement ce qui vous intéresse.">
        <ListToolbar
          filters={[
            { label: 'Tous', href: '/client/appointments?tab=all', active: tab === 'all' },
            { label: 'À venir', href: '/client/appointments?tab=upcoming', active: tab === 'upcoming' },
            { label: 'Passés', href: '/client/appointments?tab=past', active: tab === 'past' },
          ]}
          actions={[
            { label: 'Voir tous mes rendez-vous', href: '/client/appointments' },
            { label: 'Prendre rendez-vous', href: BOOKING_URL },
          ]}
        />

        <div className="rounded-2xl border border-primary-500/25 bg-primary-500/10 p-4">
          <p className="text-sm text-primary-100">
            La prise de rendez-vous se fait uniquement sur les plages horaires libres de notre calendrier.
          </p>
          <Link
            href={BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-xl border border-primary-400/40 bg-primary-400/20 px-3 py-2 text-xs font-medium text-primary-100 transition hover:bg-primary-400/30"
          >
            Ouvrir le calendrier des disponibilités
          </Link>
        </div>

        {appointments.length === 0 ? (
          <EmptyState icon={<CalendarClock size={18} />} title="Aucun rendez-vous" description="Aucun rendez-vous planifié pour le moment." />
        ) : (
          <div className="space-y-6">
            {(tab === 'all' || tab === 'upcoming') ? <div id="upcoming" className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">À venir</p>
              {upcoming.length === 0 ? (
                <EmptyState icon={<CalendarClock size={18} />} title="Aucun rendez-vous à venir" description="Vos prochains créneaux apparaîtront ici." />
              ) : (
                upcoming.map((appointment) => (
                  <article key={appointment.id} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{appointment.title}</p>
                      <StatusBadge label={appointment.status} tone={appointment.status === 'CONFIRMED' ? 'success' : 'info'} />
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-200">{formatDateTime(appointment.startAt)}</p>
                    {appointment.description ? <p className="mt-2 text-sm text-slate-400">{appointment.description}</p> : null}
                    <p className="mt-2 text-xs text-slate-500">Dossier client sécurisé</p>
                  </article>
                ))
              )}
            </div> : null}

            {(tab === 'all' || tab === 'past') ? <div id="past" className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Passés</p>
              {past.length === 0 ? (
                <EmptyState icon={<CalendarClock size={18} />} title="Aucun rendez-vous passé" description="L'historique apparaîtra ici après vos premiers rendez-vous." />
              ) : (
                past.map((appointment) => (
                  <article key={appointment.id} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{appointment.title}</p>
                      <StatusBadge label={appointment.status} tone="neutral" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-200">{formatDateTime(appointment.startAt)}</p>
                    {appointment.description ? <p className="mt-2 text-sm text-slate-400">{appointment.description}</p> : null}
                  </article>
                ))
              )}
            </div> : null}
          </div>
        )}
      </SectionCard>
    </section>
  );
}
