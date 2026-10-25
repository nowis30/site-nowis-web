const TORONTO = 'America/Toronto';

export const QUEBEC_GST_RATE = 0.05;
export const QUEBEC_QST_RATE = 0.09975;
export const FILING_INVOICE_STATUSES = ['SENT', 'PAID', 'OVERDUE', 'ARCHIVED'] as const;

export class QuebecRegistrationError extends Error {}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function moneyAmount(value: unknown) {
  if (value === null || value === undefined || value === '') return 0;
  const amount = Number(value);
  return Number.isFinite(amount) ? roundMoney(amount) : 0;
}

/** TPS et TVQ are each calculated on the price before tax, then rounded to the cent. */
export function splitConsumptionTaxes(taxableBase: number, gstRate: number, qstRate: number) {
  const base = roundMoney(taxableBase);
  const gst = Number.isFinite(gstRate) && gstRate > 0 ? gstRate : 0;
  const qst = Number.isFinite(qstRate) && qstRate > 0 ? qstRate : 0;
  const gstAmount = roundMoney(base * gst);
  const qstAmount = roundMoney(base * qst);
  return {
    taxableBase: base,
    gstAmount,
    qstAmount,
    taxAmount: roundMoney(gstAmount + qstAmount),
  };
}

export function normalizeNeq(value: string | null | undefined, strict = false) {
  const raw = (value || '').trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!/^\d{10}$/.test(digits)) {
    if (strict) throw new QuebecRegistrationError('Le NEQ doit contenir 10 chiffres.');
    return null;
  }
  return digits;
}

export function normalizeGstNumber(value: string | null | undefined, strict = false) {
  const raw = (value || '').trim().toUpperCase().replace(/[\s-]/g, '');
  if (!raw) return null;
  const match = raw.match(/^(\d{9})RT(\d{4})$/);
  if (!match) {
    if (strict) throw new QuebecRegistrationError('Le numéro de TPS doit avoir la forme 123456789 RT0001.');
    return null;
  }
  return `${match[1]} RT${match[2]}`;
}

export function normalizeQstNumber(value: string | null | undefined, strict = false) {
  const raw = (value || '').trim().toUpperCase().replace(/[\s-]/g, '');
  if (!raw) return null;
  const match = raw.match(/^(\d{10})TQ(\d{4})$/);
  if (!match) {
    if (strict) throw new QuebecRegistrationError('Le numéro de TVQ doit avoir la forme 1234567890 TQ0001.');
    return null;
  }
  return `${match[1]} TQ${match[2]}`;
}

export type ChargeableTaxProfile = {
  taxesEnabled: boolean;
  taxRateGst: number;
  taxRateQst: number;
  gstNumber?: string | null;
  qstNumber?: string | null;
};

export function chargeableTaxRates(profile: ChargeableTaxProfile) {
  const gstNumber = normalizeGstNumber(profile.gstNumber);
  const qstNumber = normalizeQstNumber(profile.qstNumber);
  const taxRateGst = profile.taxesEnabled && gstNumber ? Math.max(0, profile.taxRateGst) : 0;
  const taxRateQst = profile.taxesEnabled && qstNumber ? Math.max(0, profile.taxRateQst) : 0;
  return {
    gstNumber,
    qstNumber,
    taxRateGst,
    taxRateQst,
    taxesEnabled: profile.taxesEnabled && (taxRateGst > 0 || taxRateQst > 0),
  };
}

export function pricedInvoice(preTaxAmount: number, profile: ChargeableTaxProfile) {
  const priced = priceWithQuebecTaxes(preTaxAmount, profile);
  return {
    amount: priced.total,
    subtotal: priced.subtotal,
    taxAmount: priced.taxAmount,
    totalAmount: priced.total,
    taxesEnabled: priced.taxesEnabled,
    taxRateGst: priced.taxRateGst,
    taxRateQst: priced.taxRateQst,
  };
}

export function priceWithQuebecTaxes(preTaxAmount: number, profile: ChargeableTaxProfile) {
  const rates = chargeableTaxRates(profile);
  const subtotal = roundMoney(preTaxAmount);
  if (!rates.taxesEnabled) {
    return {
      subtotal,
      gstAmount: 0,
      qstAmount: 0,
      taxAmount: 0,
      total: subtotal,
      taxesEnabled: false,
      taxRateGst: 0,
      taxRateQst: 0,
    };
  }
  const split = splitConsumptionTaxes(subtotal, rates.taxRateGst, rates.taxRateQst);
  return {
    subtotal,
    gstAmount: split.gstAmount,
    qstAmount: split.qstAmount,
    taxAmount: split.taxAmount,
    total: roundMoney(subtotal + split.taxAmount),
    taxesEnabled: true,
    taxRateGst: rates.taxRateGst,
    taxRateQst: rates.taxRateQst,
  };
}

