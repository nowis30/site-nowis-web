import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { CrmCalendarPage } from '@/features/crm/components/calendar/CrmCalendarPage';

export default async function CalendarPage() {
  await requireCrmSession();

  const [appointments, contacts, properties] = await Promise.all([
    prisma.appointment.findMany({
      include: {
        contact: { select: { fullName: true } },
        property: { select: { name: true } },
      },
      orderBy: { startAt: 'asc' },
    }),
    prisma.contact.findMany({
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true },
      take: 300,
    }),
    prisma.property.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
      take: 200,
    }),
  ]);

  return (
    <CrmCalendarPage
      initialAppointments={appointments.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        startAt: item.startAt.toISOString(),
        endAt: item.endAt.toISOString(),
        type: item.type,
        status: item.status,
        contactId: item.contactId,
        propertyId: item.propertyId,
        contactName: item.contact?.fullName || null,
        propertyName: item.property?.name || null,
      }))}
      contacts={contacts.map((item) => ({ id: item.id, label: item.fullName }))}
      properties={properties.map((item) => ({ id: item.id, label: `${item.name} (${item.code})` }))}
    />
  );
}