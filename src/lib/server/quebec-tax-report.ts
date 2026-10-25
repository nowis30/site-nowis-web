import { prisma } from '@/lib/prisma';
import { getBillingIssuerSnapshot } from '@/lib/billing-profile';
import {
  currentQuarterBounds,
  quebecPartnerReadiness,
  quebecPeriodRange,
  summarizeQuebecTaxes,
  type FilingInvoice,
} from '@/lib/quebec-fiscal';

export async function loadQuebecTaxReport(from?: string | null, to?: string | null) {
  const defaults = currentQuarterBounds();
  const period = quebecPeriodRange(from || defaults.from, to || defaults.to);
  const profile = await getBillingIssuerSnapshot();
  const invoices = await prisma.invoice.findMany({
    where: {
      deletedAt: null,
      isTest: false,
      status: { in: ['SENT', 'PAID', 'OVERDUE', 'ARCHIVED'] },
      issueDate: { gte: period.start, lt: period.end },
    },
    orderBy: [{ issueDate: 'asc' }, { number: 'asc' }],
    select: {
      number: true,
      issueDate: true,
      status: true,
      amount: true,
      subtotal: true,
      taxAmount: true,
      totalAmount: true,
      taxesEnabled: true,
      taxRateGst: true,
      taxRateQst: true,
      isTest: true,
    },
  });

  const summary = summarizeQuebecTaxes(invoices.map((invoice): FilingInvoice => ({
    number: invoice.number,
    issueDate: invoice.issueDate,
    status: invoice.status,
    isTest: invoice.isTest,
    amount: invoice.amount.toString(),
    subtotal: invoice.subtotal?.toString() ?? null,
    taxAmount: invoice.taxAmount?.toString() ?? null,
    totalAmount: invoice.totalAmount?.toString() ?? null,
    taxesEnabled: invoice.taxesEnabled,
    taxRateGst: invoice.taxRateGst?.toString() ?? null,
    taxRateQst: invoice.taxRateQst?.toString() ?? null,
  })));

  return {
    period,
    readiness: quebecPartnerReadiness(profile),
    profile: {
      companyName: profile.companyName,
      neq: profile.neq || null,
      gstNumber: profile.gstNumber || null,
      qstNumber: profile.qstNumber || null,
      taxesEnabled: profile.taxesEnabled,
    },
    summary,
  };
}
