import { randomBytes } from 'crypto';
import { Prisma, UserRole } from '@prisma/client';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email-service';
import { createPasswordResetToken, buildPasswordResetLink, getPasswordResetExpiryDate } from '@/lib/password-reset';
import { escapeHtml } from '@/lib/contact-request-security';

export const newUnusablePasswordHash = () => hashPassword(randomBytes(48).toString('base64url'));

// An email owner adopting an unverified password signup must never inherit
// an attacker-chosen password, sessions, reset links or provider bindings.
export async function adoptVerifiedPortalUser(tx: Prisma.TransactionClient, userId: string, expectedVersion?: number | null) {
  const user = await tx.user.findUnique({ where: { id: userId }, include: { contact: true } });
  if (!user?.isActive || user.role !== UserRole.PORTAL_USER || !user.contact || user.contact.deletedAt) {
    throw new Error('AUTH_IDENTITY_UNAVAILABLE');
  }
  if (expectedVersion !== undefined && user.authVersion !== expectedVersion) throw new Error('AUTH_IDENTITY_CHANGED');
  if (user.emailVerifiedAt) return user;
  const updated = await tx.user.update({ where: { id: user.id, authVersion: user.authVersion, isActive: true }, data: {
    passwordHash: await newUnusablePasswordHash(), emailVerifiedAt: new Date(), authVersion: { increment: 1 },
  }, include: { contact: true } });
  await tx.passwordResetToken.deleteMany({ where: { userId } });
  await tx.clientOAuthAccount.deleteMany({ where: { userId } });
  return updated;
}

export async function sendPortalEmailVerification(user: { id: string; authVersion: number; email: string; fullName: string }, origin?: string) {
  const { token, tokenHash } = createPasswordResetToken();
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id, scope: 'client-verify' } }),
    prisma.passwordResetToken.create({ data: { userId: user.id, authVersion: user.authVersion, scope: 'client-verify', tokenHash,
      expiresAt: getPasswordResetExpiryDate(30) } }),
  ]);
  const link = buildPasswordResetLink('client', token, origin);
  const sent = await sendEmail({ to: user.email, subject: 'Vérifiez votre adresse et définissez votre mot de passe Nowis', html:
    `<div style="font-family:Arial,sans-serif"><h2>Bonjour ${escapeHtml(user.fullName)},</h2><p>Pour activer votre compte, confirmez que cette adresse vous appartient et définissez vous-même votre mot de passe. Ce lien expire dans 30 minutes.</p><p><a href="${escapeHtml(link)}">Vérifier mon adresse et définir mon mot de passe</a></p><p>Si vous n’avez pas demandé de compte, ignorez ce message.</p></div>` });
  if (!sent.success) throw new Error('AUTH_EMAIL_UNAVAILABLE');
}
