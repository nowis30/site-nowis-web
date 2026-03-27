import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTenantPortalToken } from '@/lib/client-portal';
import { persistUploadedFile } from '@/lib/uploaded-file';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = String(formData.get('token') || '');
    const file = formData.get('file');

    const session = verifyTenantPortalToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Lien locataire invalide' }, { status: 401 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier recu.' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { id: session.tenantId, contactId: session.contactId },
      select: { id: true, contactId: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Locataire introuvable' }, { status: 404 });
    }

    const stored = await persistUploadedFile(file);

    const item = await prisma.document.create({
      data: {
        fileName: stored.fileName,
        fileUrl: stored.url,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        linkedType: 'TENANT',
        linkedId: tenant.id,
      },
    });

    await prisma.activity.create({
      data: {
        type: 'FILE',
        title: `Document ajouté par le locataire : ${stored.fileName}`,
        description: 'Document ajouté depuis le portail locataire.',
        contactId: tenant.contactId,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('[TENANT_PORTAL_FILE_CREATE]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Ajout du document impossible' }, { status: 500 });
  }
}
