import { notFound } from 'next/navigation';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { AppointmentDetailPage } from '@/features/crm/components/appointments/AppointmentDetailPage';

export default async function CrmAppointmentDetailPage({ params }: { params: { id: string } }) {
  await requireCrmSession();

  const item = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      contact: { select: { id: true, fullName: true, email: true, phone: true } },
      organization: { select: { id: true, name: true } },
      workshopRequest: { select: { id: true, title: true, status: true } },
      songRequest: { select: { id: true, title: true, status: true } },
    },
  });

  if (!item) notFound();

  const [contacts, organizations, workshopRequests, songRequests] = await Promise.all([
    prisma.contact.findMany({ select: { id: true, fullName: true }, orderBy: { fullName: 'asc' }, take: 300 }),
    prisma.organization.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' }, take: 200 }),
    prisma.workshopRequest.findMany({ select: { id: true, title: true, contactId: true, organizationId: true }, orderBy: { createdAt: 'desc' }, take: 150 }),
    prisma.songRequest.findMany({ select: { id: true, title: true, contactId: true, organizationId: true }, orderBy: { createdAt: 'desc' }, take: 150 }),
  ]);

  type ContactType = { id: string; fullName: string; email: string | null; phone: string | null };
  const contact = item.contact as ContactType | null;

  return (
    <AppointmentDetailPage
      item={{
        id: item.id,
        title: item.title,
        description: item.description ?? null,
        startAt: item.startAt.toISOString(),
        endAt: item.endAt.toISOString(),
        type: item.type,
        status: item.status,
        location: item.location ?? null,
        notes: item.notes ?? null,
        meetingUrl: item.meetingUrl ?? null,
        contactId: item.contactId ?? null,
        organizationId: item.organizationId ?? null,
        workshopRequestId: item.workshopRequestId ?? null,
        songRequestId: item.songRequestId ?? null,
        calendarConnectionId: item.calendarConnectionId ?? null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        contact: contact ? { id: contact.id, fullName: contact.fullName, email: contact.email, phone: contact.phone } : null,
        organization: item.organization ? { id: item.organization.id, name: item.organization.name } : null,
        workshopRequest: item.workshopRequest ? { id: item.workshopRequest.id, title: item.workshopRequest.title ?? 'Atelier', status: String(item.workshopRequest.status) } : null,
        songRequest: item.songRequest ? { id: item.songRequest.id, title: item.songRequest.title ?? 'Demande chanson', status: String(item.songRequest.status) } : null,
      }}
      contacts={contacts.map((c) => ({ id: c.id, label: c.fullName }))}
      organizations={organizations.map((o) => ({ id: o.id, label: o.name }))}
      workshopRequests={workshopRequests.map((w) => ({ id: w.id, label: w.title ?? 'Atelier', contactId: w.contactId, organizationId: w.organizationId }))}
      songRequests={songRequests.map((s) => ({ id: s.id, label: s.title ?? 'Demande chanson', contactId: s.contactId, organizationId: s.organizationId }))}
    />
  );
}