import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { PageHeader } from '@/features/client-portal/components/ui';
import { prisma } from '@/lib/prisma';
import { ClientWorkshopRequestEditor } from '@/features/client-portal/components/workshops/ClientWorkshopRequestEditor';

const CLIENT_EDITABLE_STATUSES = new Set(['BROUILLON', 'NEW', 'CONTACTED', 'EN_ATTENTE_RDV', 'RDV_PLANIFIE', 'SCHEDULED']);

export default async function ClientWorkshopDetailPage({ params }: { params: { id: string } }) {
  const session = await requireClientPortalSession();

  const item = await prisma.workshopRequest.findFirst({
    where: {
      id: params.id,
      OR: [
        { contactId: session.contactId },
        { clientId: session.contactId },
      ],
    },
    select: {
      id: true,
      title: true,
      objectives: true,
      notes: true,
      participantEstimate: true,
      estimatedParticipants: true,
      location: true,
      requestedDate: true,
      requestedTime: true,
      durationMinutes: true,
      meetingType: true,
      contactPerson: true,
      contactPhone: true,
      contactEmail: true,
      status: true,
    },
  });

  if (!item) notFound();

  return (
    <section className="space-y-6">
      <PageHeader
        title={item.title}
        subtitle="Voir et modifier votre demande d'atelier selon son statut."
        actions={<Link href="/client/workshops" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white">Retour</Link>}
      />

      <ClientWorkshopRequestEditor
        initialItem={{
          ...item,
          requestedDate: item.requestedDate ? item.requestedDate.toISOString() : null,
        }}
        canEditInitially={CLIENT_EDITABLE_STATUSES.has(item.status)}
      />
    </section>
  );
}
