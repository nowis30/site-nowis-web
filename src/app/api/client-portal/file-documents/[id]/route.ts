import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { canClientAccessFileDocument } from '@/features/client-portal/documents/security';
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
      songRequest: { select: { contactId: true } },
      workshopRequest: { select: { contactId: true, clientId: true } },
      invoice: { select: { contactId: true } },
      commercialQuote: { select: { contactId: true } },
    },
  });

  if (!item || !canClientAccessFileDocument({
    sessionContactId: session.contactId,
    visibility: item.visibility,
    category: item.category,
    contactId: item.contactId,
    songRequestContactId: item.songRequest?.contactId,
    workshopRequestContactId: item.workshopRequest?.contactId,
    workshopRequestClientId: item.workshopRequest?.clientId,
    invoiceContactId: item.invoice?.contactId,
    commercialQuoteContactId: item.commercialQuote?.contactId,
  })) {
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
