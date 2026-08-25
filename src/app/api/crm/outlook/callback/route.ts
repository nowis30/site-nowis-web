import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { createInvoiceOutlookDraftWithFullInvoice } from '@/lib/outlook/invoice-draft';
import { connectOutlookFromAuthorizationCode } from '@/lib/outlook/service';

const COOKIE_NAME = 'crm_outlook_oauth_state';

type OutlookStateCookie = {
  state: string;
  userId: string;
  invoiceId: string | null;
  createdAt: number;
};

function clearStateCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/crm/outlook',
    maxAge: 0,
  });
  return response;
}

function parseStateCookie(value: string | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value) as OutlookStateCookie;
  } catch {
    return null;
  }
}

function invoiceReturnUrl(request: NextRequest, invoiceId: string | null, status: string, message?: string) {
  const url = new URL(invoiceId ? `/crm/invoices/${invoiceId}` : '/crm/settings', request.url);
  url.searchParams.set('outlook', status);
  if (message) url.searchParams.set('outlookMessage', message.slice(0, 180));
  return url;
}

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'settings', 'update');
  if (guard.error) return guard.error;

  const stateCookie = parseStateCookie(request.cookies.get(COOKIE_NAME)?.value);
  const state = request.nextUrl.searchParams.get('state');
  const code = request.nextUrl.searchParams.get('code');
  const oauthError = request.nextUrl.searchParams.get('error_description') || request.nextUrl.searchParams.get('error');

  if (
    !stateCookie ||
    !state ||
    stateCookie.state !== state ||
    stateCookie.userId !== guard.session.sub ||
    Date.now() - stateCookie.createdAt > 10 * 60 * 1000
  ) {
    return clearStateCookie(
      NextResponse.redirect(invoiceReturnUrl(request, stateCookie?.invoiceId || null, 'error', 'Connexion Outlook expirée ou invalide.')),
    );
  }

  if (oauthError || !code) {
    return clearStateCookie(
      NextResponse.redirect(invoiceReturnUrl(request, stateCookie.invoiceId, 'error', oauthError || 'Autorisation Outlook annulée.')),
    );
  }

  try {
    await connectOutlookFromAuthorizationCode(request.nextUrl.origin, code, guard.session.sub);

    if (stateCookie.invoiceId) {
      const draft = await createInvoiceOutlookDraftWithFullInvoice(stateCookie.invoiceId, request.nextUrl.origin);
      return clearStateCookie(NextResponse.redirect(draft.outlookUrl));
    }

    return clearStateCookie(
      NextResponse.redirect(invoiceReturnUrl(request, null, 'connected', 'Outlook est connecté.')),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connexion Outlook impossible.';
    return clearStateCookie(
      NextResponse.redirect(invoiceReturnUrl(request, stateCookie.invoiceId, 'error', message)),
    );
  }
}
