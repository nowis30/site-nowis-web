import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CRM_COOKIE_NAME, verifyCrmToken } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';

function getClientPortalSecret() {
  const secret = process.env.CLIENT_PORTAL_JWT_SECRET || process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && !secret) {
    console.warn('[Portal] Secrets JWT portail manquants en production. Fallback temporaire active.');
  }
  return secret || 'dev-only-portal-secret-must-change';
}

export const CLIENT_PORTAL_COOKIE_NAME = 'nowis_client_session';
export const CLIENT_PORTAL_IMPERSONATION_COOKIE_NAME = 'nowis_client_impersonation';

export interface ClientPortalSessionPayload {
  scope: 'client-dashboard';
  role: 'CLIENT';
  contactId: string;
  // Legacy field kept for backward-compatible tokens during housing domain deprecation.
  tenantId: string | null;
  email: string;
  fullName: string;
}

export interface ClientPortalImpersonationPayload {
  scope: 'client-impersonation';
  adminId: string;
  adminRole: 'ADMIN';
  contactId: string;
}

export interface ClientPortalEffectiveSession extends ClientPortalSessionPayload {
  impersonation: {
    active: boolean;
    adminId: string;
    adminRole: 'ADMIN';
  } | null;
}

interface ClientPortalMagicLinkPayload {
  scope: 'client-login';
  contactId: string;
  // Legacy field kept for backward-compatible tokens during housing domain deprecation.
  tenantId: string | null;
  email: string;
  fullName: string;
}

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function getClientPortalBaseUrl(origin?: string) {
  return trimTrailingSlash(
    origin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_DOMAIN ||
      'http://localhost:3000',
  );
}

export function signClientPortalSession(payload: Omit<ClientPortalSessionPayload, 'scope' | 'role'>) {
  return jwt.sign({ ...payload, scope: 'client-dashboard', role: 'CLIENT' }, getClientPortalSecret(), {
    expiresIn: '14d',
  });
}

export function signClientPortalImpersonation(payload: Omit<ClientPortalImpersonationPayload, 'scope'>) {
  return jwt.sign({ ...payload, scope: 'client-impersonation' }, getClientPortalSecret(), {
    expiresIn: '12h',
  });
}

export function verifyClientPortalSession(token: string) {
  try {
    const decoded = jwt.verify(token, getClientPortalSecret()) as ClientPortalSessionPayload;
    return decoded.scope === 'client-dashboard' && decoded.role === 'CLIENT' ? decoded : null;
  } catch {
    return null;
  }
}

export function verifyClientPortalImpersonation(token: string) {
  try {
    const decoded = jwt.verify(token, getClientPortalSecret()) as ClientPortalImpersonationPayload;
    return decoded.scope === 'client-impersonation' && decoded.adminRole === 'ADMIN' ? decoded : null;
  } catch {
    return null;
  }
}

export function signClientPortalMagicLink(payload: Omit<ClientPortalMagicLinkPayload, 'scope'>) {
  return jwt.sign({ ...payload, scope: 'client-login' }, getClientPortalSecret(), {
    expiresIn: '20m',
  });
}

export function verifyClientPortalMagicLink(token: string) {
  try {
    const decoded = jwt.verify(token, getClientPortalSecret()) as ClientPortalMagicLinkPayload;
    return decoded.scope === 'client-login' ? decoded : null;
  } catch {
    return null;
  }
}

export function createClientPortalSessionCookie(token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 60 * 60 * 24 * 14;
  return `${CLIENT_PORTAL_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge};${isProd ? ' Secure;' : ''}`;
}

export function createClientPortalImpersonationCookie(token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 60 * 60 * 12;
  return `${CLIENT_PORTAL_IMPERSONATION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge};${isProd ? ' Secure;' : ''}`;
}

export function clearClientPortalSessionCookie() {
  const isProd = process.env.NODE_ENV === 'production';
  return `${CLIENT_PORTAL_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;${isProd ? ' Secure;' : ''}`;
}

export function clearClientPortalImpersonationCookie() {
  const isProd = process.env.NODE_ENV === 'production';
  return `${CLIENT_PORTAL_IMPERSONATION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;${isProd ? ' Secure;' : ''}`;
}

export function getClientPortalSessionFromCookieHeader(cookie?: string) {
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`${CLIENT_PORTAL_COOKIE_NAME}=([^;]+)`));
  return match ? verifyClientPortalSession(match[1]) : null;
}

export async function getClientPortalSessionServer() {
  const cookieStore = await cookies();

  const crmToken = cookieStore.get(CRM_COOKIE_NAME)?.value;
  const crmSession = crmToken ? verifyCrmToken(crmToken) : null;
  const impersonationToken = cookieStore.get(CLIENT_PORTAL_IMPERSONATION_COOKIE_NAME)?.value;

  if (crmSession?.role === 'ADMIN' && impersonationToken) {
    const impersonation = verifyClientPortalImpersonation(impersonationToken);
    if (impersonation && impersonation.adminId === crmSession.sub) {
      const contact = await prisma.contact.findUnique({
        where: { id: impersonation.contactId },
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      });

      if (contact) {
        return {
          scope: 'client-dashboard',
          role: 'CLIENT',
          contactId: contact.id,
          tenantId: null,
          email: contact.email || `contact+${contact.id}@nowis.local`,
          fullName: contact.fullName,
          impersonation: {
            active: true,
            adminId: crmSession.sub,
            adminRole: 'ADMIN',
          },
        } satisfies ClientPortalEffectiveSession;
      }
    }
  }

  const token = cookieStore.get(CLIENT_PORTAL_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = verifyClientPortalSession(token);
  if (!session) return null;
  return { ...session, impersonation: null };
}

export async function requireClientPortalSession() {
  const session = await getClientPortalSessionServer();
  if (!session) {
    redirect('/connexion');
  }
  return session;
}

export function buildClientPortalMagicLink(token: string, origin?: string) {
  return `${getClientPortalBaseUrl(origin)}/client/auth/verify?token=${encodeURIComponent(token)}`;
}