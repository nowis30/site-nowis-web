import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { FILE_VISIBILITY_DB } from '@/lib/file-documents';
import { assertStoredObjectMetadata } from '@/lib/file-storage';
import { getDefaultCategoryForUpload, resolveDocumentCategory } from '@/features/documents/document-categories';

const finalizeUploadSchema = z.object({
  contactId: z.string().uuid().optional(),
  songRequestId: z.string().uuid().optional(),
  workshopRequestId: z.string().uuid().optional(),
  category: z.string().trim().max(80).optional(),
  visibility: z.enum(['admin_only', 'client_visible']).default('client_visible'),
  file: z.object({
    storageKey: z.string().trim().min(8).max(500),
    url: z.string().url(),
    filename: z.string().trim().min(1).max(240),
    originalName: z.string().trim().min(1).max(240),
    mimeType: z.string().trim().min(3).max(120),
    size: z.number().int().positive(),
  }),
});

const querySchema = z.object({
  contactId: z.string().uuid().optional(),
  songRequestId: z.string().uuid().optional(),
  workshopRequestId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'documents', 'read');
  if (guard.error) return guard.error;

  const parsedQuery = querySchema.safeParse({
    contactId: request.nextUrl.searchParams.get('contactId') || undefined,
    songRequestId: request.nextUrl.searchParams.get('songRequestId') || undefined,
    workshopRequestId: request.nextUrl.searchParams.get('workshopRequestId') || undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Filtres invalides' }, { status: 400 });
  }

  const items = await prisma.fileDocument.findMany({
    where: {
      ...(parsedQuery.data.contactId ? { contactId: parsedQuery.data.contactId } : {}),
      ...(parsedQuery.data.songRequestId ? { songRequestId: parsedQuery.data.songRequestId } : {}),
      ...(parsedQuery.data.workshopRequestId ? { workshopRequestId: parsedQuery.data.workshopRequestId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedByUser: { select: { id: true, fullName: true } },
    },
    take: 100,
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'documents', 'create');
  if (guard.error) return guard.error;

  try {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        {
          error: 'Upload direct requis. Merci de mettre a jour l application puis reessayer.',
          hint: 'Le client doit utiliser /presign puis un PUT direct vers le stockage.',
        },
        { status: 415 },
      );
    }

    const payload = finalizeUploadSchema.parse(await request.json());
    let contactId = payload.contactId ?? null;

    if (payload.songRequestId) {
      const songRequest = await prisma.songRequest.findUnique({
        where: { id: payload.songRequestId },
        select: { id: true, contactId: true },
      });
      if (!songRequest) {
        return NextResponse.json({ error: 'Demande de chanson introuvable' }, { status: 404 });
      }
      if (contactId && contactId !== songRequest.contactId) {
        return NextResponse.json({ error: 'Le contact et la demande ne correspondent pas' }, { status: 400 });
      }
      contactId = songRequest.contactId;
    }

    if (payload.workshopRequestId) {
      const workshopRequest = await prisma.workshopRequest.findUnique({
        where: { id: payload.workshopRequestId },
        select: { id: true, contactId: true },
      });
      if (!workshopRequest) {
        return NextResponse.json({ error: 'Demande atelier introuvable' }, { status: 404 });
      }
      if (contactId && contactId !== workshopRequest.contactId) {
        return NextResponse.json({ error: 'Le contact et la demande atelier ne correspondent pas' }, { status: 400 });
      }
      contactId = workshopRequest.contactId;
    }

    if (contactId) {
      const contact = await prisma.contact.findUnique({ where: { id: contactId }, select: { id: true } });
      if (!contact) {
        return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
      }
    }

    await assertStoredObjectMetadata(payload.file.storageKey, {
      mimeType: payload.file.mimeType,
      size: payload.file.size,
    });

    const dbVisibility = FILE_VISIBILITY_DB[payload.visibility];
    const categoryResolution = resolveDocumentCategory({
      category: payload.category,
      mimeType: payload.file.mimeType,
      songRequestId: payload.songRequestId ?? null,
      workshopRequestId: payload.workshopRequestId ?? null,
      uploadedByUserId: guard.session.sub,
      visibility: dbVisibility,
    });

    const persistedCategory = categoryResolution.source === 'fallback'
      ? getDefaultCategoryForUpload({
          context: payload.songRequestId
            ? 'song'
            : payload.workshopRequestId
              ? 'workshop'
              : payload.visibility === 'admin_only'
                ? 'admin-internal'
                : 'general',
          mimeType: payload.file.mimeType,
        })
      : categoryResolution.category;

    const item = await prisma.fileDocument.create({
      data: {
        contactId,
        songRequestId: payload.songRequestId ?? null,
        workshopRequestId: payload.workshopRequestId ?? null,
        uploadedByUserId: guard.session.sub,
        filename: payload.file.filename,
        originalName: payload.file.originalName,
        mimeType: payload.file.mimeType,
        size: payload.file.size,
        storageKey: payload.file.storageKey,
        url: payload.file.url,
        category: persistedCategory,
        visibility: dbVisibility,
      },
      include: { uploadedByUser: { select: { id: true, fullName: true } } },
    });

    await prisma.activity.create({
      data: {
        type: 'FILE',
        title: payload.songRequestId
          ? 'Document ajoute a la demande de chanson'
          : payload.workshopRequestId
            ? 'Document ajoute a la demande atelier'
            : 'Fichier depose',
        description: [
          `Nom: ${payload.file.originalName}`,
          `Categorie: ${persistedCategory}`,
          `Visibilite: ${payload.visibility}`,
          payload.songRequestId ? `Demande chanson: ${payload.songRequestId}` : null,
          payload.workshopRequestId ? `Demande atelier: ${payload.workshopRequestId}` : null,
        ].filter(Boolean).join('\n'),
          contactId,
        songRequestId: payload.songRequestId ?? null,
        userId: guard.session.sub,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation invalide', details: error.issues }, { status: 400 });
    }

    if (error instanceof S3ServiceException) {
      const status = error.$metadata?.httpStatusCode ?? 0;
      if (status === 404 || error.name === 'NoSuchKey' || error.name === 'NotFound') {
        return NextResponse.json(
          { error: "Fichier introuvable dans le stockage. L'upload a peut-être échoué ou le fichier a été supprimé." },
          { status: 422 },
        );
      }
      if (status === 403 || error.name === 'AccessDenied') {
        return NextResponse.json(
          { error: 'Stockage non accessible (403). Vérifiez les permissions IAM du bucket S3.' },
          { status: 503 },
        );
      }
      console.error('[CRM_FILE_DOCUMENT_POST] S3 error', error.name, status, error.message);
      return NextResponse.json({ error: `Erreur stockage (${error.name})` }, { status: 502 });
    }

    console.error('[CRM_FILE_DOCUMENT_POST]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload impossible' }, { status: 500 });
  }
}
