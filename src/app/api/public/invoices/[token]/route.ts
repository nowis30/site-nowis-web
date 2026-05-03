import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPublicInvoiceToken } from '@/lib/public-links';

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const decoded = verifyPublicInvoiceToken(params.token);
  if (!decoded) {
    return NextResponse.json({ error: 'Lien invalide ou expire.' }, { status: 401 });
  }

  const item = await prisma.invoice.findUnique({
    where: { id: decoded.invoiceId },
    include: {
      contact: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          companyName: true,
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 });
  }

  if (item.contactId !== decoded.contactId) {
    return NextResponse.json({ error: 'Lien non autorise pour cette facture.' }, { status: 403 });
  }

  return NextResponse.json({
    item: {
      ...item,
      issueDate: item.issueDate.toISOString(),
      dueDate: item.dueDate.toISOString(),
      amount: item.amount.toString(),
      paymentAmount: item.paymentAmount?.toString() || null,
      paypalSentAt: item.paypalSentAt?.toISOString() || null,
      paypalPaidAt: item.paypalPaidAt?.toISOString() || null,
      paypalLastWebhookAt: item.paypalLastWebhookAt?.toISOString() || null,
    },
  });
}
