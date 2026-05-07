import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { appointmentInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { createExternalCalendarEvent, recordCalendarActivity } from '@/lib/calendar/service';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'appointments', 'read');
  if (guard.error) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');
  const contactId = request.nextUrl.searchParams.get('contactId')?.trim();
  const organizationId = request.nextUrl.searchParams.get('organizationId')?.trim();
  const workshopRequestId = request.nextUrl.searchParams.get('workshopRequestId')?.trim();
  const songRequestId = request.nextUrl.searchParams.get('songRequestId')?.trim();

  const items = await prisma.appointment.findMany({
    where: {
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
      ...(from ? { startAt: { gte: new Date(from) } } : {}),
      ...(to ? { startAt: { lte: new Date(to) } } : {}),
      ...(contactId ? { contactId } : {}),
      ...(organizationId ? { organizationId } : {}),
      ...(workshopRequestId ? { workshopRequestId } : {}),
      ...(songRequestId ? { songRequestId } : {}),
    },
    include: {
      contact: { select: { id: true, fullName: true, email: true } },
      organization: { select: { id: true, name: true } },
      workshopRequest: { select: { id: true, title: true, status: true } },
      songRequest: { select: { id: true, title: true, occasion: true, status: true } },
    },
    orderBy: { startAt: 'asc' },
  });

  return NextResponse.json({ items });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error:
        'Les rendez-vous doivent être réservés via Calendly pour éviter les conflits d\'horaire. Configurez votre lien Calendly dans les paramètres.',
      code: 'APPOINTMENT_MANUAL_CREATION_DISABLED',
    },
    { status: 405 },
  );
}

// Kept for reference — replaced by POST above which enforces the Calendly-only rule.
async function _disabledManualAppointmentCreate(request: NextRequest) {
  const guard = requireApiPermission(request, 'appointments', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = appointmentInputSchema.parse(await request.json());
    const normalizedType = payload.type === 'OTHER' ? 'REMINDER' : payload.type;
    const item = await prisma.appointment.create({
      data: {
        title: payload.title.trim(),
        description: normalizeOptionalString(payload.description),
        startAt: new Date(payload.startAt),
        endAt: new Date(payload.endAt),
        type: normalizedType,
        appointmentType: payload.appointmentType || normalizedType,
        status: payload.status,
        contactId: payload.contactId || null,
        organizationId: payload.organizationId || null,
        workshopRequestId: payload.workshopRequestId || null,
        songRequestId: payload.songRequestId || null,
        location: normalizeOptionalString(payload.location),
        notes: normalizeOptionalString(payload.notes),
        calendarConnectionId: payload.calendarConnectionId || null,
        userId: guard.session.sub,
      },
    });

    if (payload.calendarConnectionId) {
      try {
        const externalEvent = await createExternalCalendarEvent({
          connectionId: payload.calendarConnectionId,
          title: item.title,
          description: item.description,
          startAt: item.startAt,
          endAt: item.endAt,
          linkedCrmAppointmentId: item.id,
          linkedClientId: item.contactId,
          linkedOrganizationId: payload.organizationId || null,
        });

        const syncedItem = await prisma.appointment.update({
          where: { id: item.id },
          data: {
            externalProvider: externalEvent.provider,
            externalEventId: externalEvent.externalEventId,
            meetingUrl: externalEvent.meetingUrl,
          },
        });

        await recordCalendarActivity({
          title: 'Rendez-vous CRM créé vers calendrier connecté',
          description: `${externalEvent.provider} · ${syncedItem.title}`,
          userId: guard.session.sub,
          relatedId: payload.calendarConnectionId,
        });

        return NextResponse.json({ item: syncedItem }, { status: 201 });
      } catch (calendarError) {
        await prisma.appointment.delete({ where: { id: item.id } }).catch(() => undefined);
        const message = calendarError instanceof Error ? calendarError.message : 'Synchronisation externe impossible';
        return NextResponse.json({ error: message }, { status: 502 });
      }
    }

    await recordCalendarActivity({
      title: 'Rendez-vous CRM créé',
      description: item.title,
      userId: guard.session.sub,
      relatedId: item.id,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json({ error: 'Le contact ou l\'utilisateur lie au rendez-vous est introuvable.' }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module rendez-vous n\'est pas encore disponible sur cette base de donnees.' }, { status: 503 });
    }

    console.error('[CRM_APPOINTMENTS_CREATE]', error);
    return NextResponse.json({ error: 'Creation du rendez-vous impossible' }, { status: 500 });
  }
}
