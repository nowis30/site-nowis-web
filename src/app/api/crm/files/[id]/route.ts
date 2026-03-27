import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { deleteStoredFileByUrl } from '@/lib/uploaded-file';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'documents', 'delete');
  if (guard.error) return guard.error;

  const item = await prisma.document.findUnique({
    where: { id: params.id },
    select: { id: true, fileName: true, fileUrl: true, linkedType: true, linkedId: true },
  });

  if (!item) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  await prisma.document.delete({ where: { id: item.id } });
  await deleteStoredFileByUrl(item.fileUrl);

  await prisma.activity.create({
    data: {
      type: 'FILE',
      title: `Fichier supprimé : ${item.fileName}`,
      description: `Document supprimé de ${item.linkedType} (${item.linkedId}).`,
      contactId: item.linkedType === 'CONTACT' ? item.linkedId : null,
      userId: guard.session.sub,
    },
  });

  return NextResponse.json({ ok: true });
}
