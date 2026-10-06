import { createHash } from 'node:crypto';
import { consumeContactRateLimit } from '@/lib/contact-rate-limit';
export type AiAbuseResult = { allowed: true } | { allowed: false; code: 'AI_BURST_LIMIT' | 'AI_GLOBAL_LIMIT'; retryAfterSeconds: number };
export function createAiAbuseLimits(consume: typeof consumeContactRateLimit = consumeContactRateLimit, env: NodeJS.ProcessEnv = process.env) {
  return {
    async burst(identity: string): Promise<AiAbuseResult> {
      const result = await consume({ scope: 'ai-command:burst', identifier: createHash('sha256').update(identity).digest('hex'), max: 5, windowMs: 60_000 });
      return result.allowed ? { allowed: true } : { allowed: false, code: 'AI_BURST_LIMIT', retryAfterSeconds: result.retryAfterSeconds };
    },
    async global(): Promise<AiAbuseResult> {
      const max = Number(env.AI_GLOBAL_DAILY_COMMAND_LIMIT ?? '500');
      if (!Number.isSafeInteger(max) || max < 1 || max > 100_000) throw new Error('AI_GLOBAL_LIMIT_INVALID');
      const result = await consume({ scope: 'ai-command:global', identifier: 'all-provider-features', max, windowMs: 24 * 60 * 60_000 });
      return result.allowed ? { allowed: true } : { allowed: false, code: 'AI_GLOBAL_LIMIT', retryAfterSeconds: result.retryAfterSeconds };
    },
  };
}
export const aiAbuseLimits = createAiAbuseLimits();
