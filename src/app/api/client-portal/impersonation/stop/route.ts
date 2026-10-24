import { NextResponse } from 'next/server';
import { clearClientPortalImpersonationCookie } from '@/features/client-portal/auth/session';

export async function POST() {
  return NextResponse.json(
    { success: true, redirectTo: '/crm/historique' },
    {
      headers: {
        'Set-Cookie': clearClientPortalImpersonationCookie(),
      },
    },
  );
}
