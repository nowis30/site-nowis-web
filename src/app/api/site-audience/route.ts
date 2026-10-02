import { NextRequest, NextResponse } from 'next/server';
import { readSiteAudience, readSiteAudiencePost, recordSiteAudience, SiteAudienceRequestError } from '@/lib/site-audience';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

function errorResponse(error: unknown) {
  if (error instanceof SiteAudienceRequestError) return json({ error: error.message }, error.status);
  // Do not log request identifiers, payloads, connection URLs or provider errors.
  const code = (error as { code?: unknown })?.code;
  console.error('[SITE_AUDIENCE]', { code: typeof code === 'string' && /^P\d{4}$/.test(code) ? code : 'UNAVAILABLE' });
  return json({ error: 'Le compteur est momentanément indisponible.' }, 503);
}

export async function GET(request: NextRequest) {
  try { return json(await readSiteAudience(request.url)); }
  catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = await readSiteAudiencePost(request);
    return json(await recordSiteAudience(request.url, sessionId));
  } catch (error) { return errorResponse(error); }
}
