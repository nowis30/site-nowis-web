import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { getInvoiceBusinessProfile } from '@/lib/invoice-profile';
import { buildInvoicePdfBuffer } from '@/lib/invoice-pdf';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'invoices', 'read');
  if (guard.error) return guard.error;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      contact: {
        select: { fullName: true, email: true },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
  }

  const pdf = await buildInvoicePdfBuffer(
    {
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      amount: invoice.amount.toString(),
      description: invoice.description,
      contact: {
        fullName: invoice.contact.fullName,
        email: invoice.contact.email,
      },
    },
    getInvoiceBusinessProfile(),
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="facture-${invoice.number}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
