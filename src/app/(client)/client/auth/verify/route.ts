import { NextRequest, NextResponse } from 'next/server';
import { createClientPortalSessionCookie, signClientPortalSession, verifyClientPortalMagicLink } from '@/features/client-portal/auth/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const payload = verifyClientPortalMagicLink(token);

  if (!payload) {
    return NextResponse.redirect(new URL('/client?error=invalid-link', request.url));
  }

  // Vérifier que le contact existe encore et n'est pas archivé
  const contact = await prisma.contact.findUnique({
    where: { id: payload.contactId },
    select: { id: true, email: true },
  });

  if (!contact) {
    return NextResponse.redirect(new URL('/client?error=account-not-found', request.url));
  }

  const sessionToken = signClientPortalSession({
    contactId: payload.contactId,
    tenantId: payload.tenantId,
    email: payload.email,
    fullName: payload.fullName,
  });

  return NextResponse.redirect(new URL('/client/dashboard', request.url), {
    headers: {
      'Set-Cookie': createClientPortalSessionCookie(sessionToken),
    },
  });
}