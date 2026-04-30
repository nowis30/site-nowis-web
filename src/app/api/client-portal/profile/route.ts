import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { isClientProfileIncomplete, upsertClientProfileMeta } from '@/features/client-portal/profile';
import { prisma } from '@/lib/prisma';

const profileSchema = z.object({
  phone: z.string().trim().min(7).max(40),
  billingAddress: z.object({
    streetNumber: z.string().trim().min(1).max(20),
    street: z.string().trim().min(2).max(140),
    city: z.string().trim().min(2).max(120),
    postalCode: z.string().trim().min(3).max(20),
  }),
  samePostalAsBilling: z.boolean().default(false),
  requestPostalAddress: z.object({
    streetNumber: z.string().trim().min(1).max(20),
    street: z.string().trim().min(2).max(140),
    city: z.string().trim().min(2).max(120),
    postalCode: z.string().trim().min(3).max(20),
  }),
  requestType: z.enum(['ATELIER', 'CHANSON', 'ATELIER_ET_CHANSON']),
});

export async function PATCH(request: NextRequest) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);

  if (!session) {
    return NextResponse.json({ error: 'Session client invalide' }, { status: 401 });
  }

  try {
    const payload = profileSchema.parse(await request.json());

    const contact = await prisma.contact.findUnique({
      where: { id: session.contactId },
      select: { id: true, fullName: true, email: true, phone: true, notes: true, tags: true },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
    }

    const wasIncomplete = isClientProfileIncomplete({ phone: contact.phone, notes: contact.notes });

    const nextNotes = upsertClientProfileMeta(contact.notes, {
      billingAddress: payload.billingAddress,
      requestPostalAddress: payload.requestPostalAddress,
      samePostalAsBilling: payload.samePostalAsBilling,
      requestType: payload.requestType,
    });

    const nextTags = Array.from(new Set([...(contact.tags || []), 'profile-contact-complete']));

    await prisma.$transaction(async (tx) => {
      await tx.contact.update({
        where: { id: contact.id },
        data: {
          phone: payload.phone,
          notes: nextNotes,
          tags: nextTags,
        },
      });

      await tx.activity.create({
        data: {
          type: 'FORM_SUBMISSION',
          title: 'Informations client completees',
          description: `Profil complete depuis portail client (${contact.fullName} - ${contact.email || 'sans-email'}).`,
          contactId: contact.id,
        },
      });

      if (wasIncomplete) {
        await tx.task.create({
          data: {
            title: 'Verifier infos client completees',
            description: `Le client ${contact.fullName} a complete ses informations (telephone, facturation, adresse de demande).`,
            type: 'FOLLOW_UP',
            status: 'TODO',
            priority: 'MEDIUM',
            linkedType: 'CONTACT',
            linkedId: contact.id,
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Donnees invalides', details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: 'Mise a jour impossible' }, { status: 500 });
  }
}
