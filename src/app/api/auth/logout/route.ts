import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', clearSessionCookie());
  return response;
}
