import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { FILE_VISIBILITY_DB } from '@/lib/file-documents';
import { assertStoredObjectMetadata, storeFileInPersistentStorage } from '@/lib/file-storage';
import { uploadFileMetadataSchema, validateUploadFile } from '@/lib/validators/file-document';

const finalizeUploadSchema = z.object({
  songRequestId: z.string().uuid().optional(),
  category: z.string().trim().min(2).max(80).default('document'),
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
});

export async function GET(request: NextRequest) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  const parsedQuery = querySchema.safeParse({
    songRequestId: request.nextUrl.searchParams.get('songRequestId') || undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Parametres invalides' }, { status: 400 });
  }

  const items = await prisma.fileDocument.findMany({
    where: {
      contactId: session.contactId,
      visibility: 'CLIENT_VISIBLE',
      ...(parsedQuery.data.songRequestId ? { songRequestId: parsedQuery.data.songRequestId } : {}),
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

    if (contentType.includes('application/json')) {
      const payload = finalizeUploadSchema.parse(await request.json());

      if (payload.songRequestId) {
        const requestExists = await prisma.songRequest.findFirst({
          where: { id: payload.songRequestId, contactId: session.contactId },
          select: { id: true },
        });

        if (!requestExists) {
          return NextResponse.json({ error: 'Demande de chanson introuvable' }, { status: 404 });
        }
      }

      await assertStoredObjectMetadata(payload.file.storageKey, {
        mimeType: payload.file.mimeType,
        size: payload.file.size,
      });

      const item = await prisma.fileDocument.create({
        data: {
          contactId: session.contactId,
          songRequestId: payload.songRequestId ?? null,
          uploadedByUserId: null,
          filename: payload.file.filename,
          originalName: payload.file.originalName,
          mimeType: payload.file.mimeType,
          size: payload.file.size,
          storageKey: payload.file.storageKey,
          url: payload.file.url,
          category: payload.category,
          visibility: FILE_VISIBILITY_DB.client_visible,
        },
      });

      await prisma.activity.create({
        data: {
          type: 'FILE',
          title: payload.songRequestId ? 'Document ajoute a la demande de chanson' : 'Fichier depose',
          description: [
            `Nom: ${payload.file.originalName}`,
            `Categorie: ${payload.category}`,
            'Depose depuis le portail client',
          ].join('\n'),
          contactId: session.contactId,
          songRequestId: payload.songRequestId ?? null,
        },
      });

      return NextResponse.json({ item }, { status: 201 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier recu.' }, { status: 400 });
    }

    validateUploadFile(file);

    const parsedMeta = uploadFileMetadataSchema.parse({
      songRequestId: formData.get('songRequestId') || undefined,
      category: formData.get('category') || 'document',
      visibility: 'client_visible',
    });

    if (parsedMeta.songRequestId) {
      const requestExists = await prisma.songRequest.findFirst({
        where: { id: parsedMeta.songRequestId, contactId: session.contactId },
        select: { id: true },
      });

      if (!requestExists) {
        return NextResponse.json({ error: 'Demande de chanson introuvable' }, { status: 404 });
      }
    }

    const stored = await storeFileInPersistentStorage(file, { folder: `client-files/${session.contactId}` });

    const item = await prisma.fileDocument.create({
      data: {
        contactId: session.contactId,
        songRequestId: parsedMeta.songRequestId ?? null,
        uploadedByUserId: null,
        filename: stored.filename,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        size: stored.size,
        storageKey: stored.storageKey,
        url: stored.url,
        category: parsedMeta.category,
        visibility: FILE_VISIBILITY_DB.client_visible,
      },
    });

    await prisma.activity.create({
      data: {
        type: 'FILE',
        title: parsedMeta.songRequestId ? 'Document ajoute a la demande de chanson' : 'Fichier depose',
        description: [
          `Nom: ${stored.originalName}`,
          `Categorie: ${parsedMeta.category}`,
          'Depose depuis le portail client',
        ].join('\n'),
        contactId: session.contactId,
        songRequestId: parsedMeta.songRequestId ?? null,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation invalide', details: error.issues }, { status: 400 });
    }

    console.error('[CLIENT_FILE_DOCUMENT_POST]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload impossible' }, { status: 500 });
  }
}
