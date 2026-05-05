import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { getPayPalDiagnostics } from '@/lib/server/paypal';

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

export async function GET(request: NextRequest) {
  const admin = ensureAdmin(request);
  if (admin.error) return admin.error;

  const diagnostics = getPayPalDiagnostics();

  return NextResponse.json({
    configured: diagnostics.configured,
    env: diagnostics.env,
    hasClientId: diagnostics.hasClientId,
    hasClientSecret: diagnostics.hasClientSecret,
    hasWebhookId: diagnostics.hasWebhookId,
    apiBaseUrl: diagnostics.apiBaseUrl,
    webhookUrlExpected: diagnostics.webhookUrlExpected,
  });
}