import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CRM_COOKIE_NAME, verifyCrmToken } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { issueAuthGrant, verifyAuthGrant, readNamedCookie } from '@/lib/auth-grants';
import { publicInquiryOriginAllowed } from '@/lib/public-inquiry-security';
import { getAuthSigningSecret } from '@/lib/auth-signing-secret';

function getClientPortalSecret() {
  return getAuthSigningSecret(['CLIENT_PORTAL_JWT_SECRET', 'JWT_SECRET'], 'dev-only-portal-secret-must-change');
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
  authVersion?: number | null;
  authUserId?: string | null;
  contactVersion?: number;
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
  authVersion?: number | null;
  authUserId?: string | null;
  contactVersion?: number;
}

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function getClientPortalBaseUrl(origin?: string) {
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_DOMAIN ||
      (origin && publicInquiryOriginAllowed(origin) ? origin : undefined) ||
      'http://localhost:3000',
  );
}

export async function signClientPortalSession(payload: Omit<ClientPortalSessionPayload, 'scope' | 'role'>) {
  return issueAuthGrant({ ...payload, scope: 'client-dashboard', role: 'CLIENT' }, getClientPortalSecret(), 14 * 86400);
}

export async function signClientPortalImpersonation(payload: Omit<ClientPortalImpersonationPayload, 'scope'>) {
  return issueAuthGrant({ ...payload, scope: 'client-impersonation' }, getClientPortalSecret(), 12 * 3600);
}

export async function verifyClientPortalSession(token: string): Promise<ClientPortalSessionPayload | null> {
  const decoded = await verifyAuthGrant(token, 'client-dashboard', getClientPortalSecret());
  return decoded?.role === 'CLIENT' ? decoded as unknown as ClientPortalSessionPayload : null;
}

export async function verifyClientPortalImpersonation(token: string): Promise<ClientPortalImpersonationPayload | null> {
  const decoded = await verifyAuthGrant(token, 'client-impersonation', getClientPortalSecret());
  return decoded?.adminRole === 'ADMIN' ? decoded as unknown as ClientPortalImpersonationPayload : null;
}

export async function signClientPortalMagicLink(payload: Omit<ClientPortalMagicLinkPayload, 'scope'>) {
  const contact = await prisma.contact.findUnique({ where: { id: payload.contactId }, include: { userAccount: true } });
  if (!contact || contact.deletedAt) throw new Error('AUTH_IDENTITY_UNAVAILABLE');
  return issueAuthGrant({ ...payload, scope: 'client-login', authVersion: contact.userAccount?.authVersion ?? null,
    authUserId: contact.userAccount?.id ?? null, contactVersion: contact.authVersion }, getClientPortalSecret(), 20 * 60);
}

export async function verifyClientPortalMagicLink(token: string): Promise<ClientPortalMagicLinkPayload | null> {
  const decoded = await verifyAuthGrant(token, 'client-login', getClientPortalSecret());
  return decoded as unknown as ClientPortalMagicLinkPayload | null;
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

export async function getClientPortalSessionFromCookieHeader(cookie?: string) {
  const token = readNamedCookie(cookie, CLIENT_PORTAL_COOKIE_NAME);
  return token ? verifyClientPortalSession(token) : null;
}

export async function getClientPortalSessionServer() {
  const cookieStore = await cookies();

  const crmToken = cookieStore.get(CRM_COOKIE_NAME)?.value;
  const crmSession = crmToken ? await verifyCrmToken(crmToken) : null;
  const impersonationToken = cookieStore.get(CLIENT_PORTAL_IMPERSONATION_COOKIE_NAME)?.value;

  if (crmSession?.role === 'ADMIN' && impersonationToken) {
    const impersonation = await verifyClientPortalImpersonation(impersonationToken);
    if (impersonation && impersonation.adminId === crmSession.sub) {
      const contact = await prisma.contact.findUnique({
        where: { id: impersonation.contactId },
        select: {
          id: true,
          fullName: true,
          email: true,
          deletedAt: true,
        },
      });

      if (contact && !contact.deletedAt) {
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
  const session = await verifyClientPortalSession(token);
  if (!session) return null;
  return { ...session, impersonation: null };
}

export async function requireClientPortalSession() {
  const session = await getClientPortalSessionServer();
  if (!session) {
    redirect('/connexion?next=/client/dashboard');
  }
  return session;
}

export function buildClientPortalMagicLink(token: string, origin?: string) {
  return `${getClientPortalBaseUrl(origin)}/client/auth/verify?token=${encodeURIComponent(token)}`;
}
