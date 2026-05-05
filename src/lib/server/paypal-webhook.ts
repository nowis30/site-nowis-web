import { NextRequest, NextResponse } from 'next/server';
import {
  extractPayPalInvoiceIdFromWebhookEvent,
  serializePayPalApiError,
  syncPayPalInvoiceStatusByPayPalInvoiceId,
  verifyPayPalWebhookSignature,
} from '@/lib/server/paypal';

const SUPPORTED_EVENTS = new Set([
  'INVOICING.INVOICE.CREATED',
  'INVOICING.INVOICE.PAID',
  'INVOICING.INVOICE.CANCELLED',
  'INVOICING.INVOICE.UPDATED',
]);

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
    const rawBody = await request.text();
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

    const item = await syncStatus(paypalInvoiceId, {
      webhookEventType: eventType,
      markWebhookAt: true,
    });

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    console.error('[PAYPAL_WEBHOOK]', error);
    const serialized = serializePayPalApiError(error, 'Webhook PayPal impossible');
    return NextResponse.json(serialized.body, { status: serialized.status === 400 ? 500 : serialized.status });
  }
}