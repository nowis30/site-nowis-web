import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { buildCustomerSnapshotFromContact, getBillingIssuerSnapshot, toCustomerSnapshot, toIssuerSnapshot } from '@/lib/billing-profile';
import { buildInvoicePdfBuffer } from '@/lib/invoice-pdf';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const guard = await requireApiPermission(request, 'invoices', 'read');
  if (guard.error) return guard.error;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      contact: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
  }

  // Match the saved issuer/customer profiles used by the email attachment.
  const businessProfile = toIssuerSnapshot(invoice.issuerSnapshot) || await getBillingIssuerSnapshot();
  const customerProfile = toCustomerSnapshot(invoice.customerSnapshot) || buildCustomerSnapshotFromContact(invoice.contact);
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
      contact: customerProfile,
    },
    businessProfile,
  );

  const disposition = request.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline';
  const filename = `facture-${invoice.number.replace(/[^A-Za-z0-9._-]/g, '_')}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

