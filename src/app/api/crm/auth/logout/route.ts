import { NextRequest, NextResponse } from 'next/server';
import { CRM_COOKIE_NAME, CRM_OTP_COOKIE_NAME, clearCrmOtpCookie, clearCrmSessionCookie } from '@/features/crm/auth/session';
import { readNamedCookie, revokeAuthGrant } from '@/lib/auth-grants';
import { assertAuthOrigin, authRequestErrorResponse } from '@/lib/auth-request-security';

export async function POST(request: NextRequest) {
  try {
    assertAuthOrigin(request);
    await revokeAuthGrant(readNamedCookie(request.headers.get('cookie'), CRM_COOKIE_NAME));
    await revokeAuthGrant(readNamedCookie(request.headers.get('cookie'), CRM_OTP_COOKIE_NAME));
  } catch (error) { return authRequestErrorResponse(error) || NextResponse.json({ error: 'Déconnexion momentanément indisponible.' }, { status: 503 }); }
  const response = NextResponse.json({ ok: true });
  response.headers.append('Set-Cookie', clearCrmSessionCookie());
  response.headers.append('Set-Cookie', clearCrmOtpCookie());
  return response;
}
