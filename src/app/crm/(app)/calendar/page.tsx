import { Prisma } from '@prisma/client';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { loadExternalCalendarEvents } from '@/lib/external-calendars';
import { CrmCalendarPage } from '@/features/crm/components/calendar/CrmCalendarPage';

export default async function CalendarPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  await requireCrmSession();

  const [appointments, contacts, organizations, workshopRequests, songRequests, workshopAppointments, workshopAvailabilities, externalCalendarEvents, calendarConnections] = await Promise.all([
    prisma.appointment.findMany({
      where: { status: { not: 'CANCELLED' } },
      include: {
        contact: { select: { fullName: true } },
        organization: { select: { id: true, name: true } },
        workshopRequest: { select: { id: true, title: true } },
        songRequest: { select: { id: true, title: true, occasion: true } },
      },
      orderBy: { startAt: 'asc' },
    }),
    prisma.contact.findMany({
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true },
      take: 300,
    }),
    prisma.organization.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
      take: 300,
    }),
    prisma.workshopRequest.findMany({
      where: { status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        contactId: true,
        organizationId: true,
      },
      take: 300,
    }),
    prisma.songRequest.findMany({
      where: { status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        occasion: true,
        contactId: true,
        organizationId: true,
      },
      take: 300,
    }),
    prisma.workshopAppointment.findMany({
      where: { status: { not: 'CANCELLED' } },
      include: {
        organization: { select: { name: true } },
        contact: { select: { fullName: true } },
      },
      orderBy: { startAt: 'asc' },
      take: 300,
    }).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') return [];
      throw error;
    }),
    prisma.workshopAvailability.findMany({
      where: { isActive: true },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
      take: 50,
    }).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') return [];
      throw error;
    }),
    loadExternalCalendarEvents(),
    prisma.calendarConnection.findMany({
      where: {
        status: { in: ['CONNECTED', 'EXPIRED', 'ERROR'] },
      },
      orderBy: [{ provider: 'asc' }, { accountEmail: 'asc' }],
      select: {
        id: true,
        provider: true,
        accountEmail: true,
        accountName: true,
        status: true,
      },
    }).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') return [];
      throw error;
    }),
  ]);

  const nextAvailabilityEvents = workshopAvailabilities.flatMap((item) => {
    const events = [] as Array<{ id: string; title: string; description: string | null; startAt: string; endAt: string; type: string; status: string; contactId: null; contactName: null; source: 'workshop_availability'; organizationName: null }>;
    const now = new Date();
    const jsWeekday = item.weekday % 7;

    for (let weekOffset = 0; weekOffset < 6; weekOffset += 1) {
      const start = new Date(now);
      const delta = (jsWeekday - start.getDay() + 7) % 7 + weekOffset * 7;
      start.setDate(start.getDate() + delta);
      const [startHour, startMinute] = item.startTime.split(':').map(Number);
      const [endHour, endMinute] = item.endTime.split(':').map(Number);
      start.setHours(startHour, startMinute, 0, 0);
      const end = new Date(start);
      end.setHours(endHour, endMinute, 0, 0);
      events.push({
        id: `availability-${item.id}-${weekOffset}`,
        title: 'Disponibilité atelier',
        description: item.capacity ? `Capacité ${item.capacity}` : 'Créneau atelier ouvert',
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        type: 'AVAILABILITY',
        status: 'ACTIVE',
        contactId: null,
        contactName: null,
        source: 'workshop_availability',
        organizationName: null,
      });
    }

    return events;
  });

  const initialAppointments = [
    ...appointments.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      startAt: item.startAt.toISOString(),
      endAt: item.endAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      type: item.type,
      status: item.status,
      contactId: item.contactId,
      contactName: item.contact?.fullName || null,
      calendarConnectionId: item.calendarConnectionId,
      meetingUrl: item.meetingUrl,
      organizationId: item.organizationId,
      organizationName: item.organization?.name || null,
      workshopRequestId: item.workshopRequestId,
      workshopRequestTitle: item.workshopRequest?.title || null,
      songRequestId: item.songRequestId,
      songRequestTitle: item.songRequest?.title || item.songRequest?.occasion || null,
      source: 'appointment' as const,
    })),
    ...workshopAppointments.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      startAt: item.startAt.toISOString(),
      endAt: item.endAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      type: 'WORKSHOP',
      status: item.status,
      contactId: item.contactId,
      contactName: item.contact?.fullName || null,
      source: 'workshop_appointment' as const,
      workshopRequestId: item.workshopRequestId,
      organizationName: item.organization?.name || null,
    })),
    ...externalCalendarEvents.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      startAt: item.startAt,
      endAt: item.endAt,
      type: item.source === 'google_calendar' ? 'GOOGLE' : item.source === 'microsoft_calendar' ? 'MICROSOFT' : 'CALENDLY',
      status: 'CONFIRMED',
      contactId: null,
      contactName: item.source === 'google_calendar' ? 'Google Calendar' : item.source === 'microsoft_calendar' ? 'Microsoft Calendar' : 'Calendly',
      calendarConnectionId: null,
      meetingUrl: null,
      source: item.source,
      organizationName: null,
    })),
    ...nextAvailabilityEvents,
  ].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const getParam = (key: string) => {
    const value = searchParams?.[key];
    return typeof value === 'string' ? value : undefined;
  };

  const prefillStart = getParam('startAt');
  const prefillEnd = getParam('endAt');
  const prefillTitle = getParam('title');
  const prefillDescription = getParam('description');
  const prefillContactId = getParam('contactId');
  const prefillType = getParam('type');
  const prefillStatus = getParam('status');
  const prefillOrganizationId = getParam('organizationId');
  const prefillWorkshopRequestId = getParam('workshopRequestId');
  const prefillSongRequestId = getParam('songRequestId');

  const initialPrefill = prefillTitle || prefillContactId || prefillStart
    ? {
        title: prefillTitle,
        description: prefillDescription,
        startAt: prefillStart,
        endAt: prefillEnd,
        type: prefillType,
        status: prefillStatus,
        contactId: prefillContactId,
        organizationId: prefillOrganizationId,
        workshopRequestId: prefillWorkshopRequestId,
        songRequestId: prefillSongRequestId,
      }
    : undefined;

  return (
    <CrmCalendarPage
      initialAppointments={initialAppointments}
      contacts={contacts.map((item) => ({ id: item.id, label: item.fullName }))}
      organizations={organizations.map((item) => ({ id: item.id, label: item.name }))}
      workshopRequests={workshopRequests.map((item) => ({ id: item.id, label: item.title, contactId: item.contactId, organizationId: item.organizationId }))}
      songRequests={songRequests.map((item) => ({ id: item.id, label: item.title || item.occasion || 'Demande de chanson', contactId: item.contactId, organizationId: item.organizationId }))}
      calendarConnections={calendarConnections.map((item) => ({
        id: item.id,
        label: `${item.provider} · ${item.accountEmail || item.accountName || 'Compte connecté'}`,
        provider: item.provider,
        status: item.status,
      }))}
      initialPrefill={initialPrefill}
    />
  );
}
