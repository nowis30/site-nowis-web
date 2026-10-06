import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  parseCompactPublicInvoiceToken,
  verifyCompactPublicInvoiceToken,
  verifyPublicInvoiceToken,
} from '@/lib/public-links';

export async function GET(_request: NextRequest, props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
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
      number: item.number,
      status: item.status,
      description: item.description,
      paypalInvoiceUrl: item.paypalInvoiceUrl,
      paypalStatus: item.paypalStatus,
      paymentStatus: item.paymentStatus,
      paymentProvider: item.paymentProvider,
      paymentCurrency: item.paymentCurrency,
      contact: { fullName: item.contact.fullName, email: item.contact.email },
      customerSnapshot: getPublicCustomerSnapshot(item.customerSnapshot),
      issueDate: item.issueDate.toISOString(),
      dueDate: item.dueDate.toISOString(),
      amount: item.amount.toString(),
      paymentAmount: item.paymentAmount?.toString() || null,
      paypalPaidAt: item.paypalPaidAt?.toISOString() || null,
    },
  }, { headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
}

function getPublicCustomerSnapshot(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  const source = snapshot as Record<string, unknown>;
  return Object.fromEntries(['fullName', 'companyName', 'email', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country']
    .map(key => [key, typeof source[key] === 'string' ? source[key] : null]));
}