export type InvoiceTaxSource = {
  amount?: unknown;
  subtotal?: unknown;
  taxAmount?: unknown;
  totalAmount?: unknown;
  taxesEnabled?: boolean | null;
  taxRateGst?: unknown;
  taxRateQst?: unknown;
};

export type InvoiceTaxPresentation = {
  subtotal: number;
  taxableBase: number;
  exemptAmount: number;
  gstAmount: number;
  qstAmount: number;
  taxAmount: number;
  total: number;
  showBreakdown: boolean;
};

function taxRate(value: unknown) {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate <= 0 || rate > 1) return 0;
  return rate;
}

export function presentInvoiceTaxes(invoice: InvoiceTaxSource): InvoiceTaxPresentation {
  const total = moneyAmount(invoice.totalAmount ?? invoice.amount);
  const subtotal = moneyAmount(invoice.subtotal ?? invoice.amount);
  const storedTax = invoice.taxAmount === null || invoice.taxAmount === undefined
    ? roundMoney(total - subtotal)
    : moneyAmount(invoice.taxAmount);
  const gstRate = taxRate(invoice.taxRateGst);
  const qstRate = taxRate(invoice.taxRateQst);
  if (storedTax <= 0 || gstRate + qstRate <= 0) {
    return {
      subtotal: total,
      taxableBase: 0,
      exemptAmount: total,
      gstAmount: 0,
      qstAmount: 0,
      taxAmount: 0,
      total,
      showBreakdown: false,
    };
  }

  const separate = splitConsumptionTaxes(subtotal, gstRate, qstRate);
  if (Math.abs(separate.taxAmount - storedTax) <= 0.01) {
    const taxableBase = subtotal;
    return {
      subtotal,
      taxableBase,
      exemptAmount: 0,
      gstAmount: separate.gstAmount,
      qstAmount: separate.qstAmount,
      taxAmount: storedTax,
      total,
      showBreakdown: true,
    };
  }

  const rateSum = gstRate + qstRate;
  const gstAmount = roundMoney(storedTax * (gstRate / rateSum));
  const qstAmount = roundMoney(storedTax - gstAmount);
  const taxableBase = roundMoney(storedTax / rateSum);
  const exemptAmount = Math.max(0, roundMoney(subtotal - taxableBase));
  return {
    subtotal,
    taxableBase,
    exemptAmount,
    gstAmount,
    qstAmount,
    taxAmount: storedTax,
    total,
    showBreakdown: true,
  };
}

export type QuebecReadinessItem = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export function quebecPartnerReadiness(profile: {
  companyName?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  neq?: string | null;
  gstNumber?: string | null;
  qstNumber?: string | null;
  taxesEnabled?: boolean;
  taxRateGst?: number;
  taxRateQst?: number;
}): QuebecReadinessItem[] {
  const neq = normalizeNeq(profile.neq);
  const gstNumber = normalizeGstNumber(profile.gstNumber);
  const qstNumber = normalizeQstNumber(profile.qstNumber);
  const postal = (profile.postalCode || '').trim().toUpperCase();
  const quebecPostal = /^[GHJ]\d[A-Z]\s?\d[A-Z]\d$/.test(postal);
  return [
    {
      id: 'identity',
      label: 'Nom légal et courriel',
      ok: Boolean((profile.companyName || '').trim() && (profile.email || '').includes('@')),
      detail: 'Le nom et le courriel apparaissent sur la facture.',
    },
    {
      id: 'address',
      label: 'Adresse au Québec',
      ok: Boolean((profile.addressLine1 || '').trim() && (profile.city || '').trim() && quebecPostal),
      detail: quebecPostal ? 'Adresse et code postal du Québec présents.' : 'Il faut une rue, une ville et un code postal du Québec.',
    },
    {
      id: 'neq',
      label: 'NEQ',
      ok: Boolean(neq),
      detail: neq ? `NEQ ${neq}.` : 'Inscrivez les 10 chiffres du Numéro d’entreprise du Québec.',
    },
    {
      id: 'gst',
      label: 'Numéro de TPS',
      ok: !profile.taxesEnabled || Boolean(gstNumber),
      detail: gstNumber ? gstNumber : 'Requis pour percevoir la TPS, sous la forme 123456789 RT0001.',
    },
    {
      id: 'qst',
      label: 'Numéro de TVQ',
      ok: !profile.taxesEnabled || Boolean(qstNumber),
      detail: qstNumber ? qstNumber : 'Requis pour percevoir la TVQ, sous la forme 1234567890 TQ0001.',
    },
    {
      id: 'rates',
      label: 'Taux TPS et TVQ',
      ok: !profile.taxesEnabled || (Number(profile.taxRateGst) === QUEBEC_GST_RATE && Number(profile.taxRateQst) === QUEBEC_QST_RATE),
      detail: 'Les taux courants sont 5 % et 9,975 %, calculés tous les deux sur le montant hors taxes.',
    },
  ];
}

