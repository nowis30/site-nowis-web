import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTenantPortalToken } from '@/lib/client-portal';
import { deleteStoredFileByUrl } from '@/lib/uploaded-file';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const session = verifyTenantPortalToken(token);

  if (!session) {
    return NextResponse.json({ error: 'Lien locataire invalide' }, { status: 401 });
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: session.tenantId, contactId: session.contactId },
    select: { id: true, contactId: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Locataire introuvable' }, { status: 404 });
  }

  const item = await prisma.document.findFirst({
    where: { id: params.id, linkedType: 'TENANT', linkedId: tenant.id },
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
      title: `Document supprimé par le locataire : ${item.fileName}`,
      description: 'Suppression depuis le portail locataire.',
      contactId: tenant.contactId,
    },
  });

  return NextResponse.json({ ok: true });
}
