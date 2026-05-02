import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import {
  buildCalendarOAuthUrl,
  CALENDAR_PROVIDER_LABELS,
  connectCalendarProviderFromCode,
  recordCalendarActivity,
} from '@/lib/calendar/service';

const CALENDAR_OAUTH_STATE_COOKIE = 'crm_calendar_oauth_state';

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/api/crm/calendar',
    maxAge: 60 * 10,
  };
}

type CalendarOAuthCookie = {
  state: string;
  provider: string;
  userId: string;
  createdAt: number;
};

function getCalendarAdminGuard(request: NextRequest, action: 'read' | 'update') {
  const permission = action === 'read' ? 'read' : 'update';
  const guard = requireApiPermission(request, 'settings', permission);
  if (guard.error) return guard;
  if (guard.session.role !== 'ADMIN') {
    return {
      error: NextResponse.json({ error: 'Action réservée à un administrateur' }, { status: 403 }),
      session: null,
    } as const;
  }
  return guard;
}

function parseStateCookie(rawValue: string | undefined) {
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue) as CalendarOAuthCookie;
  } catch {
    return null;
  }
}

function redirectWithStatus(provider: string, status: string, error?: string) {
  const url = new URL('/crm/admin/calendar-connections', 'http://localhost');
  url.searchParams.set('provider', provider.toLowerCase());
  url.searchParams.set('status', status);
  if (error) {
    url.searchParams.set('error', error.slice(0, 160));
  }
  return url.pathname + url.search;
}

export function requireCalendarAdminAccess(request: NextRequest, action: 'read' | 'update' = 'read') {
  return getCalendarAdminGuard(request, action);
}

export async function handleCalendarConnect(request: NextRequest, provider: string) {
  const guard = getCalendarAdminGuard(request, 'update');
  if (guard.error) return guard.error;

  const state = randomUUID();
  const response = NextResponse.redirect(buildCalendarOAuthUrl(provider, state));
  response.cookies.set(
    CALENDAR_OAUTH_STATE_COOKIE,
    JSON.stringify({
      state,
      provider,
      userId: guard.session.sub,
      createdAt: Date.now(),
    } satisfies CalendarOAuthCookie),
    buildCookieOptions(),
  );
  return response;
}

export async function handleCalendarCallback(request: NextRequest, provider: string) {
  const guard = getCalendarAdminGuard(request, 'update');
  if (guard.error) return guard.error;

  const redirectTarget = redirectWithStatus(provider, 'error');
  const response = NextResponse.redirect(new URL(redirectTarget, request.url));
  response.cookies.set(CALENDAR_OAUTH_STATE_COOKIE, '', { ...buildCookieOptions(), maxAge: 0 });

  const url = request.nextUrl;
  const error = url.searchParams.get('error');
  if (error) {
    return NextResponse.redirect(new URL(redirectWithStatus(provider, 'error', error), request.url));
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const stateCookie = parseStateCookie(request.cookies.get(CALENDAR_OAUTH_STATE_COOKIE)?.value);
  if (!code || !state || !stateCookie || stateCookie.state !== state || stateCookie.provider !== provider || stateCookie.userId !== guard.session.sub) {
    return NextResponse.redirect(new URL(redirectWithStatus(provider, 'error', 'Etat OAuth invalide'), request.url));
  }

  try {
    const connection = await connectCalendarProviderFromCode(provider, code, guard.session.sub);
    await recordCalendarActivity({
      title: `${CALENDAR_PROVIDER_LABELS[connection.provider]} connecté`,
      description: `Connexion du compte ${connection.accountEmail || connection.accountName || connection.providerAccountId}`,
      userId: guard.session.sub,
      relatedId: connection.id,
    });

    const success = NextResponse.redirect(new URL(redirectWithStatus(provider, 'connected'), request.url));
    success.cookies.set(CALENDAR_OAUTH_STATE_COOKIE, '', { ...buildCookieOptions(), maxAge: 0 });
    return success;
  } catch (callbackError) {
    const message = callbackError instanceof Error ? callbackError.message : 'Connexion OAuth impossible';
    return NextResponse.redirect(new URL(redirectWithStatus(provider, 'error', message), request.url));
  }
}