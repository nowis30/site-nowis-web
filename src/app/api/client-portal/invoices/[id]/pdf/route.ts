import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientPortalSessionFromCookieHeader } from '@/features/client-portal/auth/session';
import { getInvoiceBusinessProfile } from '@/lib/invoice-profile';
import { buildInvoicePdfBuffer } from '@/lib/invoice-pdf';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getClientPortalSessionFromCookieHeader(request.headers.get('cookie') ?? undefined);
  if (!session) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: params.id,
      contactId: session.contactId,
    },
    include: {
      contact: {
        select: {
          fullName: true,
          email: true,
        },
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
