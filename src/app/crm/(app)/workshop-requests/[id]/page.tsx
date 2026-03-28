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
              { label: 'Organisation', value: <Link href={`/crm/organizations/${item.organizationId}`} className="text-primary-300 hover:text-primary-200">{item.organization.name}</Link> },
              { label: 'Contact', value: item.organizationContact?.fullName || item.contact?.fullName || '—' },
              { label: 'Public', value: <StatusBadge value={item.audienceType} /> },
              { label: 'Format', value: <StatusBadge value={item.format} /> },
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
              { label: 'Jours préférés', value: item.preferredDays.join(', ') || '—' },
              { label: 'Lieu', value: item.location || '—' },
              { label: 'Plage préférée', value: item.requestedTime || '—' },
              { label: 'Objectifs', value: item.objectives },
              { label: 'Notes', value: item.notes || '—' },
            ],
          },
        ]}
      />

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-lg font-semibold text-white">Rendez-vous atelier</h3>
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