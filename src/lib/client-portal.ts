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
    console.warn('[Portal Legacy] Secrets JWT manquants en production. Fallback temporaire active.');
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
    const decoded = jwt.verify(token, getClientPortalSecret()) as ClientPortalTokenPayload;
    return decoded.scope === 'song-request-portal' ? decoded : null;
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
