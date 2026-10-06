import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { consumeContactRateLimit } from '@/lib/contact-rate-limit';
import { publicInquiryOriginAllowed } from '@/lib/public-inquiry-security';
import { CLIENT_PORTAL_COOKIE_NAME, verifyClientPortalSession } from '@/features/client-portal/auth/session';
import tracks from '@/data/radio-tracks.json';

const trackIds = new Set(tracks.map(track => track.id));
export const radioTrackIdSchema = z.string().refine(id => trackIds.has(id), 'Cette chanson ne fait pas partie de la radio.');
export class RadioHttpError extends Error {
  constructor(public status: number, message: string, public retryAfter?: number) { super(message); }
}
export function radioJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' } });
}
export function radioError(error: unknown) {
  if (error instanceof RadioHttpError) {
    const response = radioJson({ message: error.message }, error.status);
    if (error.retryAfter) response.headers.set('Retry-After', String(error.retryAfter));
    return response;
  }
  if (error instanceof ZodError) return radioJson({ message: error.issues[0]?.message || 'Vérifiez les champs.' }, 400);
  // Never log passwords, session tokens, comment bodies or connection strings.
  console.error('[RADIO_API]', error instanceof Error ? error.name : 'UnknownError');
  return radioJson({ message: 'Le service est momentanément indisponible. Réessayez dans un instant.' }, 503);
}
export async function readRadioJson(request: NextRequest): Promise<unknown> {
  const origin = request.headers.get('origin');
  // Next can normalize the internal request hostname behind a proxy or in development.
  // Reuse the explicit public-site / exact-preview allowlist, never a caller-supplied Host.
  if ((origin && !publicInquiryOriginAllowed(origin)) || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new RadioHttpError(403, 'Cette demande doit provenir du site Nowis.');
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new RadioHttpError(415, 'Format de demande invalide.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RadioHttpError(400, 'Demande vide.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) { await reader.cancel(); throw new RadioHttpError(413, 'Le texte est trop long.'); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new RadioHttpError(400, 'Demande invalide.'); }
}
export function radioIpHash(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return createHash('sha256').update(ip).digest('hex');
}
export async function limitRadio(request: NextRequest, scope: 'radio:comment' | 'radio:register' | 'radio:favorite', identifier?: string) {
  const limit = await consumeContactRateLimit({ scope, identifier: identifier || radioIpHash(request),
    max: scope === 'radio:favorite' ? 90 : 5, windowMs: scope === 'radio:favorite' ? 60_000 : 10 * 60_000 });
  if (!limit.allowed) throw new RadioHttpError(429, 'Trop de demandes. Réessayez dans quelques minutes.', limit.retryAfterSeconds);
}
export async function getRadioUser(request: NextRequest) {
  const token = request.cookies.get(CLIENT_PORTAL_COOKIE_NAME)?.value;
  const session = token ? await verifyClientPortalSession(token) : null;
  if (!session || !z.string().uuid().safeParse(session.contactId).success) return null;
  return prisma.user.findFirst({ where: { contactId: session.contactId, email: session.email, role: 'PORTAL_USER',
    isActive: true, contact: { deletedAt: null } }, select: { id: true, fullName: true } });
}
