import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { hashPasswordResetToken } from '@/lib/password-reset';

export class InvalidPasswordReset extends Error {}
export async function completePasswordReset(scope: 'client' | 'crm', token: string, password: string) {
  const passwordHash = await hashPassword(password);
  const now = new Date();
  await prisma.$transaction(async tx => {
    const reset = await tx.passwordResetToken.findUnique({ where: { tokenHash: hashPasswordResetToken(token) },
      include: { user: { include: { contact: true } } } });
    const roles = scope === 'crm' ? ['ADMIN', 'ASSISTANT'] : ['PORTAL_USER'];
    const scopes = scope === 'client' ? ['client', 'client-verify'] : ['crm'];
    if (!reset || !scopes.includes(reset.scope) || reset.usedAt || reset.expiresAt <= now || !reset.user.isActive
      || !roles.includes(reset.user.role) || reset.user.contact?.deletedAt || reset.authVersion !== reset.user.authVersion
      || (scope === 'client' && (!reset.user.contact || reset.user.email.trim().toLowerCase() !== reset.user.contact.email?.trim().toLowerCase()))) {
      throw new InvalidPasswordReset();
    }
    const claim = await tx.passwordResetToken.updateMany({ where: { id: reset.id, usedAt: null, expiresAt: { gt: now },
      authVersion: reset.authVersion }, data: { usedAt: now } });
    if (claim.count !== 1) throw new InvalidPasswordReset();
    const updated = await tx.user.updateMany({ where: { id: reset.userId, authVersion: reset.authVersion, isActive: true,
      role: reset.user.role }, data: { passwordHash, emailVerifiedAt: now, authVersion: { increment: 1 } } });
    if (updated.count !== 1) throw new InvalidPasswordReset();
    if (!reset.user.emailVerifiedAt && scope === 'client') await tx.clientOAuthAccount.deleteMany({ where: { userId: reset.userId } });
    await tx.passwordResetToken.deleteMany({ where: { userId: reset.userId, id: { not: reset.id } } });
  });
}
