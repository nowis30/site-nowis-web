import type { WorkshopRequest } from '@prisma/client';

export function toClientWorkshopDto(item: WorkshopRequest & {
  organization?: { name: string } | null;
  appointments?: unknown[];
  crmAppointments?: unknown[];
}) {
  return {
    id: item.id, title: item.title, status: item.status, objectives: item.objectives, notes: item.notes,
    participantEstimate: item.participantEstimate, estimatedParticipants: item.estimatedParticipants,
    location: item.location, addressOrLocation: item.addressOrLocation,
    requestedDate: item.requestedDate, requestedTime: item.requestedTime,
    durationMinutes: item.durationMinutes, meetingType: item.meetingType,
    contactPerson: item.contactPerson, contactPhone: item.contactPhone, contactEmail: item.contactEmail,
    scheduledAt: item.scheduledAt, startAt: item.startAt, endAt: item.endAt, bookingUrl: item.bookingUrl,
    createdAt: item.createdAt, updatedAt: item.updatedAt,
    organization: item.organization ? { name: item.organization.name } : null,
    appointments: item.appointments?.map(toClientAppointment), crmAppointments: item.crmAppointments?.map(toClientAppointment),
  };
}

function toClientAppointment(value: unknown) {
  const item = value as Record<string, unknown>;
  return { id: item.id, title: item.title, startAt: item.startAt, endAt: item.endAt, status: item.status, location: item.location, type: item.type };
}
