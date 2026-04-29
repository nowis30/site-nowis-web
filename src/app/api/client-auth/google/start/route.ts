import { NextRequest, NextResponse } from 'next/server';
import {
  buildGoogleAuthorizationUrl,
  createGoogleOauthNextCookie,
  createGoogleOauthState,
  createGoogleOauthStateCookie,
  getGoogleCallbackUrl,
  sanitizeGoogleNextPath,
} from '@/features/client-portal/auth/google';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(new URL('/connexion?error=google-unavailable', request.url));
  }

  const nextPath = sanitizeGoogleNextPath(request.nextUrl.searchParams.get('next'));
  const state = createGoogleOauthState();
  const callbackUrl = getGoogleCallbackUrl(request.nextUrl.origin);
  const authUrl = buildGoogleAuthorizationUrl({ clientId, callbackUrl, state });

  const response = NextResponse.redirect(authUrl, { headers: { 'Cache-Control': 'no-store' } });
  response.headers.append('Set-Cookie', createGoogleOauthStateCookie(state));
  response.headers.append('Set-Cookie', createGoogleOauthNextCookie(nextPath));
  return response;
}
