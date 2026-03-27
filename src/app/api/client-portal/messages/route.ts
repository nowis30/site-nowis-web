import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyClientPortalToken } from '@/lib/client-portal';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { sendPortalEventNotificationEmail } from '@/lib/email-service';
import {
  isMissingMessagesTableError,
  safeCountUnreadAdminMessages,
  safeListMessages,
  safeMarkAdminMessagesRead,
} from '@/lib/messages-store';

const sessionMessageSchema = z.object({
  message: z.string().trim().min(1).max(4000),
});

const legacyMessageSchema = z.object({
  token: z.string().trim().min(1),
  songRequestId: z.string().uuid().optional().or(z.literal('')),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(1).max(4000),
});

export async function GET(request: NextRequest) {
  try {
    const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);

    if (!session) {
      return NextResponse.json({ error: 'Session client invalide' }, { status: 401 });
    }

    const markAsRead = request.nextUrl.searchParams.get('markAsRead') === '1';

    if (markAsRead) {
      await safeMarkAdminMessagesRead(session.contactId);
    }

    const [items, unreadCount] = await Promise.all([
      safeListMessages(session.contactId),
      safeCountUnreadAdminMessages(session.contactId),
    ]);

    return NextResponse.json({ items, unreadCount });
  } catch (error) {
    console.error('[CLIENT_PORTAL_MESSAGES_GET]', error);
    return NextResponse.json({ error: 'Chargement impossible' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);

    if (session) {
      const payload = sessionMessageSchema.parse(body);

      const item = await prisma.message.create({
        data: {
          contactId: session.contactId,
          senderType: 'CLIENT',
          content: payload.message,
          isRead: false,
        },
      });

      await prisma.activity.create({
        data: {
          type: 'MESSAGE',
          title: 'Message client reçu',
          description: payload.message,
          contactId: session.contactId,
        },
      });

      await sendPortalEventNotificationEmail({
        eventLabel: 'Portail client',
        subject: 'Nouveau message client',
        headline: 'Message client',
        lines: [
          `Client: ${session.fullName}`,
          `Email: ${session.email}`,
          `Message: ${payload.message}`,
        ],
      });

      return NextResponse.json({ item }, { status: 201 });
    }

    const payload = legacyMessageSchema.parse(body);
    const legacySession = verifyClientPortalToken(payload.token);

    if (!legacySession) {
      return NextResponse.json({ error: 'Lien client invalide' }, { status: 401 });
    }

    if (payload.songRequestId) {
      const songRequest = await prisma.songRequest.findFirst({
        where: { id: payload.songRequestId, contactId: legacySession.contactId },
        select: { id: true },
      });

      if (!songRequest) {
        return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
      }
    }

    const activity = await prisma.activity.create({
      data: {
        type: 'MESSAGE',
        title: `Message client : ${payload.subject}`,
        description: payload.message,
        contactId: legacySession.contactId,
        songRequestId: payload.songRequestId || null,
      },
    });

    const item = await prisma.message.create({
      data: {
        contactId: legacySession.contactId,
        senderType: 'CLIENT',
        content: payload.message,
        isRead: false,
      },
    });

    await sendPortalEventNotificationEmail({
      eventLabel: 'Portail client',
      subject: `Nouveau message client : ${payload.subject}`,
      headline: payload.subject,
      lines: [
        `Client: ${legacySession.fullName}`,
        `Email: ${legacySession.email}`,
        payload.songRequestId ? `Demande: ${payload.songRequestId}` : null,
        `Message: ${payload.message}`,
      ],
    });

    return NextResponse.json({ item, activity }, { status: 201 });
  } catch (error) {
    if (isMissingMessagesTableError(error)) {
      return NextResponse.json({ error: 'Messagerie client indisponible tant que la migration messages n\'est pas appliquée.' }, { status: 503 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    console.error('[CLIENT_PORTAL_MESSAGE_CREATE]', error);
    return NextResponse.json({ error: 'Envoi impossible' }, { status: 500 });
  }
}
