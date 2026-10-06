import { authOriginError } from '@/lib/auth-request-security';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const originError = authOriginError(request);
  if (originError) return originError;
  const params = await props.params;
  const [{ verifyClientPortalToken }, { deleteStoredFileByUrl }] = await Promise.all([
    import('@/lib/client-portal'),
    import('@/lib/uploaded-file'),
  ]);

  const token = request.nextUrl.searchParams.get('token') || '';
  const session = await verifyClientPortalToken(token);

  if (!session) {
    return NextResponse.json({ error: 'Lien client invalide' }, { status: 401 });
  }

  const item = await prisma.document.findFirst({
    where: { id: params.id, linkedType: 'CONTACT', linkedId: session.contactId },
    select: { id: true, fileName: true, fileUrl: true, uploadedById: true },
  });

  if (!item) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  if (item.uploadedById) {
    return NextResponse.json({ error: 'Seuls les fichiers que vous avez déposés peuvent être supprimés.' }, { status: 403 });
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
