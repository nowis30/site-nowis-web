import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/icons/android/launchericon-192x192.png', request.url), 307);
}