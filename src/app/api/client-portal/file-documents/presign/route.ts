import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { createPresignedUploadUrl } from '@/lib/file-storage';
import { validateUploadDescriptor } from '@/lib/validators/file-document';
import { getUploadFolder, issueFileUploadIntent } from '@/lib/file-upload-intent';
import { consumeContactRateLimit } from '@/lib/contact-rate-limit';
import { authOriginError, readAuthJson, authRequestErrorResponse } from '@/lib/auth-request-security';

const presignSchema = z.object({
  fileName: z.string().trim().min(1).max(240),
  mimeType: z.string().trim().min(3).max(120),
  size: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const originError = authOriginError(request);
  if (originError) return originError;

  try {
    const payload = presignSchema.parse(await readAuthJson(request));
    const session = await getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
    if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    validateUploadDescriptor({ mimeType: payload.mimeType, size: payload.size });
    const limit = await consumeContactRateLimit({ scope: 'file-upload:client', identifier: session.contactId, max: 30, windowMs: 60 * 60 * 1000 });
    if (!limit.allowed) return NextResponse.json({ error: 'Trop de dépôts de fichiers. Réessayez dans une heure.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } });

    const intent = await createPresignedUploadUrl(
      {
        originalName: payload.fileName,
        mimeType: payload.mimeType,
        size: payload.size,
      },
      {
        folder: `${getUploadFolder({ actorType: 'client', actorId: session.contactId })}/staging`,
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
        uploadIntent: await issueFileUploadIntent({ actorType: 'client', actorId: session.contactId }, intent),
      },
    });
  } catch (error) {
    const securityError = authRequestErrorResponse(error);
    if (securityError) return securityError;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation invalide', details: error.issues }, { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message.startsWith('Type de fichier non autorise') || error.message.startsWith('Fichier trop volumineux')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (error.message.startsWith('Variable manquante:')) {
        return NextResponse.json(
          {
            error: 'Configuration stockage incomplète sur le serveur.',
            code: 'STORAGE_CONFIG_MISSING',
          },
          { status: 503 },
        );
      }
    }

    return NextResponse.json({ error: 'Préparation du dépôt temporairement indisponible.' }, { status: 503 });
  }
}
