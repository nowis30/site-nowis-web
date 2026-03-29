import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { FILE_VISIBILITY_DB } from '@/lib/file-documents';
import { assertStoredObjectMetadata } from '@/lib/file-storage';

const finalizeUploadSchema = z.object({
  contactId: z.string().uuid().optional(),
  songRequestId: z.string().uuid().optional(),
  category: z.string().trim().min(2).max(80).default('document'),
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
});

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'documents', 'read');
  if (guard.error) return guard.error;

  const parsedQuery = querySchema.safeParse({
    contactId: request.nextUrl.searchParams.get('contactId') || undefined,
    songRequestId: request.nextUrl.searchParams.get('songRequestId') || undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Filtres invalides' }, { status: 400 });
  }

  const items = await prisma.fileDocument.findMany({
    where: {
      ...(parsedQuery.data.contactId ? { contactId: parsedQuery.data.contactId } : {}),
      ...(parsedQuery.data.songRequestId ? { songRequestId: parsedQuery.data.songRequestId } : {}),
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

    if (!contactId) {
      return NextResponse.json({ error: 'Le contact est obligatoire' }, { status: 400 });
    }

    const contact = await prisma.contact.findUnique({ where: { id: contactId }, select: { id: true } });
    if (!contact) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
    }

    await assertStoredObjectMetadata(payload.file.storageKey, {
      mimeType: payload.file.mimeType,
      size: payload.file.size,
    });

    const item = await prisma.fileDocument.create({
      data: {
        contactId,
        songRequestId: payload.songRequestId ?? null,
        uploadedByUserId: guard.session.sub,
        filename: payload.file.filename,
        originalName: payload.file.originalName,
        mimeType: payload.file.mimeType,
        size: payload.file.size,
        storageKey: payload.file.storageKey,
        url: payload.file.url,
        category: payload.category,
        visibility: FILE_VISIBILITY_DB[payload.visibility],
      },
      include: { uploadedByUser: { select: { id: true, fullName: true } } },
    });

    await prisma.activity.create({
      data: {
        type: 'FILE',
        title: payload.songRequestId ? 'Document ajoute a la demande de chanson' : 'Fichier depose',
        description: [
          `Nom: ${payload.file.originalName}`,
          `Categorie: ${payload.category}`,
          `Visibilite: ${payload.visibility}`,
          payload.songRequestId ? `Demande chanson: ${payload.songRequestId}` : null,
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

    console.error('[CRM_FILE_DOCUMENT_POST]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload impossible' }, { status: 500 });
  }
}
