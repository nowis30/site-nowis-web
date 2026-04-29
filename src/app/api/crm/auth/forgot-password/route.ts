import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';
import { consumeRateLimit, getRequestClientIp, sanitizeRateLimitIdentifier } from '@/lib/rate-limit';
import { buildPasswordResetLink, createPasswordResetToken, getPasswordResetExpiryDate } from '@/lib/password-reset';

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = requestSchema.parse(await request.json());
    const email = payload.email;

    const clientIp = getRequestClientIp(request.headers);
    const limiter = consumeRateLimit(
      `crm-forgot-password:${sanitizeRateLimitIdentifier(clientIp)}:${sanitizeRateLimitIdentifier(email)}`,
      5,
      15 * 60 * 1000,
    );

    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Trop de demandes. Réessayez dans quelques minutes.' },
        {
          status: 429,
          headers: { 'Retry-After': String(limiter.retryAfterSeconds), 'Cache-Control': 'no-store' },
        },
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        role: { in: [UserRole.ADMIN, UserRole.ASSISTANT] },
        isActive: true,
      },
      select: { id: true, fullName: true, email: true },
    });

    if (user) {
      const { token, tokenHash } = createPasswordResetToken();
      const expiresAt = getPasswordResetExpiryDate(30);

      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({
          where: {
            userId: user.id,
            scope: 'crm',
          },
        }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            scope: 'crm',
            tokenHash,
            expiresAt,
          },
        }),
      ]);

      const resetLink = buildPasswordResetLink('crm', token, request.nextUrl.origin);

      await sendEmail({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe CRM Nowis',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #0f172a;">
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b;">CRM Nowis</p>
            <h2 style="margin: 0 0 12px;">Bonjour ${user.fullName},</h2>
            <p style="line-height: 1.6; color: #334155;">Vous avez demandé une réinitialisation de mot de passe CRM. Ce lien est valide 30 minutes.</p>
            <p style="margin: 24px 0;">
              <a href="${resetLink}" style="display:inline-block; background:#0f172a; color:#fff; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:600;">Réinitialiser le mot de passe CRM</a>
            </p>
            <p style="font-size: 12px; color: #64748b;">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
          </div>
        `,
      });
    }

    return NextResponse.json(
      { ok: true, message: 'Si cet email est autorisé CRM, un lien a été envoyé.' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    console.error('[CRM_FORGOT_PASSWORD]', error);
    return NextResponse.json({ error: 'Envoi impossible.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
