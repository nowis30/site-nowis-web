/** Public first-contact guards; no authentication or contact-profile mutation. */
export const PUBLIC_INQUIRY_MAX_BYTES = 16_384;
export const PUBLIC_PROJECT_TYPES = ['chanson', 'atelier', 'video', 'autre'] as const;
export type PublicProjectType = (typeof PUBLIC_PROJECT_TYPES)[number];

export function publicInquiryOriginAllowed(origin: string | null, env: NodeJS.ProcessEnv = process.env): boolean {
  if (!origin) return false;
  let url: URL;
  try { url = new URL(origin); } catch { return false; }
  if (origin !== url.origin) return false;
  if (env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    return ['http:', 'https:'].includes(url.protocol);
  }
  const candidates = [env.NEXT_PUBLIC_SITE_URL, env.APP_URL, 'https://nowis.store', 'https://www.nowis.store'];
  if (env.VERCEL_ENV === 'preview') {
    for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL]) {
      if (host) candidates.push(`https://${host}`);
    }
  }
  return candidates.some((candidate) => {
    if (!candidate) return false;
    try { return new URL(candidate).origin === url.origin && url.protocol === 'https:'; } catch { return false; }
  });
}

/** Bound actual streamed bytes, not just the caller-controlled Content-Length. */
export async function readPublicInquiryBody(request: Request): Promise<string> {
  const length = request.headers.get('content-length');
  if (length && Number(length) > PUBLIC_INQUIRY_MAX_BYTES) throw new RangeError('BODY_TOO_LARGE');
  const reader = request.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > PUBLIC_INQUIRY_MAX_BYTES) {
        await reader.cancel();
        throw new RangeError('BODY_TOO_LARGE');
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}
