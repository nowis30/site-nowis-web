import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';

const clientWorkshopPatchSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  objectives: z.string().trim().min(3).max(4000).optional(),
  notes: z.string().trim().max(4000).optional().or(z.literal('')),
  participantEstimate: z.coerce.number().int().min(1).max(5000).optional(),
  estimatedParticipants: z.coerce.number().int().min(1).max(5000).optional(),
  location: z.string().trim().max(240).optional().or(z.literal('')),
  requestedDate: z.string().datetime().optional().or(z.literal('')),
  requestedTime: z.string().trim().max(120).optional().or(z.literal('')),
  durationMinutes: z.coerce.number().int().min(1).max(1440).optional(),
  meetingType: z.string().trim().max(80).optional().or(z.literal('')),
  contactPerson: z.string().trim().max(160).optional().or(z.literal('')),
  contactPhone: z.string().trim().max(40).optional().or(z.literal('')),
  contactEmail: z.string().trim().email().optional().or(z.literal('')),
});

const CLIENT_EDITABLE_STATUSES = new Set(['BROUILLON', 'NEW', 'CONTACTED', 'EN_ATTENTE_RDV', 'RDV_PLANIFIE', 'SCHEDULED']);

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function unauthorized() {
  return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
}

async function loadOwnedWorkshop(sessionContactId: string, id: string) {
  return prisma.workshopRequest.findFirst({
    where: {
      id,
      OR: [
        { contactId: sessionContactId },
        { clientId: sessionContactId },
        { organizationContact: { contactId: sessionContactId } },
      ],
    },
    include: {
      organization: { select: { id: true, name: true } },
      appointments: {
        select: { id: true, title: true, startAt: true, endAt: true, status: true, location: true },
        orderBy: { startAt: 'asc' },
      },
      crmAppointments: {
        select: { id: true, title: true, startAt: true, endAt: true, status: true, type: true, location: true },
        orderBy: { startAt: 'asc' },
      },
    },
  });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) return unauthorized();

  const item = await loadOwnedWorkshop(session.contactId, params.id);
  if (!item) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  return NextResponse.json({ item, canEdit: CLIENT_EDITABLE_STATUSES.has(item.status) });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) return unauthorized();

  const item = await loadOwnedWorkshop(session.contactId, params.id);
  if (!item) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });

  if (!CLIENT_EDITABLE_STATUSES.has(item.status)) {
    return NextResponse.json({
      error: 'Cette demande est confirmée. Pour la modifier, envoyez-nous un message.',
      blocked: true,
      messageUrl: 'https://outlook.office.com/mail/deeplink/compose?to=simonmorin@nowis.store&subject=Demande%20depuis%20le%20portail%20client',
      fallbackMailto: 'mailto:simonmorin@nowis.store?subject=Demande%20depuis%20le%20portail%20client',
    }, { status: 409 });
  }

  const payload = clientWorkshopPatchSchema.parse(await request.json());

  const updated = await prisma.workshopRequest.update({
    where: { id: item.id },
    data: {
      title: payload.title ?? undefined,
      objectives: payload.objectives ?? undefined,
      notes: payload.notes !== undefined ? normalizeOptionalString(payload.notes) : undefined,
      participantEstimate: payload.participantEstimate ?? undefined,
      estimatedParticipants: payload.estimatedParticipants ?? payload.participantEstimate ?? undefined,
      location: payload.location !== undefined ? normalizeOptionalString(payload.location) : undefined,
      requestedDate: payload.requestedDate ? new Date(payload.requestedDate) : payload.requestedDate === '' ? null : undefined,
      requestedTime: payload.requestedTime !== undefined ? normalizeOptionalString(payload.requestedTime) : undefined,
      durationMinutes: payload.durationMinutes ?? undefined,
      meetingType: payload.meetingType !== undefined ? normalizeOptionalString(payload.meetingType) : undefined,
      contactPerson: payload.contactPerson !== undefined ? normalizeOptionalString(payload.contactPerson) : undefined,
      contactPhone: payload.contactPhone !== undefined ? normalizeOptionalString(payload.contactPhone) : undefined,
      contactEmail: payload.contactEmail !== undefined ? normalizeOptionalString(payload.contactEmail) : undefined,
    },
  });

  await prisma.activity.create({
    data: {
      type: 'FORM',
      title: 'Demande d\'atelier modifiée par le client',
      description: `Mise à jour client sur ${updated.title}`,
      contactId: session.contactId,
      relatedType: 'WORKSHOP_REQUEST',
      relatedId: updated.id,
      relatedUrl: `/crm/workshop-requests/${updated.id}`,
    },
  }).catch(() => undefined);

  return NextResponse.json({ item: updated });
}
