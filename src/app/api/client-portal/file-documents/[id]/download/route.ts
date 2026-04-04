import { NextRequest, NextResponse } from 'next/server';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { getObjectForProxy } from '@/lib/file-storage';
import { sanitizeFileBaseName } from '@/lib/file-documents';

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
    const range = request.headers.get('range');
    const isAudio = doc.mimeType?.startsWith('audio/') || isAudioFileName(doc.originalName || '');

    const { body, contentType, contentLength, contentRange, acceptRanges, status } =
      await getObjectForProxy(doc.storageKey, range ?? undefined);

    const headers = new Headers();
    headers.set('Content-Type', contentType || doc.mimeType || 'application/octet-stream');
    if (contentLength !== undefined) {
      headers.set('Content-Length', String(contentLength));
    }
    if (contentRange) {
      headers.set('Content-Range', contentRange);
    }
    headers.set('Accept-Ranges', acceptRanges ?? 'bytes');
    headers.set(
      'Content-Disposition',
      `${isAudio ? 'inline' : 'attachment'}; filename="${sanitizeFileBaseName(doc.originalName || 'file')}"`,
    );
    headers.set('Cache-Control', 'private, max-age=300');

    return new NextResponse(body, { status, headers });
  } catch (error) {
    if (error instanceof S3ServiceException) {
      const httpStatus = error.$metadata?.httpStatusCode ?? 0;
      if (httpStatus === 403 || error.name === 'AccessDenied') {
        return NextResponse.json(
          { error: 'Fichier temporairement inaccessible. Contactez un administrateur.' },
          { status: 503 },
        );
      }
    }
    console.error('[CLIENT_FILE_DOWNLOAD]', error);
    return NextResponse.json({ error: 'Impossible de télécharger le fichier.' }, { status: 500 });
  }
}
