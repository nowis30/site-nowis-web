import { NextResponse } from 'next/server';
import { clearCrmOtpCookie, clearCrmSessionCookie } from '@/features/crm/auth/session';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.append('Set-Cookie', clearCrmSessionCookie());
  response.headers.append('Set-Cookie', clearCrmOtpCookie());
  return response;
}
