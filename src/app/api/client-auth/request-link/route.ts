import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { readAuthJson, limitAuth, authRequestErrorResponse } from '@/lib/auth-request-security';
import { sendEmail } from '@/lib/email-service';
import { buildClientPortalMagicLink, signClientPortalMagicLink } from '@/features/client-portal/auth/session';
import { escapeHtml } from '@/lib/contact-request-security';

const requestSchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = requestSchema.parse(await readAuthJson(request));
    const email = payload.email.toLowerCase();
    await limitAuth(request, 'magic', email, 5);

    const account = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } },
      select: { contactId: true, role: true, isActive: true } });
    const contact = account && (account.role !== 'PORTAL_USER' || !account.isActive) ? null : await prisma.contact.findFirst({
      where: { ...(account ? { id: account.contactId || '00000000-0000-4000-8000-000000000000' } : {}), email: { equals: email, mode: 'insensitive' }, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        userAccount: { select: { isActive: true } },
      },
    });

    if (contact?.email && contact.userAccount?.isActive !== false) {
      const token = await signClientPortalMagicLink({
        contactId: contact.id,
        tenantId: null,
        email: contact.email,
        fullName: contact.fullName,
      });

      const link = buildClientPortalMagicLink(token, request.nextUrl.origin);
      const sent = await sendEmail({
        to: contact.email,
        subject: 'Connexion à votre portail client Nowis',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #0f172a;">
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b;">Portail client Nowis</p>
            <h2 style="margin: 0 0 12px;">Bonjour ${escapeHtml(contact.fullName)},</h2>
            <p style="line-height: 1.6; color: #334155;">Utilisez ce lien sécurisé pour accéder à votre dossier client. Ce lien expire dans 20 minutes.</p>
            <p style="margin: 24px 0;">
              <a href="${escapeHtml(link)}" style="display:inline-block; background:#b86f3d; color:#fff; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:600;">Ouvrir mon portail</a>
            </p>
            <p style="font-size: 12px; color: #64748b;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.</p>
          </div>
        `,
      });
      if (!sent.success) throw new Error('AUTH_EMAIL_UNAVAILABLE');
    }

    return NextResponse.json(
      { ok: true, message: 'Si votre email existe dans le CRM, un lien sécurisé a été envoyé.' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const securityError = authRequestErrorResponse(error);
    if (securityError) return securityError;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    console.error('[CLIENT_AUTH_REQUEST_LINK]', error);
    return NextResponse.json({ error: 'Envoi impossible' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
