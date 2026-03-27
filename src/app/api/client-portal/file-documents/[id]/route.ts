import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { deleteFileFromPersistentStorage } from '@/lib/file-storage';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  const item = await prisma.fileDocument.findFirst({
    where: {
      id: params.id,
      contactId: session.contactId,
      visibility: 'CLIENT_VISIBLE',
    },
    select: {
      id: true,
      contactId: true,
      songRequestId: true,
      originalName: true,
      storageKey: true,
    },
  });

  if (!item) {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 });
  }

  await prisma.fileDocument.delete({ where: { id: item.id } });
  await deleteFileFromPersistentStorage(item.storageKey).catch(() => null);

  await prisma.activity.create({
    data: {
      type: 'FILE',
      title: 'Fichier supprime',
      description: `Nom: ${item.originalName}\nSuppression par le client.`,
      contactId: item.contactId,
      songRequestId: item.songRequestId,
    },
  });

  return NextResponse.json({ ok: true });
}
