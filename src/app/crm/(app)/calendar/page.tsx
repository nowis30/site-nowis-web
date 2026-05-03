import { Prisma } from '@prisma/client';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { loadExternalCalendarEvents } from '@/lib/external-calendars';
import { CrmCalendarPage } from '@/features/crm/components/calendar/CrmCalendarPage';

export default async function CalendarPage() {
  await requireCrmSession();

  const isAppointmentVisible = (status: string) => !['CANCELLED', 'DELETED', 'ARCHIVED', 'CANCELLED_BY_CLIENT'].includes(status);
  const isWorkshopVisible = (status: string) => !['CANCELLED', 'DELETED', 'ARCHIVED', 'ANNULE'].includes(status);
  const isSongVisible = (status: string) => !['CANCELLED', 'DELETED', 'ARCHIVED'].includes(status);
  const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const [appointments, contacts, organizations, workshopRequests, songRequests, workshopAppointments, workshopAvailabilities, externalCalendarEvents] = await Promise.all([
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
        status: true,
        startAt: true,
        endAt: true,
        scheduledAt: true,
        durationMinutes: true,
        location: true,
        addressOrLocation: true,
        contactId: true,
        organizationId: true,
        contact: { select: { fullName: true } },
        organization: { select: { name: true } },
        crmAppointments: {
          where: { status: { not: 'CANCELLED' } },
          select: { id: true, startAt: true, endAt: true, status: true },
        },
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
        status: true,
        meetingDate: true,
        scheduledAt: true,
        startAt: true,
        endAt: true,
        durationMinutes: true,
        location: true,
        contactId: true,
        organizationId: true,
        contact: { select: { fullName: true } },
        organization: { select: { name: true } },
        appointments: {
          where: { status: { not: 'CANCELLED' } },
          select: { id: true, startAt: true, endAt: true, status: true },
        },
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

  const workshopFallbackEvents = workshopRequests
    .filter((item) => {
      if (!isWorkshopVisible(item.status)) return false;
      const start = item.startAt || item.scheduledAt;
      const end = item.endAt || (start && item.durationMinutes ? new Date(start.getTime() + item.durationMinutes * 60_000) : null);
      if (!start || !end) return false;
      const hasActiveLinkedAppointment = item.crmAppointments.some((appointment) => isAppointmentVisible(appointment.status));
      return !hasActiveLinkedAppointment;
    })
    .map((item) => {
      const start = item.startAt || item.scheduledAt!;
      const end = item.endAt || new Date(start.getTime() + (item.durationMinutes || 60) * 60_000);
      return {
        id: `workshop:${item.id}`,
        sourceType: 'workshop' as const,
        sourceId: item.id,
        canRemoveFromCalendar: true,
        title: item.title,
        description: 'Atelier planifié',
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        type: 'WORKSHOP',
        status: item.status,
        contactId: item.contactId,
        contactName: item.contact?.fullName || null,
        organizationId: item.organizationId,
        organizationName: item.organization?.name || null,
        workshopRequestId: item.id,
        workshopRequestTitle: item.title,
      };
    });

  const songFallbackEvents = songRequests
    .filter((item) => {
      if (!isSongVisible(item.status)) return false;
      const start = item.startAt || item.scheduledAt || item.meetingDate;
      const end = item.endAt || (start && item.durationMinutes ? new Date(start.getTime() + item.durationMinutes * 60_000) : null);
      if (!start || !end) return false;
      const hasActiveLinkedAppointment = item.appointments.some((appointment) => isAppointmentVisible(appointment.status));
      return !hasActiveLinkedAppointment;
    })
    .map((item) => {
      const start = item.startAt || item.scheduledAt || item.meetingDate!;
      const end = item.endAt || new Date(start.getTime() + (item.durationMinutes || 45) * 60_000);
      return {
        id: `song-request:${item.id}`,
        sourceType: 'song-request' as const,
        sourceId: item.id,
        canRemoveFromCalendar: true,
        title: item.title || item.occasion || 'Rencontre chanson',
        description: item.occasion || 'Demande chanson planifiée',
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        type: 'SONG_MEETING',
        status: item.status,
        contactId: item.contactId,
        contactName: item.contact?.fullName || null,
        organizationId: item.organizationId,
        organizationName: item.organization?.name || null,
        songRequestId: item.id,
        songRequestTitle: item.title || item.occasion || null,
      };
    });

  const initialAppointments = [
    ...appointments.map((item) => ({
      id: `appointment:${item.id}`,
      sourceType: 'appointment' as const,
      sourceId: item.id,
      canRemoveFromCalendar: true,
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
      id: `workshop:${item.id}`,
      sourceType: 'workshop' as const,
      sourceId: item.workshopRequestId,
      canRemoveFromCalendar: true,
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
    ...workshopFallbackEvents,
    ...songFallbackEvents,
    ...externalCalendarEvents.map((item) => ({
      id: `external:${item.id}`,
      sourceType: 'external' as const,
      sourceId: item.id,
      canRemoveFromCalendar: isUuid(item.id),
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
    ...nextAvailabilityEvents.map((item) => ({
      ...item,
      sourceType: 'availability' as const,
      sourceId: item.id,
      canRemoveFromCalendar: false,
    })),
  ].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return (
    <CrmCalendarPage
      initialAppointments={initialAppointments}
      contacts={contacts.map((item) => ({ id: item.id, label: item.fullName }))}
      organizations={organizations.map((item) => ({ id: item.id, label: item.name }))}
    />
  );
}
