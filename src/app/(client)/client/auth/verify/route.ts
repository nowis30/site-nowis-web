import { NextRequest, NextResponse } from 'next/server';
import { createClientPortalSessionCookie, signClientPortalSession, verifyClientPortalMagicLink } from '@/features/client-portal/auth/session';
import { prisma } from '@/lib/prisma';
import { consumeAuthGrant } from '@/lib/auth-grants';
import { adoptVerifiedPortalUser } from '@/lib/verified-account';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const payload = await verifyClientPortalMagicLink(token);

  if (!payload) {
    return NextResponse.redirect(new URL('/connexion?error=invalid-link', request.url));
  }

  // Vérifier que le contact existe encore et n'est pas archivé
  const contact = await prisma.contact.findUnique({
    where: { id: payload.contactId },
    select: { id: true, authVersion: true, email: true, fullName: true, deletedAt: true, userAccount: { select: { id: true, authVersion: true, isActive: true, role: true } } },
  });

  if (!contact || contact.deletedAt || contact.userAccount?.isActive === false || contact.email?.trim().toLowerCase() !== payload.email.trim().toLowerCase()) {
    return NextResponse.redirect(new URL('/connexion?error=account-not-found', request.url));
  }

  if (!await consumeAuthGrant(token, 'client-login')) {
    return NextResponse.redirect(new URL('/connexion?error=invalid-link', request.url));
  }
  if (contact.authVersion !== payload.contactVersion || (contact.userAccount?.id ?? null) !== payload.authUserId
    || (contact.userAccount?.authVersion ?? null) !== payload.authVersion) {
    return NextResponse.redirect(new URL('/connexion?error=invalid-link', request.url));
  }
  const user = contact.userAccount ? await prisma.$transaction(tx => adoptVerifiedPortalUser(tx, contact.userAccount!.id, payload.authVersion)) : null;
  const sessionToken = await signClientPortalSession({
    contactId: payload.contactId,
    tenantId: payload.tenantId,
    email: contact.email,
    fullName: contact.fullName,
    authVersion: user?.authVersion ?? null,
    authUserId: user?.id ?? null,
    contactVersion: contact.authVersion,
  });

  return NextResponse.redirect(new URL('/client/dashboard', request.url), {
    headers: {
      'Set-Cookie': createClientPortalSessionCookie(sessionToken),
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
