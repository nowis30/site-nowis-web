import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { deleteFileFromPersistentStorage } from '@/lib/file-storage';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'documents', 'delete');
  if (guard.error) return guard.error;

  const item = await prisma.fileDocument.findUnique({
    where: { id: params.id },
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
      description: `Nom: ${item.originalName}`,
      contactId: item.contactId,
      songRequestId: item.songRequestId,
      userId: guard.session.sub,
    },
  });

  return NextResponse.json({ ok: true });
}
