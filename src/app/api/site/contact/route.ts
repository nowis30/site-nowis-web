import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { buildAuthRedirect } from '@/lib/safe-next';
import { buildCorsPreflightResponse } from '@/lib/cors';

// Endpoint désormais protégé: les créations ne sont possibles qu'avec session portail.

const SITE_SECRET = process.env.SITE_INTEGRATION_SECRET;

const contactFormSchema = z.object({
  // Auth optionnelle
  secret: z.string().optional(),
  // Source du formulaire
  formType: z.enum(['contact', 'rental', 'inquiry', 'property', 'custom']).default('contact'),
  formLabel: z.string().max(120).optional(),
  // Données du contact
  fullName: z.string().min(2).max(160),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(40).optional(),
  companyName: z.string().max(160).optional(),
  message: z.string().max(5000).optional(),
  // Métadonnées optionnelles
  source: z.string().max(120).optional(),
  tags: z.array(z.string()).default([]),
  // Création de tâche de suivi
  createFollowUpTask: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
    if (!session) {
      return NextResponse.json(
        {
          error: 'Connexion requise pour envoyer une demande.',
          code: 'AUTH_REQUIRED',
          loginUrl: buildAuthRedirect('/client/dashboard'),
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const data = contactFormSchema.parse({
      ...body,
      email: session.email,
      fullName: body?.fullName || session.fullName,
    });

    if (SITE_SECRET && data.secret && data.secret !== SITE_SECRET) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formLabel = data.formLabel ?? `Formulaire ${data.formType}`;
    const source = data.source ?? 'site-web';

    // Vérifier si le contact existe déjà (par email)
    let contact = await prisma.contact.findFirst({
      where: data.email
        ? {
            OR: [
              { id: session.contactId },
              { email: data.email },
            ],
          }
        : { id: session.contactId },
    });

    if (!contact) {
      // Créer le contact
      contact = await prisma.contact.create({
        data: {
          type: 'CLIENT',
          fullName: data.fullName.trim(),
          email: data.email || null,
          phone: data.phone || null,
          companyName: data.companyName || null,
          source,
          tags: data.tags,
          notes: data.message || null,
        },
      });
    }

    // Créer une activité de type FORM
    await prisma.activity.create({
      data: {
        type: 'FORM',
        title: `Formulaire reçu : ${formLabel}`,
        description: data.message
          ? `Message : ${data.message.slice(0, 500)}`
          : `Soumission via ${formLabel}`,
        contactId: contact.id,
      },
    });

    // Créer une demande (Inquiry)
    if (data.message) {
      await prisma.inquiry.create({
        data: {
          subject: formLabel,
          message: data.message,
          source,
          status: 'NEW',
          contactId: contact.id,
        },
      });
    }

    // Créer une tâche de suivi si demandé
    if (data.createFollowUpTask) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 2); // 48h

        const followUpTaskData: Prisma.TaskUncheckedCreateInput = {
          title: `Suivi : ${data.fullName} (${formLabel})`,
          description: `Contact reçu via le formulaire "${formLabel}" le ${new Date().toLocaleDateString('fr-CA')}.${data.message ? `\n\nMessage : ${data.message.slice(0, 300)}` : ''}`,
          type: 'FOLLOW_UP',
          status: 'TODO',
          priority: 'MEDIUM',
          dueDate,
      };

      await prisma.task.create({ data: followUpTaskData });
    }

    return NextResponse.json({
      ok: true,
      contactId: contact.id,
      isNew: !data.email || !await prisma.contact.findFirst({ where: { email: data.email, id: { not: contact.id } } }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    console.error('[SITE-INTEGRATION]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// CORS pour appels depuis le site vitrine
export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, {
    methods: 'POST, OPTIONS',
    headers: 'Content-Type, Authorization',
    credentials: true,
  });
}
