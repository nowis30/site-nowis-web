import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import {
  canClientAccessFileDocument,
  canClientDeleteFileDocument,
} from '@/features/client-portal/documents/security';
import { deleteFileFromPersistentStorage } from '@/lib/file-storage';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  const item = await prisma.fileDocument.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      visibility: true,
      category: true,
      contactId: true,
      songRequestId: true,
      originalName: true,
      storageKey: true,
      uploadedByUserId: true,
      songRequest: { select: { contactId: true } },
      workshopRequest: { select: { contactId: true, clientId: true } },
      invoice: { select: { contactId: true } },
      commercialQuote: { select: { contactId: true } },
    },
  });

  const accessInput = item ? {
    sessionContactId: session.contactId,
    visibility: item.visibility,
    category: item.category,
    contactId: item.contactId,
    songRequestContactId: item.songRequest?.contactId,
    workshopRequestContactId: item.workshopRequest?.contactId,
    workshopRequestClientId: item.workshopRequest?.clientId,
    invoiceContactId: item.invoice?.contactId,
    commercialQuoteContactId: item.commercialQuote?.contactId,
  } : null;

  if (!item || !accessInput || !canClientAccessFileDocument(accessInput)) {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 });
  }

  if (!canClientDeleteFileDocument({
    ...accessInput,
    uploadedByUserId: item.uploadedByUserId,
    storageKey: item.storageKey,
  })) {
    return NextResponse.json(
      { error: 'Seuls les fichiers déposés depuis votre portail peuvent être supprimés.' },
      { status: 403 },
    );
  }

  await prisma.fileDocument.delete({ where: { id: item.id } });
  await deleteFileFromPersistentStorage(item.storageKey).catch(() => null);

  await prisma.activity.create({
    data: {
      type: 'FILE',
      title: 'Fichier supprimé',
      description: `Nom : ${item.originalName}\nSuppression par le client.`,
      contactId: item.contactId,
      songRequestId: item.songRequestId,
    },
  });

  return NextResponse.json({ ok: true });
}
