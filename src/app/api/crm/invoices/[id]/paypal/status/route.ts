import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { getPayPalInvoiceStatus } from '@/lib/server/paypal';

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
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification PayPal impossible' },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return GET(request, { params });
}
