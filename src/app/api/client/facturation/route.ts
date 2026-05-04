import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';

function unauthorized() {
  return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
}

const nullableString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal('')).or(z.null());

const billingPatchSchema = z.object({
  billingLegalName: nullableString(160),
  billingCompanyName: nullableString(160),
  billingEmail: z.string().trim().email().optional().or(z.literal('')).or(z.null()),
  billingPhone: nullableString(40),
  billingAddressLine1: nullableString(240),
  billingAddressLine2: nullableString(240),
  billingCity: nullableString(120),
  billingState: nullableString(120),
  billingPostalCode: nullableString(40),
  billingCountry: nullableString(120),
  billingTaxId: nullableString(80),
  billingNotes: nullableString(2000),
});

function normalize(value?: string | null) {
  if (!value) return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
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
      billingLegalName: true,
      billingCompanyName: true,
      billingEmail: true,
      billingPhone: true,
      billingAddressLine1: true,
      billingAddressLine2: true,
      billingCity: true,
      billingState: true,
      billingPostalCode: true,
      billingCountry: true,
      billingTaxId: true,
      billingNotes: true,
    },
  });

  if (!contact) return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
  return NextResponse.json({ item: contact });
}

export async function PATCH(request: NextRequest) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) return unauthorized();

  const parseResult = billingPatchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Champs invalides', details: parseResult.error.flatten() }, { status: 400 });
  }
  const payload = parseResult.data;

  const contact = await prisma.contact.update({
    where: { id: session.contactId },
    data: {
      billingLegalName: payload.billingLegalName !== undefined ? normalize(payload.billingLegalName) : undefined,
      billingCompanyName: payload.billingCompanyName !== undefined ? normalize(payload.billingCompanyName) : undefined,
      billingEmail: payload.billingEmail !== undefined ? normalize(payload.billingEmail) : undefined,
      billingPhone: payload.billingPhone !== undefined ? normalize(payload.billingPhone) : undefined,
      billingAddressLine1: payload.billingAddressLine1 !== undefined ? normalize(payload.billingAddressLine1) : undefined,
      billingAddressLine2: payload.billingAddressLine2 !== undefined ? normalize(payload.billingAddressLine2) : undefined,
      billingCity: payload.billingCity !== undefined ? normalize(payload.billingCity) : undefined,
      billingState: payload.billingState !== undefined ? normalize(payload.billingState) : undefined,
      billingPostalCode: payload.billingPostalCode !== undefined ? normalize(payload.billingPostalCode) : undefined,
      billingCountry: payload.billingCountry !== undefined ? normalize(payload.billingCountry) : undefined,
      billingTaxId: payload.billingTaxId !== undefined ? normalize(payload.billingTaxId) : undefined,
      billingNotes: payload.billingNotes !== undefined ? normalize(payload.billingNotes) : undefined,
    },
    select: {
      id: true,
      billingLegalName: true,
      billingCompanyName: true,
      billingEmail: true,
      billingPhone: true,
      billingAddressLine1: true,
      billingAddressLine2: true,
      billingCity: true,
      billingState: true,
      billingPostalCode: true,
      billingCountry: true,
      billingTaxId: true,
      billingNotes: true,
    },
  });

  return NextResponse.json({ item: contact });
}
