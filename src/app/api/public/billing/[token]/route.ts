import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPublicBillingToken } from '@/lib/public-links';

const nullableString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal('')).or(z.null());

const updateSchema = z.object({
  billingCompanyName: nullableString(160),
  billingLegalName: nullableString(160),
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

function normalizeOptional(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const decoded = verifyPublicBillingToken(params.token);
  if (!decoded) {
    return NextResponse.json({ error: 'Lien invalide ou expire.' }, { status: 401 });
  }

  const contact = await prisma.contact.findUnique({
    where: { id: decoded.contactId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      companyName: true,
      billingCompanyName: true,
      billingLegalName: true,
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

  if (!contact) {
    return NextResponse.json({ error: 'Contact introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ item: contact });
}

export async function PATCH(request: NextRequest, { params }: { params: { token: string } }) {
  const decoded = verifyPublicBillingToken(params.token);
  if (!decoded) {
    return NextResponse.json({ error: 'Lien invalide ou expire.' }, { status: 401 });
  }

  try {
    const payload = updateSchema.parse(await request.json());

    const updated = await prisma.contact.update({
      where: { id: decoded.contactId },
      data: {
        billingCompanyName: normalizeOptional(payload.billingCompanyName),
        billingLegalName: normalizeOptional(payload.billingLegalName),
        billingEmail: normalizeOptional(payload.billingEmail),
        billingPhone: normalizeOptional(payload.billingPhone),
        billingAddressLine1: normalizeOptional(payload.billingAddressLine1),
        billingAddressLine2: normalizeOptional(payload.billingAddressLine2),
        billingCity: normalizeOptional(payload.billingCity),
        billingState: normalizeOptional(payload.billingState),
        billingPostalCode: normalizeOptional(payload.billingPostalCode),
        billingCountry: normalizeOptional(payload.billingCountry),
        billingTaxId: normalizeOptional(payload.billingTaxId),
        billingNotes: normalizeOptional(payload.billingNotes),
      },
      select: {
        id: true,
        fullName: true,
        billingCompanyName: true,
        billingLegalName: true,
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

    await prisma.activity.create({
      data: {
        type: 'NOTE',
        title: 'Informations de facturation client mises a jour',
        description: `Mise a jour via lien client securise. Contact: ${updated.fullName}`,
        contactId: updated.id,
        relatedType: 'BILLING_PROFILE_UPDATE',
      },
    }).catch(() => undefined);

    return NextResponse.json({ ok: true, item: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Donnees invalides';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
