import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ContactWorkspace } from '@/features/crm/components/contacts/ContactWorkspace';
import { TimelineItem } from '@/components/crm/timeline';
import { ActivityType, Prisma } from '@prisma/client';

interface PageProps {
  params: { id: string };
}

const LEGACY_TASK_MARKER_REGEX = /\n\n\[[a-z-]+:[0-9a-f-]{36}\]\s*$/i;

function stripLegacyMessageTaskMeta(description: string | null | undefined) {
  if (!description) {
    return null;
  }

  const cleanedDescription = description.replace(LEGACY_TASK_MARKER_REGEX, '').trim();
  return cleanedDescription || null;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const session = await requireCrmSession();

  const activityKindMap: Record<ActivityType, TimelineItem['kind']> = {
    NOTE: 'note',
    CALL: 'call',
    MESSAGE: 'message',
    EMAIL: 'email',
    APPOINTMENT: 'appointment',
    INVOICE: 'invoice',
    PAYMENT: 'payment',
    FORM: 'activity',
    FORM_SUBMISSION: 'activity',
    FILE: 'file',
    TASK: 'task',
  };

  function isMissingTable(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021';
  }

  const [contact, tasks, files] = await Promise.all([
    prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        cases: { orderBy: { createdAt: 'desc' } },
        appointments: { orderBy: { startAt: 'desc' }, take: 20 },
        invoices: { orderBy: { issueDate: 'desc' } },
        activities: { include: { user: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' }, take: 40 },
        organizationLinks: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
              },
            },
          },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        workshopRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
        workshopClientRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
        songRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
        communications: { orderBy: { sentAt: 'desc' }, take: 30 },
        outboundEmails: { orderBy: { sentAt: 'desc' }, take: 30 },
      },
    }).catch((error) => {
      if (isMissingTable(error)) {
        return prisma.contact.findUnique({
          where: { id: params.id },
          include: {
            cases: { orderBy: { createdAt: 'desc' } },
            appointments: { orderBy: { startAt: 'desc' }, take: 20 },
            invoices: { orderBy: { issueDate: 'desc' } },
            activities: { include: { user: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' }, take: 40 },
            organizationLinks: {
              include: {
                organization: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                    address: true,
                  },
                },
              },
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
            },
            workshopRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
            workshopClientRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
            communications: { orderBy: { sentAt: 'desc' }, take: 30 },
          },
        }).then((contactWithoutOptionalModules) => {
          if (!contactWithoutOptionalModules) return null;
          return {
            ...contactWithoutOptionalModules,
            organizationLinks: contactWithoutOptionalModules.organizationLinks,
            workshopRequests: contactWithoutOptionalModules.workshopRequests,
            workshopClientRequests: contactWithoutOptionalModules.workshopClientRequests,
            songRequests: [],
            outboundEmails: [],
          };
        });
      }
      throw error;
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { linkedType: 'CONTACT', linkedId: params.id },
          { caseRecord: { contactId: params.id } },
          { songRequest: { contactId: params.id } },
        ],
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    }).catch((error) => {
      if (isMissingTable(error)) {
        return prisma.task.findMany({
          where: {
            OR: [
              { linkedType: 'CONTACT', linkedId: params.id },
              { caseRecord: { contactId: params.id } },
            ],
          },
          orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        });
      }
      throw error;
    }),
    prisma.fileDocument.findMany({
      where: { contactId: params.id },
      orderBy: { createdAt: 'desc' },
    }).catch((error) => {
      if (isMissingTable(error)) return [];
      throw error;
    }),
  ]);

  if (!contact) notFound();

  const timeline: TimelineItem[] = [
    ...contact.activities.map((item) => ({
      id: `activity-${item.id}`,
      kind: activityKindMap[item.type],
      title: item.title,
      description: item.description,
      date: item.createdAt.toISOString(),
      badge: item.user?.fullName || null,
      meta: item.type,
    })),
    ...contact.communications.map((item) => ({
      id: `communication-${item.id}`,
      kind: (item.channel.includes('mail') ? 'email' : 'message') as TimelineItem['kind'],
      title: item.subject || 'Communication',
      description: item.body,
      date: item.sentAt.toISOString(),
      badge: item.direction,
      meta: item.channel,
    })),
    ...contact.appointments.map((item) => ({
      id: `appointment-${item.id}`,
      kind: 'appointment' as const,
      title: item.title,
      description: item.description,
      date: item.startAt.toISOString(),
      badge: item.status,
      href: '/crm/calendar',
      meta: item.type,
    })),
    ...contact.invoices.map((item) => ({
      id: `invoice-${item.id}`,
      kind: 'invoice' as const,
      title: `Facture ${item.number}`,
      description: item.description,
      date: item.issueDate.toISOString(),
      badge: item.status,
      href: `/crm/invoices/${item.id}`,
      meta: new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(item.amount)),
    })),
    ...contact.songRequests.map((item) => ({
      id: `song-${item.id}`,
      kind: 'song-request' as const,
      title: `${item.songType} · ${item.occasion}`,
      description: null,
      date: item.createdAt.toISOString(),
      badge: item.status,
      href: `/crm/song-requests/${item.id}`,
      meta: 'Demande chanson',
    })),
    ...files.map((item) => ({
      id: `file-${item.id}`,
      kind: 'file' as const,
      title: item.originalName,
      description: null,
      date: item.createdAt.toISOString(),
      href: item.url,
      meta: item.mimeType,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <ContactWorkspace
      contact={{
        id: contact.id,
        fullName: contact.fullName,
        type: contact.type,
        email: contact.email,
        phone: contact.phone,
        companyName: contact.companyName,
        source: contact.source,
        tags: contact.tags,
        notes: contact.notes,
        createdAt: contact.createdAt.toISOString(),
        organizations: contact.organizationLinks.map((item) => ({
          id: item.organization.id,
          name: item.organization.name,
          role: item.role,
          isPrimary: item.isPrimary,
          city: item.organization.city,
          address: item.organization.address,
        })),
        workshopRequests: [...contact.workshopRequests, ...contact.workshopClientRequests].slice(0, 10).map((item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          requestedDate: item.requestedDate?.toISOString() || null,
          contactEmail: item.contactEmail,
          contactPhone: item.contactPhone,
        })),
        communications: contact.communications.map((item) => ({
          id: item.id,
          subject: item.subject,
          body: item.body,
          channel: item.channel,
          direction: item.direction,
          sentAt: item.sentAt.toISOString(),
        })),
        outboundEmails: contact.outboundEmails.map((item) => ({
          id: item.id,
          recipientEmail: item.recipientEmail,
          subject: item.subject,
          messagePreview: item.messagePreview,
          sentAt: item.sentAt.toISOString(),
          openedAt: item.openedAt?.toISOString() || null,
        })),
        songRequests: contact.songRequests.map((item) => ({
          id: item.id,
          title: item.title || 'Demande de chanson',
          songType: item.songType,
          language: item.language,
          eventType: item.eventType,
          theme: item.theme,
          status: item.status,
          createdAt: item.createdAt.toISOString(),
          budget: item.budget?.toString() || null,
        })),
      }}
      tasks={tasks.map((item) => ({
        id: item.id,
        title: item.title,
        description: stripLegacyMessageTaskMeta(item.description),
        status: item.status,
        priority: item.priority,
        dueDate: item.dueDate?.toISOString() || null,
        href: null,
      }))}
      appointments={contact.appointments.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        startAt: item.startAt.toISOString(),
        endAt: item.endAt.toISOString(),
        type: item.type,
        status: item.status,
      }))}
      invoices={contact.invoices.map((item) => ({
        id: item.id,
        number: item.number,
        amount: item.amount.toString(),
        status: item.status,
        issueDate: item.issueDate.toISOString(),
        dueDate: item.dueDate.toISOString(),
        description: item.description,
      }))}
      files={files.map((item) => ({
        id: item.id,
        filename: item.filename,
        originalName: item.originalName,
        url: item.url,
        size: item.size,
        createdAt: item.createdAt.toISOString(),
        mimeType: item.mimeType,
        category: item.category,
        visibility: item.visibility,
      }))}
      timeline={timeline}
      canImpersonate={session.role === 'ADMIN'}
    />
  );
}

