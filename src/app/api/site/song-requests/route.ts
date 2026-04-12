import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { submitSongRequestFromWebsite } from '@/lib/actions/song-request';
import { buildClientPortalUrl } from '@/lib/client-portal';
import { songRequestInputSchema } from '@/lib/validators/song-request';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { buildAuthRedirect } from '@/lib/safe-next';
import { applyCorsHeaders, buildCorsPreflightResponse } from '@/lib/cors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);

    if (!session) {
      return applyCorsHeaders(
        NextResponse.json(
        {
          error: 'Connexion requise pour envoyer une demande.',
          code: 'AUTH_REQUIRED',
          loginUrl: buildAuthRedirect('/client/song-requests/nouveau'),
        },
        { status: 401 },
        ),
        request,
      );
    }

    const parsed = songRequestInputSchema.parse({
      ...body,
      email: session.email,
    });

    if (parsed.antiSpam && parsed.antiSpam.length > 0) {
      return NextResponse.json({ error: 'Requête rejetée' }, { status: 400 });
    }

    const result = await submitSongRequestFromWebsite(parsed, {
      contactId: session.contactId,
    });

    return applyCorsHeaders(
      NextResponse.json({
        ok: true,
        message: 'Demande envoyée avec succès.',
        clientPortalUrl: buildClientPortalUrl(result.clientPortalPath.replace('/crm/client/', ''), request.nextUrl.origin),
        ...result,
      }),
      request,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return applyCorsHeaders(
        NextResponse.json(
        { error: 'Validation invalide', details: error.issues },
        { status: 400 },
        ),
        request,
      );
    }

    console.error('[SONG_REQUEST_PUBLIC]', error);
    return applyCorsHeaders(NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, {
    methods: 'POST, OPTIONS',
    headers: 'Content-Type, Authorization',
    credentials: true,
  });
}
