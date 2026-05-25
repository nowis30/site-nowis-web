import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

function toCsvValue(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'finance', 'read');
  if (guard.error) return guard.error;

  const scope = request.nextUrl.searchParams.get('scope') || 'quarter';
  const now = new Date();
  const start = new Date(now);
  if (scope === 'year') {
    start.setMonth(0, 1);
  } else if (scope === 'month') {
    start.setDate(1);
  } else {
    const month = start.getMonth();
    const quarterStartMonth = month - (month % 3);
    start.setMonth(quarterStartMonth, 1);
  }
  start.setHours(0, 0, 0, 0);

  const entries = await prisma.financeEntry.findMany({
    where: { entryDate: { gte: start } },
    include: { contact: { select: { fullName: true } }, invoice: { select: { number: true } } },
    orderBy: { entryDate: 'asc' },
  });

  const payments = await prisma.invoicePaymentHistory.findMany({
    where: { paidAt: { gte: start } },
    include: {
      invoice: {
        select: {
          number: true,
          contact: { select: { fullName: true } },
        },
      },
    },
    orderBy: { paidAt: 'asc' },
  });

  const header = [
    'kind',
    'date',
    'counterparty',
    'category',
    'description',
    'quantity',
    'amountBeforeTax',
    'taxAmount',
    'totalAmount',
    'paymentMethod',
    'status',
    'invoiceNumber',
  ];

  const entryRows = entries.map((entry) => ({
    date: entry.entryDate,
    row: [
      entry.kind,
      entry.entryDate.toISOString(),
      entry.counterpartyName || entry.contact?.fullName || '',
      entry.category,
      entry.description || '',
      entry.quantity,
      entry.amountBeforeTax.toString(),
      entry.taxAmount.toString(),
      entry.totalAmount.toString(),
      entry.paymentMethod,
      entry.status,
      entry.invoice?.number || '',
    ],
  }));

  const paymentRows = payments.map((payment) => ({
    date: payment.paidAt,
    row: [
      'PAYMENT',
      payment.paidAt.toISOString(),
      payment.invoice.contact?.fullName || '',
      'INVOICE_PAYMENT',
      payment.note || 'Paiement facture',
      1,
      payment.amount.toString(),
      '0',
      payment.amount.toString(),
      payment.paymentMethod,
      'PAID',
      payment.invoice.number,
    ],
  }));

  const rows = [...entryRows, ...paymentRows]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((item) => item.row);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => toCsvValue(value)).join(','))
    .join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rapport-finance-${scope}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
