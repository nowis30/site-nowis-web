import { randomUUID } from 'crypto';
import { sanitizeNextPath } from '@/lib/safe-next';

export const CLIENT_GOOGLE_STATE_COOKIE_NAME = 'nowis_client_google_state';
export const CLIENT_GOOGLE_NEXT_COOKIE_NAME = 'nowis_client_google_next';

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function getGoogleAuthBaseUrl(origin?: string) {
  return trimTrailingSlash(
    process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_DOMAIN ||
      origin ||
      'http://localhost:3000',
  );
}

export function getGoogleCallbackUrl(origin?: string) {
  // Use the canonical Google callback path expected in most OAuth app configs.
  return `${getGoogleAuthBaseUrl(origin)}/api/auth/callback/google`;
}

export function createGoogleOauthStateCookie(state: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 60 * 10;
  return `${CLIENT_GOOGLE_STATE_COOKIE_NAME}=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge};${isProd ? ' Secure;' : ''}`;
}

export function createGoogleOauthNextCookie(nextPath: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 60 * 10;
  return `${CLIENT_GOOGLE_NEXT_COOKIE_NAME}=${encodeURIComponent(nextPath)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge};${isProd ? ' Secure;' : ''}`;
}

export function clearGoogleOauthStateCookie() {
  const isProd = process.env.NODE_ENV === 'production';
  return `${CLIENT_GOOGLE_STATE_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;${isProd ? ' Secure;' : ''}`;
}

export function clearGoogleOauthNextCookie() {
  const isProd = process.env.NODE_ENV === 'production';
  return `${CLIENT_GOOGLE_NEXT_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;${isProd ? ' Secure;' : ''}`;
}

export function buildGoogleAuthorizationUrl(options: {
  clientId: string;
  callbackUrl: string;
  state: string;
}) {
  const params = new URLSearchParams({
    client_id: options.clientId,
    redirect_uri: options.callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state: options.state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function readCookieValue(cookieHeader: string | null, cookieName: string) {
  if (!cookieHeader) return null;
  const escaped = cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = cookieHeader.match(new RegExp(`${escaped}=([^;]+)`));
  return match?.[1] ?? null;
}

export function createGoogleOauthState() {
  return randomUUID();
}

export function sanitizeGoogleNextPath(nextParam: string | null | undefined) {
  return sanitizeNextPath(nextParam, '/client/dashboard');
}
