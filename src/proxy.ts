import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { songSlugRedirects } from '../config/song-slug-aliases.cjs';
import { privateContentSecurityPolicy } from '@/lib/private-content-security-policy';

const canonicalSongPaths: Record<string, string> = Object.fromEntries(
  Object.entries(songSlugRedirects).map(([source, destination]) => [`/chanson/${source}`, `/chanson/${destination}`]),
);

const gestionnairePortal = 'https://crm.nowis.store/connexion/gestionnaire#accueil';
const legacyCrmDoors = new Set(['/crm', '/crm/dashboard', '/crm/historique']);

export function proxy(request: NextRequest) {
  if (legacyCrmDoors.has(request.nextUrl.pathname)) {
    // A fixed destination drops queries; a fixed fragment prevents inheritance
    // of any legacy #token by the browser when it follows the redirect.
    const response = request.method === 'GET' || request.method === 'HEAD'
      ? NextResponse.redirect(gestionnairePortal, 307)
      : new NextResponse(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }

  const canonicalSongPath = canonicalSongPaths[request.nextUrl.pathname];
  if (canonicalSongPath) {
    const url = request.nextUrl.clone();
    url.pathname = canonicalSongPath;
    return NextResponse.redirect(url, 301);
  }

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
  matcher: [
    '/crm/:path*',
    '/client/:path*',
    '/connexion',
    '/inscription',
    '/mot-de-passe-oublie',
    '/reinitialiser-mot-de-passe',
    '/facture/:path*',
    '/soumission/:path*',
    '/facturation/:path*',
    '/chanson/superbowl',
    '/chanson/le-printemps-va-rugir',
    '/chanson/j-t-alle-a-doremi',
    '/chanson/pas-besion-de-voir',
    '/chanson/marie-lisa-gtub6g',
  ],
};
