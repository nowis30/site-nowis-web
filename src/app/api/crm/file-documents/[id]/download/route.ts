import { NextRequest, NextResponse } from 'next/server';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { createPresignedDownloadUrl } from '@/lib/file-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = requireApiPermission(request, 'documents', 'read');
  if (guard.error) return guard.error;

  const doc = await prisma.fileDocument.findUnique({
    where: { id: params.id },
    select: { id: true, storageKey: true, originalName: true, mimeType: true },
  });

  if (!doc) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  try {
    const isAudio = doc.mimeType?.startsWith('audio/');
    const signedUrl = await createPresignedDownloadUrl(doc.storageKey, {
      fileName: doc.originalName,
      expiresInSeconds: 300,
      disposition: isAudio ? 'inline' : 'attachment',
    });
    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch (error) {
    if (error instanceof S3ServiceException) {
      const status = error.$metadata?.httpStatusCode ?? 0;
      if (status === 403 || error.name === 'AccessDenied') {
        return NextResponse.json(
          { error: 'Stockage non accessible (permissions IAM manquantes sur s3:GetObject).' },
          { status: 503 },
        );
      }
    }
    console.error('[CRM_FILE_DOWNLOAD]', error);
    return NextResponse.json({ error: 'Impossible de générer le lien de téléchargement.' }, { status: 500 });
  }
}
