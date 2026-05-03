import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPublicQuoteToken } from '@/lib/public-links';

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const decoded = verifyPublicQuoteToken(params.token);
  if (!decoded) {
    return NextResponse.json({ error: 'Lien invalide ou expire.' }, { status: 401 });
  }

  const item = await prisma.commercialQuote.findUnique({
    where: { id: decoded.quoteId },
    include: {
      contact: { select: { id: true, fullName: true, email: true } },
      lines: { orderBy: { sortOrder: 'asc' } },
      convertedToInvoice: { select: { id: true, number: true, status: true } },
    },
  });

  if (!item) {
    return NextResponse.json({ error: 'Soumission introuvable.' }, { status: 404 });
  }

  if (decoded.contactId && item.contactId && decoded.contactId !== item.contactId) {
    return NextResponse.json({ error: 'Lien non autorise pour cette soumission.' }, { status: 403 });
  }

  return NextResponse.json({
    item: {
      ...item,
      subtotal: item.subtotal.toString(),
      taxAmount: item.taxAmount.toString(),
      totalAmount: item.totalAmount.toString(),
      lines: item.lines.map((line) => ({
        ...line,
        quantity: line.quantity.toString(),
        unitPrice: line.unitPrice.toString(),
        subtotal: line.subtotal.toString(),
      })),
    },
  });
}
