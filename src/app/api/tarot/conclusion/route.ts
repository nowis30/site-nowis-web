import { NextResponse } from 'next/server';
import { createTarotOracleLimiter, isTarotOracleAvailable, type SymbolicVisionFailure, type SymbolicVisionFailureReason } from '@/lib/tarot-oracle';
import { OracleConclusionRequestError, readOracleConclusionInput, requestOracleConclusion } from '@/lib/oracle-conclusion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const consumeRateLimit = createTarotOracleLimiter();
const headers = { 'Cache-Control': 'no-store' };
const unavailable = 'La conclusion IA est indisponible pour le moment. Les lectures symboliques locales restent accessibles.';
const failureMessages: Record<SymbolicVisionFailureReason, string> = {
  timeout: 'L’IA n’a pas terminé dans le délai prévu. Vous pouvez réessayer dans quelques instants ; vos lectures restent disponibles.',
  incomplete: 'L’IA a renvoyé une réponse incomplète. Aucune conclusion partielle n’est affichée. Vous pouvez réessayer.',
  auth: 'La connexion au service d’IA rencontre un problème. Vos lectures restent disponibles ; réessayez plus tard.',
  quota: 'Le service d’IA a atteint une limite temporaire. Vos lectures restent disponibles ; réessayez plus tard.',
  http: 'Le service d’IA ne peut pas répondre actuellement. Vos lectures restent disponibles ; réessayez plus tard.',
  empty: 'L’IA n’a pas renvoyé de conclusion lisible. Vous pouvez réessayer ; vos lectures restent disponibles.',
  refusal: 'L’IA n’a pas pu rédiger cette conclusion. Vous pouvez reformuler votre question ; vos lectures restent disponibles.',
  output_limit: 'La réponse de l’IA ne peut pas être affichée correctement. Vous pouvez réessayer ; vos lectures restent disponibles.',
  error: unavailable,
};

export function GET(request: Request) {
  return NextResponse.json({ available: isTarotOracleAvailable(process.env, request) }, { headers });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const input = await readOracleConclusionInput(request);
    if (!isTarotOracleAvailable(process.env, request)) return NextResponse.json({ mode: 'unavailable', reason: 'configuration', message: unavailable }, { status: 503, headers });
    const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const limit = consumeRateLimit(client);
    if (!limit.allowed) return NextResponse.json({ mode: 'unavailable', message: 'Patientez avant de demander une autre conclusion IA. Vos lectures locales restent disponibles.' }, { status: 429, headers: { ...headers, 'Retry-After': String(limit.retryAfter) } });
    const failure: { current?: SymbolicVisionFailure } = {};
    const reply = await requestOracleConclusion(input, { request, onFailure: value => { failure.current = value; } });
    if (!reply) {
      const reason = failure.current?.reason || 'error';
      return NextResponse.json({ mode: 'unavailable', reason, message: failureMessages[reason] }, { status: 503, headers });
    }
    return NextResponse.json({ mode: 'ai', reply }, { headers });
  } catch (error) {
    if (error instanceof OracleConclusionRequestError) return NextResponse.json({ mode: 'unavailable', message: error.message }, { status: error.status, headers });
    console.warn('ORACLE_CONCLUSION', { reason: 'error', durationMs: Math.max(0, Date.now() - startedAt) });
    return NextResponse.json({ mode: 'unavailable', reason: 'error', message: unavailable }, { status: 503, headers });
  }
}
