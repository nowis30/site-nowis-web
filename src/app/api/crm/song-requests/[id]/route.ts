import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { crmSongRequestPatchSchema } from '@/lib/validators/song-request';
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'songRequests', 'read');
  if (guard.error) return guard.error;

  const item = await prisma.songRequest.findUnique({
    where: { id: params.id },
    include: {
      organization: { select: { id: true, name: true } },
      contact: { select: { id: true, fullName: true, email: true, phone: true } },
      appointments: {
        select: {
          id: true,
          title: true,
          startAt: true,
          endAt: true,
          status: true,
          type: true,
          location: true,
        },
        orderBy: { startAt: 'asc' },
      },
      activities: {
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
      tasks: {
        include: { createdBy: { select: { fullName: true } } },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'songRequests', 'update');
  if (guard.error) return guard.error;

  const payload = crmSongRequestPatchSchema.parse(await request.json());

  const songRequest = await prisma.songRequest.findUnique({
    where: { id: params.id },
    include: { contact: true },
  });

  if (!songRequest) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  }

  if (payload.action === 'convert_appointment') {
    const startAt = new Date();
    startAt.setDate(startAt.getDate() + 1);
    startAt.setHours(10, 0, 0, 0);

    const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);

    const appointment = await prisma.appointment.create({
      data: {
        title: `RDV suivi - ${songRequest.fullName}`,
        description: `Suivi de la demande de chanson (${songRequest.songType} / ${songRequest.occasion}).`,
        startAt,
        endAt,
        type: 'MEETING',
        appointmentType: 'SONG_MEETING',
        status: 'PENDING',
        contactId: songRequest.contactId,
        organizationId: songRequest.organizationId,
        songRequestId: songRequest.id,
        location: songRequest.location,
        notes: songRequest.meetingNotes,
        userId: guard.session.sub,
      },
    });

    const updated = await prisma.songRequest.update({
      where: { id: songRequest.id },
      data: {
        status: 'IN_PROGRESS',
        convertedAppointmentId: appointment.id,
      },
    });

    await prisma.activity.create({
      data: {
        type: 'APPOINTMENT',
        title: 'Demande convertie en rendez-vous',
        description: `Rendez-vous créé: ${appointment.title} (${appointment.startAt.toISOString()}).`,
        contactId: songRequest.contactId,
        songRequestId: songRequest.id,
        relatedType: 'APPOINTMENT',
        relatedId: appointment.id,
        relatedUrl: '/crm/calendar',
        userId: guard.session.sub,
      },
    });

    return NextResponse.json({ item: updated, appointmentId: appointment.id });
  }

  if (payload.action === 'plan_meeting') {
    const startAt = payload.startAt ? new Date(payload.startAt) : new Date();
    const duration = payload.durationMinutes || 45;
    const endAt = payload.endAt ? new Date(payload.endAt) : new Date(startAt.getTime() + duration * 60_000);

    const appointment = await prisma.appointment.create({
      data: {
        title: payload.title || `Rencontre chanson - ${songRequest.fullName}`,
        description: payload.meetingNotes || `Rencontre de planification pour ${songRequest.occasion}`,
        startAt,
        endAt,
        type: 'MEETING',
        appointmentType: 'SONG_MEETING',
        status: 'CONFIRMED',
        contactId: songRequest.contactId,
        organizationId: payload.organizationId || songRequest.organizationId,
        songRequestId: songRequest.id,
        location: payload.location || null,
        notes: payload.meetingNotes || null,
        userId: guard.session.sub,
      },
    });

    const updated = await prisma.songRequest.update({
      where: { id: songRequest.id },
      data: {
        meetingDate: startAt,
        scheduledAt: startAt,
        startAt,
        endAt,
        durationMinutes: Math.max(1, Math.round((endAt.getTime() - startAt.getTime()) / 60_000)),
        meetingType: payload.meetingType || 'visio',
        location: payload.location || null,
        meetingNotes: payload.meetingNotes || null,
        convertedAppointmentId: appointment.id,
        organizationId: payload.organizationId || songRequest.organizationId,
      },
    });

    await prisma.activity.create({
      data: {
        type: 'APPOINTMENT',
        title: 'Rencontre chanson planifiée',
        description: `${appointment.title} (${appointment.startAt.toISOString()})`,
        contactId: songRequest.contactId,
        songRequestId: songRequest.id,
        appointmentId: appointment.id,
        relatedType: 'SONG_REQUEST',
        relatedId: songRequest.id,
        relatedUrl: `/crm/song-requests/${songRequest.id}`,
        userId: guard.session.sub,
      },
    });

    return NextResponse.json({ item: updated, appointmentId: appointment.id });
  }

  if (payload.action === 'link_appointment') {
    if (!payload.appointmentId) {
      return NextResponse.json({ error: 'appointmentId requis' }, { status: 400 });
    }

    const linked = await prisma.appointment.update({
      where: { id: payload.appointmentId },
      data: {
        songRequestId: songRequest.id,
        contactId: songRequest.contactId,
        organizationId: payload.organizationId || songRequest.organizationId,
        type: 'MEETING',
        appointmentType: 'SONG_MEETING',
      },
    });

    await prisma.activity.create({
      data: {
        type: 'APPOINTMENT',
        title: 'Rendez-vous lié à la demande de chanson',
        description: linked.title,
        contactId: songRequest.contactId,
        songRequestId: songRequest.id,
        appointmentId: linked.id,
        relatedType: 'SONG_REQUEST',
        relatedId: songRequest.id,
        relatedUrl: `/crm/song-requests/${songRequest.id}`,
        userId: guard.session.sub,
      },
    }).catch(() => undefined);

    return NextResponse.json({ ok: true, appointmentId: linked.id });
  }

  if (payload.action === 'unlink_appointment') {
    if (!payload.appointmentId) {
      return NextResponse.json({ error: 'appointmentId requis' }, { status: 400 });
    }

    await prisma.appointment.update({
      where: { id: payload.appointmentId },
      data: { songRequestId: null },
    });

    return NextResponse.json({ ok: true });
  }

  if (payload.action === 'mark_quoted') {
    return NextResponse.json({ error: 'Cette action est désactivée. Créez une soumission commerciale puis convertissez-la en facture.' }, { status: 410 });
  }

  const nextStatus =
    payload.action === 'soft_delete'
      ? 'DELETED'
      : payload.action === 'restore'
        ? 'NEW'
        :
    payload.action === 'mark_contacted'
      ? 'CONTACTED'
      : payload.action === 'mark_in_production'
        ? 'IN_PRODUCTION'
        : payload.action === 'mark_delivered'
          ? 'DELIVERED'
          : payload.status;

  const hasFieldUpdate = Boolean(
    payload.title ||
    payload.meetingDate ||
    payload.scheduledAt ||
    payload.startAt ||
    payload.endAt ||
    typeof payload.durationMinutes === 'number' ||
    payload.meetingType ||
    payload.location ||
    payload.meetingNotes ||
    payload.organizationId,
  );

  if (!nextStatus && !hasFieldUpdate) {
    return NextResponse.json({ error: 'Aucune action valide fournie' }, { status: 400 });
  }

  if ((payload.action === 'soft_delete' || payload.action === 'restore') && guard.session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un administrateur' }, { status: 403 });
  }

  const item = await prisma.songRequest.update({
    where: { id: songRequest.id },
    data: {
      status: nextStatus,
      title: payload.title || undefined,
      meetingDate: payload.meetingDate ? new Date(payload.meetingDate) : undefined,
      scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : undefined,
      startAt: payload.startAt ? new Date(payload.startAt) : undefined,
      endAt: payload.endAt ? new Date(payload.endAt) : undefined,
      durationMinutes: typeof payload.durationMinutes === 'number' ? payload.durationMinutes : undefined,
      meetingType: payload.meetingType || undefined,
      location: payload.location || undefined,
      meetingNotes: payload.meetingNotes || undefined,
      organizationId: payload.organizationId || undefined,
      deletedAt: nextStatus === 'DELETED' ? new Date() : null,
      deletedBy: nextStatus === 'DELETED' ? guard.session.sub : null,
      deleteReason: nextStatus === 'DELETED' ? payload.reason || null : null,
    },
  });

  await prisma.activity.create({
    data: {
      type: 'TASK',
      title: 'Mise à jour de la demande de chanson',
      description: `Statut changé à ${nextStatus}.`,
      contactId: songRequest.contactId,
      songRequestId: songRequest.id,
      userId: guard.session.sub,
    },
  });

  return NextResponse.json({ item });
}
