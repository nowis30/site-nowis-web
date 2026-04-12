import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { sendEmail as sendEmailService } from '@/lib/email-service';

const contactEmailSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(5).max(6000),
});

interface RouteParams {
  params: { id: string };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'contacts', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = contactEmailSchema.parse(await request.json());

    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      select: { id: true, fullName: true, email: true },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
    }

    if (!contact.email) {
      return NextResponse.json({ error: 'Ce contact n\'a pas d\'email' }, { status: 400 });
    }

    const trackingToken = randomUUID();
    const appUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_DOMAIN ||
      request.nextUrl.origin;
    const trackingUrl = `${appUrl}/api/email/track/open?token=${encodeURIComponent(trackingToken)}`;

    const emailHtml = `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${escapeHtml(payload.message)}</div><img src="${trackingUrl}" alt="" width="1" height="1" style="display:block;border:0;" />`;

    const sendResult = await sendEmailService({
      to: contact.email,
      subject: payload.subject,
      html: emailHtml,
    });

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || 'Envoi email impossible. Vérifiez RESEND_API_KEY et le domaine expéditeur.' },
        { status: 502 },
      );
    }

    const author = await prisma.user.findUnique({
      where: { id: guard.session.sub },
      select: { id: true },
    });

    const outboundEmail = await prisma.outboundEmail.create({
      data: {
        trackingToken,
        contactId: contact.id,
        createdById: author?.id ?? null,
        recipientEmail: contact.email,
        subject: payload.subject,
        messagePreview: payload.message.slice(0, 1000),
        provider: 'resend',
        providerMessageId: sendResult.id ?? null,
      },
      select: { id: true, sentAt: true },
    });

    await prisma.activity.create({
      data: {
        type: 'EMAIL',
        title: `Email envoyé : ${payload.subject}`,
        description: `${payload.message.slice(0, 300)}\n\nEmail ID: ${outboundEmail.id}`,
        contactId: contact.id,
        userId: author?.id ?? null,
      },
    });

    return NextResponse.json({ ok: true, sentAt: outboundEmail.sentAt, emailId: outboundEmail.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    console.error('[CRM_CONTACT_EMAIL]', error);
    return NextResponse.json({ error: 'Envoi impossible' }, { status: 500 });
  }
}
