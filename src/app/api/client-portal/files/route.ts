import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  BAIL: 'Bail',
  CONTRAT: 'Contrat',
  DEMANDE: 'Demande',
  AUTRE: 'Autre',
};

export async function POST(request: NextRequest) {
  try {
    const [{ verifyClientPortalToken }, { getClientPortalSessionFromCookieHeader }, { persistUploadedFile }] = await Promise.all([
      import('@/lib/client-portal'),
      import('@/features/client-portal/auth/session'),
      import('@/lib/uploaded-file'),
    ]);

    const formData = await request.formData();
    const token = String(formData.get('token') || '');
    const songRequestId = String(formData.get('songRequestId') || '');
    const documentTypeRaw = String(formData.get('documentType') || 'AUTRE').toUpperCase();
    const documentType = DOCUMENT_TYPE_LABELS[documentTypeRaw] ? documentTypeRaw : 'AUTRE';
    const file = formData.get('file');

    const cookieSession = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
    const tokenSession = token ? verifyClientPortalToken(token) : null;
    const session = cookieSession || tokenSession;

    if (!session) {
      return NextResponse.json({ error: 'Session client invalide' }, { status: 401 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier recu.' }, { status: 400 });
    }

    const contact = await prisma.contact.findUnique({
      where: { id: session.contactId },
      select: { id: true },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
    }

    if (songRequestId) {
      const songRequest = await prisma.songRequest.findFirst({
        where: { id: songRequestId, contactId: session.contactId },
        select: { id: true },
      });

      if (!songRequest) {
        return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
      }
    }

    const stored = await persistUploadedFile(file);

    const item = await prisma.document.create({
      data: {
        fileName: stored.fileName,
        fileUrl: stored.url,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        linkedType: 'CONTACT',
        linkedId: session.contactId,
      },
    });

    await prisma.activity.create({
      data: {
        type: 'FILE',
        title: `Document ajouté par le client (${DOCUMENT_TYPE_LABELS[documentType]}) : ${stored.fileName}`,
        description: songRequestId
          ? `Type: ${DOCUMENT_TYPE_LABELS[documentType]}\nDocument ajouté depuis le portail client pour la demande ${songRequestId}.`
          : `Type: ${DOCUMENT_TYPE_LABELS[documentType]}\nDocument ajouté depuis le portail client.`,
        contactId: session.contactId,
        songRequestId: songRequestId || null,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('[CLIENT_PORTAL_FILE_CREATE]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Ajout du document impossible' }, { status: 500 });
  }
}
