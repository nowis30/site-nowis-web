import { NextResponse } from 'next/server';
import { GameError } from './engine';

export const MAX_BODY_BYTES = 2048;

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_BODY_BYTES) throw new GameError(413, 'Requête trop volumineuse.');
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new GameError(413, 'Requête trop volumineuse.');
  try { return JSON.parse(text || '{}'); }
  catch { throw new GameError(400, 'Requête invalide.'); }
}

export function playerToken(request: Request): string | null {
  const token = request.headers.get('x-player-token')?.trim();
  return token && /^[A-Za-z0-9_-]{20,64}$/.test(token) ? token : null;
}

export function errorResponse(error: unknown) {
  if (error instanceof GameError) return json({ error: error.message }, error.status);
  // On ne journalise ni jetons, ni contenu, ni URL de connexion.
  const code = (error as { code?: unknown })?.code;
  console.error('[YES_NO_GAME]', { code: typeof code === 'string' && /^P\d{4}$/.test(code) ? code : 'UNAVAILABLE' });
  return json({ error: 'Le jeu est momentanément indisponible. Réessaie dans un instant.' }, 503);
}
