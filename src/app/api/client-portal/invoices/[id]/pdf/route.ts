import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { buildCustomerSnapshotFromContact, getBillingIssuerSnapshot, toCustomerSnapshot, toIssuerSnapshot } from '@/lib/billing-profile';
import { buildInvoicePdfBuffer, safeInvoiceFilename } from '@/lib/invoice-pdf';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: params.id,
      contactId: session.contactId,
    },
    include: { contact: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
  }

  const businessProfile = toIssuerSnapshot(invoice.issuerSnapshot) || await getBillingIssuerSnapshot();
  const customer = toCustomerSnapshot(invoice.customerSnapshot) || buildCustomerSnapshotFromContact(invoice.contact);
  const pdf = await buildInvoicePdfBuffer(
    {
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      amount: invoice.amount.toString(),
      subtotal: invoice.subtotal?.toString() ?? null,
      taxAmount: invoice.taxAmount?.toString() ?? null,
      totalAmount: invoice.totalAmount?.toString() ?? null,
      taxesEnabled: invoice.taxesEnabled,
      taxRateGst: invoice.taxRateGst == null ? null : Number(invoice.taxRateGst),
      taxRateQst: invoice.taxRateQst == null ? null : Number(invoice.taxRateQst),
      description: invoice.description,
      contact: customer,
    },
    businessProfile,
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${safeInvoiceFilename(invoice.number)}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
