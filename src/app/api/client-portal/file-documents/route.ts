import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { FILE_VISIBILITY_DB } from '@/lib/file-documents';
import { assertStoredObjectMetadata } from '@/lib/file-storage';
import { canClientAccessSongRequest, canClientAccessWorkshopRequest } from '@/features/client-portal/documents/security';
import { getDefaultCategoryForUpload, resolveDocumentCategory } from '@/features/documents/document-categories';

const finalizeUploadSchema = z.object({
  songRequestId: z.string().uuid().optional(),
  workshopRequestId: z.string().uuid().optional(),
  category: z.string().trim().max(80).optional(),
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
  songRequestId: z.string().uuid().optional(),
  workshopRequestId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  const parsedQuery = querySchema.safeParse({
    songRequestId: request.nextUrl.searchParams.get('songRequestId') || undefined,
    workshopRequestId: request.nextUrl.searchParams.get('workshopRequestId') || undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Parametres invalides' }, { status: 400 });
  }

  if (parsedQuery.data.workshopRequestId) {
    const workshopExists = await canClientAccessWorkshopRequest({
      workshopRequestId: parsedQuery.data.workshopRequestId,
      sessionContactId: session.contactId,
    });
    if (!workshopExists) {
      return NextResponse.json({ error: 'Demande atelier introuvable' }, { status: 404 });
    }
  }

  const items = await prisma.fileDocument.findMany({
    where: {
      contactId: session.contactId,
      visibility: 'CLIENT_VISIBLE',
      ...(parsedQuery.data.songRequestId ? { songRequestId: parsedQuery.data.songRequestId } : {}),
      ...(parsedQuery.data.workshopRequestId ? { workshopRequestId: parsedQuery.data.workshopRequestId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

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

    if (payload.songRequestId) {
      const requestExists = await canClientAccessSongRequest({
        songRequestId: payload.songRequestId,
        sessionContactId: session.contactId,
      });

      if (!requestExists) {
        return NextResponse.json({ error: 'Demande de chanson introuvable' }, { status: 404 });
      }
    }

    if (payload.workshopRequestId) {
      const workshopExists = await canClientAccessWorkshopRequest({
        workshopRequestId: payload.workshopRequestId,
        sessionContactId: session.contactId,
      });

      if (!workshopExists) {
        return NextResponse.json({ error: 'Demande atelier introuvable' }, { status: 404 });
      }
    }

    await assertStoredObjectMetadata(payload.file.storageKey, {
      mimeType: payload.file.mimeType,
      size: payload.file.size,
    });

    const categoryResolution = resolveDocumentCategory({
      category: payload.category,
      mimeType: payload.file.mimeType,
      songRequestId: payload.songRequestId ?? null,
      workshopRequestId: payload.workshopRequestId ?? null,
      uploadedByUserId: null,
      visibility: 'CLIENT_VISIBLE',
    });

    const persistedCategory = categoryResolution.source === 'fallback'
      ? getDefaultCategoryForUpload({
          context: payload.songRequestId ? 'song' : payload.workshopRequestId ? 'workshop' : 'general',
          mimeType: payload.file.mimeType,
        })
      : categoryResolution.category;

    const item = await prisma.fileDocument.create({
      data: {
        contactId: session.contactId,
        songRequestId: payload.songRequestId ?? null,
        workshopRequestId: payload.workshopRequestId ?? null,
        uploadedByUserId: null,
        filename: payload.file.filename,
        originalName: payload.file.originalName,
        mimeType: payload.file.mimeType,
        size: payload.file.size,
        storageKey: payload.file.storageKey,
        url: payload.file.url,
        category: persistedCategory,
        visibility: FILE_VISIBILITY_DB.client_visible,
      },
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
          'Depose depuis le portail client',
        ].join('\n'),
        contactId: session.contactId,
        songRequestId: payload.songRequestId ?? null,
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
          { error: "Fichier introuvable dans le stockage. L'upload a peut-être échoué." },
          { status: 422 },
        );
      }
      if (status === 403 || error.name === 'AccessDenied') {
        return NextResponse.json(
          { error: 'Stockage non accessible. Contactez un administrateur.' },
          { status: 503 },
        );
      }
      console.error('[CLIENT_FILE_DOCUMENT_POST] S3 error', error.name, status, error.message);
      return NextResponse.json({ error: `Erreur stockage (${error.name})` }, { status: 502 });
    }

    console.error('[CLIENT_FILE_DOCUMENT_POST]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload impossible' }, { status: 500 });
  }
}
