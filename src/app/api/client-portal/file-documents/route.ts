import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { FILE_VISIBILITY_DB } from '@/lib/file-documents';
import { finalizeUploadedFile, deleteFileFromPersistentStorage } from '@/lib/file-storage';
import { InvalidUploadIntent, verifyFileUploadIntent, claimFileUploadIntent, getUploadFolder } from '@/lib/file-upload-intent';
import {
  canClientAccessFileDocument,
  canClientAccessSongRequest,
  canClientAccessWorkshopRequest,
} from '@/features/client-portal/documents/security';
import { getDefaultCategoryForUpload, resolveDocumentCategory } from '@/features/documents/document-categories';
import { isClientVisibleStoredFile, toClientFileDto } from '@/features/client-portal/documents/client-file-dto';
import { authOriginError, readAuthJson, authRequestErrorResponse } from '@/lib/auth-request-security';

const finalizeUploadSchema = z.object({
  songRequestId: z.string().uuid().optional(),
  workshopRequestId: z.string().uuid().optional(),
  category: z.string().trim().max(80).optional(),
  file: z.object({
    uploadIntent: z.string().min(20).max(4000),
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
  const session = await getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
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

  if (parsedQuery.data.songRequestId) {
    const songExists = await canClientAccessSongRequest({
      songRequestId: parsedQuery.data.songRequestId,
      sessionContactId: session.contactId,
    });
    if (!songExists) {
      return NextResponse.json({ error: 'Demande de chanson introuvable' }, { status: 404 });
    }
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
      visibility: 'CLIENT_VISIBLE',
      OR: [
        { contactId: session.contactId },
        { songRequest: { contactId: session.contactId } },
        { workshopRequest: { OR: [{ contactId: session.contactId }, { clientId: session.contactId }] } },
        { invoice: { contactId: session.contactId } },
        { commercialQuote: { contactId: session.contactId } },
      ],
      ...(parsedQuery.data.songRequestId ? { songRequestId: parsedQuery.data.songRequestId } : {}),
      ...(parsedQuery.data.workshopRequestId ? { workshopRequestId: parsedQuery.data.workshopRequestId } : {}),
    },
    include: {
      songRequest: { select: { contactId: true } },
      workshopRequest: { select: { contactId: true, clientId: true } },
      invoice: { select: { contactId: true } },
      commercialQuote: { select: { contactId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const visibleItems = items.filter((item) => isClientVisibleStoredFile(item, session.contactId) && canClientAccessFileDocument({
    sessionContactId: session.contactId,
    visibility: item.visibility,
    category: item.category,
    contactId: item.contactId,
    songRequestContactId: item.songRequest?.contactId,
    workshopRequestContactId: item.workshopRequest?.contactId,
    workshopRequestClientId: item.workshopRequest?.clientId,
    invoiceContactId: item.invoice?.contactId,
    commercialQuoteContactId: item.commercialQuote?.contactId,
  })).map(({ songRequest, workshopRequest, invoice, commercialQuote, ...item }) => toClientFileDto(item));

  return NextResponse.json({ items: visibleItems });
}

export async function POST(request: NextRequest) {
  const originError = authOriginError(request);
  if (originError) return originError;

  let uncommittedStorageKey: string | null = null;
  try {
    const payload = finalizeUploadSchema.parse(await readAuthJson(request));
    const session = await getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
    if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    const uploadActor = { actorType: 'client' as const, actorId: session.contactId };
    verifyFileUploadIntent(payload.file.uploadIntent, uploadActor, payload.file);

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

    await claimFileUploadIntent(payload.file.uploadIntent, uploadActor, payload.file);
    const storedFile = await finalizeUploadedFile(payload.file, getUploadFolder(uploadActor));
    uncommittedStorageKey = storedFile.storageKey;

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
        filename: storedFile.filename,
        originalName: payload.file.originalName,
        mimeType: payload.file.mimeType,
        size: payload.file.size,
        storageKey: storedFile.storageKey,
        url: storedFile.url,
        category: persistedCategory,
        visibility: FILE_VISIBILITY_DB.client_visible,
      },
    });

    uncommittedStorageKey = null;
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

    return NextResponse.json({ item: { ...item, storageKey: undefined, url: `/api/client-portal/file-documents/${item.id}/download` } }, { status: 201 });
  } catch (error) {
    if (uncommittedStorageKey) await deleteFileFromPersistentStorage(uncommittedStorageKey).catch(() => undefined);
    const securityError = authRequestErrorResponse(error);
    if (securityError) return securityError;
    if (error instanceof InvalidUploadIntent) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
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
      if (status === 412 || error.name === 'PreconditionFailed') {
        return NextResponse.json({ error: 'Le fichier a changé pendant le dépôt. Préparez à nouveau le fichier.' }, { status: 409 });
      }
      console.error('[CLIENT_FILE_DOCUMENT_POST] S3 error', error.name, status);
      return NextResponse.json({ error: 'Stockage momentanément indisponible.' }, { status: 502 });
    }

    console.error('[CLIENT_FILE_DOCUMENT_POST]', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'Dépôt impossible. Réessayez avec un nouveau fichier.' }, { status: 503 });
  }
}
