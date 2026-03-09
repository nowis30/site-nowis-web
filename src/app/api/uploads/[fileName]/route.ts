import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getUploadsDirectory, isUsingDefaultPublicUploadsDir } from '@/lib/storage';

export const runtime = 'nodejs';

const contentTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export async function GET(request: NextRequest, { params }: { params: { fileName: string } }) {
  try {
    if (isUsingDefaultPublicUploadsDir()) {
      return NextResponse.redirect(
        new URL(`/uploads/${encodeURIComponent(params.fileName)}`, request.url)
      );
    }

    const safeName = path.basename(params.fileName);
    const filePath = path.join(getUploadsDirectory(), safeName);
    const fileBuffer = await fs.readFile(filePath);
    const extension = path.extname(safeName).toLowerCase();

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentTypes[extension] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
  }
}
