import { NextRequest, NextResponse } from 'next/server';
import { persistUploadedFile } from '@/lib/uploaded-file';

export const runtime = 'nodejs';

const SITE_SECRET = process.env.SITE_INTEGRATION_SECRET;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const secret = String(formData.get('secret') || '');

    if (SITE_SECRET && SITE_SECRET !== secret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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
