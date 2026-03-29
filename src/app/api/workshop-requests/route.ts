import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { workshopRequestFormSchema } from '@/features/workshops/schemas';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { buildAuthRedirect } from '@/lib/safe-next';

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth guard (hard block) ───────────────────────────────────────────────
    const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
    if (!session) {
      return NextResponse.json(
        {
          error: "Connexion requise pour envoyer une demande d'atelier.",
          code: 'AUTH_REQUIRED',
          loginUrl: buildAuthRedirect('/client/workshops/nouveau'),
        },
        { status: 401 },
      );
    }

    const sessionEmail = session.email.trim().toLowerCase();
    const payload = workshopRequestFormSchema.parse({
      ...(await request.json()),
      email: sessionEmail,
    });

    // Pre-compute throwaway hash outside transaction (bcrypt is slow)
    const throwawayPasswordHash = await hashPassword(randomBytes(32).toString('hex'));

    const result = await prisma.$transaction(async (tx) => {
      // ── 1. Organisation upsert ────────────────────────────────────────────
      const existingOrg = await tx.organization.findFirst({
        where: {
          name: { equals: payload.organizationName, mode: 'insensitive' },
          city: { equals: payload.city, mode: 'insensitive' },
        },
      });

      const organization = existingOrg
        ? await tx.organization.update({
            where: { id: existingOrg.id },
            data: {
              type: payload.organizationType,
              email: sessionEmail,
              phone: payload.phone,
              city: payload.city,
              status: existingOrg.status,
            },
          })
        : await tx.organization.create({
            data: {
              name: payload.organizationName,
              type: payload.organizationType,
              email: sessionEmail,
              phone: payload.phone,
              city: payload.city,
              status: 'LEAD',
              notes: normalizeOptionalString(payload.notes),
            },
          });

      // ── 2. Contact auto-upsert ────────────────────────────────────────────
      // Tries session.contactId first, then email fallback — avoids duplicates
      const existingContact = await tx.contact.findFirst({
        where: {
          OR: [
            { id: session.contactId },
            { email: { equals: sessionEmail, mode: 'insensitive' } },
          ],
        },
        select: { id: true, type: true, source: true, tags: true },
      });

      const contact = existingContact
        ? await tx.contact.update({
            where: { id: existingContact.id },
            data: {
              fullName: payload.contactName,
              phone: payload.phone,
              email: sessionEmail,
              companyName: payload.organizationName,
              type: existingContact.type === 'CLIENT' ? 'CLIENT' : 'PARTENAIRE',
              source: existingContact.source || 'workshop-form',
              tags: Array.from(new Set([...(existingContact.tags || []), 'atelier', 'organisation'])),
            },
          })
        : await tx.contact.create({
            data: {
              fullName: payload.contactName,
              email: sessionEmail,
              phone: payload.phone,
              companyName: payload.organizationName,
              type: 'CLIENT',
              source: 'workshop-form',
              tags: ['atelier', 'organisation', 'portal-client'],
            },
          });

      // ── 3. TENANT user auto-link ──────────────────────────────────────────
      // Find by email. If missing, create. Either way keep contactId in sync.
      let linkedUser = await tx.user.findFirst({
        where: {
          role: 'TENANT',
          isActive: true,
          email: { equals: sessionEmail, mode: 'insensitive' },
        },
        select: { id: true, contactId: true },
      });

      if (!linkedUser) {
        linkedUser = await tx.user.create({
          data: {
            email: sessionEmail,
            fullName: payload.contactName || session.fullName,
            passwordHash: throwawayPasswordHash,
            role: 'TENANT',
            isActive: true,
            contactId: contact.id,
          },
          select: { id: true, contactId: true },
        });
      } else if (!linkedUser.contactId || linkedUser.contactId !== contact.id) {
        await tx.user.update({
          where: { id: linkedUser.id },
          data: { contactId: contact.id },
        });
        linkedUser = { ...linkedUser, contactId: contact.id };
      }

      // ── 4. Organisation contact upsert ────────────────────────────────────
      const existingOrgContact = await tx.organizationContact.findFirst({
        where: {
          organizationId: organization.id,
          OR: [{ email: sessionEmail }, { contactId: contact.id }],
        },
      });

      const organizationContact = existingOrgContact
        ? await tx.organizationContact.update({
            where: { id: existingOrgContact.id },
            data: {
              contactId: contact.id,
              fullName: payload.contactName,
              role: normalizeOptionalString(payload.role),
              email: sessionEmail,
              phone: payload.phone,
              isPrimary: true,
            },
          })
        : await tx.organizationContact.create({
            data: {
              organizationId: organization.id,
              contactId: contact.id,
              fullName: payload.contactName,
              role: normalizeOptionalString(payload.role),
              email: sessionEmail,
              phone: payload.phone,
              isPrimary: true,
            },
          });

      // ── 5. WorkshopRequest ────────────────────────────────────────────────
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

      // ── 6. Activity + Task ────────────────────────────────────────────────
      await tx.activity.create({
        data: {
          type: 'FORM',
          title: "Nouvelle demande d'atelier",
          description: `${payload.organizationName} · ${payload.workshopTheme}`,
          contactId: contact.id,
          userId: linkedUser.id,
        },
      });

      await tx.task.create({
        data: {
          title: "Faire le suivi de la demande d'atelier",
          description: `${payload.organizationName} · ${payload.contactName}\n\nTheme: ${payload.workshopTheme}\nParticipants: ${payload.estimatedParticipants}\nJours preferes: ${payload.preferredDays.join(', ')}`,
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          linkedType: 'WORKSHOP_REQUEST',
          linkedId: workshopRequest.id,
          createdById: linkedUser.id,
        },
      });

      return { workshopRequest, organization, contact };
    });

    return NextResponse.json(
      {
        ok: true,
        item: result.workshopRequest,
        organizationId: result.organization.id,
        contactId: result.contact.id,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json({ error: "Le module atelier n'est pas encore disponible sur cette base de données." }, { status: 503 });
    }

    console.error('[WORKSHOP_REQUEST_CREATE]', error);
    return NextResponse.json({ error: "Impossible de créer la demande d'atelier" }, { status: 500 });
  }
}
