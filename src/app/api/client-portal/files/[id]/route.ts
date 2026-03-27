import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyClientPortalToken } from '@/lib/client-portal';
import { deleteStoredFileByUrl } from '@/lib/uploaded-file';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const session = verifyClientPortalToken(token);

  if (!session) {
    return NextResponse.json({ error: 'Lien client invalide' }, { status: 401 });
  }

  const item = await prisma.document.findFirst({
    where: { id: params.id, linkedType: 'CONTACT', linkedId: session.contactId },
    select: { id: true, fileName: true, fileUrl: true },
  });

  if (!item) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  await prisma.document.delete({ where: { id: item.id } });
  await deleteStoredFileByUrl(item.fileUrl);
  await prisma.activity.create({
    data: {
      type: 'FILE',
      title: `Document supprimé par le client : ${item.fileName}`,
      description: 'Suppression depuis le portail client.',
      contactId: session.contactId,
    },
  });

  return NextResponse.json({ ok: true });
}
