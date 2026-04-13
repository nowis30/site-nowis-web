type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function now() {
  return Date.now();
}

function cleanupExpiredEntries(currentTime: number) {
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= currentTime) {
      store.delete(key);
    }
  }
}

export function getRequestClientIp(headers: Headers) {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return headers.get('x-real-ip') || 'unknown';
}

export function sanitizeRateLimitIdentifier(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9@._:-]/g, '_');
}

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const currentTime = now();
  cleanupExpiredEntries(currentTime);

  const existing = store.get(key);

  if (!existing || existing.resetAt <= currentTime) {
    const resetAt = currentTime + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - currentTime) / 1000)),
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - currentTime) / 1000)),
  };
}