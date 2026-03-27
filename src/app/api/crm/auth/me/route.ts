import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionFromCookieHeader } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = getCrmSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user || !user.isActive) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('crm auth me error', error);
    return NextResponse.json({ user: null });
  }
}
