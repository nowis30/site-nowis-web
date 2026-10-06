import { isIP } from 'node:net';

/** Only Vercel's overwritten edge header is trusted; arbitrary forwarding headers are not identity. */
export function getTrustedClientIp(headers: Headers, env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.VERCEL !== '1') return env.NODE_ENV === 'production' ? null : '127.0.0.1';
  const value = headers.get('x-vercel-forwarded-for')?.trim();
  if (!value || !isIP(value)) return null;
  if (isIP(value) === 4) return value;
  // Canonicalize IPv6 so equivalent textual representations share the same counter.
  return new URL(`http://[${value}]/`).hostname.slice(1, -1).toLowerCase();
}
