import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { appointmentInputSchema, normalizeOptionalString } from '@/features/crm/server/validators';
import { recordCalendarActivity } from '@/lib/calendar/service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'appointments', 'read');
  if (guard.error) return guard.error;

  const item = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      contact: true,
      organization: { select: { id: true, name: true } },
      workshopRequest: { select: { id: true, title: true, status: true } },
      songRequest: { select: { id: true, title: true, occasion: true, status: true } },
    },
  });
  if (!item) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
  return NextResponse.json({ item });
}

async function updateAppointment(request: NextRequest, params: { id: string }) {
  const guard = requireApiPermission(request, 'appointments', 'update');
  if (guard.error) return guard.error;
  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur' }, { status: 403 });
  }

  try {
    const payload = appointmentInputSchema.parse(await request.json());
    const normalizedType = payload.type === 'OTHER' ? 'REMINDER' : payload.type;
    const item = await prisma.appointment.update({
      where: { id: params.id },
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
      },
    });

    await recordCalendarActivity({
      title: 'Rendez-vous CRM modifié',
      description: item.title,
      userId: guard.session.sub,
      relatedId: item.id,
    });

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json({ error: 'Le contact lie au rendez-vous est introuvable.' }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module rendez-vous n\'est pas encore disponible sur cette base de donnees.' }, { status: 503 });
    }

    console.error('[CRM_APPOINTMENTS_UPDATE]', error);
    return NextResponse.json({ error: 'Modification du rendez-vous impossible' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return updateAppointment(request, params);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return updateAppointment(request, params);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'appointments', 'delete');
  if (guard.error) return guard.error;
  if (guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur' }, { status: 403 });
  }

  try {
    const existing = await prisma.appointment.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Rendez-vous introuvable' }, { status: 404 });
    }

    const item = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
      },
    });

    await recordCalendarActivity({
      title: 'Rendez-vous CRM annulé',
      description: item.title,
      userId: guard.session.sub,
      relatedId: item.id,
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module rendez-vous n\'est pas encore disponible sur cette base de donnees.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Annulation du rendez-vous impossible' }, { status: 500 });
  }
}
