import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';

const clientSongPatchSchema = z.object({
  title: z.string().trim().max(160).optional().or(z.literal('')),
  recipientName: z.string().trim().min(1).max(160).optional(),
  occasion: z.string().trim().min(1).max(160).optional(),
  style: z.string().trim().min(1).max(160).optional(),
  mood: z.string().trim().min(1).max(160).optional(),
  language: z.string().trim().max(80).optional().or(z.literal('')),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  details: z.string().trim().min(1).max(4000).optional(),
  desiredDeadline: z.string().datetime().optional().or(z.literal(''))
  meetingDate: z.string().datetime().optional().or(z.literal('')),
  startAt: z.string().datetime().optional().or(z.literal('')),
  endAt: z.string().datetime().optional().or(z.literal('')),
  durationMinutes: z.coerce.number().int().min(1).max(1440).optional(),
  meetingType: z.string().trim().max(80).optional().or(z.literal('')),
  location: z.string().trim().max(240).optional().or(z.literal('')),
  meetingNotes: z.string().trim().max(4000).optional().or(z.literal('')),
});

const CLIENT_BLOCKED_STATUSES = new Set(['QUOTED', 'DELIVERED', 'COMPLETED', 'DELETED']);

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function unauthorized() {
  return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) return unauthorized();

  const item = await prisma.songRequest.findFirst({
    where: { id: params.id, contactId: session.contactId },
    include: {
      appointments: {
        select: { id: true, title: true, startAt: true, endAt: true, status: true, type: true, location: true },
        orderBy: { startAt: 'asc' },
      },
    },
  });

  if (!item) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  return NextResponse.json({ item, canEdit: !CLIENT_BLOCKED_STATUSES.has(item.status) });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) return unauthorized();

  const current = await prisma.songRequest.findFirst({
    where: { id: params.id, contactId: session.contactId },
  });

  if (!current) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });

  if (CLIENT_BLOCKED_STATUSES.has(current.status)) {
    return NextResponse.json({
      error: 'Cette demande est confirmée. Pour la modifier, envoyez-nous un message.',
      blocked: true,
      messageUrl: 'https://outlook.office.com/mail/deeplink/compose?to=simonmorin@nowis.store&subject=Demande%20depuis%20le%20portail%20client',
      fallbackMailto: 'mailto:simonmorin@nowis.store?subject=Demande%20depuis%20le%20portail%20client',
    }, { status: 409 });
  }

  const payload = clientSongPatchSchema.parse(await request.json());

  const item = await prisma.songRequest.update({
    where: { id: current.id },
    data: {
      title: payload.title !== undefined ? normalizeOptionalString(payload.title) : undefined,
      recipientName: payload.recipientName ?? undefined,
      occasion: payload.occasion ?? undefined,
      style: payload.style ?? undefined,
      mood: payload.mood ?? undefined,
      language: payload.language !== undefined ? normalizeOptionalString(payload.language) : undefined,
      description: payload.description !== undefined ? normalizeOptionalString(payload.description) : undefined,
      details: payload.details !== undefined ? payload.details.trim() : undefined,
      desiredDeadline: payload.desiredDeadline ? new Date(payload.desiredDeadline) : payload.desiredDeadline === '' ? null : undefined,
      meetingDate: payload.meetingDate ? new Date(payload.meetingDate) : payload.meetingDate === '' ? null : undefined,
      startAt: payload.startAt ? new Date(payload.startAt) : payload.startAt === '' ? null : undefined,
      endAt: payload.endAt ? new Date(payload.endAt) : payload.endAt === '' ? null : undefined,
      durationMinutes: payload.durationMinutes ?? undefined,
      meetingType: payload.meetingType !== undefined ? normalizeOptionalString(payload.meetingType) : undefined,
      location: payload.location !== undefined ? normalizeOptionalString(payload.location) : undefined,
      meetingNotes: payload.meetingNotes !== undefined ? normalizeOptionalString(payload.meetingNotes) : undefined,
    },
  });

  await prisma.activity.create({
    data: {
      type: 'FORM',
      title: 'Demande de chanson modifiée par le client',
      description: `Mise à jour client sur ${item.title || item.occasion}`,
      contactId: session.contactId,
      songRequestId: item.id,
      relatedType: 'SONG_REQUEST',
      relatedId: item.id,
      relatedUrl: `/crm/song-requests/${item.id}`,
    },
  }).catch(() => undefined);

  return NextResponse.json({ item });
}
