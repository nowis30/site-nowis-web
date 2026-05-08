import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCalendarAdminAccess } from '@/lib/calendar/oauth-routes';

export async function GET(request: NextRequest) {
  const guard = requireCalendarAdminAccess(request, 'read');
  if (guard.error) return guard.error;

  const now = new Date();
  const in180Days = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

  const [appointments, workshopRequests, externalEvents, visibleUpcomingCount, cancelledCount, calendlyConnection] = await Promise.all([
    prisma.appointment.findMany({
      where: { externalProvider: 'CALENDLY' },
      orderBy: [{ startAt: 'desc' }, { updatedAt: 'desc' }],
      take: 20,
      select: {
        id: true,
        title: true,
        status: true,
        type: true,
        startAt: true,
        endAt: true,
        externalEventId: true,
        contactId: true,
        workshopRequestId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.workshopRequest.findMany({
      where: {
        OR: [
          { calendlyEventUri: { not: null } },
          { calendlyInviteeUri: { not: null } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        status: true,
        calendlyEventUri: true,
        calendlyInviteeUri: true,
        startAt: true,
        endAt: true,
        scheduledAt: true,
        durationMinutes: true,
        meetingType: true,
        contactId: true,
        organizationId: true,
        updatedAt: true,
      },
    }),
    prisma.calendarExternalEvent.findMany({
      where: { provider: 'CALENDLY' },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        connectionId: true,
        externalEventId: true,
        title: true,
        status: true,
        startAt: true,
        endAt: true,
        linkedCrmAppointmentId: true,
        linkedWorkshopRequestId: true,
        linkedClientId: true,
        linkedOrganizationId: true,
        updatedAt: true,
      },
    }),
    prisma.appointment.count({
      where: {
        externalProvider: 'CALENDLY',
        status: 'CONFIRMED',
        startAt: { gte: now, lte: in180Days },
      },
    }),
    prisma.appointment.count({
      where: {
        externalProvider: 'CALENDLY',
        status: 'CANCELLED',
      },
    }),
    prisma.calendarConnection.findFirst({
      where: { provider: 'CALENDLY' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        provider: true,
        status: true,
        accountEmail: true,
        accountName: true,
        providerAccountId: true,
        lastSyncedAt: true,
        lastError: true,
        updatedAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    diagnosticsAt: new Date().toISOString(),
    counters: {
      calendlyAppointmentsVisibleNext180Days: visibleUpcomingCount,
      calendlyAppointmentsCancelled: cancelledCount,
      hasCalendlyConnection: Boolean(calendlyConnection),
    },
    latest: {
      appointments,
      workshopRequests,
      calendarExternalEvents: externalEvents,
    },
    calendlyConnection,
  });
}
