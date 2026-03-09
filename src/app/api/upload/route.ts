import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getStoredUploadUrl, getUploadsDirectory } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non accepté.' }, { status: 400 });
    }

    const uploadsDir = getUploadsDirectory();
    await fs.mkdir(uploadsDir, { recursive: true });

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const fileName = `${Date.now()}-${sanitizedFileName}`;
    const destPath = path.join(uploadsDir, fileName);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(destPath, Buffer.from(arrayBuffer));

    const url = getStoredUploadUrl(fileName);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('upload error', error);
    return NextResponse.json({ error: 'Erreur lors de l’upload.' }, { status: 500 });
  }
}

