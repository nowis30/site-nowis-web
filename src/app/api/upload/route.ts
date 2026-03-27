import { NextResponse } from 'next/server';
import { persistUploadedFile } from '@/lib/uploaded-file';

export const runtime = 'nodejs';

export async function POST(request: Request) {
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
