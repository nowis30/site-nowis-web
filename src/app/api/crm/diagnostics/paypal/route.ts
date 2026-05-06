import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { getPayPalDiagnostics, getPayPalInvoiceAdminDiagnostics, getPayPalMerchantEmailUsed } from '@/lib/server/paypal';

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
  const invoiceId = request.nextUrl.searchParams.get('invoiceId');
  const merchantEmailUsed = await getPayPalMerchantEmailUsed();

  let invoice = null;
  if (invoiceId) {
    try {
      invoice = await getPayPalInvoiceAdminDiagnostics(invoiceId);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Diagnostic PayPal impossible.' },
        { status: 404 },
      );
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_DOMAIN || null;

  return NextResponse.json({
    configured: diagnostics.configured,
    env: diagnostics.env,
    hasClientId: diagnostics.hasClientId,
    hasClientSecret: diagnostics.hasClientSecret,
    hasWebhookId: diagnostics.hasWebhookId,
    apiBaseUrl: diagnostics.apiBaseUrl,
    webhookUrlExpected: diagnostics.webhookUrlExpected,
    clientIdPreview: diagnostics.clientIdPreview,
    businessEmailConfigured: diagnostics.businessEmailConfigured,
    merchantEmailUsed,
    siteUrl,
    invoice,
  });
}