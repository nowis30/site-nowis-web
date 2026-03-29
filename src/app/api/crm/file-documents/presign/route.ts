import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { createPresignedUploadUrl } from '@/lib/file-storage';
import { validateUploadDescriptor } from '@/lib/validators/file-document';

const presignSchema = z.object({
  fileName: z.string().trim().min(1).max(240),
  mimeType: z.string().trim().min(3).max(120),
  size: z.number().int().positive(),
  folder: z.string().trim().min(1).max(160).optional(),
});

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'documents', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = presignSchema.parse(await request.json());
    validateUploadDescriptor({ mimeType: payload.mimeType, size: payload.size });

    const intent = await createPresignedUploadUrl(
      {
        originalName: payload.fileName,
        mimeType: payload.mimeType,
        size: payload.size,
      },
      {
        folder: payload.folder || 'crm-files',
      },
    );

    return NextResponse.json({
      uploadUrl: intent.uploadUrl,
      file: {
        storageKey: intent.storageKey,
        url: intent.url,
        filename: intent.filename,
        originalName: intent.originalName,
        mimeType: intent.mimeType,
        size: intent.size,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation invalide', details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Generation URL upload impossible' }, { status: 500 });
  }
}
