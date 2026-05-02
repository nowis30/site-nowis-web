import { Prisma } from '@prisma/client';
import { notFound } from 'next/navigation';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { listCalendarConnections } from '@/lib/calendar/service';
import { WorkshopRequestAdminPage } from '@/features/crm/components/workshops/WorkshopRequestAdminPage';

type WorkshopRequestDetailRecord = Prisma.WorkshopRequestGetPayload<{
  include: {
    organization: true;
    contact: true;
    client: true;
    organizationContact: true;
    appointments: true;
    crmAppointments: true;
    commercialQuotes: true;
  };
}>;

export default async function WorkshopRequestDetailPage({ params }: { params: { id: string } }) {
  const session = await requireCrmSession();
  const isAdmin = session.role === 'ADMIN';

  let item: WorkshopRequestDetailRecord | null = null;
  try {
    item = await prisma.workshopRequest.findUnique({
      where: { id: params.id },
      include: {
        organization: true,
        contact: true,
        client: true,
        organizationContact: true,
        appointments: { orderBy: { startAt: 'asc' } },
        crmAppointments: { orderBy: { startAt: 'asc' } },
        commercialQuotes: { orderBy: { createdAt: 'desc' }, take: 12 },
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021')) {
      throw error;
    }
  }

  if (!item) notFound();

  const calendarConnections = await listCalendarConnections();

  return (
    <WorkshopRequestAdminPage
      item={{
        id: item.id,
        title: item.title,
        status: item.status,
        workshopType: item.workshopType,
        workshopTheme: item.workshopTheme,
        organizationId: item.organizationId,
        organizationName: item.organizationName,
        contactId: item.contactId,
        clientId: item.clientId,
        organizationContactId: item.organizationContactId,
        contactPerson: item.contactPerson,
        contactEmail: item.contactEmail,
        contactPhone: item.contactPhone,
        addressOrLocation: item.addressOrLocation,
        location: item.location,
        estimatedParticipants: item.estimatedParticipants,
        participantEstimate: item.participantEstimate,
        finalPrice: item.finalPrice?.toString() || null,
        requestedDate: item.requestedDate?.toISOString() || null,
        requestedTime: item.requestedTime,
        scheduledAt: item.scheduledAt?.toISOString() || null,
        startAt: item.startAt?.toISOString() || null,
        endAt: item.endAt?.toISOString() || null,
        durationMinutes: item.durationMinutes ?? null,
        meetingType: item.meetingType ?? null,
        durationPreset: item.durationPreset,
        objectives: item.objectives,
        notes: item.notes,
        internalNotes: item.internalNotes,
        organization: item.organization ? { id: item.organization.id, name: item.organization.name } : null,
        contact: item.contact ? { id: item.contact.id, fullName: item.contact.fullName } : null,
        client: item.client ? { id: item.client.id, fullName: item.client.fullName } : null,
        organizationContact: item.organizationContact ? { id: item.organizationContact.id, contactId: item.organizationContact.contactId, fullName: item.organizationContact.fullName } : null,
        appointments: item.appointments.map((appointment) => ({
          id: appointment.id,
          title: appointment.title,
          startAt: appointment.startAt.toISOString(),
          endAt: appointment.endAt.toISOString(),
          status: appointment.status,
          location: appointment.location,
        })),
        crmAppointments: item.crmAppointments.map((appointment) => ({
          id: appointment.id,
          title: appointment.title,
          startAt: appointment.startAt.toISOString(),
          endAt: appointment.endAt.toISOString(),
          status: appointment.status,
          type: appointment.type,
          location: appointment.location,
        })),
        commercialQuotes: item.commercialQuotes.map((quote) => ({
          id: quote.id,
          quoteNumber: quote.quoteNumber,
          title: quote.title,
          status: quote.status,
          totalAmount: quote.totalAmount.toString(),
          currency: quote.currency,
          createdAt: quote.createdAt.toISOString(),
        })),
      }}
      calendarConnections={calendarConnections.map((connection) => ({
        id: connection.id,
        provider: connection.provider,
        accountName: connection.accountName,
        accountEmail: connection.accountEmail,
        status: connection.status,
      }))}
      isAdmin={isAdmin}
    />
  );
}