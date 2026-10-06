import { authOriginError } from '@/lib/auth-request-security';
﻿import { randomBytes } from 'crypto';
import { Prisma, UserRole } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { mapWorkshopGroupTypeToOrganizationType, workshopRequestFormSchema } from '@/features/workshops/schemas';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { buildAuthRedirect } from '@/lib/safe-next';
import { ensureCrmTask } from '@/features/crm/server/task-automation';

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

class SessionContactUnavailable extends Error {}

export async function POST(request: NextRequest) {
  const originError = authOriginError(request);
  if (originError) return originError;
  try {
    // ── Auth guard (hard block) ───────────────────────────────────────────────
    const session = await getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
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
      // The signed dossier id is authoritative. An account's declared email is not ownership of another dossier.
      const existingContact = await tx.contact.findFirst({
        where: { id: session.contactId, deletedAt: null },
        select: { id: true, email: true, type: true, source: true, tags: true },
      });
      if (!existingContact || existingContact.email?.trim().toLowerCase() !== sessionEmail) {
        throw new SessionContactUnavailable();
      }
      // ── 1. Organisation upsert ────────────────────────────────────────────
      const existingOrg = await tx.organization.findFirst({
        where: {
          name: { equals: payload.organizationName, mode: 'insensitive' },
          city: { equals: payload.city, mode: 'insensitive' },
        },
      });

      // Reusing an organisation name does not authorize rewriting its existing CRM details.
      const organization = existingOrg
        ? existingOrg
        : await tx.organization.create({
            data: {
              name: payload.organizationName,
                type: mapWorkshopGroupTypeToOrganizationType(payload.groupType),
              email: sessionEmail,
              phone: payload.phone,
              city: payload.city,
              status: 'LEAD',
              notes: normalizeOptionalString(payload.notes),
            },
          });

      // ── 2. Contact auto-upsert ────────────────────────────────────────────
      const contact = await tx.contact.update({
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
          });

      // ── 3. Portal user auto-link ──────────────────────────────────────────
      // Never move a password account between dossiers just because an email matches.
      let linkedUser = await tx.user.findFirst({
        where: {
          role: UserRole.PORTAL_USER,
          isActive: true,
          emailVerifiedAt: new Date(),
          email: { equals: sessionEmail, mode: 'insensitive' },
          contactId: contact.id,
        },
        select: { id: true, contactId: true },
      });

      const emailAlreadyUsed = !linkedUser && await tx.user.findFirst({
        where: { email: { equals: sessionEmail, mode: 'insensitive' } }, select: { id: true },
      });
      if (!linkedUser && !emailAlreadyUsed) {
        linkedUser = await tx.user.create({
          data: {
            email: sessionEmail,
            fullName: payload.contactName || session.fullName,
            passwordHash: throwawayPasswordHash,
            role: UserRole.PORTAL_USER,
            isActive: true,
            contactId: contact.id,
          },
          select: { id: true, contactId: true },
        });
      }

      // ── 4. Organisation contact upsert ────────────────────────────────────
      const existingOrgContact = await tx.organizationContact.findFirst({
        where: {
          organizationId: organization.id,
          contactId: contact.id,
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
          groupType: payload.groupType,
          residenceName: normalizeOptionalString(payload.residenceName),
          residenceUnit: normalizeOptionalString(payload.residenceUnit),
          seniorsProfile: normalizeOptionalString(payload.seniorsProfile),
          coordinatorName: normalizeOptionalString(payload.coordinatorName),
          coordinatorRole: normalizeOptionalString(payload.coordinatorRole),
          coordinatorEmail: normalizeOptionalString(payload.coordinatorEmail),
          coordinatorPhone: normalizeOptionalString(payload.coordinatorPhone),
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
          userId: linkedUser?.id ?? null,
        },
      });

      await ensureCrmTask(
        {
          title: "Préparer la soumission pour l'atelier",
          description: `${payload.organizationName} · ${payload.contactName}\n\nTheme: ${payload.workshopTheme}\nParticipants: ${payload.estimatedParticipants}\nJours preferes: ${payload.preferredDays.join(', ')}`,
          type: 'CREATE_QUOTE',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          linkedType: 'WORKSHOP_REQUEST',
          linkedId: workshopRequest.id,
          workshopRequestId: workshopRequest.id,
          organizationId: organization.id,
          contactId: contact.id,
          createdById: linkedUser?.id ?? null,
          isAutoCreated: true,
        },
        tx,
      );

      return { workshopRequest, organization, contact };
    });

    return NextResponse.json(
      {
        success: true,
        ok: true,
        id: result.workshopRequest.id,
        requestType: 'workshop-request',
        redirectTo: `/client/workshops/${result.workshopRequest.id}`,
        item: result.workshopRequest,
        organizationId: result.organization.id,
        contactId: result.contact.id,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SessionContactUnavailable) {
      return NextResponse.json({ error: 'Session client invalide. Reconnectez-vous.', code: 'AUTH_REQUIRED' }, { status: 401 });
    }
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
