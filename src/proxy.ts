import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { privateContentSecurityPolicy } from '@/lib/private-content-security-policy';

export function proxy(request: NextRequest) {
  const nonce = randomBytes(24).toString('base64');
  const policy = privateContentSecurityPolicy(nonce);
  const headers = new Headers(request.headers);
  // Next.js extracts the nonce from the trusted request CSP for its own scripts.
  // Ignore any nonce or CSP supplied by the requester.
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', policy);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

export const config = {
  matcher: ['/crm/:path*', '/client/:path*', '/connexion', '/inscription', '/mot-de-passe-oublie', '/reinitialiser-mot-de-passe', '/facture/:path*', '/soumission/:path*', '/facturation/:path*'],
};
