import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  parseCompactPublicInvoiceToken,
  verifyCompactPublicInvoiceToken,
  verifyPublicInvoiceToken,
} from '@/lib/public-links';

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const decoded = verifyPublicInvoiceToken(params.token);
  const compact = decoded ? null : parseCompactPublicInvoiceToken(params.token);

  const item = decoded
    ? await prisma.invoice.findUnique({
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
      })
    : compact
      ? await prisma.invoice.findUnique({
          where: { number: compact.invoiceNumber },
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
        })
      : null;

  if (!decoded && !compact) {
    return NextResponse.json({ error: 'Lien invalide ou expire.' }, { status: 401 });
  }

  if (!item) {
    return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 });
  }

  if (decoded) {
    if (item.contactId !== decoded.contactId) {
      return NextResponse.json({ error: 'Lien non autorise pour cette facture.' }, { status: 403 });
    }
  } else if (
    !verifyCompactPublicInvoiceToken(params.token, {
      invoiceId: item.id,
      invoiceNumber: item.number,
      contactId: item.contactId,
    })
  ) {
    return NextResponse.json({ error: 'Lien invalide ou expire.' }, { status: 401 });
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
