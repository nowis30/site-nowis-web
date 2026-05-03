import { NextRequest, NextResponse } from 'next/server';
import {
  extractPayPalInvoiceIdFromWebhookEvent,
  syncPayPalInvoiceStatusByPayPalInvoiceId,
  verifyPayPalWebhookSignature,
} from '@/lib/server/paypal';

export const runtime = 'nodejs';

const SUPPORTED_EVENTS = new Set([
  'INVOICING.INVOICE.PAID',
  'INVOICING.INVOICE.CANCELLED',
  'INVOICING.INVOICE.REFUNDED',
  'INVOICING.INVOICE.UPDATED',
]);

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const verification = await verifyPayPalWebhookSignature(request, rawBody);

    if (!verification.isValid) {
      return NextResponse.json({ error: 'Signature PayPal invalide.' }, { status: 400 });
    }

    const eventType = typeof verification.event.event_type === 'string' ? verification.event.event_type : null;
    const paypalInvoiceId = extractPayPalInvoiceIdFromWebhookEvent(verification.event);

    if (!eventType || !SUPPORTED_EVENTS.has(eventType)) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'unsupported_event' });
    }

    if (!paypalInvoiceId) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'missing_paypal_invoice_id' });
    }

    const item = await syncPayPalInvoiceStatusByPayPalInvoiceId(paypalInvoiceId, {
      webhookEventType: eventType,
      markWebhookAt: true,
    });

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    console.error('[PAYPAL_WEBHOOK]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook PayPal impossible' },
      { status: 500 },
    );
  }
}
