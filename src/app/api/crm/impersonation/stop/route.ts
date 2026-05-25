import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionFromCookieHeader } from '@/features/crm/auth/session';
import { clearClientPortalImpersonationCookie } from '@/features/client-portal/auth/session';

export async function POST(request: NextRequest) {
  const session = getCrmSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) {
    return NextResponse.json({ error: 'Session CRM invalide' }, { status: 401 });
  }

  return NextResponse.json(
    { success: true },
    {
      headers: {
        'Set-Cookie': clearClientPortalImpersonationCookie(),
      },
    },
  );
}
