import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPasswordResetToken, isStrongPassword } from '@/lib/password-reset';

const requestSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const payload = requestSchema.parse(await request.json());

    if (!isStrongPassword(payload.password)) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir 8 caractères, une majuscule, une minuscule et un chiffre.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const tokenHash = hashPasswordResetToken(payload.token);
    const now = new Date();

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, role: true, isActive: true },
        },
      },
    });

    const allowedCrmRoles = new Set<UserRole>([UserRole.ADMIN, UserRole.ASSISTANT]);

    if (
      !resetToken ||
      resetToken.scope !== 'crm' ||
      resetToken.usedAt ||
      resetToken.expiresAt <= now ||
      !allowedCrmRoles.has(resetToken.user.role) ||
      !resetToken.user.isActive
    ) {
      return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    const newPasswordHash = await hashPassword(payload.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          scope: 'crm',
          id: { not: resetToken.id },
        },
      }),
    ]);

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Requête invalide.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    console.error('[CRM_RESET_PASSWORD]', error);
    return NextResponse.json({ error: 'Réinitialisation impossible.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
