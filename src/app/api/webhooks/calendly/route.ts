import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type CalendlyEventPayload = {
  event?: string;
  payload?: {
    uri?: string;
    email?: string;
    name?: string;
    scheduled_event?: {
      uri?: string;
      start_time?: string;
      end_time?: string;
    };
  };
};

function parseCalendlySignatureHeader(rawHeader: string | null) {
  if (!rawHeader) return null;

  const chunks = rawHeader.split(',').map((part) => part.trim());
  const values: Record<string, string> = {};
  for (const chunk of chunks) {
    const [key, value] = chunk.split('=');
    if (!key || !value) continue;
    values[key] = value;
  }

  if (values.t && values.v1) {
    return { timestamp: values.t, signature: values.v1 };
  }

  return { timestamp: '', signature: rawHeader.trim() };
}

function verifyCalendlySignature(rawBody: string, signatureHeader: string | null, signingKey: string) {
  const parsed = parseCalendlySignatureHeader(signatureHeader);
  if (!parsed?.signature) return false;

  const signedPayload = parsed.timestamp ? `${parsed.timestamp}.${rawBody}` : rawBody;
  const expected = createHmac('sha256', signingKey).update(signedPayload).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(parsed.signature, 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: NextRequest) {
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim();
  const signatureHeader = request.headers.get('calendly-webhook-signature');
  const rawBody = await request.text();

  if (signingKey && !verifyCalendlySignature(rawBody, signatureHeader, signingKey)) {
    return NextResponse.json({ error: 'Signature webhook invalide' }, { status: 401 });
  }

  let body: CalendlyEventPayload;
  try {
    body = JSON.parse(rawBody) as CalendlyEventPayload;
  } catch {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
  }

  const eventType = body.event;
  const payload = body.payload;

  if (!eventType || !payload) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const inviteeUri = payload.uri || null;
  const scheduledEventUri = payload.scheduled_event?.uri || null;
  const inviteeEmail = payload.email?.trim().toLowerCase() || null;
  const startAt = payload.scheduled_event?.start_time ? new Date(payload.scheduled_event.start_time) : null;
  const endAt = payload.scheduled_event?.end_time ? new Date(payload.scheduled_event.end_time) : null;

  const workshopRequest = await prisma.workshopRequest.findFirst({
    where: {
      OR: [
        inviteeUri ? { calendlyInviteeUri: inviteeUri } : undefined,
        scheduledEventUri ? { calendlyEventUri: scheduledEventUri } : undefined,
        inviteeEmail ? { contactEmail: { equals: inviteeEmail, mode: 'insensitive' } } : undefined,
      ].filter(Boolean) as Array<Record<string, unknown>>,
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!workshopRequest) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'workshop_not_found' });
  }

  if (eventType === 'invitee.created') {
    const nextStatus = workshopRequest.status === 'CONFIRME' ? 'CONFIRME' : 'RDV_PLANIFIE';

    const updated = await prisma.workshopRequest.update({
      where: { id: workshopRequest.id },
      data: {
        status: nextStatus,
        calendlyEventUri: scheduledEventUri || workshopRequest.calendlyEventUri,
        calendlyInviteeUri: inviteeUri || workshopRequest.calendlyInviteeUri,
        scheduledAt: startAt || workshopRequest.scheduledAt,
      },
    });

    if (updated.organizationId && startAt && endAt) {
      const existingAppointment = await prisma.workshopAppointment.findFirst({
        where: {
          workshopRequestId: updated.id,
          startAt,
        },
      });

      if (!existingAppointment) {
        await prisma.workshopAppointment.create({
          data: {
            workshopRequestId: updated.id,
            organizationId: updated.organizationId,
            contactId: updated.contactId,
            organizationContactId: updated.organizationContactId,
            title: `Rendez-vous atelier - ${updated.title}`,
            description: 'Synchronisé depuis Calendly',
            startAt,
            endAt,
            status: 'CONFIRMED',
            location: updated.addressOrLocation || updated.location,
          },
        });
      }
    }

    return NextResponse.json({ ok: true, status: nextStatus });
  }

  if (eventType === 'invitee.canceled') {
    await prisma.workshopRequest.update({
      where: { id: workshopRequest.id },
      data: {
        status: 'EN_ATTENTE_RDV',
      },
    });

    return NextResponse.json({ ok: true, status: 'EN_ATTENTE_RDV' });
  }

  return NextResponse.json({ ok: true, skipped: true, reason: 'event_not_handled' });
}
