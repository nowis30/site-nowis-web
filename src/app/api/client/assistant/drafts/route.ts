import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { formRegistry, FORM_IDS, getFormById } from '@/features/client-portal/forms/form-registry';

/**
 * POST /api/client/assistant/drafts
 *
 * Valide un brouillon de formulaire contre le registre des formulaires.
 * Retourne le brouillon nettoyé, les champs manquants, et la route de soumission finale.
 *
 * ⚠️ NE CRÉE AUCUNE DONNÉE EN BASE. Cette route est un outil de validation uniquement.
 * Pour soumettre réellement, l'utilisateur doit appeler la route `form.api`.
 */

const FORM_IDS_TUPLE = FORM_IDS as [keyof typeof formRegistry, ...Array<keyof typeof formRegistry>];

const RequestBodySchema = z.object({
  type: z.string().refine((v): v is keyof typeof formRegistry => FORM_IDS.includes(v as keyof typeof formRegistry), {
    message: `Type de formulaire invalide. Valeurs acceptées : ${FORM_IDS.join(', ')}`,
  }),
  draft: z.record(z.string(), z.unknown()),
});

// Silencer l'avertissement inutilisé
void FORM_IDS_TUPLE;

export async function POST(request: NextRequest) {
  const session = getClientPortalSessionFromCookieHeader(
    request.headers.get('cookie') ?? undefined
  );
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const parsed = RequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Paramètres invalides.', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { type, draft } = parsed.data;
  const form = getFormById(type);
  if (!form) {
    return NextResponse.json({ error: `Formulaire inconnu : ${type}` }, { status: 404 });
  }

  // Collecter tous les champs de tous les étapes
  const allFields = form.steps.flatMap((step) => step.fields);

  // Nettoyer le brouillon : garder seulement les champs connus, sanitiser les strings
  const cleanedDraft: Record<string, unknown> = {};
  for (const field of allFields) {
    const value = draft[field.name];
    if (value !== undefined && value !== null && value !== '') {
      // Sanitisation basique : couper les strings trop longues
      if (typeof value === 'string' && field.maxLength) {
        cleanedDraft[field.name] = value.slice(0, field.maxLength);
      } else {
        cleanedDraft[field.name] = value;
      }
    }
  }

  // Trouver les champs requis manquants
  const missingRequired = allFields
    .filter((field) => field.required && !cleanedDraft[field.name])
    .map((field) => ({
      name: field.name,
      label: field.label,
      assistantPrompt: field.assistantPrompt,
    }));

  return NextResponse.json({
    type,
    draft: cleanedDraft,
    ready: missingRequired.length === 0,
    missingRequired,
    submitRoute: form.api,
    submitNote:
      missingRequired.length === 0
        ? `Le brouillon est complet. Vous pouvez soumettre via POST ${form.api}.`
        : `Il manque ${missingRequired.length} champ(s) requis avant de pouvoir soumettre.`,
  });
}

// Préférer la méthode POST ; on expose aussi OPTIONS pour les clients CORS potentiels
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
    },
  });
}

// Empêcher les GET accidentels
export async function GET() {
  return NextResponse.json(
    {
      error: 'Méthode non supportée. Utilisez POST avec { type, draft }.',
      _docs: '/docs/crm-client-portal-ai-surface.md',
    },
    { status: 405 }
  );
}
