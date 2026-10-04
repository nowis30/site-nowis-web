import { NextResponse } from 'next/server';
import { createTarotOracleLimiter, isTarotOracleAvailable } from '@/lib/tarot-oracle';
import { OracleConclusionRequestError, readOracleConclusionInput, requestOracleConclusion } from '@/lib/oracle-conclusion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const consumeRateLimit = createTarotOracleLimiter();
const headers = { 'Cache-Control': 'no-store' };
const unavailable = 'La conclusion IA est indisponible pour le moment. Les lectures symboliques locales restent accessibles.';

export function GET(request: Request) {
  return NextResponse.json({ available: isTarotOracleAvailable(process.env, request) }, { headers });
}

export async function POST(request: Request) {
  try {
    const input = await readOracleConclusionInput(request);
    if (!isTarotOracleAvailable(process.env, request)) return NextResponse.json({ mode: 'unavailable', message: unavailable }, { status: 503, headers });
    const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const limit = consumeRateLimit(client);
    if (!limit.allowed) return NextResponse.json({ mode: 'unavailable', message: 'Patientez avant de demander une autre conclusion IA. Vos lectures locales restent disponibles.' }, { status: 429, headers: { ...headers, 'Retry-After': String(limit.retryAfter) } });
    const reply = await requestOracleConclusion(input, { request });
    if (!reply) return NextResponse.json({ mode: 'unavailable', message: unavailable }, { status: 503, headers });
    return NextResponse.json({ mode: 'ai', reply }, { headers });
  } catch (error) {
    if (error instanceof OracleConclusionRequestError) return NextResponse.json({ mode: 'unavailable', message: error.message }, { status: error.status, headers });
    return NextResponse.json({ mode: 'unavailable', message: unavailable }, { status: 503, headers });
  }
}
