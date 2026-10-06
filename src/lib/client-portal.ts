import jwt from 'jsonwebtoken';

export interface ClientPortalTokenPayload {
  scope: 'song-request-portal';
  contactId: string;
  email: string;
  fullName: string;
}

function getClientPortalSecret() {
  const secret = process.env.CLIENT_PORTAL_JWT_SECRET || process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('CLIENT_PORTAL_JWT_SECRET ou JWT_SECRET manquant en production.');
  }
  return secret || 'dev-only-portal-secret-must-change';
}

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function getClientPortalBaseUrl(origin?: string) {
  return trimTrailingSlash(
    origin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_DOMAIN ||
      'http://localhost:3000',
  );
}

export function signClientPortalToken(payload: Omit<ClientPortalTokenPayload, 'scope'>): string {
  return jwt.sign({ ...payload, scope: 'song-request-portal' }, getClientPortalSecret(), {
    expiresIn: '180d',
  });
}

export function verifyClientPortalToken(token: string): ClientPortalTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getClientPortalSecret(), { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || decoded.scope !== 'song-request-portal' ||
      typeof decoded.contactId !== 'string' || !decoded.contactId.trim() ||
      typeof decoded.email !== 'string' || !decoded.email.trim() ||
      typeof decoded.fullName !== 'string' || !decoded.fullName.trim() ||
      typeof decoded.exp !== 'number') {
      return null;
    }
    return decoded as ClientPortalTokenPayload;
  } catch {
    return null;
  }
}

export function buildClientPortalPath(token: string): string {
  return `/crm/client/${token}`;
}

export function buildClientPortalUrl(token: string, origin?: string): string {
  const baseUrl = getClientPortalBaseUrl(origin);

  return `${baseUrl}${buildClientPortalPath(token)}`;
}
