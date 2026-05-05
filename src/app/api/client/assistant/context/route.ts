import { NextRequest, NextResponse } from 'next/server';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { prisma } from '@/lib/prisma';
import { formRegistry } from '@/features/client-portal/forms/form-registry';

/**
 * GET /api/client/assistant/context
 *
 * Retourne les informations contextuelles pour un assistant IA :
 * - Identité du contact connecté
 * - Complétude du profil de facturation
 * - Liste des formulaires disponibles avec leurs champs et prompts assistant
 *
 * Utilisé par un chatbot/assistant pour guider le client dans ses demandes.
 */
export async function GET(request: NextRequest) {
  const session = getClientPortalSessionFromCookieHeader(
    request.headers.get('cookie') ?? undefined
  );
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const contact = await prisma.contact.findUnique({
    where: { id: session.contactId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      billingAddressLine1: true,
      billingCity: true,
      billingPostalCode: true,
      billingCountry: true,
    },
  });

  if (!contact) {
    return NextResponse.json({ error: 'Contact introuvable.' }, { status: 404 });
  }

  // Vérifier la complétude du profil de facturation
  const billingChecks: Record<string, string | null | undefined> = {
    billingAddressLine1: contact.billingAddressLine1,
    billingCity: contact.billingCity,
    billingPostalCode: contact.billingPostalCode,
    billingCountry: contact.billingCountry,
  };
  const missingFields = Object.entries(billingChecks)
    .filter(([, v]) => !v || v.trim() === '')
    .map(([k]) => k);

  // Formulaires disponibles sans le champ `api` (route interne)
  const forms = Object.values(formRegistry).map((form) => ({
    id: form.id,
    title: form.title,
    description: form.description,
    route: form.route,
    steps: form.steps,
  }));

  return NextResponse.json({
    contact: {
      id: contact.id,
      fullName: contact.fullName,
      email: contact.email,
      phone: contact.phone ?? null,
    },
    billing: {
      complete: missingFields.length === 0,
      missingFields,
    },
    forms,
  });
}
