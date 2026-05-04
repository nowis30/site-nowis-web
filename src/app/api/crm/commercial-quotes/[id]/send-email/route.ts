import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { sendEmail as sendEmailService } from '@/lib/email-service';
import { buildPublicBillingUrl, buildPublicQuoteUrl, signPublicBillingToken, signPublicQuoteToken } from '@/lib/public-links';
import { buildCustomerSnapshotFromContact, getBillingIssuerSnapshot, toCustomerSnapshot, toIssuerSnapshot, validateCustomerSnapshot, validateIssuerSnapshot } from '@/lib/billing-profile';

const payloadSchema = z.object({
  subject: z.string().trim().min(3).max(180).optional(),
  message: z.string().trim().min(3).max(6000).optional(),
});

function ensureAdmin(request: NextRequest) {
  const guard = requireApiPermission(request, 'commercialQuotes', 'update');
  if (guard.error) return { error: guard.error, session: null as null };
  if (guard.session.role !== 'ADMIN') {
    return {
      error: NextResponse.json({ error: 'Action reservee a un administrateur.' }, { status: 403 }),
      session: null as null,
    };
  }
  return { error: null, session: guard.session };
}

function formatMoney(value: string | number, currency = 'CAD') {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency }).format(Number(value));
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = ensureAdmin(request);
  if (admin.error) return admin.error;

  const quote = await prisma.commercialQuote.findUnique({
    where: { id: params.id },
    include: {
      contact: { select: { id: true, fullName: true, email: true } },
      lines: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!quote) {
    return NextResponse.json({ error: 'Soumission commerciale introuvable.' }, { status: 404 });
  }

  if (!quote.contact?.email) {
    return NextResponse.json({ error: 'Le client associe n a pas de courriel.' }, { status: 400 });
  }

  const issuer = toIssuerSnapshot(quote.issuerSnapshot) || await getBillingIssuerSnapshot();
  const customer = toCustomerSnapshot(quote.customerSnapshot) || buildCustomerSnapshotFromContact(quote.contact);
  const missingIssuer = validateIssuerSnapshot(issuer);
  const missingCustomer = validateCustomerSnapshot(customer);
  if (missingIssuer.length > 0 || missingCustomer.length > 0) {
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_DOMAIN || request.nextUrl.origin;
    const billingUpdateUrl = quote.contactId
      ? buildPublicBillingUrl(
          signPublicBillingToken({ contactId: quote.contactId, quoteId: quote.id }),
          appUrl,
        )
      : null;
    return NextResponse.json(
      {
        error: 'Facturation incomplete. Complete le profil emetteur et les informations de facturation client avant envoi.',
        missingIssuer,
        missingCustomer,
        billingUpdateUrl,
      },
      { status: 409 },
    );
  }

  const body = payloadSchema.safeParse(await request.json().catch(() => ({})));
  const payload = body.success ? body.data : {};

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_DOMAIN || request.nextUrl.origin;
  const publicToken = signPublicQuoteToken({
    quoteId: quote.id,
    contactId: quote.contactId,
  });
  const quoteUrl = buildPublicQuoteUrl(publicToken, appUrl);
  const trackingToken = randomUUID();
  const trackingUrl = `${appUrl.replace(/\/$/, '')}/api/email/track/open?token=${encodeURIComponent(trackingToken)}`;

  const subject = payload.subject || `Votre soumission ${quote.quoteNumber} - ${issuer.companyName}`;
  const preview = (quote.description || quote.title || '').slice(0, 240);
  const customMessage = payload.message?.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #0f172a;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b;">Soumission commerciale</p>
      <h2 style="margin: 0 0 12px;">${quote.quoteNumber} · ${quote.title}</h2>
      <p style="line-height: 1.6; color: #334155;">Bonjour ${quote.contact.fullName},</p>
      ${customMessage ? `<p style="white-space: pre-wrap; line-height: 1.6; color: #334155;">${customMessage.replace(/</g, '&lt;')}</p>` : ''}
      <p style="line-height: 1.6; color: #334155;">Montant: <strong>${formatMoney(quote.totalAmount.toString(), quote.currency)}</strong></p>
      ${preview ? `<p style="line-height: 1.6; color: #334155;">${preview.replace(/</g, '&lt;')}</p>` : ''}
      <p style="margin-top: 16px;">
        <a href="${quoteUrl}" style="display: inline-block; background: #0f766e; color: white; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;">
          Consulter / Accepter la soumission
        </a>
      </p>
      <p style="margin-top: 12px; color: #64748b; font-size: 12px;">Lien securise. Si le lien expire, demandez un nouvel envoi.</p>
      <p style="margin-top: 6px; color: #64748b; font-size: 12px;">${issuer.companyName}${issuer.email ? ` · ${issuer.email}` : ''}</p>
      <img src="${trackingUrl}" alt="" width="1" height="1" style="display:block;border:0;" />
    </div>
  `;

  const sendResult = await sendEmailService({
    to: quote.contact.email,
    subject,
    html,
  });

  if (!sendResult.success) {
    return NextResponse.json(
      {
        ok: true,
        emailSent: false,
        message: 'Email non configure. Le lien a ete genere, mais aucun courriel n a ete envoye.',
        quoteUrl,
      },
      { status: 200 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.outboundEmail.create({
      data: {
        trackingToken,
        contactId: quote.contact!.id,
        createdById: admin.session.sub,
        recipientEmail: quote.contact!.email!,
        subject,
        messagePreview: `Soumission ${quote.quoteNumber} envoyee`,
        provider: 'resend',
        providerMessageId: sendResult.id || null,
      },
    });

    await tx.activity.create({
      data: {
        type: 'EMAIL',
        title: `Soumission envoyee par email : ${quote.quoteNumber}`,
        description: `Lien public envoye a ${quote.contact!.email}`,
        contactId: quote.contact!.id,
        relatedType: 'COMMERCIAL_QUOTE',
        relatedId: quote.id,
        relatedUrl: `/crm/commercial-quotes/${quote.id}`,
        userId: admin.session.sub,
      },
    });

    if (quote.status === 'DRAFT') {
      await tx.commercialQuote.update({ where: { id: quote.id }, data: { status: 'SENT' } });
    }
  });

  return NextResponse.json({ ok: true, emailSent: true, quoteUrl });
}
