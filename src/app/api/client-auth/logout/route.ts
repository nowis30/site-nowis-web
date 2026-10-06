import { NextRequest, NextResponse } from 'next/server';
import { CLIENT_PORTAL_COOKIE_NAME, CLIENT_PORTAL_IMPERSONATION_COOKIE_NAME, clearClientPortalImpersonationCookie, clearClientPortalSessionCookie } from '@/features/client-portal/auth/session';
import { readNamedCookie, revokeAuthGrant } from '@/lib/auth-grants';
import { assertAuthOrigin, authRequestErrorResponse } from '@/lib/auth-request-security';

export async function POST(request: NextRequest) {
  try {
    assertAuthOrigin(request);
    await revokeAuthGrant(readNamedCookie(request.headers.get('cookie'), CLIENT_PORTAL_COOKIE_NAME));
    await revokeAuthGrant(readNamedCookie(request.headers.get('cookie'), CLIENT_PORTAL_IMPERSONATION_COOKIE_NAME));
  } catch (error) { return authRequestErrorResponse(error) || NextResponse.json({ error: 'Déconnexion momentanément indisponible.' }, { status: 503 }); }
  const response = new NextResponse(null, { status: 204 });
  response.headers.append('Set-Cookie', clearClientPortalSessionCookie());
  response.headers.append('Set-Cookie', clearClientPortalImpersonationCookie());
  return response;
}
