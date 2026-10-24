import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { FINANCE_ENTRY_STATUS_LABELS, FINANCE_PAYMENT_METHOD_LABELS } from '@/features/crm/finance/constants';
import { accountantSummary, buildAccountantCsv, type AccountantDetail, type LedgerLine } from '@/features/crm/finance/activity';

function toCsvValue(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function torontoDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function paymentLabel(method: string) {
  if (method in FINANCE_PAYMENT_METHOD_LABELS) {
    return FINANCE_PAYMENT_METHOD_LABELS[method as keyof typeof FINANCE_PAYMENT_METHOD_LABELS];
  }
  return method;
}

function statusLabel(status: string) {
  if (status in FINANCE_ENTRY_STATUS_LABELS) {
    return FINANCE_ENTRY_STATUS_LABELS[status as keyof typeof FINANCE_ENTRY_STATUS_LABELS];
  }
  return status;
}

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(request, 'finance', 'read');
  if (guard.error) return guard.error;

  const scope = request.nextUrl.searchParams.get('scope') || 'quarter';
  const format = request.nextUrl.searchParams.get('format');
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

  const [entries, payments] = await Promise.all([
    prisma.financeEntry.findMany({
      where: { entryDate: { gte: start } },
      include: { contact: { select: { fullName: true } }, invoice: { select: { number: true } } },
      orderBy: { entryDate: 'asc' },
    }),
    prisma.invoicePaymentHistory.findMany({
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
    }),
  ]);

  if (format === 'comptable') {
    const counted = entries.filter((entry) => entry.status !== 'CANCELLED');
    const ledger: LedgerLine[] = counted.map((entry) => ({
      kind: entry.kind,
      year: entry.entryDate.getFullYear(),
      month: entry.entryDate.getMonth(),
      category: entry.category,
      quantity: entry.quantity,
      amountBeforeTax: Number(entry.amountBeforeTax),
      taxAmount: Number(entry.taxAmount),
      totalAmount: Number(entry.totalAmount),
      status: entry.status,
    }));
    const summary = accountantSummary(ledger, start.getFullYear());
    const entryDetails: AccountantDetail[] = counted.map((entry) => ({
      kind: entry.kind,
      date: torontoDate(entry.entryDate),
      counterparty: entry.counterpartyName || entry.contact?.fullName || '',
      category: entry.category,
      description: entry.description || '',
      quantity: entry.quantity,
      amountBeforeTax: Number(entry.amountBeforeTax),
      taxAmount: Number(entry.taxAmount),
      totalAmount: Number(entry.totalAmount),
      paymentMethod: paymentLabel(entry.paymentMethod),
      status: statusLabel(entry.status),
      invoiceNumber: entry.invoice?.number || '',
    }));
    const paymentDetails: AccountantDetail[] = payments.map((payment) => ({
      kind: 'PAYMENT',
      date: torontoDate(payment.paidAt),
      counterparty: payment.invoice.contact?.fullName || '',
      category: 'INVOICE_PAYMENT',
      description: payment.note || 'Paiement facture',
      quantity: 1,
      amountBeforeTax: Number(payment.amount),
      taxAmount: 0,
      totalAmount: Number(payment.amount),
      paymentMethod: paymentLabel(payment.paymentMethod),
      status: 'Payé',
      invoiceNumber: payment.invoice.number,
    }));
    const csv = buildAccountantCsv(summary, [...entryDetails, ...paymentDetails], start.getFullYear());
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="rendu-comptable-${scope}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  }

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
