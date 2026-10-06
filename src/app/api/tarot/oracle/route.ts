import { NextResponse } from 'next/server';
import {
  isTarotOracleAvailable, readTarotOracleInput,
  requestTarotOracleVision, TarotOracleRequestError,
} from '@/lib/tarot-oracle';
import { createAiCommandQuota } from '@/lib/ai-command-quota';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const commands = createAiCommandQuota();
const unavailable = 'La vision IA est indisponible pour le moment. Votre lecture symbolique locale reste accessible.';
const headers = { 'Cache-Control': 'no-store', Vary: 'Cookie' };

export function GET(request: Request) {
  return commands.status(request, isTarotOracleAvailable(process.env, request));
}

export async function POST(request: Request) {
  try {
    const input = await readTarotOracleInput(request);
    const reservation = await commands.reserve(request, isTarotOracleAvailable(process.env, request));
    if (reservation.response) return reservation.response;
    const reply = await requestTarotOracleVision(input, { request });
    if (!reply) return NextResponse.json({ mode: 'unavailable', message: unavailable, quota: reservation.quota }, { status: 503, headers });
    return NextResponse.json({ mode: 'ai', reply, quota: reservation.quota }, { headers });
  } catch (error) {
    if (error instanceof TarotOracleRequestError) return NextResponse.json({ mode: 'unavailable', message: error.message }, { status: error.status, headers });
    return NextResponse.json({ mode: 'unavailable', message: unavailable }, { status: 503, headers });
  }
}
