import { authOriginError } from '@/lib/auth-request-security';
import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionFromCookieHeader } from '@/features/crm/auth/session';
import { CLIENT_PORTAL_IMPERSONATION_COOKIE_NAME, clearClientPortalImpersonationCookie } from '@/features/client-portal/auth/session';
import { readNamedCookie, revokeAuthGrant } from '@/lib/auth-grants';

export async function POST(request: NextRequest) {
  const originError = authOriginError(request);
  if (originError) return originError;
  const session = await getCrmSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) {
    return NextResponse.json({ error: 'Session CRM invalide' }, { status: 401 });
  }
  await revokeAuthGrant(readNamedCookie(request.headers.get('cookie'), CLIENT_PORTAL_IMPERSONATION_COOKIE_NAME));

  return NextResponse.json(
    { success: true },
    {
      headers: {
        'Set-Cookie': clearClientPortalImpersonationCookie(),
      },
    },
  );
}
