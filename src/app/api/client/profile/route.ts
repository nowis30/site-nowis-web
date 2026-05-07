import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { prisma } from '@/lib/prisma';

const billingProfileSchema = z.object({
  phone: z.string().trim().min(7).max(40),
  billingLegalName: z.string().trim().min(1).max(160),
  billingCompanyName: z.string().trim().max(160).nullish(),
  billingEmail: z.string().trim().email(),
  billingPhone: z.string().trim().max(40).nullish(),
  billingAddressLine1: z.string().trim().min(1).max(240),
  billingAddressLine2: z.string().trim().max(240).nullish(),
  billingCity: z.string().trim().min(1).max(120),
  billingState: z.string().trim().min(1).max(120),
  billingPostalCode: z.string().trim().min(1).max(20),
  billingCountry: z.string().trim().min(1).max(120).default('Canada'),
  billingTaxId: z.string().trim().max(50).nullish(),
});

export async function PATCH(request: NextRequest) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);

  if (!session) {
    return NextResponse.json({ error: 'Session client invalide' }, { status: 401 });
  }

  try {
    const payload = billingProfileSchema.parse(await request.json());

    const contact = await prisma.contact.findUnique({
      where: { id: session.contactId },
      select: {
        id: true,
        fullName: true,
        email: true,
        notes: true,
        tags: true,
      },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
    }

    // Mise à jour complète des informations de facturation
    const updated = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        phone: payload.phone,
        billingLegalName: payload.billingLegalName,
        billingCompanyName: payload.billingCompanyName || null,
        billingEmail: payload.billingEmail,
        billingPhone: payload.billingPhone || null,
        billingAddressLine1: payload.billingAddressLine1,
        billingAddressLine2: payload.billingAddressLine2 || null,
        billingCity: payload.billingCity,
        billingState: payload.billingState,
        billingPostalCode: payload.billingPostalCode,
        billingCountry: payload.billingCountry,
        billingTaxId: payload.billingTaxId || null,
        tags: Array.from(new Set([...(contact.tags || []), 'profile-billing-complete'])),
      },
    });

    // Enregistrer activité (non-bloquant)
    try {
      await prisma.activity.create({
        data: {
          type: 'FORM_SUBMISSION',
          title: 'Profil de facturation mis à jour',
          description: `Coordonnées de facturation complétées pour ${contact.fullName}.`,
          contactId: contact.id,
        },
      });
    } catch {
      // Ignorer les erreurs d'activité
    }

    return NextResponse.json({
      ok: true,
      message: 'Profil de facturation enregistré avec succès',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('[CLIENT_PROFILE_PATCH]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Mise à jour impossible' },
      { status: 500 }
    );
  }
}

// Fallback pour les autres méthodes
export async function GET(request: NextRequest) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);

  if (!session) {
    return NextResponse.json({ error: 'Session client invalide' }, { status: 401 });
  }

  const contact = await prisma.contact.findUnique({
    where: { id: session.contactId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
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
    },
  });

  if (!contact) {
    return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
  }

  // Vérifier si le profil de facturation est complet
  const missingFields = [];
  if (!contact.billingLegalName) missingFields.push('billingLegalName');
  if (!contact.billingEmail) missingFields.push('billingEmail');
  if (!contact.billingAddressLine1) missingFields.push('billingAddressLine1');
  if (!contact.billingCity) missingFields.push('billingCity');
  if (!contact.billingState) missingFields.push('billingState');
  if (!contact.billingPostalCode) missingFields.push('billingPostalCode');
  if (!contact.billingCountry) missingFields.push('billingCountry');

  return NextResponse.json({
    contact,
    complete: missingFields.length === 0,
    missingFields,
  });
}
