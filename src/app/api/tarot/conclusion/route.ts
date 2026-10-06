import { NextResponse } from 'next/server';
import { isTarotOracleAvailable, type SymbolicVisionFailure, type SymbolicVisionFailureReason } from '@/lib/tarot-oracle';
import { OracleConclusionRequestError, readOracleConclusionInput, requestOracleConclusion, buildOracleConclusionContext } from '@/lib/oracle-conclusion';
import { createAiCommandQuota } from '@/lib/ai-command-quota';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const commands = createAiCommandQuota();
const headers = { 'Cache-Control': 'no-store', Vary: 'Cookie' };
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
  return commands.status(request, isTarotOracleAvailable(process.env, request));
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const input = await readOracleConclusionInput(request);
    const reservation = await commands.reserve(request, isTarotOracleAvailable(process.env, request), () => { buildOracleConclusionContext(input); });
    if (reservation.response) return reservation.response;
    const failure: { current?: SymbolicVisionFailure } = {};
    const reply = await requestOracleConclusion(input, { request, onFailure: value => { failure.current = value; } });
    if (!reply) {
      const reason = failure.current?.reason || 'error';
      return NextResponse.json({ mode: 'unavailable', reason, message: failureMessages[reason], quota: reservation.quota }, { status: 503, headers });
    }
    return NextResponse.json({ mode: 'ai', reply, quota: reservation.quota }, { headers });
  } catch (error) {
    if (error instanceof OracleConclusionRequestError) return NextResponse.json({ mode: 'unavailable', message: error.message }, { status: error.status, headers });
    console.warn('ORACLE_CONCLUSION', { reason: 'error', durationMs: Math.max(0, Date.now() - startedAt) });
    return NextResponse.json({ mode: 'unavailable', reason: 'error', message: unavailable }, { status: 503, headers });
  }
}
