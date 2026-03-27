import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { sendEmail as sendEmailService } from '@/lib/email-service';
import { getInvoiceBusinessProfile } from '@/lib/invoice-profile';
import { signClientPortalToken } from '@/lib/client-portal';
import { buildInvoicePdfBuffer } from '@/lib/invoice-pdf';

const sendInvoiceSchema = z.object({
  subject: z.string().trim().min(3).max(180).optional(),
  message: z.string().trim().min(5).max(6000).optional(),
  cc: z.string().trim().max(1000).optional(),
  bcc: z.string().trim().max(1000).optional(),
});

function parseEmailList(value?: string) {
  if (!value) return [] as string[];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateEmailList(list: string[]) {
  const emailSchema = z.string().email();
  for (const item of list) {
    if (!emailSchema.safeParse(item).success) {
      throw new Error(`Email invalide: ${item}`);
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value));
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'invoices', 'update');
  if (guard.error) return guard.error;

  let payload: z.infer<typeof sendInvoiceSchema> = {};
  try {
    const body = await request.json();
    const parsed = sendInvoiceSchema.safeParse(body);
    if (parsed.success) payload = parsed.data;
  } catch {
    // Body optionnel: on applique le message par défaut si absent.
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      contact: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
  }

  if (!invoice.contact.email) {
    return NextResponse.json({ error: 'Le contact de cette facture n\'a pas d\'email.' }, { status: 400 });
  }

  const businessProfile = getInvoiceBusinessProfile();
  const subject = payload.subject || `Facture ${invoice.number} - ${businessProfile.displayName}`;
  const appUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin;

  const portalToken = signClientPortalToken({
    contactId: invoice.contact.id,
    email: invoice.contact.email,
    fullName: invoice.contact.fullName,
  });

  const invoiceUrl = `${appUrl}/crm/client/${portalToken}/invoices/${invoice.id}`;
  const trackingToken = randomUUID();
  const trackingUrl = `${appUrl}/api/email/track/open?token=${encodeURIComponent(trackingToken)}`;

  const defaultMessage = [
    `Bonjour ${invoice.contact.fullName},`,
    '',
    `Veuillez trouver ci-joint la facture ${invoice.number}.`,
    `Montant: ${formatMoney(invoice.amount.toString())}`,
    `Échéance: ${invoice.dueDate.toLocaleDateString('fr-CA')}`,
    '',
    'Merci,',
    businessProfile.displayName,
  ].join('\n');

  const finalMessage = payload.message?.trim() || defaultMessage;
  const ccList = parseEmailList(payload.cc);
  const bccList = parseEmailList(payload.bcc);

  try {
    validateEmailList(ccList);
    validateEmailList(bccList);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Emails CC/BCC invalides.' },
      { status: 400 },
    );
  }

  const invoicePdf = await buildInvoicePdfBuffer(
    {
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      amount: invoice.amount.toString(),
      description: invoice.description,
      contact: {
        fullName: invoice.contact.fullName,
        email: invoice.contact.email,
      },
    },
    businessProfile,
  );

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #0f172a;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b;">Facturation</p>
      <h2 style="margin: 0 0 12px;">Facture ${escapeHtml(invoice.number)}</h2>
      <div style="white-space: pre-wrap; line-height: 1.7; color: #334155;">${escapeHtml(finalMessage)}</div>
      <p style="margin-top: 16px;">
        <a href="${invoiceUrl}" style="display: inline-block; background: #0f766e; color: white; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;">
          Ouvrir la facture
        </a>
      </p>
      <p style="margin-top: 12px; color: #64748b; font-size: 12px;">La facture est aussi jointe en PDF a ce courriel.</p>
      <img src="${trackingUrl}" alt="" width="1" height="1" style="display:block;border:0;" />
    </div>
  `;

  const sendResult = await sendEmailService({
    to: invoice.contact.email,
    cc: ccList,
    bcc: bccList,
    subject,
    html,
    attachments: [
      {
        filename: `facture-${invoice.number}.pdf`,
        contentBase64: invoicePdf.toString('base64'),
      },
    ],
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

  await prisma.$transaction(async (tx) => {
    await tx.outboundEmail.create({
      data: {
        trackingToken,
        contactId: invoice.contact.id,
        createdById: author?.id ?? null,
        recipientEmail: invoice.contact.email!,
        subject,
        messagePreview: `Facture ${invoice.number} envoyée (${formatMoney(invoice.amount.toString())})`,
        provider: 'resend',
        providerMessageId: sendResult.id ?? null,
      },
    });

    await tx.activity.create({
      data: {
        type: 'EMAIL',
        title: `Facture envoyée par email : ${invoice.number}`,
        description: `Envoi facture à ${invoice.contact.email}${ccList.length ? `\nCC: ${ccList.join(', ')}` : ''}${bccList.length ? `\nBCC: ${bccList.join(', ')}` : ''}`,
        contactId: invoice.contact.id,
        invoiceId: invoice.id,
        userId: author?.id ?? null,
      },
    });

    if (invoice.status === 'DRAFT') {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'SENT' },
      });
    }
  });

  return NextResponse.json({ ok: true, status: invoice.status === 'DRAFT' ? 'SENT' : invoice.status });
}
