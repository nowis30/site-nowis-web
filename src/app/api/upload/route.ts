import { NextResponse } from 'next/server';
import { persistUploadedFile } from '@/lib/uploaded-file';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { buildAuthRedirect } from '@/lib/safe-next';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  // Require an authenticated session — no anonymous uploads
  const session = getClientPortalSessionFromCookieHeader(
    (request as import('next/server').NextRequest).headers.get('cookie') ?? undefined
  );
  if (!session) {
    return NextResponse.json(
      { error: 'Connexion requise.', loginUrl: buildAuthRedirect('/client/dashboard') },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier recu.' }, { status: 400 });
    }

    const stored = await persistUploadedFile(file);
    return NextResponse.json({ url: stored.url, name: stored.fileName, size: stored.sizeBytes });
  } catch (error) {
    console.error('upload error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de l'upload." },
      { status: 500 },
    );
  }
}
