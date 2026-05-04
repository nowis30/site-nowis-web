import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';

function unauthorized() {
  return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
}

function toClientSongRequest(item: {
  id: string;
  title: string | null;
  occasion: string;
  status: string;
  description: string | null;
  style: string;
  mood: string;
  lyrics: string | null;
  details: string;
  specialMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    title: item.title || item.occasion,
    status: item.status,
    description: item.description,
    musicStyle: item.style,
    mood: item.mood,
    lyrics: item.lyrics,
    clientNotes: item.details,
    clientMessage: item.specialMessage,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) return unauthorized();

  const items = await prisma.songRequest.findMany({
    where: {
      contactId: session.contactId,
      status: { not: 'DELETED' },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      title: true,
      occasion: true,
      status: true,
      description: true,
      style: true,
      mood: true,
      lyrics: true,
      details: true,
      specialMessage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ items: items.map(toClientSongRequest) });
}
