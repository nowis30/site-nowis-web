import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const USER_LIMIT = { scope: 'contact:user', max: 5, windowMs: 10 * 60 * 1000 } as const;
const IP_LIMIT = { scope: 'contact:ip', max: 20, windowMs: 60 * 60 * 1000 } as const;

type RateLimitScope = typeof USER_LIMIT.scope | typeof IP_LIMIT.scope;

type ConsumeArgs = {
  scope: RateLimitScope;
  identifier: string;
  max: number;
  windowMs: number;
};

type ConsumeResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type ConsumeFn = (args: ConsumeArgs) => Promise<ConsumeResult>;

export type ContactRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; message: string };

function getWindowStart(date: Date, windowMs: number) {
  return new Date(Math.floor(date.getTime() / windowMs) * windowMs);
}

function getRequestClientIp(headers: Headers) {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  return headers.get('x-real-ip') || 'unknown';
}

function sanitizeIdentifier(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9@._:-]/g, '_').slice(0, 160);
}

export async function consumeContactRateLimit({ scope, identifier, max, windowMs }: ConsumeArgs): Promise<ConsumeResult> {
  const now = new Date();
  const windowStart = getWindowStart(now, windowMs);
  const resetAt = new Date(windowStart.getTime() + windowMs);

  const runAttempt = async () => prisma.$transaction(async (tx) => {
    const existing = await tx.apiRateLimit.findUnique({
      where: {
        scope_identifier_windowStart: {
          scope,
          identifier,
          windowStart,
        },
      },
    });

    if (!existing) {
      await tx.apiRateLimit.create({
        data: {
          scope,
          identifier,
          windowStart,
          windowSeconds: Math.ceil(windowMs / 1000),
          count: 1,
          resetAt,
        },
      });

      return {
        allowed: true,
        remaining: Math.max(0, max - 1),
        retryAfterSeconds: Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000)),
      } satisfies ConsumeResult;
    }

    if (existing.count >= max) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000)),
      } satisfies ConsumeResult;
    }

    const updated = await tx.apiRateLimit.update({
      where: { id: existing.id },
      data: { count: { increment: 1 } },
      select: { count: true, resetAt: true },
    });

    return {
      allowed: true,
      remaining: Math.max(0, max - updated.count),
      retryAfterSeconds: Math.max(1, Math.ceil((updated.resetAt.getTime() - now.getTime()) / 1000)),
    } satisfies ConsumeResult;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await runAttempt();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2) {
        continue;
      }
      throw error;
    }
  }

  return {
    allowed: false,
    remaining: 0,
    retryAfterSeconds: Math.ceil(windowMs / 1000),
  };
}

export function createContactRateLimiter(consumeFn: ConsumeFn = consumeContactRateLimit) {
  return async (input: {
  userId: string;
  headers: Headers;
}): Promise<ContactRateLimitResult> => {
    const userId = sanitizeIdentifier(input.userId);
    const ipAddress = sanitizeIdentifier(getRequestClientIp(input.headers));

    const userResult = await consumeFn({
      scope: USER_LIMIT.scope,
      identifier: userId,
      max: USER_LIMIT.max,
      windowMs: USER_LIMIT.windowMs,
    });

    if (!userResult.allowed) {
      return {
        allowed: false,
        retryAfterSeconds: userResult.retryAfterSeconds,
        message: 'Trop de demandes envoyees. Reessayez dans quelques minutes.',
      };
    }

    const ipResult = await consumeFn({
      scope: IP_LIMIT.scope,
      identifier: ipAddress,
      max: IP_LIMIT.max,
      windowMs: IP_LIMIT.windowMs,
    });

    if (!ipResult.allowed) {
      return {
        allowed: false,
        retryAfterSeconds: ipResult.retryAfterSeconds,
        message: 'Limite temporaire atteinte pour cette adresse IP. Reessayez plus tard.',
      };
    }

    // Nettoyage opportuniste des anciennes entrees sans impact utilisateur.
    if (Math.random() < 0.02) {
      await prisma.apiRateLimit.deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }).catch(() => undefined);
    }

    return { allowed: true };
  };
}

export const enforceContactRateLimit = createContactRateLimiter();