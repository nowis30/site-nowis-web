import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { submitSongRequestFromWebsite } from '@/lib/actions/song-request';
import { buildClientPortalUrl } from '@/lib/client-portal';
import { SongRequestInput, songRequestPortalInputSchema } from '@/lib/validators/song-request';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { buildAuthRedirect } from '@/lib/safe-next';
import { applyCorsHeaders, buildCorsPreflightResponse } from '@/lib/cors';

function compact(value?: string | null) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

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

    const parsed = songRequestPortalInputSchema.parse({
      ...body,
      email: session.email,
    });

    const description = compact(parsed.description) || compact(parsed.details) || 'A definir';
    const normalizedInput: SongRequestInput = {
      fullName: parsed.fullName,
      email: parsed.email?.trim() || session.email,
      phone: compact(parsed.phone) || 'N/A',
      title: compact(parsed.title) || 'Demande de chanson',
      language: compact(parsed.language) || 'Français',
      songType: compact(parsed.songType) || 'PERSONNALISEE',
      tempo: parsed.tempo || 'MOYEN',
      occasion: compact(parsed.occasion) || compact(parsed.eventType) || 'DEMANDE_WEB',
      eventType: compact(parsed.eventType) || 'GENERAL',
      recipientName: compact(parsed.recipientName) || parsed.fullName,
      specialMessage: compact(parsed.specialMessage) || '',
      style: compact(parsed.style) || 'Libre',
      mood: compact(parsed.mood) || 'A_DETERMINER',
      theme: compact(parsed.theme) || 'A definir',
      description,
      inspirations: compact(parsed.inspirations) || '',
      lyrics: compact(parsed.lyrics) || '',
      structureVerse: compact(parsed.structureVerse) || 'A definir',
      structureChorus: compact(parsed.structureChorus) || 'A definir',
      structureBridge: compact(parsed.structureBridge) || '',
      fileUrl: compact(parsed.fileUrl) || '',
      details: description,
      budget: compact(parsed.budget) || '',
      desiredDeadline: compact(parsed.desiredDeadline) || '',
      consentToBeContacted: parsed.consentToBeContacted ?? true,
      source: compact(parsed.source) || 'website',
      antiSpam: compact(parsed.antiSpam) || '',
    };

    if (parsed.antiSpam && parsed.antiSpam.length > 0) {
      return NextResponse.json({ error: 'Requête rejetée' }, { status: 400 });
    }

    const result = await submitSongRequestFromWebsite(normalizedInput, {
      contactId: session.contactId,
    });
    const redirectTo = `/client/song-requests/${result.songRequestId}`;

    return applyCorsHeaders(
      NextResponse.json({
        success: true,
        ok: true,
        id: result.songRequestId,
        requestType: 'song-request',
        redirectTo,
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
