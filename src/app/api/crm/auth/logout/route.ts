import { NextResponse } from 'next/server';
import { clearCrmSessionCookie } from '@/features/crm/auth/session';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', clearCrmSessionCookie());
  return response;
}
