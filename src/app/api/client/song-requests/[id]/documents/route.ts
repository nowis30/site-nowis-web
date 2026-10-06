import { NextRequest, NextResponse } from 'next/server';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { getSongDocumentLibrary } from '@/features/crm/server/document-library';
import { canClientAccessSongRequest } from '@/features/client-portal/documents/security';
import { isClientVisibleStoredFile, toClientFileDto } from '@/features/client-portal/documents/client-file-dto';

function unauthorized() {
  return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
}

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) return unauthorized();

  const songExists = await canClientAccessSongRequest({
    songRequestId: params.id,
    sessionContactId: session.contactId,
  });

  if (!songExists) {
    return NextResponse.json({ error: 'Demande de chanson introuvable' }, { status: 404 });
  }

  const items = await getSongDocumentLibrary(params.id);
  return NextResponse.json({ items: items.filter(item => isClientVisibleStoredFile(item, session.contactId)).map(toClientFileDto) },
    { headers: { 'Cache-Control': 'private, no-store' } });
}
