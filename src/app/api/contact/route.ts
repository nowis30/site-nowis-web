import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { legalConfig } from '@/data/legal';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, email, phone, projectType, message, kind, portfolioConsent } = data;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const typeLabel = kind === 'testimonial' ? 'Témoignage' : 'Message';
    const subject = `Nouveau ${typeLabel} - ${name} (${projectType || 'Sans type'})`;
    const body = `
Type: ${typeLabel}
Nom: ${name}
Email: ${email}
  Téléphone: ${phone || 'Non renseigné'}
Type de projet: ${projectType || 'Non précisé'}

Message:
${message}

Consentement portfolio: ${portfolioConsent === 'accept' ? 'Accord donné' : portfolioConsent === 'refuse' ? 'Refus de diffusion' : 'Non précisé'}
`;

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

      return NextResponse.json({ ok: true });
    }

    // No SMTP configured: log and return success for local development
    console.log('Contact form submission (no SMTP configured):', { name, email, phone, projectType, message, portfolioConsent });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
