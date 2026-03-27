import { NextResponse } from 'next/server';
import { clearClientPortalImpersonationCookie, clearClientPortalSessionCookie } from '@/features/client-portal/auth/session';

export async function POST() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.append('Set-Cookie', clearClientPortalSessionCookie());
  response.headers.append('Set-Cookie', clearClientPortalImpersonationCookie());
  return response;
}