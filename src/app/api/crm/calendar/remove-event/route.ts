import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

const removeEventSchema = z.object({
  sourceType: z.enum(['appointment', 'workshop', 'song-request', 'external']),
  sourceId: z.string().uuid(),
  cancelLinkedAppointments: z.boolean().optional(),
  unlinkLinkedAppointments: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'appointments', 'delete');
  if (guard.error) return guard.error;

  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur.' }, { status: 403 });
  }

  try {
    const payload = removeEventSchema.parse(await request.json());

    if (payload.sourceType === 'appointment') {
      const appt = await prisma.appointment.findUnique({
        where: { id: payload.sourceId },
        select: { id: true, title: true, contactId: true, workshopRequestId: true, songRequestId: true },
      });
      if (!appt) return NextResponse.json({ error: 'Rendez-vous introuvable.' }, { status: 404 });

      await prisma.appointment.update({
        where: { id: appt.id },
        data: { status: 'CANCELLED' },
      });

      await prisma.activity.create({
        data: {
          type: 'APPOINTMENT',
          title: 'Rendez-vous retiré du calendrier',
          description: appt.title,
          contactId: appt.contactId,
          appointmentId: appt.id,
          relatedType: 'APPOINTMENT',
          relatedId: appt.id,
          relatedUrl: `/crm/appointments/${appt.id}`,
          userId: guard.session.sub,
        },
      }).catch(() => undefined);

      return NextResponse.json({ success: true });
    }

    if (payload.sourceType === 'workshop') {
      const workshop = await prisma.workshopRequest.findUnique({
        where: { id: payload.sourceId },
        select: { id: true, title: true, contactId: true, clientId: true, status: true },
      });
      if (!workshop) return NextResponse.json({ error: 'Atelier introuvable.' }, { status: 404 });

      const cancelLinkedAppointments = payload.cancelLinkedAppointments ?? true;
      const unlinkLinkedAppointments = payload.unlinkLinkedAppointments ?? true;

      await prisma.$transaction(async (tx) => {
        await tx.workshopRequest.update({
          where: { id: workshop.id },
          data: {
            scheduledAt: null,
            startAt: null,
            endAt: null,
            durationMinutes: null,
            meetingType: null,
          },
        });

        await tx.workshopAppointment.updateMany({
          where: {
            workshopRequestId: workshop.id,
            status: { not: 'CANCELLED' },
          },
          data: { status: 'CANCELLED' },
        });

        if (cancelLinkedAppointments) {
          await tx.appointment.updateMany({
            where: {
              workshopRequestId: workshop.id,
              status: { not: 'CANCELLED' },
            },
            data: { status: 'CANCELLED' },
          });
        }

        if (unlinkLinkedAppointments) {
          await tx.appointment.updateMany({
            where: { workshopRequestId: workshop.id },
            data: { workshopRequestId: null },
          });
        }

        await tx.activity.create({
          data: {
            type: 'APPOINTMENT',
            title: 'Atelier retiré du calendrier',
            description: workshop.title,
            contactId: workshop.contactId || workshop.clientId,
            relatedType: 'WORKSHOP_REQUEST',
            relatedId: workshop.id,
            relatedUrl: `/crm/workshop-requests/${workshop.id}`,
            userId: guard.session.sub,
          },
        }).catch(() => undefined);
      });

      return NextResponse.json({ success: true });
    }

    if (payload.sourceType === 'song-request') {
      const song = await prisma.songRequest.findUnique({
        where: { id: payload.sourceId },
        select: { id: true, title: true, contactId: true },
      });
      if (!song) return NextResponse.json({ error: 'Demande chanson introuvable.' }, { status: 404 });

      const cancelLinkedAppointments = payload.cancelLinkedAppointments ?? true;
      const unlinkLinkedAppointments = payload.unlinkLinkedAppointments ?? true;

      await prisma.$transaction(async (tx) => {
        await tx.songRequest.update({
          where: { id: song.id },
          data: {
            meetingDate: null,
            scheduledAt: null,
            startAt: null,
            endAt: null,
            durationMinutes: null,
            meetingType: null,
          },
        });

        if (cancelLinkedAppointments) {
          await tx.appointment.updateMany({
            where: {
              songRequestId: song.id,
              status: { not: 'CANCELLED' },
            },
            data: { status: 'CANCELLED' },
          });
        }

        if (unlinkLinkedAppointments) {
          await tx.appointment.updateMany({
            where: { songRequestId: song.id },
            data: { songRequestId: null },
          });
        }

        await tx.activity.create({
          data: {
            type: 'APPOINTMENT',
            title: 'Rencontre chanson retirée du calendrier',
            description: song.title,
            contactId: song.contactId,
            relatedType: 'SONG_REQUEST',
            relatedId: song.id,
            relatedUrl: `/crm/song-requests/${song.id}`,
            userId: guard.session.sub,
          },
        }).catch(() => undefined);
      });

      return NextResponse.json({ success: true });
    }

    const external = await prisma.calendarExternalEvent.findUnique({
      where: { id: payload.sourceId },
      select: { id: true, title: true, linkedClientId: true },
    });
    if (!external) return NextResponse.json({ error: 'Événement externe introuvable.' }, { status: 404 });

    await prisma.calendarExternalEvent.update({
      where: { id: external.id },
      data: { status: 'DELETED' },
    });

    await prisma.activity.create({
      data: {
        type: 'APPOINTMENT',
        title: 'Événement externe masqué du calendrier CRM',
        description: external.title,
        contactId: external.linkedClientId,
        relatedType: 'ACTIVITY',
        relatedId: external.id,
        relatedUrl: '/crm/calendar',
        userId: guard.session.sub,
      },
    }).catch(() => undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Payload invalide', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Retrait du calendrier impossible' }, { status: 500 });
  }
}
