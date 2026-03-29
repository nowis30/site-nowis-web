import { NextRequest, NextResponse } from 'next/server';
import { persistUploadedFile } from '@/lib/uploaded-file';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { buildAuthRedirect } from '@/lib/safe-next';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);

    if (!session) {
      return NextResponse.json(
        {
          error: 'Connexion requise pour envoyer un fichier.',
          code: 'AUTH_REQUIRED',
          loginUrl: buildAuthRedirect('/client/song-requests/nouveau'),
        },
        { status: 401 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });
    }

    const stored = await persistUploadedFile(file);
    return NextResponse.json({
      ok: true,
      fileUrl: stored.url,
      fileName: stored.fileName,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload impossible' }, { status: 400 });
  }
}
