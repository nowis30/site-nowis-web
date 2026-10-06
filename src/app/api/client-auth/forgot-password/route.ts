import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';
import { readAuthJson, limitAuth, authRequestErrorResponse } from '@/lib/auth-request-security';
import { buildPasswordResetLink, createPasswordResetToken, getPasswordResetExpiryDate } from '@/lib/password-reset';

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = requestSchema.parse(await readAuthJson(request));
    const email = payload.email;

    await limitAuth(request, 'forgot', email, 5);

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        role: UserRole.PORTAL_USER,
        isActive: true,
      },
      select: { id: true, fullName: true, email: true, authVersion: true, emailVerifiedAt: true, contact: { select: { deletedAt: true } } },
    });

    if (user && !user.contact?.deletedAt) {
      const { token, tokenHash } = createPasswordResetToken();
      const expiresAt = getPasswordResetExpiryDate(30);

      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({
          where: {
            userId: user.id,
            scope: 'client',
          },
        }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            authVersion: user.authVersion,
            scope: 'client',
            tokenHash,
            expiresAt,
          },
        }),
      ]);

      const resetLink = buildPasswordResetLink('client', token, request.nextUrl.origin);

      const sent = await sendEmail({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe client Nowis',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #0f172a;">
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b;">Portail client Nowis</p>
            <h2 style="margin: 0 0 12px;">Bonjour ${user.fullName},</h2>
            <p style="line-height: 1.6; color: #334155;">Vous avez demandé une réinitialisation de mot de passe. Ce lien est valide 30 minutes.</p>
            <p style="margin: 24px 0;">
              <a href="${resetLink}" style="display:inline-block; background:#b86f3d; color:#fff; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:600;">Réinitialiser mon mot de passe</a>
            </p>
            <p style="font-size: 12px; color: #64748b;">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
          </div>
        `,
      });
      if (!sent.success) throw new Error('AUTH_EMAIL_UNAVAILABLE');
    }

    return NextResponse.json(
      { ok: true, message: 'Si votre email existe, un lien de réinitialisation a été envoyé.' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const securityError = authRequestErrorResponse(error);
    if (securityError) return securityError;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    console.error('[CLIENT_FORGOT_PASSWORD]', error);
    return NextResponse.json({ error: 'Envoi impossible.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
