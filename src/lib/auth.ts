import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User, UserRole } from '@/types';

const COOKIE_NAME = 'nowis_session';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET manquante en production.');
  }
  return 'change-me-in-production';
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

export function signToken(user: User): string {
  const payload: AuthTokenPayload = {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  };
  return jwt.sign({ ...payload, scope: 'legacy-session' }, getJwtSecret(), { algorithm: 'HS256', expiresIn: '30d' });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    if (typeof decoded === 'string'
      || (decoded.scope !== undefined && decoded.scope !== 'legacy-session')
      || !['owner', 'admin'].includes(decoded.role)
      || typeof decoded.sub !== 'string' || !decoded.sub.trim()
      || typeof decoded.email !== 'string' || !decoded.email.trim()
      || typeof decoded.name !== 'string' || !decoded.name.trim()) return null;
    return { sub: decoded.sub, role: decoded.role, email: decoded.email, name: decoded.name };
  } catch {
    return null;
  }
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
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}
