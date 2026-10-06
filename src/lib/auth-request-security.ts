import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { publicInquiryOriginAllowed, readPublicInquiryBody } from '@/lib/public-inquiry-security';
import { consumeContactRateLimit } from '@/lib/contact-rate-limit';
import { getTrustedClientIp } from '@/lib/trusted-client-ip';

export class AuthRequestError extends Error {
  constructor(public status: number, message: string, public retryAfter?: number) { super(message); }
}
export function assertAuthOrigin(request: Request) {
  if (!publicInquiryOriginAllowed(request.headers.get('origin')) || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new AuthRequestError(403, 'Cette demande doit provenir du site Nowis.');
  }
}
export function authOriginError(request: Request): NextResponse | null {
  try { assertAuthOrigin(request); return null; }
  catch (error) { return authRequestErrorResponse(error); }
}
export async function readAuthJson(request: Request): Promise<unknown> {
  assertAuthOrigin(request);
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    throw new AuthRequestError(415, 'Format de demande invalide.');
  }
  try { return JSON.parse(await readPublicInquiryBody(request)); }
  catch (error) { throw new AuthRequestError(error instanceof RangeError ? 413 : 400, 'Demande invalide ou trop volumineuse.'); }
}
export async function limitAuth(request: Request, action: string, email: string, max = 5) {
  const digest = (value: string) => createHash('sha256').update(value).digest('hex');
  for (const [scope, identifier, budget] of [
    ['auth:ip', digest(`${action}:${getTrustedClientIp(request.headers) || 'unknown'}`), max * 5],
    ['auth:account', digest(`${action}:${email.trim().toLowerCase()}`), max],
  ] as const) {
    const limit = await consumeContactRateLimit({ scope, identifier, max: budget, windowMs: 15 * 60_000 });
    if (!limit.allowed) throw new AuthRequestError(429, 'Trop de tentatives. Réessayez dans quelques minutes.', limit.retryAfterSeconds);
  }
}
export function authRequestErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof AuthRequestError)) return null;
  return NextResponse.json({ error: error.message, message: error.message }, { status: error.status,
    headers: { 'Cache-Control': 'no-store', ...(error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {}) } });
}
