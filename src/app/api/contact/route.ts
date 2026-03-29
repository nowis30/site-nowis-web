import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { legalConfig } from '@/data/legal';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { buildAuthRedirect } from '@/lib/safe-next';
import { prisma } from '@/lib/prisma';
import { buildIncomingMessageTaskDescription } from '@/lib/contact-message-tasks';

function normalizeOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getFormLabel(kind: unknown, projectType: unknown) {
  const normalizedProjectType = typeof projectType === 'string' && projectType.trim().length > 0 ? projectType.trim() : 'Sans type';
  return kind === 'testimonial' ? `Temoignage site (${normalizedProjectType})` : `Contact site (${normalizedProjectType})`;
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

    const data = await request.json();
    const { name, email, phone, projectType, message, kind, portfolioConsent } = data;
    const normalizedEmail = session.email.trim().toLowerCase();
    const resolvedName = normalizeOptionalString(name) ?? session.fullName;

    if (!resolvedName || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const typeLabel = kind === 'testimonial' ? 'Témoignage' : 'Message';
    const subject = `Nouveau ${typeLabel} - ${resolvedName} (${projectType || 'Sans type'})`;
    const formLabel = getFormLabel(kind, projectType);
    const dueDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const body = `
Type: ${typeLabel}
Nom: ${resolvedName}
Email: ${normalizedEmail}
  Téléphone: ${phone || 'Non renseigné'}
Type de projet: ${projectType || 'Non précisé'}

Message:
${message}

Consentement portfolio: ${portfolioConsent === 'accept' ? 'Accord donné' : portfolioConsent === 'refuse' ? 'Refus de diffusion' : 'Non précisé'}
`;

    const contact = await prisma.$transaction(async (tx) => {
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
              phone: normalizeOptionalString(phone) ?? existingContact.phone,
              source: 'site-contact',
              notes: existingContact.notes || normalizeOptionalString(message),
            },
          })
        : await tx.contact.create({
            data: {
              type: 'CLIENT',
              fullName: resolvedName,
              email: normalizedEmail,
              phone: normalizeOptionalString(phone),
              source: 'site-contact',
              notes: normalizeOptionalString(message),
            },
          });

      const createdMessage = await tx.message.create({
        data: {
          contactId: upsertedContact.id,
          senderType: 'CLIENT',
          content: message.trim(),
          isRead: false,
        },
      });

      await tx.activity.create({
        data: {
          type: 'FORM',
          title: `Formulaire recu : ${formLabel}`,
          description: message.trim(),
          contactId: upsertedContact.id,
        },
      });

      await tx.inquiry.create({
        data: {
          subject,
          message: message.trim(),
          source: 'site-contact',
          status: 'NEW',
          contactId: upsertedContact.id,
        },
      });

      await tx.task.create({
        data: {
          title: `Repondre au message de ${resolvedName}`,
          description: buildIncomingMessageTaskDescription(message.trim(), createdMessage.id),
          status: 'TODO',
          priority: 'HIGH',
          dueDate,
          linkedType: 'CONTACT',
          linkedId: upsertedContact.id,
        },
      });

      return upsertedContact;
    });

    // If SMTP vars are configured, send an email.
    // Otherwise, just log the request (useful for local/dev).
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
    const smtpTo = process.env.SMTP_TO || process.env.ADMIN_EMAIL || legalConfig.contactEmail;

    if (smtpHost && smtpPort && smtpUser && smtpPass && smtpTo) {
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
        text: body,
      });

      return NextResponse.json({ ok: true, contactId: contact.id });
    }

    // No SMTP configured: log and return success for local development
    console.log('Contact form submission (no SMTP configured):', { name: resolvedName, email: normalizedEmail, phone, projectType, message, portfolioConsent });

    return NextResponse.json({ ok: true, contactId: contact.id });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
