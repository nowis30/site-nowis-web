import { NextRequest, NextResponse } from 'next/server';
import {
  extractPayPalInvoiceIdFromWebhookEvent,
  syncPayPalInvoiceStatusByPayPalInvoiceId,
  verifyPayPalWebhookSignature,
} from '@/lib/server/paypal';

const SUPPORTED_EVENTS = new Set([
  'INVOICING.INVOICE.CREATED',
  'INVOICING.INVOICE.PAID',
  'INVOICING.INVOICE.CANCELLED',
  'INVOICING.INVOICE.UPDATED',
]);

export const PAYPAL_MAX_WEBHOOK_BODY_BYTES = 128 * 1024;

async function readWebhookBody(request: NextRequest) {
  const advertisedLength = Number(request.headers.get('content-length') || 0);
  if (advertisedLength > PAYPAL_MAX_WEBHOOK_BODY_BYTES) {
    await request.body?.cancel().catch(() => undefined);
    return null;
  }
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > PAYPAL_MAX_WEBHOOK_BODY_BYTES) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function hasSignatureHeaders(request: NextRequest) {
  return ['paypal-transmission-id', 'paypal-transmission-time', 'paypal-cert-url', 'paypal-auth-algo', 'paypal-transmission-sig']
    .every(name => { const value = request.headers.get(name); return value && value.length <= 4096; });
}

export async function handlePayPalWebhookRequest(
  request: NextRequest,
  deps: {
    verifySignature?: typeof verifyPayPalWebhookSignature;
    extractInvoiceId?: typeof extractPayPalInvoiceIdFromWebhookEvent;
    syncStatus?: typeof syncPayPalInvoiceStatusByPayPalInvoiceId;
  } = {},
) {
  const verifySignature = deps.verifySignature ?? verifyPayPalWebhookSignature;
  const extractInvoiceId = deps.extractInvoiceId ?? extractPayPalInvoiceIdFromWebhookEvent;
  const syncStatus = deps.syncStatus ?? syncPayPalInvoiceStatusByPayPalInvoiceId;

  try {
    const rawBody = await readWebhookBody(request);
    if (rawBody === null) return NextResponse.json({ error: 'Payload trop volumineux.' }, { status: 413 });
    if (!hasSignatureHeaders(request)) return NextResponse.json({ error: 'Signature PayPal invalide.' }, { status: 400 });
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid payload');
    } catch {
      return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 });
    }
    const verification = await verifySignature(request, rawBody);

    if (!verification.isValid) {
      return NextResponse.json({ error: 'Signature PayPal invalide.' }, { status: 400 });
    }

    const eventType = typeof verification.event.event_type === 'string' ? verification.event.event_type : null;
    const paypalInvoiceId = extractInvoiceId(verification.event);

    if (!eventType || !SUPPORTED_EVENTS.has(eventType)) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'unsupported_event' });
    }

    if (!paypalInvoiceId) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'missing_paypal_invoice_id' });
    }

    await syncStatus(paypalInvoiceId, {
      webhookEventType: eventType,
      markWebhookAt: true,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[PAYPAL_WEBHOOK]', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'Webhook PayPal temporairement indisponible.' }, { status: 503 });
  }
}
