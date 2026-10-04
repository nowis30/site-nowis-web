import { NextResponse } from 'next/server';
import {
  createTarotOracleLimiter, isTarotOracleAvailable, readTarotOracleInput,
  requestTarotOracleVision, TarotOracleRequestError,
} from '@/lib/tarot-oracle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const consumeRateLimit = createTarotOracleLimiter();
const unavailable = 'La vision IA est indisponible pour le moment. Votre lecture symbolique locale reste accessible.';
const headers = { 'Cache-Control': 'no-store' };

export function GET(request: Request) {
  return NextResponse.json({ available: isTarotOracleAvailable(process.env, request) }, { headers });
}

export async function POST(request: Request) {
  try {
    const input = await readTarotOracleInput(request);
    if (!isTarotOracleAvailable(process.env, request)) return NextResponse.json({ mode: 'unavailable', message: unavailable }, { status: 503, headers });
    const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const limit = consumeRateLimit(client);
    if (!limit.allowed) return NextResponse.json({ mode: 'unavailable', message: 'Patientez avant de demander une autre vision IA. Votre lecture locale reste disponible.' }, { status: 429, headers: { ...headers, 'Retry-After': String(limit.retryAfter) } });
    const reply = await requestTarotOracleVision(input, { request });
    if (!reply) return NextResponse.json({ mode: 'unavailable', message: unavailable }, { status: 503, headers });
    return NextResponse.json({ mode: 'ai', reply }, { headers });
  } catch (error) {
    if (error instanceof TarotOracleRequestError) return NextResponse.json({ mode: 'unavailable', message: error.message }, { status: error.status, headers });
    return NextResponse.json({ mode: 'unavailable', message: unavailable }, { status: 503, headers });
  }
}
