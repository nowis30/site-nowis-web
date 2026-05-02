import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordCalendarActivity } from '@/lib/calendar/service';

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
  const inviteeName = payload.name?.trim() || null;
  const startAt = payload.scheduled_event?.start_time ? new Date(payload.scheduled_event.start_time) : null;
  const endAt = payload.scheduled_event?.end_time ? new Date(payload.scheduled_event.end_time) : null;

  let matchedContact = inviteeEmail
    ? await prisma.contact.findFirst({
        where: { email: { equals: inviteeEmail, mode: 'insensitive' } },
        orderBy: { updatedAt: 'desc' },
      })
    : null;

  if (!matchedContact && inviteeEmail && process.env.CALENDLY_AUTO_CREATE_CONTACTS?.trim().toLowerCase() === 'true') {
    matchedContact = await prisma.contact.create({
      data: {
        type: 'CLIENT',
        fullName: inviteeName || inviteeEmail,
        email: inviteeEmail,
        source: 'calendly-webhook',
        tags: ['calendly'],
        notes: 'Créé automatiquement depuis un webhook Calendly.',
      },
    });
  }

  const calendlyConnection = await prisma.calendarConnection.findFirst({
    where: {
      provider: 'CALENDLY',
      status: { in: ['CONNECTED', 'EXPIRED', 'ERROR'] },
    },
    orderBy: { updatedAt: 'desc' },
  }).catch(() => null);

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

  if (eventType === 'invitee.created') {
    if (workshopRequest) {
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

      if (calendlyConnection && scheduledEventUri && startAt && endAt) {
        await prisma.calendarExternalEvent.upsert({
          where: {
            connectionId_externalEventId: {
              connectionId: calendlyConnection.id,
              externalEventId: scheduledEventUri,
            },
          },
          create: {
            connectionId: calendlyConnection.id,
            provider: 'CALENDLY',
            externalEventId: scheduledEventUri,
            title: `Calendly - ${updated.title}`,
            description: inviteeName || 'Rendez-vous reçu via webhook Calendly',
            startAt,
            endAt,
            meetingUrl: scheduledEventUri,
            status: 'CONFIRMED',
            rawPayload: body,
            linkedWorkshopRequestId: updated.id,
            linkedClientId: matchedContact?.id || updated.clientId || updated.contactId || null,
            linkedOrganizationId: updated.organizationId,
          },
          update: {
            title: `Calendly - ${updated.title}`,
            description: inviteeName || 'Rendez-vous reçu via webhook Calendly',
            startAt,
            endAt,
            meetingUrl: scheduledEventUri,
            status: 'CONFIRMED',
            rawPayload: body,
            linkedWorkshopRequestId: updated.id,
            linkedClientId: matchedContact?.id || updated.clientId || updated.contactId || null,
            linkedOrganizationId: updated.organizationId,
          },
        }).catch(() => undefined);
      }

      await recordCalendarActivity({
        title: 'Rendez-vous Calendly reçu',
        description: `Atelier lié${inviteeEmail ? ` · ${inviteeEmail}` : ''}`,
        relatedId: updated.id,
      });

      return NextResponse.json({ ok: true, status: nextStatus });
    }

    if (startAt && endAt && scheduledEventUri) {
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          externalProvider: 'CALENDLY',
          externalEventId: scheduledEventUri,
        },
      });

      const appointment = existingAppointment
        ? await prisma.appointment.update({
            where: { id: existingAppointment.id },
            data: {
              title: existingAppointment.title || 'Rendez-vous Calendly',
              description: inviteeName || existingAppointment.description,
              startAt,
              endAt,
              status: 'CONFIRMED',
              contactId: matchedContact?.id || existingAppointment.contactId,
            },
          })
        : await prisma.appointment.create({
            data: {
              title: inviteeName ? `Rendez-vous Calendly - ${inviteeName}` : 'Rendez-vous Calendly',
              description: 'Créé automatiquement depuis un webhook Calendly',
              startAt,
              endAt,
              type: 'MEETING',
              status: 'CONFIRMED',
              contactId: matchedContact?.id || null,
              externalProvider: 'CALENDLY',
              externalEventId: scheduledEventUri,
              meetingUrl: scheduledEventUri,
            },
          });

      if (calendlyConnection) {
        await prisma.calendarExternalEvent.upsert({
          where: {
            connectionId_externalEventId: {
              connectionId: calendlyConnection.id,
              externalEventId: scheduledEventUri,
            },
          },
          create: {
            connectionId: calendlyConnection.id,
            provider: 'CALENDLY',
            externalEventId: scheduledEventUri,
            title: appointment.title,
            description: inviteeName || appointment.description,
            startAt,
            endAt,
            meetingUrl: scheduledEventUri,
            status: 'CONFIRMED',
            rawPayload: body,
            linkedCrmAppointmentId: appointment.id,
            linkedClientId: matchedContact?.id || appointment.contactId,
          },
          update: {
            title: appointment.title,
            description: inviteeName || appointment.description,
            startAt,
            endAt,
            meetingUrl: scheduledEventUri,
            status: 'CONFIRMED',
            rawPayload: body,
            linkedCrmAppointmentId: appointment.id,
            linkedClientId: matchedContact?.id || appointment.contactId,
          },
        }).catch(() => undefined);
      }

      await recordCalendarActivity({
        title: matchedContact ? 'Rendez-vous Calendly reçu et lié au client' : 'Rendez-vous Calendly reçu',
        description: inviteeEmail || inviteeName || appointment.title,
        relatedId: appointment.id,
      });

      return NextResponse.json({ ok: true, status: 'CONFIRMED', appointmentId: appointment.id });
    }

    return NextResponse.json({ ok: true, skipped: true, reason: 'missing_schedule_data' });
  }

  if (eventType === 'invitee.canceled') {
    if (workshopRequest) {
      await prisma.workshopRequest.update({
        where: { id: workshopRequest.id },
        data: {
          status: 'EN_ATTENTE_RDV',
        },
      });
    }

    if (scheduledEventUri) {
      await prisma.appointment.updateMany({
        where: {
          externalProvider: 'CALENDLY',
          externalEventId: scheduledEventUri,
        },
        data: {
          status: 'CANCELLED',
        },
      }).catch(() => undefined);

      if (calendlyConnection) {
        await prisma.calendarExternalEvent.updateMany({
          where: {
            connectionId: calendlyConnection.id,
            externalEventId: scheduledEventUri,
          },
          data: {
            status: 'CANCELLED',
            rawPayload: body,
          },
        }).catch(() => undefined);
      }
    }

    await recordCalendarActivity({
      title: 'Rendez-vous Calendly annulé',
      description: inviteeEmail || inviteeName || 'Annulation Calendly',
      relatedId: workshopRequest?.id || null,
    });

    return NextResponse.json({ ok: true, status: 'EN_ATTENTE_RDV' });
  }

  return NextResponse.json({ ok: true, skipped: true, reason: 'event_not_handled' });
}
