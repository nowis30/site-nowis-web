import jwt from 'jsonwebtoken';

export interface ClientPortalTokenPayload {
  scope: 'song-request-portal';
  contactId: string;
  email: string;
  fullName: string;
}

export interface TenantPortalTokenPayload {
  scope: 'tenant-portal';
  tenantId: string;
  contactId: string;
  email: string;
  fullName: string;
}

if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_PORTAL_JWT_SECRET && !process.env.JWT_SECRET) {
  throw new Error('[Portal Legacy] Au moins CLIENT_PORTAL_JWT_SECRET ou JWT_SECRET doit être défini en production.');
}
const CLIENT_PORTAL_SECRET =
  process.env.CLIENT_PORTAL_JWT_SECRET ||
  process.env.JWT_SECRET ||
  'dev-only-portal-secret-must-change';

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function getClientPortalBaseUrl(origin?: string) {
  return trimTrailingSlash(
    origin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_DOMAIN ||
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000',
  );
}

export function signClientPortalToken(payload: Omit<ClientPortalTokenPayload, 'scope'>): string {
  return jwt.sign({ ...payload, scope: 'song-request-portal' }, CLIENT_PORTAL_SECRET, {
    expiresIn: '180d',
  });
}

export function signTenantPortalToken(payload: Omit<TenantPortalTokenPayload, 'scope'>): string {
  return jwt.sign({ ...payload, scope: 'tenant-portal' }, CLIENT_PORTAL_SECRET, {
    expiresIn: '180d',
  });
}

export function verifyClientPortalToken(token: string): ClientPortalTokenPayload | null {
  try {
    const decoded = jwt.verify(token, CLIENT_PORTAL_SECRET) as ClientPortalTokenPayload;
    return decoded.scope === 'song-request-portal' ? decoded : null;
  } catch {
    return null;
  }
}

export function verifyTenantPortalToken(token: string): TenantPortalTokenPayload | null {
  try {
    const decoded = jwt.verify(token, CLIENT_PORTAL_SECRET) as TenantPortalTokenPayload;
    return decoded.scope === 'tenant-portal' ? decoded : null;
  } catch {
    return null;
  }
}

export function buildClientPortalPath(token: string): string {
  return `/crm/client/${token}`;
}

export function buildTenantPortalPath(token: string): string {
  return `/crm/tenant/${token}`;
}

export function buildClientPortalUrl(token: string, origin?: string): string {
  const baseUrl = getClientPortalBaseUrl(origin);

  return `${baseUrl}${buildClientPortalPath(token)}`;
}

export function buildTenantPortalUrl(token: string, origin?: string): string {
  const baseUrl = getClientPortalBaseUrl(origin);

  return `${baseUrl}${buildTenantPortalPath(token)}`;
}
