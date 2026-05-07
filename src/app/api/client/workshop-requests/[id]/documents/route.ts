import { NextRequest, NextResponse } from 'next/server';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { getWorkshopDocumentLibrary } from '@/features/crm/server/document-library';
import { canClientAccessWorkshopRequest } from '@/features/client-portal/documents/security';

function unauthorized() {
  return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) return unauthorized();

  const workshopExists = await canClientAccessWorkshopRequest({
    workshopRequestId: params.id,
    sessionContactId: session.contactId,
  });

  if (!workshopExists) {
    return NextResponse.json({ error: 'Demande atelier introuvable' }, { status: 404 });
  }

  const items = await getWorkshopDocumentLibrary(params.id);
  return NextResponse.json({ items });
}
