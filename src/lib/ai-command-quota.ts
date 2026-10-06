import { aiAbuseLimits, type AiAbuseResult } from '@/lib/ai-abuse-limits';
import { NextResponse } from 'next/server';
import { getAssistantIdentity } from '@/lib/site-assistant-identity';
import { consumeAssistantQuota, readAssistantQuota, type AssistantQuota } from '@/lib/site-assistant-quota';

const headers = { 'Cache-Control': 'no-store', Vary: 'Cookie' };
const loginUrl = '/connexion?next=%2Ftarot';
const limitMessage = 'Vous avez atteint vos 20 commandes IA aujourd’hui. Réessayez après minuit, heure de Toronto. Vos lectures locales restent accessibles.';
const quotaUnavailable = () => NextResponse.json({ mode: 'unavailable', reason: 'QUOTA_UNAVAILABLE',
  message: 'Le contrôle des commandes IA est momentanément indisponible. Vos lectures locales restent accessibles.' }, { status: 503, headers });
type Dependencies = {
  burst?(identity: string): Promise<AiAbuseResult>;
  global?(): Promise<AiAbuseResult>;
  identity: typeof getAssistantIdentity;
  consume: typeof consumeAssistantQuota;
  read: typeof readAssistantQuota;
};

/** Every provider-backed feature shares the same durable account/day counter. */
export function createAiCommandQuota(deps: Dependencies = { identity: getAssistantIdentity, consume: consumeAssistantQuota, read: readAssistantQuota, burst: aiAbuseLimits.burst, global: aiAbuseLimits.global }) {
  return {
    async status(request: Request, providerAvailable: boolean) {
      try {
        const identity = await deps.identity(request);
        if (!identity) return NextResponse.json({ available: false, reason: 'AUTH_REQUIRED', loginUrl, quota: null }, { headers });
        const quota = await deps.read(identity);
        return NextResponse.json({ available: providerAvailable && quota.remaining > 0,
          reason: quota.remaining === 0 ? 'ASSISTANT_DAILY_LIMIT' : providerAvailable ? null : 'configuration',
          ...(quota.remaining === 0 ? { message: limitMessage } : {}), quota }, { headers });
      } catch {
        return NextResponse.json({ available: false, reason: 'QUOTA_UNAVAILABLE', message: 'Le contrôle des commandes IA est momentanément indisponible. Vos lectures locales restent accessibles.' }, { status: 503, headers });
      }
    },
    async reserve(request: Request, providerAvailable: boolean, validateBeforeReservation?: () => void): Promise<{ quota: AssistantQuota; response?: never } | { response: NextResponse; quota?: never }> {
      let identity: string | null;
      try { identity = await deps.identity(request); }
      catch { return { response: quotaUnavailable() }; }
      if (!identity) return { response: NextResponse.json({ mode: 'unavailable', reason: 'AUTH_REQUIRED', code: 'AUTH_REQUIRED',
        message: 'Connectez-vous pour utiliser la vision ou la conclusion IA. Vos lectures locales restent accessibles.', loginUrl }, { status: 401, headers }) };
      if (!providerAvailable) return { response: NextResponse.json({ mode: 'unavailable', reason: 'configuration',
        message: 'Le service IA est indisponible pour le moment. Vos lectures locales restent accessibles.' }, { status: 503, headers }) };
      // Domain validation may throw its ordinary 400 error. Run it only for an
      // authenticated account, and before charging its command allowance.
      validateBeforeReservation?.();
      try {
        const blocked = (guard: AiAbuseResult) => !guard.allowed ? { response: NextResponse.json({ mode: 'unavailable', reason: guard.code, code: guard.code, message: 'Trop de commandes IA. Vos lectures locales restent accessibles.' }, { status: 429, headers: { ...headers, 'Retry-After': String(guard.retryAfterSeconds) } }) } : null;
        const burst = await deps.burst?.(identity);
        if (burst) { const result = blocked(burst); if (result) return result; }
        const reservation = await deps.consume(identity);
        if (!reservation.allowed) return { response: NextResponse.json({ mode: 'unavailable', reason: 'ASSISTANT_DAILY_LIMIT', code: 'ASSISTANT_DAILY_LIMIT',
          message: limitMessage, quota: reservation.quota }, { status: 429, headers: { ...headers,
          'Retry-After': String(Math.max(1, Math.ceil((Date.parse(reservation.quota.resetAt) - Date.now()) / 1000))) } }) };
        const global = await deps.global?.();
        if (global) { const result = blocked(global); if (result) return result; }
        return { quota: reservation.quota };
      } catch {
        return { response: quotaUnavailable() };
      }
    },
  };
}
