import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { sendEmail as sendEmailService } from '@/lib/email-service';
import { coerceTaskPayload } from '@/features/crm/tasks/task-normalization';

const taskEmailSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(5).max(6000),
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'tasks', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = taskEmailSchema.parse(await request.json());

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        type: true,
        payload: true,
        linkedType: true,
        linkedId: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 });
    }

    const taskPayload = coerceTaskPayload(task.payload);
    const payloadEmail = typeof taskPayload?.email === 'string' ? taskPayload.email : null;

    let contactId: string | null = null;
    let recipientEmail: string | null = payloadEmail;

    if (task.linkedType === 'CONTACT' && task.linkedId) {
      contactId = task.linkedId;
    }

    if (!recipientEmail && contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { email: true },
      });
      recipientEmail = contact?.email ?? null;
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Aucun email destinataire trouvé pour cette tâche' }, { status: 400 });
    }

    const trackingToken = randomUUID();
    const appUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_DOMAIN ||
      request.nextUrl.origin;
    const trackingUrl = `${appUrl}/api/email/track/open?token=${encodeURIComponent(trackingToken)}`;

    const emailHtml = `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${escapeHtml(payload.message)}</div><img src="${trackingUrl}" alt="" width="1" height="1" style="display:block;border:0;" />`;

    const sendResult = await sendEmailService({
      to: recipientEmail,
      subject: payload.subject,
      html: emailHtml,
    });

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || 'Envoi email impossible. Vérifiez RESEND_API_KEY et le domaine expéditeur.' },
        { status: 502 },
      );
    }

    if (contactId) {
      const outboundEmail = await prisma.outboundEmail.create({
        data: {
          trackingToken,
          contactId,
          createdById: guard.session.sub,
          recipientEmail,
          subject: payload.subject,
          messagePreview: payload.message.slice(0, 1000),
          provider: 'resend',
          providerMessageId: sendResult.id ?? null,
        },
      });

      await prisma.activity.create({
        data: {
          type: 'EMAIL',
          title: `Email envoyé depuis tâche: ${task.title}`,
          description: `${payload.subject}\n\n${payload.message.slice(0, 300)}\n\nEmail ID: ${outboundEmail.id}`,
          contactId,
          userId: guard.session.sub,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    console.error('[CRM_TASK_EMAIL]', error);
    return NextResponse.json({ error: 'Envoi impossible' }, { status: 500 });
  }
}
