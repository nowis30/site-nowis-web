import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';

const clientSongPatchSchema = z.object({
  title: z.string().trim().max(160).optional().or(z.literal('')),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  musicStyle: z.string().trim().max(160).optional().or(z.literal('')),
  mood: z.string().trim().max(160).optional().or(z.literal('')),
  lyrics: z.string().trim().max(8000).optional().or(z.literal('')),
  clientNotes: z.string().trim().max(4000).optional().or(z.literal('')),
  desiredDeadline: z.string().datetime().optional().or(z.literal('')),
}).strict();

const CLIENT_EDITABLE_STATUSES = new Set(['NEW', 'CONTACTED', 'IN_PROGRESS', 'IN_PRODUCTION']);

function normalizeOptionalString(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function unauthorized() {
  return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: 'Acces refuse a cette demande' }, { status: 403 });
}

function toClientSongRequest(item: {
  id: string;
  title: string | null;
  status: string;
  description: string | null;
  style: string;
  mood: string;
  lyrics: string | null;
  details: string;
  specialMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  desiredDeadline: Date | null;
}) {
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    description: item.description,
    musicStyle: item.style,
    mood: item.mood,
    lyrics: item.lyrics,
    clientNotes: item.details,
    clientMessage: item.specialMessage,
    desiredDeadline: item.desiredDeadline?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) return unauthorized();

  const item = await prisma.songRequest.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      contactId: true,
      title: true,
      status: true,
      description: true,
      style: true,
      mood: true,
      lyrics: true,
      details: true,
      specialMessage: true,
      createdAt: true,
      updatedAt: true,
      desiredDeadline: true,
      convertedInvoiceId: true,
      archivedAt: true,
      deletedAt: true,
    },
  });

  if (!item) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  if (item.contactId !== session.contactId) return forbidden();
  const canEdit =
    CLIENT_EDITABLE_STATUSES.has(item.status as string)
    && !item.convertedInvoiceId
    && !item.archivedAt
    && !item.deletedAt;

  return NextResponse.json({ item: toClientSongRequest(item), canEdit });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) return unauthorized();

  const current = await prisma.songRequest.findUnique({
    where: { id: params.id },
  });

  if (!current) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  if (current.contactId !== session.contactId) return forbidden();

  const canEdit =
    CLIENT_EDITABLE_STATUSES.has(current.status)
    && !current.convertedInvoiceId
    && !current.archivedAt
    && !current.deletedAt;

  if (!canEdit) {
    return NextResponse.json({
      error: 'Cette demande ne peut plus être modifiée directement. Contactez Création Nowis pour faire un changement.',
      blocked: true,
      messageUrl: 'https://outlook.office.com/mail/deeplink/compose?to=simonmorin@nowis.store&subject=Demande%20depuis%20le%20portail%20client',
      fallbackMailto: 'mailto:simonmorin@nowis.store?subject=Demande%20depuis%20le%20portail%20client',
    }, { status: 409 });
  }

  const payloadResult = clientSongPatchSchema.safeParse(await request.json());
  if (!payloadResult.success) {
    return NextResponse.json({ error: 'Champs invalides pour la modification client' }, { status: 400 });
  }
  const payload = payloadResult.data;

  const item = await prisma.songRequest.update({
    where: { id: current.id },
    data: {
      title: payload.title !== undefined ? normalizeOptionalString(payload.title) : undefined,
      description: payload.description !== undefined ? normalizeOptionalString(payload.description) : undefined,
      style: payload.musicStyle !== undefined ? (normalizeOptionalString(payload.musicStyle) ?? current.style) : undefined,
      mood: payload.mood !== undefined ? (normalizeOptionalString(payload.mood) ?? current.mood) : undefined,
      lyrics: payload.lyrics !== undefined ? normalizeOptionalString(payload.lyrics) : undefined,
      details: payload.clientNotes !== undefined ? (normalizeOptionalString(payload.clientNotes) ?? current.details) : undefined,
      desiredDeadline: payload.desiredDeadline ? new Date(payload.desiredDeadline) : payload.desiredDeadline === '' ? null : undefined,
    },
    select: {
      id: true,
      title: true,
      status: true,
      description: true,
      style: true,
      mood: true,
      lyrics: true,
      details: true,
      specialMessage: true,
      createdAt: true,
      updatedAt: true,
      desiredDeadline: true,
    },
  });

  await prisma.activity.create({
    data: {
      type: 'FORM',
      title: 'Demande de chanson modifiée par le client',
      description: `Mise à jour client sur ${item.title || 'demande chanson'}`,
      contactId: session.contactId,
      songRequestId: item.id,
      relatedType: 'SONG_REQUEST',
      relatedId: item.id,
      relatedUrl: `/crm/song-requests/${item.id}`,
    },
  }).catch(() => undefined);

  return NextResponse.json({ item: toClientSongRequest(item) });
}
