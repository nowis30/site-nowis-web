import nodemailer from 'nodemailer';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { legalConfig } from '@/data/legal';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import {
  buildSafeContactLog,
  escapeHtml,
  normalizeWhitespace,
  parseContactPayload,
  sanitizeEmailSubject,
  sanitizeText,
  validateContactRequestGuards,
} from '@/lib/contact-request-security';
import { buildAuthRedirect } from '@/lib/safe-next';
import { prisma } from '@/lib/prisma';
import { enforceContactRateLimit } from '@/lib/contact-rate-limit';
import { buildIncomingMessageTaskDescription } from '@/lib/contact-message-tasks';

function normalizeOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getFormLabel(kind: 'contact' | 'testimonial', serviceType: string) {
  return kind === 'testimonial' ? `Temoignage site (${serviceType})` : `Contact site (${serviceType})`;
}

function getServiceTypeLabel(serviceType: string) {
  const labels: Record<string, string> = {
    chanson: 'Chanson',
    video: 'Video',
    atelier: 'Atelier',
    autre: 'Autre',
  };

  return labels[serviceType] || 'Autre';
}

function buildEmailPayload(input: {
  typeLabel: string;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  serviceTypeLabel: string;
  pageUrl: string | null;
  source: string | null;
  message: string;
  portfolioConsent: 'accept' | 'refuse' | null;
}) {
  const textBody = [
    `Type: ${input.typeLabel}`,
    `Nom: ${input.name}`,
    `Email: ${input.email}`,
    `Telephone: ${input.phone || 'Non renseigne'}`,
    `Organisation: ${input.organization || 'Non precisee'}`,
    `Type de service: ${input.serviceTypeLabel}`,
    `Page URL: ${input.pageUrl || 'Non precisee'}`,
    `Source: ${input.source || 'Non precisee'}`,
    '',
    'Message:',
    input.message,
    '',
    `Consentement portfolio: ${input.portfolioConsent === 'accept' ? 'Accord donne' : input.portfolioConsent === 'refuse' ? 'Refus de diffusion' : 'Non precise'}`,
  ].join('\n');

  const htmlBody = `
    <h2>Nouveau message CRM/contact</h2>
    <ul>
      <li><strong>Type:</strong> ${escapeHtml(input.typeLabel)}</li>
      <li><strong>Nom:</strong> ${escapeHtml(input.name)}</li>
      <li><strong>Email:</strong> ${escapeHtml(input.email)}</li>
      <li><strong>Telephone:</strong> ${escapeHtml(input.phone || 'Non renseigne')}</li>
      <li><strong>Organisation:</strong> ${escapeHtml(input.organization || 'Non precisee')}</li>
      <li><strong>Type de service:</strong> ${escapeHtml(input.serviceTypeLabel)}</li>
      <li><strong>Page URL:</strong> ${escapeHtml(input.pageUrl || 'Non precisee')}</li>
      <li><strong>Source:</strong> ${escapeHtml(input.source || 'Non precisee')}</li>
      <li><strong>Consentement portfolio:</strong> ${escapeHtml(input.portfolioConsent === 'accept' ? 'Accord donne' : input.portfolioConsent === 'refuse' ? 'Refus de diffusion' : 'Non precise')}</li>
    </ul>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(input.message).replace(/\n/g, '<br/>')}</p>
  `;

  return { textBody, htmlBody };
}

