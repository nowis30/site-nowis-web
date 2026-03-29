import { Prisma } from '@prisma/client';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { CrmCalendarPage } from '@/features/crm/components/calendar/CrmCalendarPage';

export default async function CalendarPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  await requireCrmSession();

  const [appointments, contacts, workshopAppointments, workshopAvailabilities] = await Promise.all([
    prisma.appointment.findMany({
      include: {
        contact: { select: { fullName: true } },
      },
      orderBy: { startAt: 'asc' },
    }),
    prisma.contact.findMany({
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true },
      take: 300,
    }),
    prisma.workshopAppointment.findMany({
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
  ]);

  const nextAvailabilityEvents = workshopAvailabilities.flatMap((item) => {
    const events = [] as Array<{ id: string; title: string; description: string | null; startAt: string; endAt: string; type: string; status: string; contactId: null; propertyId: null; contactName: null; propertyName: null; source: 'workshop_availability'; organizationName: null }>;
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
        propertyId: null,
        contactName: null,
        propertyName: null,
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
      type: item.type,
      status: item.status,
      contactId: item.contactId,
      propertyId: null,
      contactName: item.contact?.fullName || null,
      propertyName: null,
      source: 'appointment' as const,
      organizationName: null,
    })),
    ...workshopAppointments.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      startAt: item.startAt.toISOString(),
      endAt: item.endAt.toISOString(),
      type: 'WORKSHOP',
      status: item.status,
      contactId: item.contactId,
      propertyId: null,
      contactName: item.contact?.fullName || null,
      propertyName: null,
      source: 'workshop_appointment' as const,
      organizationName: item.organization?.name || null,
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

  const initialPrefill = prefillTitle || prefillContactId || prefillStart
    ? {
        title: prefillTitle,
        description: prefillDescription,
        startAt: prefillStart,
        endAt: prefillEnd,
        type: prefillType,
        status: prefillStatus,
        contactId: prefillContactId,
      }
    : undefined;

  return (
    <CrmCalendarPage
      initialAppointments={initialAppointments}
      contacts={contacts.map((item) => ({ id: item.id, label: item.fullName }))}
      initialPrefill={initialPrefill}
    />
  );
}
