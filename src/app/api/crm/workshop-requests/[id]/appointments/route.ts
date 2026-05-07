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
  action: z.enum(['link_existing', 'unlink', 'cancel', 'cancel_workshop_appointment', 'delete_workshop_appointment', 'delete_appointment']),
  appointmentId: z.string().uuid().optional(),
  workshopAppointmentId: z.string().uuid().optional(),
});

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest, _ctx: { params: { id: string } }) {
  return NextResponse.json(
    {
      error:
        'Les rendez-vous d\'atelier doivent être réservés via Calendly pour éviter les conflits d\'horaire. Le CRM se synchronise automatiquement via le webhook Calendly.',
      code: 'WORKSHOP_APPOINTMENT_MANUAL_CREATION_DISABLED',
    },
    { status: 405 },
  );
}

// Kept for reference — replaced by POST above which enforces the Calendly-only rule.
async function _disabledManualWorkshopAppointmentCreate(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'appointments', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = scheduleSchema.parse(await request.json());
    const workshop = await prisma.workshopRequest.findUnique({ where: { id: params.id } });

    if (!workshop || !workshop.organizationId) {
      return NextResponse.json({ error: 'Atelier introuvable ou organisation manquante.' }, { status: 404 });
    }

    // Anti-doublon : vérifier qu'il n'existe pas déjà un horaire à la même date/heure
    const startAtDate = new Date(payload.startAt);
    const existingSlot = await prisma.workshopAppointment.findFirst({
      where: {
        workshopRequestId: workshop.id,
        startAt: startAtDate,
        status: { not: 'CANCELLED' },
      },
    });
    if (existingSlot) {
      return NextResponse.json(
        { error: `Un horaire existe déjà pour cette date et cette heure (${new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(startAtDate)}). Annulez-le d'abord ou choisissez une autre heure.` },
        { status: 409 }
      );
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

    // --- Lier un rendez-vous existant ---
    if (payload.action === 'link_existing') {
      if (!payload.appointmentId) return NextResponse.json({ error: 'appointmentId requis.' }, { status: 400 });
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
          title: `Rendez-vous lié à l'atelier`,
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

    // --- Délier un rendez-vous CRM ---
    if (payload.action === 'unlink') {
      if (!payload.appointmentId) return NextResponse.json({ error: 'appointmentId requis.' }, { status: 400 });
      const unlinked = await prisma.appointment.update({
        where: { id: payload.appointmentId },
        data: { workshopRequestId: null },
      });
      await prisma.activity.create({
        data: {
          type: 'APPOINTMENT',
          title: `Rendez-vous délié de l'atelier`,
          description: unlinked.title,
          contactId: unlinked.contactId,
          appointmentId: unlinked.id,
          relatedType: 'WORKSHOP_REQUEST',
          relatedId: workshop.id,
          relatedUrl: `/crm/workshop-requests/${workshop.id}`,
          userId: guard.session.sub,
        },
      }).catch(() => undefined);
      return NextResponse.json({ item: unlinked });
    }

    // --- Annuler un rendez-vous CRM (garde le lien à l'atelier) ---
    if (payload.action === 'cancel') {
      if (!payload.appointmentId) return NextResponse.json({ error: 'appointmentId requis.' }, { status: 400 });
      const cancelled = await prisma.appointment.update({
        where: { id: payload.appointmentId, workshopRequestId: workshop.id },
        data: { status: 'CANCELLED' },
      });
      await prisma.activity.create({
        data: {
          type: 'APPOINTMENT',
          title: 'Rendez-vous annulé',
          description: cancelled.title,
          contactId: cancelled.contactId,
          appointmentId: cancelled.id,
          relatedType: 'WORKSHOP_REQUEST',
          relatedId: workshop.id,
          relatedUrl: `/crm/workshop-requests/${workshop.id}`,
          userId: guard.session.sub,
        },
      }).catch(() => undefined);
      return NextResponse.json({ item: cancelled });
    }

    // --- Annuler un horaire atelier (WorkshopAppointment) ---
    if (payload.action === 'cancel_workshop_appointment') {
      if (!payload.workshopAppointmentId) return NextResponse.json({ error: 'workshopAppointmentId requis.' }, { status: 400 });
      const cancelled = await prisma.workshopAppointment.update({
        where: { id: payload.workshopAppointmentId, workshopRequestId: workshop.id },
        data: { status: 'CANCELLED' },
      });
      await prisma.activity.create({
        data: {
          type: 'APPOINTMENT',
          title: `Horaire d'atelier annulé`,
          description: cancelled.title,
          contactId: workshop.contactId,
          relatedType: 'WORKSHOP_REQUEST',
          relatedId: workshop.id,
          relatedUrl: `/crm/workshop-requests/${workshop.id}`,
          userId: guard.session.sub,
        },
      }).catch(() => undefined);
      return NextResponse.json({ item: cancelled });
    }

    // --- Supprimer définitivement un horaire atelier (admin seulement) ---
    if (payload.action === 'delete_workshop_appointment') {
      if (!payload.workshopAppointmentId) return NextResponse.json({ error: 'workshopAppointmentId requis.' }, { status: 400 });
      if (guard.session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Réservé aux administrateurs.' }, { status: 403 });
      }
      await prisma.workshopAppointment.delete({
        where: { id: payload.workshopAppointmentId, workshopRequestId: workshop.id },
      });
      return NextResponse.json({ success: true });
    }

    // --- Supprimer définitivement un rendez-vous CRM (admin, sans soumission liée) ---
    if (payload.action === 'delete_appointment') {
      if (!payload.appointmentId) return NextResponse.json({ error: 'appointmentId requis.' }, { status: 400 });
      if (guard.session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Réservé aux administrateurs.' }, { status: 403 });
      }
      const linkedQuotes = await prisma.commercialQuote.count({ where: { appointmentId: payload.appointmentId } });
      if (linkedQuotes > 0) {
        return NextResponse.json(
          { error: `Ce rendez-vous est lié à ${linkedQuotes} soumission(s) commerciale(s). Supprimez d'abord les soumissions liées.` },
          { status: 409 }
        );
      }
      const appt = await prisma.appointment.findUnique({
        where: { id: payload.appointmentId, workshopRequestId: workshop.id },
        select: { id: true, title: true, contactId: true },
      });
      if (!appt) return NextResponse.json({ error: 'Rendez-vous introuvable ou non lié à cet atelier.' }, { status: 404 });
      await prisma.appointment.delete({ where: { id: appt.id } });
      await prisma.activity.create({
        data: {
          type: 'APPOINTMENT',
          title: 'Rendez-vous supprimé définitivement',
          description: appt.title,
          contactId: appt.contactId,
          relatedType: 'WORKSHOP_REQUEST',
          relatedId: workshop.id,
          relatedUrl: `/crm/workshop-requests/${workshop.id}`,
          userId: guard.session.sub,
        },
      }).catch(() => undefined);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action non reconnue.' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Mise à jour des liaisons impossible' }, { status: 500 });
  }
}