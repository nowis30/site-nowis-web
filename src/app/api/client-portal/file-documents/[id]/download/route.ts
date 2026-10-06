import { NextRequest, NextResponse } from 'next/server';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { verifyClientPortalToken } from '@/lib/client-portal';
import { canClientAccessFileDocument } from '@/features/client-portal/documents/security';
import { getObjectForProxy } from '@/lib/file-storage';
import { sanitizeFileBaseName } from '@/lib/file-documents';
import { canClientAccessStoredDocumentKey } from '@/lib/file-upload-intent';

function isSafeInternalApiPath(path: string) {
  return path.startsWith('/api/client-portal/') && !path.startsWith('/api/client-portal/file-documents/');
}

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieSession = await getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  const legacyToken = request.nextUrl.searchParams.get('token') || '';
  const tokenSession = legacyToken ? await verifyClientPortalToken(legacyToken) : null;
  const sessionContactId = cookieSession?.contactId || tokenSession?.contactId || null;

  if (!sessionContactId) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  const doc = await prisma.fileDocument.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      storageKey: true,
      originalName: true,
      mimeType: true,
      url: true,
      category: true,
      visibility: true,
      contactId: true,
      songRequest: { select: { contactId: true } },
      workshopRequest: { select: { contactId: true, clientId: true } },
      invoice: { select: { contactId: true } },
      commercialQuote: { select: { contactId: true } },
    },
  });

  if (!doc || !canClientAccessStoredDocumentKey(doc.storageKey, sessionContactId)
    || !canClientAccessFileDocument({
    sessionContactId,
    visibility: doc.visibility,
    category: doc.category,
    contactId: doc.contactId,
    songRequestContactId: doc.songRequest?.contactId,
    workshopRequestContactId: doc.workshopRequest?.contactId,
    workshopRequestClientId: doc.workshopRequest?.clientId,
    invoiceContactId: doc.invoice?.contactId,
    commercialQuoteContactId: doc.commercialQuote?.contactId,
  })) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  try {
    const range = request.headers.get('range');
    const { body, contentType, contentLength, contentRange, acceptRanges, status } =
      await getObjectForProxy(doc.storageKey, range ?? undefined);

    const headers = new Headers();
    headers.set('Content-Type', contentType || doc.mimeType || 'application/octet-stream');
    if (contentLength !== undefined) {
      headers.set('Content-Length', String(contentLength));
    }
    if (contentRange) {
      headers.set('Content-Range', contentRange);
    }
    headers.set('Accept-Ranges', acceptRanges ?? 'bytes');
    headers.set(
      'Content-Disposition',
      `attachment; filename="${sanitizeFileBaseName(doc.originalName || 'file')}"`,
    );
    headers.set('Cache-Control', 'private, no-store');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Content-Security-Policy', "sandbox; default-src 'none'");

    return new NextResponse(body, { status, headers });
  } catch (error) {
    if (error instanceof S3ServiceException) {
      const httpStatus = error.$metadata?.httpStatusCode ?? 0;
      if (
        (httpStatus === 404 || error.name === 'NoSuchKey' || error.name === 'NotFound')
        && isSafeInternalApiPath(doc.url)
      ) {
        return NextResponse.redirect(new URL(doc.url, request.url), { status: 302 });
      }
      if (httpStatus === 404 || error.name === 'NoSuchKey' || error.name === 'NotFound') {
        return NextResponse.json(
          { error: 'Le fichier est introuvable dans le stockage. Veuillez contacter un administrateur.' },
          { status: 404 },
        );
      }
      if (httpStatus === 403 || error.name === 'AccessDenied') {
        return NextResponse.json(
          { error: 'Fichier temporairement inaccessible. Contactez un administrateur.' },
          { status: 503 },
        );
      }
    }
    console.error('[CLIENT_FILE_DOWNLOAD]', error);
    return NextResponse.json({ error: 'Impossible de télécharger le fichier.' }, { status: 500 });
  }
}
