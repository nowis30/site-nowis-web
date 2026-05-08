import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireCalendarAdminAccess } from '@/lib/calendar/oauth-routes';

const payloadSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(200),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  workshopRequestId: z.string().uuid().optional(),
});

function buildSyntheticExternalEventId(email: string, startAtIso: string, workshopRequestId?: string) {
  const base = `${email.toLowerCase()}|${startAtIso}|${workshopRequestId || 'none'}`;
  const normalized = Buffer.from(base).toString('base64url').slice(0, 40);
  return `test-calendly-${normalized}`;
}

export async function POST(request: NextRequest) {
  const guard = requireCalendarAdminAccess(request, 'update');
  if (guard.error) return guard.error;

  let parsed: z.infer<typeof payloadSchema>;
  try {
    parsed = payloadSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json({ error: 'Payload invalide', details: error instanceof Error ? error.message : 'invalid_body' }, { status: 400 });
  }

  const startAt = new Date(parsed.startAt);
  const endAt = new Date(parsed.endAt);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return NextResponse.json({ error: 'startAt/endAt invalides' }, { status: 400 });
  }

  const matchedContact = await prisma.contact.findFirst({
    where: {
      email: { equals: parsed.email, mode: 'insensitive' },
    },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, fullName: true, email: true },
  });

  const workshopRequest = parsed.workshopRequestId
    ? await prisma.workshopRequest.findUnique({
        where: { id: parsed.workshopRequestId },
        select: { id: true, title: true, contactId: true, clientId: true },
      })
    : null;

  if (parsed.workshopRequestId && !workshopRequest) {
    return NextResponse.json({ error: 'workshopRequestId introuvable' }, { status: 404 });
  }

  const externalEventId = buildSyntheticExternalEventId(parsed.email, startAt.toISOString(), parsed.workshopRequestId);

  const existing = await prisma.appointment.findFirst({
    where: {
      externalProvider: 'CALENDLY',
      externalEventId,
    },
    select: { id: true },
  });

  const contactId = matchedContact?.id || workshopRequest?.clientId || workshopRequest?.contactId || null;
  const type = workshopRequest ? 'WORKSHOP' : 'MEETING';
  const title = workshopRequest
    ? `Rendez-vous atelier - ${workshopRequest.title}`
    : `Rendez-vous Calendly test - ${parsed.name}`;

  const appointment = existing
    ? await prisma.appointment.update({
        where: { id: existing.id },
        data: {
          title,
          description: 'Simulation manuelle Calendly (test payload admin)',
          startAt,
          endAt,
          type,
          status: 'CONFIRMED',
          contactId,
          workshopRequestId: workshopRequest?.id || null,
          externalProvider: 'CALENDLY',
          externalEventId,
          meetingUrl: `https://calendly.test/scheduled_events/${externalEventId}`,
        },
      })
    : await prisma.appointment.create({
        data: {
          title,
          description: 'Simulation manuelle Calendly (test payload admin)',
          startAt,
          endAt,
          type,
          status: 'CONFIRMED',
          contactId,
          workshopRequestId: workshopRequest?.id || null,
          externalProvider: 'CALENDLY',
          externalEventId,
          meetingUrl: `https://calendly.test/scheduled_events/${externalEventId}`,
        },
      });

  return NextResponse.json({
    ok: true,
    mode: existing ? 'updated' : 'created',
    appointmentId: appointment.id,
    externalEventId,
    contactId,
    workshopRequestId: workshopRequest?.id || null,
    debug: {
      eventType: 'invitee.created.test',
      scheduledEventUri: externalEventId,
      inviteeEmail: parsed.email.toLowerCase(),
      hasStartAt: true,
      hasEndAt: true,
      matchedWorkshopRequestId: workshopRequest?.id || null,
      createdAppointmentId: appointment.id,
      createdWorkshopAppointmentId: null,
      skippedReason: null,
      traceId: randomUUID(),
    },
  });
}
