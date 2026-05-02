import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';

function unauthorized() {
  return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) return unauthorized();

  const items = await prisma.workshopRequest.findMany({
    where: {
      OR: [
        { contactId: session.contactId },
        { clientId: session.contactId },
        { organizationContact: { contactId: session.contactId } },
      ],
      status: { not: 'DELETED' },
    },
    include: {
      organization: { select: { id: true, name: true } },
      appointments: {
        select: { id: true, title: true, startAt: true, endAt: true, status: true, location: true },
        orderBy: { startAt: 'asc' },
        take: 20,
      },
      crmAppointments: {
        select: { id: true, title: true, startAt: true, endAt: true, status: true, type: true, location: true },
        orderBy: { startAt: 'asc' },
        take: 20,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ items });
}
