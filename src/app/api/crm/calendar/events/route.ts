import { NextRequest, NextResponse } from 'next/server';
import { CalendarProvider } from '@prisma/client';
import { z } from 'zod';
import { createExternalCalendarEvent, listStoredCalendarEvents, recordCalendarActivity, toSafeConnection } from '@/lib/calendar/service';
import { requireCalendarAdminAccess } from '@/lib/calendar/oauth-routes';

const eventCreateSchema = z.object({
  connectionId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().trim().max(120).optional().or(z.literal('')),
  location: z.string().trim().max(240).optional().or(z.literal('')),
  linkedCrmAppointmentId: z.string().uuid().optional().or(z.literal('')),
  linkedWorkshopRequestId: z.string().uuid().optional().or(z.literal('')),
  linkedClientId: z.string().uuid().optional().or(z.literal('')),
  linkedOrganizationId: z.string().uuid().optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  const guard = requireCalendarAdminAccess(request, 'read');
  if (guard.error) return guard.error;

  const providerValue = request.nextUrl.searchParams.get('provider');
  const contactId = request.nextUrl.searchParams.get('contactId');
  const organizationId = request.nextUrl.searchParams.get('organizationId');
  const provider = providerValue && ['GOOGLE', 'MICROSOFT', 'CALENDLY', 'ICLOUD'].includes(providerValue.toUpperCase())
    ? providerValue.toUpperCase() as CalendarProvider
    : null;

  const items = await listStoredCalendarEvents({
    provider,
    contactId,
    organizationId,
  });

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      provider: item.provider,
      title: item.title,
      description: item.description,
      startAt: item.startAt.toISOString(),
      endAt: item.endAt.toISOString(),
      timezone: item.timezone,
      location: item.location,
      meetingUrl: item.meetingUrl,
      status: item.status,
      connection: toSafeConnection(item.connection),
      linkedClient: item.linkedClient,
      linkedOrganization: item.linkedOrganization,
    })),
  });
}

export async function POST(request: NextRequest) {
  const guard = requireCalendarAdminAccess(request, 'update');
  if (guard.error) return guard.error;

  try {
    const payload = eventCreateSchema.parse(await request.json());
    const item = await createExternalCalendarEvent({
      connectionId: payload.connectionId,
      title: payload.title,
      description: payload.description || null,
      startAt: new Date(payload.startAt),
      endAt: new Date(payload.endAt),
      timezone: payload.timezone || null,
      location: payload.location || null,
      linkedCrmAppointmentId: payload.linkedCrmAppointmentId || null,
      linkedWorkshopRequestId: payload.linkedWorkshopRequestId || null,
      linkedClientId: payload.linkedClientId || null,
      linkedOrganizationId: payload.linkedOrganizationId || null,
    });

    await recordCalendarActivity({
      title: 'Événement externe créé',
      description: `${item.provider} · ${item.title}`,
      userId: guard.session.sub,
      relatedId: item.connectionId,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Création de l’événement impossible';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}