export type FilingInvoice = InvoiceTaxSource & {
  number: string;
  issueDate: Date;
  status: string;
  isTest?: boolean;
};

export function summarizeQuebecTaxes(invoices: FilingInvoice[]) {
  let taxableSupplies = 0;
  let exemptSupplies = 0;
  let gstCollected = 0;
  let qstCollected = 0;
  const lines: Array<InvoiceTaxPresentation & { number: string; issueDate: string; status: string }> = [];

  for (const invoice of invoices) {
    if (invoice.isTest || !FILING_INVOICE_STATUSES.includes(invoice.status as typeof FILING_INVOICE_STATUSES[number])) continue;
    const presented = presentInvoiceTaxes(invoice);
    taxableSupplies = roundMoney(taxableSupplies + presented.taxableBase);
    exemptSupplies = roundMoney(exemptSupplies + presented.exemptAmount);
    gstCollected = roundMoney(gstCollected + presented.gstAmount);
    qstCollected = roundMoney(qstCollected + presented.qstAmount);
    lines.push({
      ...presented,
      number: invoice.number,
      issueDate: invoice.issueDate.toISOString(),
      status: invoice.status,
    });
  }

  return {
    invoiceCount: lines.length,
    taxableSupplies,
    exemptSupplies,
    gstCollected,
    qstCollected,
    taxCollected: roundMoney(gstCollected + qstCollected),
    lines,
  };
}

export function civilDateInTimeZone(date: Date, timeZone = TORONTO) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function timeZoneOffsetMs(utcMillis: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMillis));
  const bag = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(Number(bag.year), Number(bag.month) - 1, Number(bag.day), Number(bag.hour) % 24, Number(bag.minute), Number(bag.second));
  return asUtc - utcMillis;
}

export function zonedDayStart(isoDate: string, timeZone = TORONTO) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) throw new Error('Date invalide.');
  const [year, month, day] = isoDate.split('-').map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0);
  if (!Number.isFinite(utcGuess) || month < 1 || month > 12 || day < 1 || day > 31) throw new Error('Date invalide.');
  const start = new Date(utcGuess - timeZoneOffsetMs(utcGuess, timeZone));
  if (civilDateInTimeZone(start, timeZone) !== isoDate) throw new Error('Date invalide.');
  return start;
}

export function nextCivilDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + 1);
  return utc.toISOString().slice(0, 10);
}

export function currentQuarterBounds(now = new Date()) {
  const [yearText, monthText] = civilDateInTimeZone(now).split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
  const from = `${year}-${String(quarterStartMonth).padStart(2, '0')}-01`;
  const endMonth = quarterStartMonth + 3;
  const endYear = endMonth > 12 ? year + 1 : year;
  const endMonthNorm = endMonth > 12 ? endMonth - 12 : endMonth;
  const endExclusive = `${endYear}-${String(endMonthNorm).padStart(2, '0')}-01`;
  const toDate = new Date(`${endExclusive}T00:00:00Z`);
  toDate.setUTCDate(toDate.getUTCDate() - 1);
  return { from, to: toDate.toISOString().slice(0, 10) };
}

export function quebecPeriodRange(from: string, to: string) {
  const start = zonedDayStart(from);
  const end = zonedDayStart(nextCivilDate(to));
  if (end.getTime() <= start.getTime()) throw new Error('La date de fin doit suivre la date de début.');
  const days = (end.getTime() - start.getTime()) / 86_400_000;
  if (days > 800) throw new Error('La période ne peut pas dépasser 800 jours.');
  return { from, to, start, end };
}

export function csvCell(value: string | number | null | undefined) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\n;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}
