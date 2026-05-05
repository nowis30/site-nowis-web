import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { resetPayPalInvoiceLinkForTest } from '@/lib/server/paypal';

export const runtime = 'nodejs';

function ensureAdmin(request: NextRequest) {
  const guard = requireApiPermission(request, 'invoices', 'update');
  if (guard.error) return { error: guard.error, session: null as null };
  if (guard.session.role !== 'ADMIN') {
    return {
      error: NextResponse.json({ error: 'Action reservee a un administrateur.' }, { status: 403 }),
      session: null as null,
    };
  }
  return { error: null, session: guard.session };
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = ensureAdmin(request);
  if (admin.error) return admin.error;

  try {
    const item = await resetPayPalInvoiceLinkForTest(params.id, admin.session.sub);
    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reset PayPal impossible.';
    const status = message.includes('introuvable') ? 404 : message.includes('reserve') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}