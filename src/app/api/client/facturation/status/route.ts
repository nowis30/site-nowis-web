import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { getClientBillingMissingLabels, isClientBillingComplete } from '@/lib/client-billing';

function unauthorized() {
  return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) return unauthorized();

  const contact = await prisma.contact.findUnique({
    where: { id: session.contactId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      billingLegalName: true,
      billingEmail: true,
      billingAddressLine1: true,
      billingCity: true,
      billingState: true,
      billingPostalCode: true,
      billingCountry: true,
    },
  });

  if (!contact) return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });

  const complete = isClientBillingComplete(contact);
  return NextResponse.json({
    complete,
    missingFields: complete ? [] : getClientBillingMissingLabels(contact),
  });
}
