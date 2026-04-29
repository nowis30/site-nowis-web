import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { prisma } from '@/lib/prisma';

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.enum(['SCHOOL', 'COMMUNITY_ORG', 'DAYCARE', 'CAMP', 'OTHER']).default('OTHER'),
  status: z.enum(['ACTIVE', 'LEAD', 'INACTIVE']).default('LEAD'),
  city: z.string().trim().max(120).optional().or(z.literal('')),
  address: z.string().trim().max(240).optional().or(z.literal('')),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  notes: z.string().trim().max(4000).optional().or(z.literal('')),
});

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);

  if (!session) {
    return NextResponse.json({ error: 'Session client invalide' }, { status: 401 });
  }

  try {
    const payload = createOrganizationSchema.parse(await request.json());

    const contact = await prisma.contact.findUnique({
      where: { id: session.contactId },
      select: { id: true, fullName: true, email: true, phone: true },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: payload.name,
          type: payload.type,
          status: payload.status,
          city: normalizeOptionalString(payload.city),
          address: normalizeOptionalString(payload.address),
          email: normalizeOptionalString(payload.email) || contact.email,
          phone: normalizeOptionalString(payload.phone) || contact.phone,
          notes: normalizeOptionalString(payload.notes),
        },
      });

      const organizationContact = await tx.organizationContact.create({
        data: {
          organizationId: organization.id,
          contactId: contact.id,
          fullName: contact.fullName,
          email: contact.email,
          phone: contact.phone,
          isPrimary: true,
        },
      });

      await tx.activity.create({
        data: {
          type: 'FORM_SUBMISSION',
          title: 'Organisation créée depuis le portail client',
          description: `Organisation: ${organization.name}`,
          contactId: contact.id,
        },
      });

      return { organization, organizationContact };
    });

    return NextResponse.json({ item: result.organization, organizationContact: result.organizationContact }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module organisations n est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    console.error('[CLIENT_PORTAL_ORGANIZATIONS_CREATE]', error);
    return NextResponse.json({ error: 'Création impossible' }, { status: 500 });
  }
}
