import { NextResponse } from 'next/server';
import { z } from 'zod';
import { publicInquiryOriginAllowed, readPublicInquiryBody } from '@/lib/public-inquiry-security';
import type { AssistantQuota } from '@/lib/site-assistant-quota';

const schema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(1200) }).strict()).min(1).max(8),
  pathname: z.string().max(160).regex(/^\/(?!\/)[^\r\n?#\\]*$/).optional(),
}).strict().refine(body => body.messages[body.messages.length - 1]?.role === 'user');

type Dependencies = {
  identity(request: Request): Promise<string | null>;
  read(identifier: string): Promise<AssistantQuota>;
  consume(identifier: string): Promise<{ allowed: boolean; quota: AssistantQuota }>;
  reply(input: { transcript: string; pathname: string }): Promise<string | null>;
  fallback(message: string): string;
};

function json(data: unknown, status = 200, retryAfter?: number) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', Vary: 'Cookie',
    ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}) } });
}
const authRequired = () => json({ code: 'AUTH_REQUIRED', error: 'Connectez-vous pour utiliser vos 20 commandes par jour.' }, 401);
const unavailable = () => json({ code: 'ASSISTANT_UNAVAILABLE', error: 'L’assistant est momentanément indisponible. Réessayez plus tard. Les raccourcis restent disponibles.' }, 503);

export function createAssistantHandlers(deps: Dependencies) {
  return {
    async GET(request: Request) {
      try {
        const identity = await deps.identity(request);
        if (!identity) return authRequired();
        return json({ quota: await deps.read(identity) });
      } catch {
        console.error('[SITE_ASSISTANT] Status unavailable');
        return unavailable();
      }
    },
    async POST(request: Request) {
      if (!publicInquiryOriginAllowed(request.headers.get('origin')) || request.headers.get('sec-fetch-site') === 'cross-site') {
        return json({ code: 'INVALID_ORIGIN', error: 'Cette demande doit provenir du site NOWIS.' }, 403);
      }
      if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
        return json({ code: 'INVALID_CONTENT_TYPE', error: 'Format de demande invalide.' }, 415);
      }
      let parsed: z.infer<typeof schema>;
      try {
        const value = schema.safeParse(JSON.parse(await readPublicInquiryBody(request)));
        if (!value.success) return json({ code: 'INVALID_MESSAGE', error: 'Message invalide. Envoyez une question de 1 à 1 200 caractères.' }, 400);
        parsed = value.data;
      } catch (error) {
        return json({ code: error instanceof RangeError ? 'BODY_TOO_LARGE' : 'INVALID_MESSAGE',
          error: 'La demande est invalide ou trop longue.' }, error instanceof RangeError ? 413 : 400);
      }
      try {
        const identity = await deps.identity(request);
        if (!identity) return authRequired();
        // Reserve before *any* provider call. Storage errors fail closed; no in-memory fallback.
        const reservation = await deps.consume(identity);
        if (!reservation.allowed) {
          const retryAfter = Math.max(1, Math.ceil((Date.parse(reservation.quota.resetAt) - Date.now()) / 1000));
          return json({ code: 'ASSISTANT_DAILY_LIMIT', error: 'Vous avez atteint vos 20 commandes aujourd’hui. Réessayez après minuit, heure de Toronto.',
            quota: reservation.quota }, 429, retryAfter);
        }
        const transcript = parsed.messages.map(message => `${message.role === 'assistant' ? 'Assistant' : 'Visiteur'}: ${message.content}`).join('\n');
        let reply: string | null = null;
        try { reply = await deps.reply({ transcript, pathname: parsed.pathname || '/' }); }
        catch { console.error('[SITE_ASSISTANT] Provider unavailable'); }
        return json({ reply: reply || deps.fallback(parsed.messages[parsed.messages.length - 1].content),
          mode: reply ? 'ai' : 'navigation', quota: reservation.quota });
      } catch {
        console.error('[SITE_ASSISTANT] Reservation unavailable');
        return unavailable();
      }
    },
  };
}
