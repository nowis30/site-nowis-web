import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyTenantPortalToken } from '@/lib/client-portal';
import { buildIncomingMessageTaskDescription } from '@/lib/contact-message-tasks';
import { sendPortalEventNotificationEmail } from '@/lib/email-service';
import { isMissingMessagesTableError } from '@/lib/messages-store';

const tenantMessageSchema = z.object({
  token: z.string().trim().min(1),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(5).max(4000),
});

export async function POST(request: NextRequest) {
  try {
    const payload = tenantMessageSchema.parse(await request.json());
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = verifyTenantPortalToken(payload.token);

    if (!session) {
      return NextResponse.json({ error: 'Lien locataire invalide' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { id: session.tenantId, contactId: session.contactId },
      select: { id: true, contactId: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Locataire introuvable' }, { status: 404 });
    }

    const { activity, item } = await prisma.$transaction(async (tx) => {
      const createdActivity = await tx.activity.create({
        data: {
          type: 'MESSAGE',
          title: `Message locataire : ${payload.subject}`,
          description: payload.message,
          contactId: tenant.contactId,
        },
      });

      const message = await tx.message.create({
        data: {
          contactId: tenant.contactId,
          senderType: 'CLIENT',
          content: payload.message,
          isRead: false,
        },
      });

      await tx.task.create({
        data: {
          title: `Repondre au message de ${session.fullName}`,
          description: buildIncomingMessageTaskDescription(payload.message, message.id),
          status: 'TODO',
          priority: 'HIGH',
          dueDate,
          linkedType: 'CONTACT',
          linkedId: tenant.contactId,
        },
      });

      return { activity: createdActivity, item: message };
    });

    await sendPortalEventNotificationEmail({
      eventLabel: 'Portail locataire',
      subject: `Nouveau message locataire : ${payload.subject}`,
      headline: payload.subject,
      lines: [
        `Locataire: ${session.fullName}`,
        `Email: ${session.email}`,
        `Locataire ID: ${tenant.id}`,
        `Message: ${payload.message}`,
      ],
    });

    return NextResponse.json({ item, activity }, { status: 201 });
  } catch (error) {
    if (isMissingMessagesTableError(error)) {
      return NextResponse.json({ error: 'Messagerie locataire indisponible tant que la migration messages n\'est pas appliquée.' }, { status: 503 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    console.error('[TENANT_PORTAL_MESSAGE_CREATE]', error);
    return NextResponse.json({ error: 'Envoi impossible' }, { status: 500 });
  }
}
