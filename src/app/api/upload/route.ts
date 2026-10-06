import { NextResponse } from 'next/server';
import { persistUploadedFile } from '@/lib/uploaded-file';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { buildAuthRedirect } from '@/lib/safe-next';
import { authOriginError } from '@/lib/auth-request-security';
import { consumeContactRateLimit } from '@/lib/contact-rate-limit';
import {
  assertUploadMultipartHeaders,
  readBoundedUploadFormData,
  MAX_UPLOAD_FILE_BYTES,
  UploadBodyError,
  legacyUploadError,
} from '@/lib/bounded-upload-body';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const originError = authOriginError(request);
  if (originError) return originError;
  try {
    // Require an authenticated session — no anonymous uploads.
    const session = await getClientPortalSessionFromCookieHeader(
      request.headers.get('cookie') ?? undefined,
    );
    if (!session) {
      return NextResponse.json(
        { error: 'Connexion requise.', loginUrl: buildAuthRedirect('/client/dashboard') },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
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
      return NextResponse.json(
        { error: 'Trop de dépôts de fichiers. Réessayez dans une heure.' },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfterSeconds), 'Cache-Control': 'no-store' },
        },
      );
    }
    const formData = await readBoundedUploadFormData(request);
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Aucun fichier recu.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (file.size > MAX_UPLOAD_FILE_BYTES) {
      throw new UploadBodyError(413, 'Fichier trop volumineux (max 10 Mo).');
    }

    const stored = await persistUploadedFile(file);
    return NextResponse.json(
      { url: stored.url, name: stored.fileName, size: stored.sizeBytes },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const safe = legacyUploadError(error);
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
