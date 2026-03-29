import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

const createDocumentSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  fileUrl: z.string().trim().min(1).max(2000),
  mimeType: z.string().trim().max(255).nullable().optional(),
  sizeBytes: z.number().int().nonnegative().nullable().optional(),
  linkedType: z.enum([
    'CONTACT',
    'INQUIRY',
    'CASE',
    'APPOINTMENT',
    'INVOICE',
    'ACTIVITY',
    'SONG_REQUEST',
    'WORKSHOP_REQUEST',
    'WORKSHOP_APPOINTMENT',
  ]),
  linkedId: z.string().uuid(),
});

const linkedTypeFilterSchema = z.enum([
  'CONTACT',
  'INQUIRY',
  'CASE',
  'APPOINTMENT',
  'INVOICE',
  'ACTIVITY',
  'SONG_REQUEST',
  'WORKSHOP_REQUEST',
  'WORKSHOP_APPOINTMENT',
]);

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'documents', 'read');
  if (guard.error) return guard.error;

  const linkedType = request.nextUrl.searchParams.get('linkedType');
  const linkedId = request.nextUrl.searchParams.get('linkedId');
  const q = request.nextUrl.searchParams.get('q')?.trim();
  const parsedLinkedType = linkedType ? linkedTypeFilterSchema.safeParse(linkedType) : null;

  const items = await prisma.document.findMany({
    where: {
      ...(parsedLinkedType?.success ? { linkedType: parsedLinkedType.data } : {}),
      ...(linkedId ? { linkedId } : {}),
      ...(q ? { fileName: { contains: q, mode: 'insensitive' } } : {}),
    },
    include: { uploadedBy: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'documents', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = createDocumentSchema.parse(await request.json());

    const item = await prisma.document.create({
      data: {
        fileName: payload.fileName,
        fileUrl: payload.fileUrl,
        mimeType: payload.mimeType ?? null,
        sizeBytes: payload.sizeBytes ?? null,
        linkedType: payload.linkedType,
        linkedId: payload.linkedId,
        uploadedById: guard.session.sub,
      },
      include: { uploadedBy: { select: { fullName: true } } },
    });

    await prisma.activity.create({
      data: {
        type: 'FILE',
        title: `Fichier ajouté : ${payload.fileName}`,
        description: `Document attaché à ${payload.linkedType} (${payload.linkedId}).`,
        contactId: payload.linkedType === 'CONTACT' ? payload.linkedId : null,
        userId: guard.session.sub,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    console.error('[CRM_FILES_CREATE]', error);
    return NextResponse.json({ error: 'Création du document impossible' }, { status: 500 });
  }
}
