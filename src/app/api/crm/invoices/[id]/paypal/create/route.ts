import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { createPayPalInvoiceFromCrmInvoice } from '@/lib/server/paypal';

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
    const item = await createPayPalInvoiceFromCrmInvoice(params.id, admin.session.sub);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Creation PayPal impossible' },
      { status: 400 },
    );
  }
}
