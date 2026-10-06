import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { readPublicInquiryBody } from '@/lib/public-inquiry-security';
import { publicTokenFromInput, revokePublicDocumentLink } from '@/lib/public-link-revocation';

const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
export async function POST(request: NextRequest) {
  try {
    const guard = await requireApiPermission(request, 'documents', 'update');
    if (guard.error) return guard.error;
    if (guard.session.role !== 'ADMIN') return NextResponse.json({ error: 'Accès réservé à un administrateur.' }, { status: 403, headers });
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return NextResponse.json({ error: 'Format invalide.' }, { status: 415, headers });
    let token: string;
    try {
      const input = z.object({ link: z.string().min(20).max(6000), confirm: z.literal(true) }).strict().parse(JSON.parse(await readPublicInquiryBody(request)));
      token = publicTokenFromInput(input.link);
    } catch (error) { return NextResponse.json({ error: 'Lien invalide ou trop long.' }, { status: error instanceof RangeError ? 413 : 400, headers }); }
    try { await revokePublicDocumentLink(token, guard.session.sub); }
    catch (error) { if (error instanceof Error && error.message === 'PUBLIC_LINK_INVALID') return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 400, headers }); throw error; }
    return NextResponse.json({ ok: true, message: 'Ce lien est révoqué. Les autres liens et le document restent disponibles.' }, { headers });
  } catch { return NextResponse.json({ error: 'Révocation indisponible. Aucun succès confirmé.' }, { status: 503, headers }); }
}
