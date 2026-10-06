import { issueAuthGrant, verifyAuthGrant } from '@/lib/auth-grants';
import { getClientPortalBaseUrl } from '@/features/client-portal/auth/session';
import type { Prisma } from '@prisma/client';
import { getAuthSigningSecret } from '@/lib/auth-signing-secret';

export interface ClientPortalTokenPayload {
  scope: 'song-request-portal';
  contactId: string;
  email: string;
  fullName: string;
}

function getClientPortalSecret() {
  return getAuthSigningSecret(['CLIENT_PORTAL_JWT_SECRET', 'JWT_SECRET'], 'dev-only-portal-secret-must-change');
}

export async function signClientPortalToken(payload: Omit<ClientPortalTokenPayload, 'scope'>, database?: Prisma.TransactionClient): Promise<string> {
  return issueAuthGrant({ ...payload, scope: 'song-request-portal' }, getClientPortalSecret(), 180 * 86400, database);
}

export async function verifyClientPortalToken(token: string): Promise<ClientPortalTokenPayload | null> {
  return await verifyAuthGrant(token, 'song-request-portal', getClientPortalSecret()) as unknown as ClientPortalTokenPayload | null;
}

export function buildClientPortalPath(token: string): string {
  return `/crm/client/${token}`;
}

export function buildClientPortalUrl(token: string, origin?: string): string {
  const baseUrl = getClientPortalBaseUrl(origin);

  return `${baseUrl}${buildClientPortalPath(token)}`;
}
