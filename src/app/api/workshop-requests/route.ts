import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { workshopRequestFormSchema } from '@/features/workshops/schemas';

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  try {
    const payload = workshopRequestFormSchema.parse(await request.json());

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.findFirst({
        where: {
          name: { equals: payload.organizationName, mode: 'insensitive' },
          city: { equals: payload.city, mode: 'insensitive' },
        },
      }).then((existing) => existing
        ? tx.organization.update({
            where: { id: existing.id },
            data: {
              type: payload.organizationType,
              email: payload.email,
              phone: payload.phone,
              city: payload.city,
              status: existing.status,
            },
          })
        : tx.organization.create({
            data: {
              name: payload.organizationName,
              type: payload.organizationType,
              email: payload.email,
              phone: payload.phone,
              city: payload.city,
              status: 'LEAD',
              notes: normalizeOptionalString(payload.notes),
            },
          }));

      const contact = await tx.contact.findFirst({
        where: { email: { equals: payload.email, mode: 'insensitive' } },
      }).then((existing) => existing
        ? tx.contact.update({
            where: { id: existing.id },
            data: {
              fullName: payload.contactName,
              phone: payload.phone,
              companyName: payload.organizationName,
              type: existing.type === 'CLIENT' ? 'CLIENT' : 'PARTENAIRE',
              source: existing.source || 'workshop-form',
              tags: Array.from(new Set([...(existing.tags || []), 'atelier', 'organisation'])),
            },
          })
        : tx.contact.create({
            data: {
              type: 'PARTENAIRE',
              fullName: payload.contactName,
              email: payload.email,
              phone: payload.phone,
              companyName: payload.organizationName,
              source: 'workshop-form',
              tags: ['atelier', 'organisation'],
              notes: normalizeOptionalString(payload.notes),
            },
          }));

      const organizationContact = await tx.organizationContact.findFirst({
        where: {
          organizationId: organization.id,
          OR: [{ email: payload.email }, { contactId: contact.id }],
        },
      }).then((existing) => existing
        ? tx.organizationContact.update({
            where: { id: existing.id },
            data: {
              contactId: contact.id,
              fullName: payload.contactName,
              role: normalizeOptionalString(payload.role),
              email: payload.email,
              phone: payload.phone,
              isPrimary: true,
            },
          })
        : tx.organizationContact.create({
            data: {
              organizationId: organization.id,
              contactId: contact.id,
              fullName: payload.contactName,
              role: normalizeOptionalString(payload.role),
              email: payload.email,
              phone: payload.phone,
              isPrimary: true,
            },
          }));

      const workshopRequest = await tx.workshopRequest.create({
        data: {
          organizationId: organization.id,
          contactId: contact.id,
          organizationContactId: organizationContact.id,
          title: `Atelier ${payload.workshopTheme}`,
          audienceType: payload.audienceType,
          ageRange: payload.ageRange,
          estimatedParticipants: payload.estimatedParticipants,
          requestedDate: payload.requestedDate ? new Date(payload.requestedDate) : null,
          requestedTime: normalizeOptionalString(payload.preferredTime),
          preferredDays: payload.preferredDays,
          format: payload.format,
          location: normalizeOptionalString(payload.location),
          workshopTheme: payload.workshopTheme,
          objectives: payload.objectives,
          notes: normalizeOptionalString(payload.notes),
          status: 'NEW',
        },
      });

      await tx.activity.create({
        data: {
          type: 'FORM',
          title: 'Nouvelle demande d’atelier',
          description: `${payload.organizationName} · ${payload.workshopTheme}`,
          contactId: contact.id,
        },
      });

      await tx.task.create({
        data: {
          title: 'Faire le suivi de la demande d’atelier',
          description: `${payload.organizationName} · ${payload.contactName}\n\nTheme: ${payload.workshopTheme}\nParticipants: ${payload.estimatedParticipants}\nJours preferes: ${payload.preferredDays.join(', ')}`,
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          linkedType: 'WORKSHOP_REQUEST',
          linkedId: workshopRequest.id,
        },
      });

      return { workshopRequest, organization, contact };
    });

    return NextResponse.json({ ok: true, item: result.workshopRequest, organizationId: result.organization.id, contactId: result.contact.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: 'Le module atelier n’est pas encore disponible sur cette base de données.' }, { status: 503 });
    }

    console.error('[WORKSHOP_REQUEST_CREATE]', error);
    return NextResponse.json({ error: 'Impossible de créer la demande d’atelier' }, { status: 500 });
  }
}
