import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { crmSongRequestPatchSchema } from '@/lib/validators/song-request';

function nextInvoiceNumber(prefixDate = new Date()) {
  const yyyy = prefixDate.getFullYear();
  const mm = String(prefixDate.getMonth() + 1).padStart(2, '0');
  const dd = String(prefixDate.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `SQ-${yyyy}${mm}${dd}-${rand}`;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'songRequests', 'read');
  if (guard.error) return guard.error;

  const item = await prisma.songRequest.findUnique({
    where: { id: params.id },
    include: {
      contact: { select: { id: true, fullName: true, email: true, phone: true } },
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
        type: 'FOLLOWUP',
        status: 'PENDING',
        contactId: songRequest.contactId,
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
        userId: guard.session.sub,
      },
    });

    return NextResponse.json({ item: updated, appointmentId: appointment.id });
  }

  if (payload.action === 'mark_quoted') {
    const draftNumber = nextInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        number: draftNumber,
        contactId: songRequest.contactId,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        amount: songRequest.budget ?? 0,
        status: 'DRAFT',
        description: `Soumission issue de la demande de chanson (${songRequest.songType}).`,
      },
    });

    const updated = await prisma.songRequest.update({
      where: { id: songRequest.id },
      data: {
        status: 'QUOTED',
        convertedInvoiceId: invoice.id,
      },
    });

    await prisma.activity.create({
      data: {
        type: 'INVOICE',
        title: 'Demande convertie en soumission',
        description: `Brouillon de facture créé (${invoice.number}).`,
        contactId: songRequest.contactId,
        songRequestId: songRequest.id,
        userId: guard.session.sub,
      },
    });

    return NextResponse.json({ item: updated, invoiceId: invoice.id });
  }

  const nextStatus =
    payload.action === 'mark_contacted'
      ? 'CONTACTED'
      : payload.action === 'mark_in_production'
        ? 'IN_PRODUCTION'
        : payload.action === 'mark_delivered'
          ? 'DELIVERED'
          : payload.status;

  if (!nextStatus) {
    return NextResponse.json({ error: 'Aucune action valide fournie' }, { status: 400 });
  }

  const item = await prisma.songRequest.update({
    where: { id: songRequest.id },
    data: { status: nextStatus },
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
