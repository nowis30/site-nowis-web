import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookie, verifyToken } from '@/lib/auth';
import { getListingsByOwner } from '@/lib/db';

export async function GET(request: NextRequest) {
  const cookie = request.headers.get('cookie') ?? undefined;
  const token = getTokenFromCookie(cookie);
  if (!token) {
    return NextResponse.json({ listings: [], message: 'Non authentifié' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ listings: [], message: 'Jeton invalide' }, { status: 401 });
  }

  const listings = await getListingsByOwner(payload.sub);
  return NextResponse.json({ listings });
}
