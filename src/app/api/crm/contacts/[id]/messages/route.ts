import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { prisma } from '@/lib/prisma';
import { isIncomingMessageTask } from '@/lib/contact-message-tasks';
import {
  isMissingMessagesTableError,
  safeCountUnreadClientMessages,
  safeListMessages,
  safeMarkClientMessagesRead,
} from '@/lib/messages-store';

const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'contacts', 'read');
  if (guard.error) return guard.error;

  try {
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
    }

    const markAsRead = request.nextUrl.searchParams.get('markAsRead') === '1';

    if (markAsRead) {
      await safeMarkClientMessagesRead(contact.id);
    }

    const [items, unreadCount] = await Promise.all([
      safeListMessages(contact.id),
      safeCountUnreadClientMessages(contact.id),
    ]);

    return NextResponse.json({ items, unreadCount });
  } catch (error) {
    console.error('[CRM_CONTACT_MESSAGES_GET]', error);
    return NextResponse.json({ error: 'Chargement impossible' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'contacts', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = createMessageSchema.parse(await request.json());

    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
    }

    const message = await prisma.$transaction(async (tx) => {
      const createdMessage = await tx.message.create({
        data: {
          contactId: contact.id,
          senderType: 'ADMIN',
          content: payload.content,
          isRead: false,
        },
      });

      await tx.activity.create({
        data: {
          type: 'MESSAGE',
          title: 'Message envoye au client',
          description: payload.content,
          contactId: contact.id,
          userId: guard.session.sub,
        },
      });

      const openTasks = await tx.task.findMany({
        where: {
          linkedType: 'CONTACT',
          linkedId: contact.id,
          status: { not: 'DONE' },
        },
        select: {
          id: true,
          title: true,
          linkedType: true,
          linkedId: true,
          description: true,
        },
      });

      const taskIdsToClose = openTasks.filter(isIncomingMessageTask).map((item) => item.id);

      if (taskIdsToClose.length > 0) {
        await tx.task.updateMany({
          where: { id: { in: taskIdsToClose } },
          data: { status: 'DONE' },
        });
      }

      return createdMessage;
    });

    return NextResponse.json({ item: message }, { status: 201 });
  } catch (error) {
    if (isMissingMessagesTableError(error)) {
      return NextResponse.json({ error: 'Messagerie CRM indisponible tant que la migration messages n\'est pas appliquée.' }, { status: 503 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    console.error('[CRM_CONTACT_MESSAGE_CREATE]', error);
    return NextResponse.json({ error: 'Envoi impossible' }, { status: 500 });
  }
}
