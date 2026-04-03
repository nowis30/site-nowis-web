import { NextRequest, NextResponse } from 'next/server';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { createPresignedDownloadUrl } from '@/lib/file-storage';

const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav', '.aac', '.ogg'];

function isAudioFileName(value: string) {
  const name = value.toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  // Enforce ownership: the file must belong to this contact and be client-visible
  const doc = await prisma.fileDocument.findFirst({
    where: {
      id: params.id,
      contactId: session.contactId,
      visibility: 'CLIENT_VISIBLE',
    },
    select: { id: true, storageKey: true, originalName: true, mimeType: true },
  });

  if (!doc) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  try {
    const isAudio = doc.mimeType?.startsWith('audio/') || isAudioFileName(doc.originalName || '');
    const signedUrl = await createPresignedDownloadUrl(doc.storageKey, {
      fileName: doc.originalName,
      expiresInSeconds: 300,
      disposition: isAudio ? 'inline' : 'attachment',
      responseContentType: doc.mimeType || undefined,
    });
    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch (error) {
    if (error instanceof S3ServiceException) {
      const status = error.$metadata?.httpStatusCode ?? 0;
      if (status === 403 || error.name === 'AccessDenied') {
        return NextResponse.json(
          { error: 'Fichier temporairement inaccessible. Contactez un administrateur.' },
          { status: 503 },
        );
      }
    }
    console.error('[CLIENT_FILE_DOWNLOAD]', error);
    return NextResponse.json({ error: 'Impossible de générer le lien de téléchargement.' }, { status: 500 });
  }
}
