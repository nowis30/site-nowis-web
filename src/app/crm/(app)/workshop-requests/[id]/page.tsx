import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { notFound } from 'next/navigation';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { CrmDetailCard } from '@/features/crm/components/shared/CrmDetailCard';
import { StatusBadge } from '@/features/crm/components/shared/StatusBadge';

type WorkshopRequestDetailRecord = Prisma.WorkshopRequestGetPayload<{
  include: {
    organization: true;
    contact: true;
    organizationContact: true;
    appointments: true;
  };
}>;

function formatDate(value: Date | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(value);
}

function buildCalendarCreateHref(item: WorkshopRequestDetailRecord) {
  const start = item.requestedDate ? new Date(item.requestedDate) : new Date();
  if (!item.requestedDate) {
    start.setDate(start.getDate() + 1);
  }
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  const params = new URLSearchParams({
    title: `Atelier - ${item.organization?.name || item.organizationName || item.title}`,
    description: `Suivi de la demande atelier: ${item.workshopTheme}`,
    type: 'MEETING',
    status: 'PENDING',
    startAt: start.toISOString(),
    endAt: end.toISOString(),
  });

  if (item.contactId) {
    params.set('contactId', item.contactId);
  }

  return `/crm/calendar?${params.toString()}`;
}

export default async function WorkshopRequestDetailPage({ params }: { params: { id: string } }) {
  await requireCrmSession();

  let item: WorkshopRequestDetailRecord | null = null;
  try {
    item = await prisma.workshopRequest.findUnique({
      where: { id: params.id },
      include: {
        organization: true,
        contact: true,
        organizationContact: true,
        appointments: { orderBy: { startAt: 'asc' } },
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021')) {
      throw error;
    }
  }

  if (!item) notFound();

  const calendarCreateHref = buildCalendarCreateHref(item);

  return (
    <section className="space-y-6">
      <CrmDetailCard
        title={item.title}
        backHref="/crm/workshop-requests"
        backLabel="Demandes d’atelier"
        badge={<StatusBadge value={item.status} />}
        sections={[
          {
            title: 'Demande',
            fields: [
              { label: 'Organisation', value: item.organizationId && item.organization ? <Link href={`/crm/organizations/${item.organizationId}`} className="text-primary-300 hover:text-primary-200">{item.organization.name}</Link> : item.organizationName || '—' },
              { label: 'Contact', value: item.organizationContact?.fullName || item.contact?.fullName || '—' },
              { label: 'Contact direct', value: item.contactPerson || '—' },
              { label: 'Téléphone', value: item.contactPhone || '—' },
              { label: 'Courriel', value: item.contactEmail || '—' },
              { label: 'Public', value: <StatusBadge value={item.audienceType} /> },
              { label: 'Format', value: <StatusBadge value={item.deliveryFormat || item.format} /> },
              { label: 'Durée', value: item.durationPreset || '—' },
              { label: 'Prix final', value: item.finalPrice ? `${Number(item.finalPrice)} $` : '—' },
              { label: 'Lien client', value: item.clientAccessToken ? <a href={`/atelier/${item.clientAccessToken}`} target="_blank" rel="noreferrer" className="text-primary-300 hover:text-primary-200">Ouvrir la page client</a> : '—' },
              { label: 'Lien Calendly', value: item.calendlyUrl ? <a href={item.calendlyUrl} target="_blank" rel="noreferrer" className="text-primary-300 hover:text-primary-200">Ouvrir le lien de planification</a> : '—' },
              { label: 'Date souhaitée', value: formatDate(item.requestedDate) },
              { label: 'Créée le', value: formatDate(item.createdAt) },
            ],
          },
          {
            title: 'Contenu',
            fields: [
              { label: 'Thème', value: item.workshopTheme },
              { label: 'Tranche d’âge', value: item.ageRange || '—' },
              { label: 'Participants', value: item.estimatedParticipants ?? '—' },
              { label: 'Participants (atelier)', value: item.participantEstimate ?? '—' },
              { label: 'Jours préférés', value: item.preferredDays.join(', ') || '—' },
              { label: 'Lieu', value: item.addressOrLocation || item.location || '—' },
              { label: 'Plage préférée', value: item.requestedTime || '—' },
              { label: 'Objectifs', value: item.objectives },
              { label: 'Notes', value: item.notes || '—' },
              { label: 'Notes client', value: item.clientNotes || '—' },
              { label: 'Notes internes', value: item.internalNotes || '—' },
            ],
          },
        ]}
      />

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Rendez-vous atelier</h3>
          <Link href={calendarCreateHref} className="rounded-xl border border-primary-500/40 bg-primary-500/10 px-3 py-2 text-xs font-medium text-primary-300 hover:bg-primary-500/20">
            Ajouter au calendrier
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {item.appointments.length === 0 ? <p className="text-sm text-slate-400">Aucun rendez-vous atelier lié pour le moment.</p> : item.appointments.map((appointment: WorkshopRequestDetailRecord['appointments'][number]) => (
            <article key={appointment.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-200">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-white">{appointment.title}</p>
                <StatusBadge value={appointment.status} />
              </div>
              <p className="mt-2 text-slate-400">{new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(appointment.startAt)}</p>
              {appointment.location ? <p className="mt-1 text-slate-400">{appointment.location}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}