import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionFromCookieHeader } from '@/features/crm/auth/session';
import {
  createClientPortalImpersonationCookie,
  signClientPortalImpersonation,
} from '@/features/client-portal/auth/session';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = getCrmSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) {
    return NextResponse.json({ error: 'Session CRM invalide' }, { status: 401 });
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Seul un admin peut activer le mode client' }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { contactId?: string } | null;
  const contactId = body?.contactId?.trim();

  if (!contactId) {
    return NextResponse.json({ error: 'contactId requis' }, { status: 400 });
  }

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { id: true, fullName: true },
  });

  if (!contact) {
    return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
  }

  const token = signClientPortalImpersonation({
    adminId: session.sub,
    adminRole: 'ADMIN',
    contactId: contact.id,
  });

  await prisma.activity.create({
    data: {
      type: 'NOTE',
      title: 'Consultation en mode client',
      description: `Admin ${session.fullName} a activé l\'impersonation client.`,
      contactId: contact.id,
      userId: session.sub,
    },
  });

  return NextResponse.json(
    { success: true, contactId: contact.id, contactName: contact.fullName },
    {
      headers: {
        'Set-Cookie': createClientPortalImpersonationCookie(token),
      },
    },
  );
}
