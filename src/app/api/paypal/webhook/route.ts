import { NextRequest } from 'next/server';
import { handlePayPalWebhookRequest } from '@/lib/server/paypal-webhook';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return handlePayPalWebhookRequest(request);
}
