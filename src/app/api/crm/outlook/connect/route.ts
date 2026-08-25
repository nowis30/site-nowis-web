import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { buildOutlookAuthorizationUrl, OutlookConfigurationError } from '@/lib/outlook/service';

const COOKIE_NAME = 'crm_outlook_oauth_state';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'settings', 'update');
  if (guard.error) return guard.error;

  const invoiceId = request.nextUrl.searchParams.get('invoiceId')?.trim() || null;
  const state = randomUUID();
  const origin = request.nextUrl.origin;

  try {
    const response = NextResponse.redirect(buildOutlookAuthorizationUrl(origin, state));
    response.cookies.set(
      COOKIE_NAME,
      JSON.stringify({
        state,
        userId: guard.session.sub,
        invoiceId,
        createdAt: Date.now(),
      }),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/api/crm/outlook',
        maxAge: 60 * 10,
      },
    );
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Configuration Outlook impossible.';
    return NextResponse.json(
      {
        error: message,
        code: error instanceof OutlookConfigurationError ? 'OUTLOOK_CONFIG_MISSING' : 'OUTLOOK_CONNECT_ERROR',
      },
      { status: 503 },
    );
  }
}
