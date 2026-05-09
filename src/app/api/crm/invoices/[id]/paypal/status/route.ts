import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { getPayPalDiagnostics, getPayPalInvoiceStatus, serializePayPalApiError } from '@/lib/server/paypal';

export const runtime = 'nodejs';

function ensureAdmin(request: NextRequest) {
  const guard = requireApiPermission(request, 'invoices', 'read');
  if (guard.error) return { error: guard.error, session: null as null };
  if (guard.session.role !== 'ADMIN') {
    return {
      error: NextResponse.json({ error: 'Action reservee a un administrateur.' }, { status: 403 }),
      session: null as null,
    };
  }
  return { error: null, session: guard.session };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = ensureAdmin(request);
  if (admin.error) return admin.error;

  try {
    const item = await getPayPalInvoiceStatus(params.id, admin.session.sub);
    console.info('[PAYPAL_INVOICE_URL_SYNC]', {
      invoiceId: item.invoiceId,
      paypalInvoiceIdPresent: Boolean(item.paypalInvoiceId),
      paypalInvoiceUrlPresent: Boolean(item.paypalInvoiceUrl),
      env: getPayPalDiagnostics().env,
    });
    return NextResponse.json({ item });
  } catch (error) {
    const serialized = serializePayPalApiError(error, 'Verification PayPal impossible');
    return NextResponse.json(serialized.body, { status: serialized.status });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return GET(request, { params });
}
