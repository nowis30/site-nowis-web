import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

const DELETABLE_STATUSES = ['ANNULE', 'DELETED', 'CANCELLED', 'TERMINE', 'COMPLETED'];

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'workshopRequests', 'delete');
  if (guard.error) return guard.error;

  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Action réservée à un administrateur.' },
      { status: 403 },
    );
  }

  const item = await prisma.workshopRequest.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      status: true,
    },
  });

  if (!item) {
    return NextResponse.json({ error: 'Atelier introuvable.' }, { status: 404 });
  }

  if (!DELETABLE_STATUSES.includes(item.status)) {
    return NextResponse.json(
      {
        error: `Impossible de supprimer définitivement un atelier avec le statut "${item.status}". Seuls les ateliers annulés, archivés ou terminés peuvent être supprimés définitivement.`,
        status: item.status,
      },
      { status: 409 },
    );
  }

  // Enregistrer une activité CRM avant suppression (la FK est SetNull, l'activité survivra)
  await prisma.activity.create({
    data: {
      type: 'NOTE',
      title: 'Atelier supprimé définitivement',
      description: `L'atelier "${item.title}" (statut: ${item.status}) a été supprimé définitivement par l'admin ${guard.session.email ?? guard.session.sub}.`,
      contactId: null,
      relatedType: 'WORKSHOP_REQUEST_DELETED',
      relatedId: item.id,
      relatedUrl: null,
      userId: guard.session.sub,
    },
  }).catch(() => undefined); // ne pas bloquer la suppression si l'activité échoue

  // Détacher les rendez-vous CRM liés (SetNull via Prisma, mais on le fait explicitement
  // pour s'assurer que la note soit visible)
  await prisma.appointment.updateMany({
    where: { workshopRequestId: item.id },
    data: {
      workshopRequestId: null,
      notes: undefined, // on ne touche pas les notes existantes
    },
  }).catch(() => undefined);

  // Supprimer l'atelier — WorkshopAppointment est en cascade, CalendarExternalEvent est SetNull
  await prisma.workshopRequest.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true, deletedTitle: item.title });
}