export async function POST(request: NextRequest) {
  try {
    const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
    if (!session) {
      return NextResponse.json(
        {
          error: 'Connexion requise pour envoyer une demande depuis le site.',
          code: 'AUTH_REQUIRED',
          loginUrl: buildAuthRedirect('/client/dashboard'),
        },
        { status: 401 },
      );
    }

    const guard = validateContactRequestGuards(request.headers);
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error, code: guard.code }, { status: guard.status });
    }

    const limitResult = await enforceContactRateLimit({ userId: session.contactId, headers: request.headers });
    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: limitResult.message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfterSeconds: limitResult.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(limitResult.retryAfterSeconds) },
        },
      );
    }

    const payloadResult = parseContactPayload(await request.json());
    if (!payloadResult.success) {
      return NextResponse.json(
        {
          error: 'Données invalides.',
          code: 'VALIDATION_ERROR',
          details: payloadResult.error.issues,
        },
        { status: 400 },
      );
    }

    const payload = payloadResult.data;
    const normalizedEmail = session.email.trim().toLowerCase();
    const resolvedName = normalizeOptionalString(payload.name) ?? session.fullName;
    const sanitizedMessage = sanitizeText(payload.message, 3000);
    const serviceTypeLabel = getServiceTypeLabel(payload.serviceType);
    const typeLabel = payload.kind === 'testimonial' ? 'Temoignage' : 'Message';
    const subject = sanitizeEmailSubject(`Nouveau ${typeLabel} - ${resolvedName} (${serviceTypeLabel})`);
    const formLabel = getFormLabel(payload.kind, serviceTypeLabel);
    const dueDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const emailPayload = buildEmailPayload({
      typeLabel,
      name: resolvedName,
      email: normalizedEmail,
      phone: payload.phone,
      organization: payload.organization || payload.company,
      serviceTypeLabel,
      pageUrl: payload.pageUrl,
      source: payload.source,
      message: sanitizedMessage,
      portfolioConsent: payload.portfolioConsent,
    });

    const submission = await prisma.$transaction(async (tx) => {
      const existingContact = await tx.contact.findFirst({
        where: {
          OR: [
            { id: session.contactId },
            { email: normalizedEmail },
          ],
        },
        select: { id: true, fullName: true, email: true, phone: true, companyName: true, notes: true },
      });

      const upsertedContact = existingContact
        ? await tx.contact.update({
            where: { id: existingContact.id },
            data: {
              fullName: resolvedName,
              email: normalizedEmail,
              phone: normalizeOptionalString(payload.phone) ?? existingContact.phone,
              companyName: normalizeOptionalString(payload.organization || payload.company) ?? existingContact.companyName,
              source: 'site-contact',
              notes: existingContact.notes || normalizeOptionalString(sanitizedMessage),
            },
          })
        : await tx.contact.create({
            data: {
              type: 'CLIENT',
              fullName: resolvedName,
              email: normalizedEmail,
              phone: normalizeOptionalString(payload.phone),
              companyName: normalizeOptionalString(payload.organization || payload.company),
              source: 'site-contact',
              notes: normalizeOptionalString(sanitizedMessage),
            },
          });

      const createdMessage = await tx.message.create({
        data: {
          contactId: upsertedContact.id,
          senderType: 'CLIENT',
          content: sanitizedMessage,
          isRead: false,
        },
      });

      const inquiry = await tx.inquiry.create({
        data: {
          subject,
          message: sanitizedMessage,
          source: 'site-contact',
          status: 'NEW',
          submissionStatus: 'NOUVEAU',
          contactId: upsertedContact.id,
        },
      });

      await tx.activity.create({
        data: {
          type: 'FORM_SUBMISSION',
          title: `Formulaire recu : ${formLabel}`,
          description: `Message recu (${sanitizedMessage.length} caracteres).`,
          contactId: upsertedContact.id,
          relatedType: 'INQUIRY',
          relatedId: inquiry.id,
          relatedUrl: `/crm/submissions?focus=${inquiry.id}`,
        },
      });

      await tx.task.create({
        data: {
          title: `Repondre au message de ${resolvedName}`,
          description: buildIncomingMessageTaskDescription(sanitizedMessage, createdMessage.id),
          status: 'TODO',
          priority: 'HIGH',
          dueDate,
          linkedType: 'CONTACT',
          linkedId: upsertedContact.id,
        },
      });

      return {
        contactId: upsertedContact.id,
        inquiryId: inquiry.id,
      };
    });

    // If SMTP vars are configured, send an email.
    // Otherwise, just log the request (useful for local/dev).
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
    const smtpTo = process.env.SMTP_TO || process.env.ADMIN_EMAIL || legalConfig.contactEmail;

    let emailStatus: 'sent' | 'smtp_not_configured' | 'smtp_failed' = 'smtp_not_configured';

    if (smtpHost && smtpPort && smtpUser && smtpPass && smtpTo) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(smtpPort),
          secure: Number(smtpPort) === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: smtpFrom,
          to: smtpTo,
          subject,
          text: emailPayload.textBody,
          html: emailPayload.htmlBody,
        });

        emailStatus = 'sent';
      } catch (error) {
        emailStatus = 'smtp_failed';
        console.error('[CONTACT_API_SMTP_FAILED]', {
          userId: session.contactId,
          contactId: submission.contactId,
          inquiryId: submission.inquiryId,
          messageLength: sanitizedMessage.length,
          errorName: error instanceof Error ? error.name : 'UnknownError',
        });
      }
    }

    if (emailStatus !== 'sent') {
      await prisma.activity.create({
        data: {
          type: 'EMAIL',
          title: emailStatus === 'smtp_failed'
            ? 'Email admin non envoye (erreur SMTP)'
            : 'Email admin non envoye (SMTP non configure)',
          description: `Soumission ${submission.inquiryId} enregistree dans le CRM sans envoi email.`,
          contactId: submission.contactId,
          relatedType: 'INQUIRY',
          relatedId: submission.inquiryId,
          relatedUrl: `/crm/submissions?focus=${submission.inquiryId}`,
        },
      }).catch(() => undefined);
    }

    console.info('[CONTACT_API_SUBMISSION]', buildSafeContactLog({
      userId: session.contactId,
      contactId: submission.contactId,
      inquiryId: submission.inquiryId,
      messageLength: sanitizedMessage.length,
      emailStatus,
    }));

    return NextResponse.json({ ok: true, contactId: submission.contactId, emailStatus });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides.', code: 'VALIDATION_ERROR', details: error.issues },
        { status: 400 },
      );
    }

    console.error('[CONTACT_API_ERROR]', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? sanitizeText(normalizeWhitespace(error.message), 120) : 'Unknown error',
    });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
