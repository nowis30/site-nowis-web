import { createHash, randomBytes } from 'crypto';

export type PasswordResetScope = 'client' | 'crm';

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function getBaseUrl(origin?: string) {
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_DOMAIN ||
      process.env.APP_URL ||
      origin ||
      'http://localhost:3000',
  );
}

export function createPasswordResetToken() {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

export function hashPasswordResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function getPasswordResetExpiryDate(minutes = 30) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function buildPasswordResetLink(scope: PasswordResetScope, token: string, origin?: string) {
  const base = getBaseUrl(origin);
  const path = scope === 'crm' ? '/crm/reset-password' : '/reinitialiser-mot-de-passe';
  return `${base}${path}?token=${encodeURIComponent(token)}`;
}

export function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
}
