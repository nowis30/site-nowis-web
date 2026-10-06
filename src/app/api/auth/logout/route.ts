import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getTokenFromCookie } from '@/lib/auth';
import { revokeAuthGrant } from '@/lib/auth-grants';
import { assertAuthOrigin, authRequestErrorResponse } from '@/lib/auth-request-security';

export async function POST(request: NextRequest) {
  try { assertAuthOrigin(request); await revokeAuthGrant(getTokenFromCookie(request.headers.get('cookie') || undefined)); }
  catch (error) { return authRequestErrorResponse(error) || NextResponse.json({ error: 'Déconnexion indisponible.' }, { status: 503 }); }
  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', clearSessionCookie());
  return response;
}
