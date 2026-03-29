import { requireCrmSession } from '@/features/crm/auth/session';
import { buildContactMessageTaskHref, extractIncomingMessageTaskMeta } from '@/lib/contact-message-tasks';
import { safeListMessages } from '@/lib/messages-store';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ContactWorkspace } from '@/features/crm/components/contacts/ContactWorkspace';
import { TimelineItem } from '@/components/crm/timeline';
import { ActivityType, Prisma } from '@prisma/client';

interface PageProps {
  params: { id: string };
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

  const [contact, tasks, files, messages] = await Promise.all([
    prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        cases: { orderBy: { createdAt: 'desc' } },
        appointments: { orderBy: { startAt: 'desc' }, take: 20 },
        invoices: { orderBy: { issueDate: 'desc' } },
        activities: { include: { user: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' }, take: 40 },
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
            communications: { orderBy: { sentAt: 'desc' }, take: 30 },
          },
        }).then((contactWithoutOptionalModules) => {
          if (!contactWithoutOptionalModules) return null;
          return {
            ...contactWithoutOptionalModules,
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
    safeListMessages(params.id),
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
    ...messages.map((item) => ({
      id: `message-${item.id}`,
      kind: 'message' as const,
      title: item.senderType === 'CLIENT' ? 'Message client' : 'Message Nowis',
      description: item.content,
      date: item.createdAt.toISOString(),
      badge: item.senderType,
      meta: item.isRead ? 'Lu' : 'Non lu',
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
        communications: contact.communications.map((item) => ({
          id: item.id,
          subject: item.subject,
          body: item.body,
          channel: item.channel,
          direction: item.direction,
          sentAt: item.sentAt.toISOString(),
        })),
        messages: messages.map((item) => ({
          id: item.id,
          senderType: item.senderType,
          content: item.content,
          createdAt: item.createdAt.toISOString(),
          isRead: item.isRead,
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
        description: extractIncomingMessageTaskMeta(item.description).description,
        status: item.status,
        priority: item.priority,
        dueDate: item.dueDate?.toISOString() || null,
        href: item.linkedType === 'CONTACT' ? (() => {
          const { messageId } = extractIncomingMessageTaskMeta(item.description);
          return messageId ? buildContactMessageTaskHref(contact.id, messageId) : null;
        })() : null,
      }))}
      appointments={contact.appointments.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        startAt: item.startAt.toISOString(),
        endAt: item.endAt.toISOString(),
        type: item.type,
        status: item.status,
        property: null,
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
      unreadClientMessages={messages.filter((item) => item.senderType === 'CLIENT' && !item.isRead).length}
      canImpersonate={session.role === 'ADMIN'}
    />
  );
}

