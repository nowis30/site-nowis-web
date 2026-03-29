import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';
import { buildClientPortalMagicLink, signClientPortalMagicLink } from '@/features/client-portal/auth/session';

const requestSchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = requestSchema.parse(await request.json());
    const email = payload.email.toLowerCase();

    const contact = await prisma.contact.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    if (contact?.email) {
      const token = signClientPortalMagicLink({
        contactId: contact.id,
        tenantId: null,
        email: contact.email,
        fullName: contact.fullName,
      });

      const link = buildClientPortalMagicLink(token, request.nextUrl.origin);
      await sendEmail({
        to: contact.email,
        subject: 'Connexion à votre portail client Nowis',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #0f172a;">
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b;">Portail client Nowis</p>
            <h2 style="margin: 0 0 12px;">Bonjour ${contact.fullName},</h2>
            <p style="line-height: 1.6; color: #334155;">Utilisez ce lien sécurisé pour accéder à votre dossier client. Ce lien expire dans 20 minutes.</p>
            <p style="margin: 24px 0;">
              <a href="${link}" style="display:inline-block; background:#2563eb; color:#fff; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:600;">Ouvrir mon portail</a>
            </p>
            <p style="font-size: 12px; color: #64748b;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true, message: 'Si votre email existe dans le CRM, un lien sécurisé a été envoyé.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    console.error('[CLIENT_AUTH_REQUEST_LINK]', error);
    return NextResponse.json({ error: 'Envoi impossible' }, { status: 500 });
  }
}