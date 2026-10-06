import bcrypt from 'bcryptjs';
import type { User, UserRole } from '@/types';
import { issueAuthGrant, verifyAuthGrant, readNamedCookie } from '@/lib/auth-grants';
import { getAuthSigningSecret } from '@/lib/auth-signing-secret';

const COOKIE_NAME = 'nowis_session';

function getJwtSecret(): string {
  return getAuthSigningSecret(['JWT_SECRET'], 'change-me-in-production');
}

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  email: string;
  name: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(user: User): Promise<string> {
  const payload: AuthTokenPayload = {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  };
  return issueAuthGrant({ ...payload, scope: 'legacy-session' }, getJwtSecret(), 30 * 86400);
}

export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
    if (process.env.NODE_ENV === 'production') return null;
    const decoded = await verifyAuthGrant(token, 'legacy-session', getJwtSecret());
    if (!decoded
      || !['owner', 'admin'].includes(decoded.role)
      || typeof decoded.sub !== 'string' || !decoded.sub.trim()
      || typeof decoded.email !== 'string' || !decoded.email.trim()
      || typeof decoded.name !== 'string' || !decoded.name.trim()) return null;
    return { sub: decoded.sub, role: decoded.role, email: decoded.email, name: decoded.name };
}

export function createSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge};${
    isProd ? ' Secure;' : ''
  }`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;`;
}

export function getTokenFromCookie(cookie?: string): string | null {
  return readNamedCookie(cookie, COOKIE_NAME);
}
