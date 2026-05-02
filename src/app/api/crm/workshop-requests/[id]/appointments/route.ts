import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { createExternalCalendarEvent } from '@/lib/calendar/service';

const scheduleSchema = z.object({
  title: z.string().min(3).max(180),
  description: z.string().max(4000).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().max(240).optional(),
  calendarConnectionId: z.string().uuid().optional().or(z.literal('')),
  meetingType: z.string().max(80).optional(),
  durationMinutes: z.number().int().min(1).max(1440).optional(),
});

const linkSchema = z.object({
  action: z.enum(['link_existing', 'unlink']),
  appointmentId: z.string().uuid(),
});

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'appointments', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = scheduleSchema.parse(await request.json());
    const workshop = await prisma.workshopRequest.findUnique({ where: { id: params.id } });

    if (!workshop || !workshop.organizationId) {
      return NextResponse.json({ error: 'Atelier introuvable ou organisation manquante.' }, { status: 404 });
    }

    const workshopAppointment = await prisma.workshopAppointment.create({
      data: {
        workshopRequestId: workshop.id,
        organizationId: workshop.organizationId,
        contactId: workshop.contactId,
        organizationContactId: workshop.organizationContactId,
        title: payload.title,
        description: normalizeOptionalString(payload.description),
        startAt: new Date(payload.startAt),
        endAt: new Date(payload.endAt),
        status: 'CONFIRMED',
        location: normalizeOptionalString(payload.location) || workshop.location || workshop.addressOrLocation,
      },
    });

    const appointment = await prisma.appointment.create({
      data: {
        title: payload.title,
        description: normalizeOptionalString(payload.description),
        startAt: new Date(payload.startAt),
        endAt: new Date(payload.endAt),
        type: 'WORKSHOP',
        appointmentType: 'WORKSHOP',
        status: 'CONFIRMED',
        contactId: workshop.contactId || workshop.clientId || null,
        organizationId: workshop.organizationId || null,
        workshopRequestId: workshop.id,
        location: normalizeOptionalString(payload.location) || workshop.location || workshop.addressOrLocation,
        notes: normalizeOptionalString(payload.description),
        calendarConnectionId: payload.calendarConnectionId || null,
        userId: guard.session.sub,
      },
    });

    let warning: string | null = null;
    if (payload.calendarConnectionId) {
      try {
        const externalEvent = await createExternalCalendarEvent({
          connectionId: payload.calendarConnectionId,
          title: appointment.title,
          description: appointment.description,
          startAt: appointment.startAt,
          endAt: appointment.endAt,
          location: workshopAppointment.location,
          linkedCrmAppointmentId: appointment.id,
          linkedWorkshopRequestId: workshop.id,
          linkedClientId: appointment.contactId,
          linkedOrganizationId: workshop.organizationId,
        });

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            externalProvider: externalEvent.provider,
            externalEventId: externalEvent.externalEventId,
            meetingUrl: externalEvent.meetingUrl,
          },
        });
      } catch (error) {
        warning = error instanceof Error ? error.message : 'Synchronisation du calendrier connecté impossible';
      }
    }

    await prisma.activity.create({
      data: {
        type: 'APPOINTMENT',
        title: 'Horaire d’atelier confirmé',
        description: payload.title,
        contactId: appointment.contactId,
        appointmentId: appointment.id,
        relatedType: 'WORKSHOP_REQUEST',
        relatedId: workshop.id,
        relatedUrl: `/crm/workshop-requests/${workshop.id}`,
        userId: guard.session.sub,
      },
    }).catch(() => undefined);

    return NextResponse.json({ item: workshopAppointment, appointmentId: appointment.id, warning }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module ateliers n’est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Planification impossible' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'appointments', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = linkSchema.parse(await request.json());
    const workshop = await prisma.workshopRequest.findUnique({ where: { id: params.id } });
    if (!workshop) {
      return NextResponse.json({ error: 'Atelier introuvable.' }, { status: 404 });
    }

    if (payload.action === 'link_existing') {
      const linked = await prisma.appointment.update({
        where: { id: payload.appointmentId },
        data: {
          workshopRequestId: workshop.id,
          contactId: workshop.contactId || workshop.clientId || null,
          organizationId: workshop.organizationId || null,
          appointmentType: 'WORKSHOP',
          type: 'WORKSHOP',
        },
      });

      await prisma.activity.create({
        data: {
          type: 'APPOINTMENT',
          title: 'Rendez-vous lié à l’atelier',
          description: linked.title,
          contactId: linked.contactId,
          appointmentId: linked.id,
          relatedType: 'WORKSHOP_REQUEST',
          relatedId: workshop.id,
          relatedUrl: `/crm/workshop-requests/${workshop.id}`,
          userId: guard.session.sub,
        },
      }).catch(() => undefined);

      return NextResponse.json({ item: linked });
    }

    const unlinked = await prisma.appointment.update({
      where: { id: payload.appointmentId },
      data: {
        workshopRequestId: null,
      },
    });

    return NextResponse.json({ item: unlinked });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Mise à jour des liaisons impossible' }, { status: 500 });
  }
}