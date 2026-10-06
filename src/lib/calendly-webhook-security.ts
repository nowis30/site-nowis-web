import { createHmac, timingSafeEqual } from 'crypto';

export const CALENDLY_MAX_BODY_BYTES = 256 * 1024;

/** Official t=timestamp,v1=HMAC-SHA256 scheme, with a five-minute replay window. */
export function verifyCalendlySignature(rawBody: string, header: string | null, signingKey: string, nowSeconds = Date.now() / 1000) {
  if (!header || !signingKey) return false;
  const fields = header.split(',').map(part => part.trim());
  const timestamps = fields.filter(part => part.startsWith('t=')).map(part => part.slice(2));
  const signatures = fields.filter(part => part.startsWith('v1=')).map(part => part.slice(3));
  if (timestamps.length !== 1 || !/^\d{9,16}$/.test(timestamps[0])) return false;
  const timestamp = Number(timestamps[0]);
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300) return false;
  const expected = createHmac('sha256', signingKey).update(`${timestamps[0]}.${rawBody}`).digest();
  return signatures.some(signature => /^[a-f0-9]{64}$/i.test(signature)
    && timingSafeEqual(expected, Buffer.from(signature, 'hex')));
}

export async function readCalendlyWebhookBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > CALENDLY_MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}
