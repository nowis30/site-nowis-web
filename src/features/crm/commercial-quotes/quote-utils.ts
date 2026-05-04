import { prisma } from '@/lib/prisma';

type QuoteLineInput = {
  title: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
  sortOrder: number;
};

const DEFAULT_GST = 0.05;
const DEFAULT_QST = 0.09975;

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getTaxRates(options?: { gst?: number; qst?: number; taxesEnabled?: boolean }) {
  const gst = Number(options?.gst ?? process.env.CRM_TAX_GST_RATE ?? DEFAULT_GST);
  const qst = Number(options?.qst ?? process.env.CRM_TAX_QST_RATE ?? DEFAULT_QST);
  const taxesEnabled = options?.taxesEnabled ?? true;

  return {
    gst: Number.isFinite(gst) && gst >= 0 ? gst : DEFAULT_GST,
    qst: Number.isFinite(qst) && qst >= 0 ? qst : DEFAULT_QST,
    taxesEnabled,
  };
}

export function computeQuoteTotals(lines: QuoteLineInput[], options?: { gst?: number; qst?: number; taxesEnabled?: boolean }) {
  const normalizedLines = lines.map((line, index) => {
    const quantity = Number(line.quantity || 0);
    const unitPrice = Number(line.unitPrice || 0);
    const subtotal = roundMoney(quantity * unitPrice);
    return {
      ...line,
      quantity,
      unitPrice,
      subtotal,
      sortOrder: Number.isInteger(line.sortOrder) ? line.sortOrder : index,
    };
  });

  const subtotal = roundMoney(normalizedLines.reduce((sum, line) => sum + line.subtotal, 0));
  const taxableBase = roundMoney(normalizedLines.filter((line) => line.taxable).reduce((sum, line) => sum + line.subtotal, 0));
  const { gst, qst, taxesEnabled } = getTaxRates(options);
  const taxAmount = taxesEnabled ? roundMoney(taxableBase * (gst + qst)) : 0;
  const totalAmount = roundMoney(subtotal + taxAmount);

  return {
    lines: normalizedLines,
    subtotal,
    taxAmount,
    totalAmount,
    taxMeta: { gst, qst, taxableBase, taxesEnabled },
  };
}

export async function nextCommercialQuoteNumber(prefixDate = new Date()) {
  const yyyy = prefixDate.getFullYear();
  const mm = String(prefixDate.getMonth() + 1).padStart(2, '0');
  const dd = String(prefixDate.getDate()).padStart(2, '0');
  const prefix = `DEV-${yyyy}${mm}${dd}`;

  const count = await prisma.commercialQuote.count({
    where: {
      quoteNumber: {
        startsWith: prefix,
      },
    },
  });

  const seq = String(count + 1).padStart(3, '0');
  return `${prefix}-${seq}`;
}

export function canDeleteCommercialQuote(status: string) {
  return status === 'DRAFT';
}
