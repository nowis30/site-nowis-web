import { authOriginError } from '@/lib/auth-request-security';
import { NextRequest, NextResponse } from 'next/server';
import { persistUploadedFile } from '@/lib/uploaded-file';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { buildAuthRedirect } from '@/lib/safe-next';
import { applyCorsHeaders, buildCorsPreflightResponse } from '@/lib/cors';
import { consumeContactRateLimit } from '@/lib/contact-rate-limit';
import {
  assertUploadMultipartHeaders,
  readBoundedUploadFormData,
  MAX_UPLOAD_FILE_BYTES,
  UploadBodyError,
  legacyUploadError,
} from '@/lib/bounded-upload-body';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const originError = authOriginError(request);
  if (originError) return originError;
  try {
    const session = await getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);

    if (!session) {
      return applyCorsHeaders(
        NextResponse.json(
          {
            error: 'Connexion requise pour envoyer un fichier.',
            code: 'AUTH_REQUIRED',
            loginUrl: buildAuthRedirect('/client/song-requests/nouveau'),
          },
          { status: 401, headers: { 'Cache-Control': 'no-store' } },
        ),
        request,
      );
    }
    assertUploadMultipartHeaders(request);
    const limit = await consumeContactRateLimit({
      scope: 'file-upload:client',
      identifier: session.contactId,
      max: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.allowed) {
      return applyCorsHeaders(
        NextResponse.json(
          { error: 'Trop de dépôts de fichiers. Réessayez dans une heure.' },
          {
            status: 429,
            headers: { 'Retry-After': String(limit.retryAfterSeconds), 'Cache-Control': 'no-store' },
          },
        ),
        request,
      );
    }
    const formData = await readBoundedUploadFormData(request);
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return applyCorsHeaders(
        NextResponse.json(
          { error: 'Aucun fichier reçu' },
          { status: 400, headers: { 'Cache-Control': 'no-store' } },
        ),
        request,
      );
    }
    if (file.size > MAX_UPLOAD_FILE_BYTES) {
      throw new UploadBodyError(413, 'Fichier trop volumineux (max 10 Mo).');
    }

    const stored = await persistUploadedFile(file);
    return applyCorsHeaders(
      NextResponse.json(
        {
          ok: true,
          fileUrl: stored.url,
          fileName: stored.fileName,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
        },
        { headers: { 'Cache-Control': 'no-store' } },
      ),
      request,
    );
  } catch (error) {
    const safe = legacyUploadError(error);
    return applyCorsHeaders(
      NextResponse.json(
        { error: safe.message },
        { status: safe.status, headers: { 'Cache-Control': 'no-store' } },
      ),
      request,
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, {
    methods: 'POST, OPTIONS',
    headers: 'Content-Type, Authorization',
    credentials: true,
  });
}
