import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPublicBillingToken } from '@/lib/public-links';
import { getClientBillingDefaults, getClientBillingMissingLabels } from '@/lib/client-billing';

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

    const current = await prisma.contact.findUnique({
      where: { id: decoded.contactId },
      select: {
        fullName: true,
        email: true,
        billingLegalName: true,
        billingEmail: true,
        billingAddressLine1: true,
        billingCity: true,
        billingState: true,
        billingPostalCode: true,
        billingCountry: true,
      },
    });

    if (!current) {
      return NextResponse.json({ error: 'Contact introuvable.' }, { status: 404 });
    }

    const candidate = {
      ...current,
      billingLegalName: payload.billingLegalName !== undefined ? normalizeOptional(payload.billingLegalName) : current.billingLegalName,
      billingEmail: payload.billingEmail !== undefined ? normalizeOptional(payload.billingEmail) : current.billingEmail,
      billingAddressLine1: payload.billingAddressLine1 !== undefined ? normalizeOptional(payload.billingAddressLine1) : current.billingAddressLine1,
      billingCity: payload.billingCity !== undefined ? normalizeOptional(payload.billingCity) : current.billingCity,
      billingState: payload.billingState !== undefined ? normalizeOptional(payload.billingState) : current.billingState,
      billingPostalCode: payload.billingPostalCode !== undefined ? normalizeOptional(payload.billingPostalCode) : current.billingPostalCode,
      billingCountry: payload.billingCountry !== undefined ? normalizeOptional(payload.billingCountry) : current.billingCountry,
    };

    const defaults = getClientBillingDefaults(candidate);
    const merged = {
      ...candidate,
      billingLegalName: candidate.billingLegalName || defaults.billingLegalName,
      billingEmail: candidate.billingEmail || defaults.billingEmail,
      billingCountry: candidate.billingCountry || defaults.billingCountry,
    };

    const missingFields = getClientBillingMissingLabels(merged);
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Profil de facturation incomplet',
          missingFields,
        },
        { status: 400 },
      );
    }

    const updated = await prisma.contact.update({
      where: { id: decoded.contactId },
      data: {
        billingCompanyName: normalizeOptional(payload.billingCompanyName),
        billingLegalName: merged.billingLegalName,
        billingEmail: merged.billingEmail,
        billingPhone: normalizeOptional(payload.billingPhone),
        billingAddressLine1: merged.billingAddressLine1,
        billingAddressLine2: normalizeOptional(payload.billingAddressLine2),
        billingCity: merged.billingCity,
        billingState: merged.billingState,
        billingPostalCode: merged.billingPostalCode,
        billingCountry: merged.billingCountry,
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
