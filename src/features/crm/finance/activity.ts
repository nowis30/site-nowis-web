import { getFinanceCategoryLabel } from '@/features/crm/finance/constants';

/** TPS 5 % et TVQ 9,975 %, les deux calculées sur le montant avant taxes. */
export const QUEBEC_GST_RATE = 0.05;
export const QUEBEC_QST_RATE = 0.09975;
export const QUEBEC_COMBINED_RATE = QUEBEC_GST_RATE + QUEBEC_QST_RATE;

export type ActivityKey = 'songs' | 'shows' | 'workshops' | 'usb' | 'video' | 'other';

export const ACTIVITY_LABELS: Record<ActivityKey, string> = {
  songs: 'Chansons vendues',
  shows: 'Spectacles',
  workshops: 'Ateliers',
  usb: 'Clés USB',
  video: 'Vidéos IA',
  other: 'Autres ventes',
};

export const ACTIVITY_ORDER: ActivityKey[] = ['songs', 'shows', 'workshops', 'usb', 'video', 'other'];

const ACTIVITY_PRESETS = {
  chansons: 'CUSTOM_SONG',
  spectacles: 'SHOW',
  ateliers: 'WORKSHOP',
  'cles-usb': 'USB_16GB',
  videos: 'AI_VIDEO',
} as const;

export type ActivityPreset = keyof typeof ACTIVITY_PRESETS;

export function saleCategoryForActivity(preset: string | undefined): string | null {
  if (!preset || !(preset in ACTIVITY_PRESETS)) return null;
  return ACTIVITY_PRESETS[preset as ActivityPreset];
}

export function activityKeyForSaleCategory(category: string): ActivityKey {
  switch (category) {
    case 'CUSTOM_SONG':
      return 'songs';
    case 'SHOW':
      return 'shows';
    case 'WORKSHOP':
      return 'workshops';
    case 'USB_2GB':
    case 'USB_16GB':
    case 'USB_KEY':
      return 'usb';
    case 'AI_VIDEO':
      return 'video';
    default:
      return 'other';
  }
}

export type LedgerLine = {
  kind: 'SALE' | 'EXPENSE';
  year: number;
  month: number;
  category: string;
  quantity: number;
  amountBeforeTax: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
};

export type TaxSplit = {
  gst: number;
  qst: number;
  other: number;
};

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function quebecTaxAmount(amountBeforeTax: number): number {
  return roundMoney(Math.max(0, amountBeforeTax) * QUEBEC_COMBINED_RATE);
}

/**
 * Ventile TPS / TVQ seulement quand la taxe enregistrée correspond au taux combiné.
 * Sinon le montant reste dans « autre taxe » pour ne pas inventer une répartition.
 */
export function splitQuebecTax(amountBeforeTax: number, taxAmount: number): TaxSplit {
  const before = roundMoney(amountBeforeTax);
  const tax = roundMoney(taxAmount);
  if (tax <= 0) return { gst: 0, qst: 0, other: 0 };
  if (before <= 0) return { gst: 0, qst: 0, other: tax };
  const expected = roundMoney(before * QUEBEC_COMBINED_RATE);
  // Un centime couvre l’écart d’arrondi entre le taux combiné et TPS + TVQ calculées à part.
  if (Math.abs(tax - expected) <= 0.015) {
    const gst = roundMoney(before * QUEBEC_GST_RATE);
    return { gst, qst: roundMoney(tax - gst), other: 0 };
  }
  return { gst: 0, qst: 0, other: tax };
}

export type ActivityTotals = {
  key: ActivityKey;
  label: string;
  count: number;
  quantity: number;
  beforeTax: number;
  tax: number;
  total: number;
  gst: number;
  qst: number;
  otherTax: number;
};

function emptyActivity(key: ActivityKey): ActivityTotals {
  return {
    key,
    label: ACTIVITY_LABELS[key],
    count: 0,
    quantity: 0,
    beforeTax: 0,
    tax: 0,
    total: 0,
    gst: 0,
    qst: 0,
    otherTax: 0,
  };
}

function isCounted(line: LedgerLine) {
  return line.status !== 'CANCELLED';
}

export function summarizeActivities(lines: LedgerLine[], year: number): ActivityTotals[] {
  const buckets = new Map<ActivityKey, ActivityTotals>(ACTIVITY_ORDER.map((key) => [key, emptyActivity(key)]));
  for (const line of lines) {
    if (line.kind !== 'SALE' || line.year !== year || !isCounted(line)) continue;
    const bucket = buckets.get(activityKeyForSaleCategory(line.category));
    if (!bucket) continue;
    const split = splitQuebecTax(line.amountBeforeTax, line.taxAmount);
    bucket.count += 1;
    bucket.quantity += line.quantity;
    bucket.beforeTax = roundMoney(bucket.beforeTax + line.amountBeforeTax);
    bucket.tax = roundMoney(bucket.tax + line.taxAmount);
    bucket.total = roundMoney(bucket.total + line.totalAmount);
    bucket.gst = roundMoney(bucket.gst + split.gst);
    bucket.qst = roundMoney(bucket.qst + split.qst);
    bucket.otherTax = roundMoney(bucket.otherTax + split.other);
  }
  return ACTIVITY_ORDER.map((key) => buckets.get(key) ?? emptyActivity(key));
}

const MONTH_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export type MonthPoint = {
  month: number;
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
};

export function monthlyEvolution(lines: LedgerLine[], year: number): MonthPoint[] {
  const points: MonthPoint[] = MONTH_LABELS.map((label, month) => ({
    month,
    label,
    revenue: 0,
    expenses: 0,
    profit: 0,
  }));
  for (const line of lines) {
    if (line.year !== year || !isCounted(line) || line.month < 0 || line.month > 11) continue;
    const point = points[line.month];
    if (line.kind === 'SALE') point.revenue = roundMoney(point.revenue + line.totalAmount);
    if (line.kind === 'EXPENSE') point.expenses = roundMoney(point.expenses + line.totalAmount);
  }
  for (const point of points) {
    point.profit = roundMoney(point.revenue - point.expenses);
  }
  return points;
}

export type AccountantSummary = {
  salesBeforeTax: number;
  gst: number;
  qst: number;
  otherTax: number;
  salesTotal: number;
  expensesTotal: number;
  profit: number;
  receivable: number;
  activities: ActivityTotals[];
};

export function accountantSummary(lines: LedgerLine[], year: number): AccountantSummary {
  const activities = summarizeActivities(lines, year);
  let salesBeforeTax = 0;
  let gst = 0;
  let qst = 0;
  let otherTax = 0;
  let salesTotal = 0;
  let expensesTotal = 0;
  let receivable = 0;
  for (const line of lines) {
    if (line.year !== year || !isCounted(line)) continue;
    if (line.kind === 'SALE') {
      const split = splitQuebecTax(line.amountBeforeTax, line.taxAmount);
      salesBeforeTax = roundMoney(salesBeforeTax + line.amountBeforeTax);
      gst = roundMoney(gst + split.gst);
      qst = roundMoney(qst + split.qst);
      otherTax = roundMoney(otherTax + split.other);
      salesTotal = roundMoney(salesTotal + line.totalAmount);
      if (line.status === 'UNPAID' || line.status === 'PARTIAL') {
        receivable = roundMoney(receivable + line.totalAmount);
      }
    }
    if (line.kind === 'EXPENSE') {
      expensesTotal = roundMoney(expensesTotal + line.totalAmount);
    }
  }
  return {
    salesBeforeTax,
    gst,
    qst,
    otherTax,
    salesTotal,
    expensesTotal,
    profit: roundMoney(salesTotal - expensesTotal),
    receivable,
    activities,
  };
}

export type SimulationInput = {
  songCount: number;
  songPrice: number;
  showCount: number;
  showPrice: number;
  workshopCount: number;
  workshopPrice: number;
  usb2Count: number;
  usb2Price: number;
  usb16Count: number;
  usb16Price: number;
  extraExpenses: number;
  applyQuebecTax: boolean;
};

export const DEFAULT_SIMULATION: SimulationInput = {
  songCount: 0,
  songPrice: 30,
  showCount: 0,
  showPrice: 0,
  workshopCount: 0,
  workshopPrice: 500,
  usb2Count: 0,
  usb2Price: 20,
  usb16Count: 0,
  usb16Price: 40,
  extraExpenses: 0,
  applyQuebecTax: true,
};

function nonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export type SimulationResult = {
  addedBeforeTax: number;
  addedTax: number;
  addedRevenue: number;
  addedExpenses: number;
  projectedRevenue: number;
  projectedExpenses: number;
  projectedProfit: number;
};

export function simulateYear(summary: AccountantSummary, input: SimulationInput): SimulationResult {
  const beforeTax = roundMoney(
    nonNegative(input.songCount) * nonNegative(input.songPrice)
    + nonNegative(input.showCount) * nonNegative(input.showPrice)
    + nonNegative(input.workshopCount) * nonNegative(input.workshopPrice)
    + nonNegative(input.usb2Count) * nonNegative(input.usb2Price)
    + nonNegative(input.usb16Count) * nonNegative(input.usb16Price),
  );
  const addedTax = input.applyQuebecTax ? quebecTaxAmount(beforeTax) : 0;
  const addedRevenue = roundMoney(beforeTax + addedTax);
  const addedExpenses = roundMoney(nonNegative(input.extraExpenses));
  return {
    addedBeforeTax: beforeTax,
    addedTax,
    addedRevenue,
    addedExpenses,
    projectedRevenue: roundMoney(summary.salesTotal + addedRevenue),
    projectedExpenses: roundMoney(summary.expensesTotal + addedExpenses),
    projectedProfit: roundMoney(summary.salesTotal + addedRevenue - (summary.expensesTotal + addedExpenses)),
  };
}

export type AccountantDetail = {
  kind: 'SALE' | 'EXPENSE' | 'PAYMENT';
  date: string;
  counterparty: string;
  category: string;
  description: string;
  quantity: number;
  amountBeforeTax: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  invoiceNumber: string;
};

function csvCell(value: string | number) {
  const text = String(value);
  if (/[";\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function moneyCsv(value: number) {
  return roundMoney(value).toFixed(2).replace('.', ',');
}

const KIND_LABELS: Record<AccountantDetail['kind'], string> = {
  SALE: 'Vente',
  EXPENSE: 'Dépense',
  PAYMENT: 'Paiement de facture',
};

export function buildAccountantCsv(summary: AccountantSummary, details: AccountantDetail[], year: number): string {
  const rows: Array<Array<string | number>> = [
    ['Section', 'Libellé', 'Montant'],
    ['Sommaire', `Année ${year}`, ''],
    ['Sommaire', 'Revenus avant taxes', moneyCsv(summary.salesBeforeTax)],
    ['Sommaire', 'TPS 5 %', moneyCsv(summary.gst)],
    ['Sommaire', 'TVQ 9,975 %', moneyCsv(summary.qst)],
    ['Sommaire', 'Taxes non ventilées', moneyCsv(summary.otherTax)],
    ['Sommaire', 'Revenus totaux', moneyCsv(summary.salesTotal)],
    ['Sommaire', 'Dépenses totales', moneyCsv(summary.expensesTotal)],
    ['Sommaire', 'Profit', moneyCsv(summary.profit)],
    ['Sommaire', 'Ventes non encaissées', moneyCsv(summary.receivable)],
    ['Sommaire', 'Note', 'Les paiements de facture sont listés à part et ne sont pas additionnés aux revenus du registre.'],
  ];
  for (const activity of summary.activities) {
    rows.push(['Activité', activity.label, moneyCsv(activity.total)]);
    rows.push(['Activité', `${activity.label} — avant taxes`, moneyCsv(activity.beforeTax)]);
    rows.push(['Activité', `${activity.label} — quantité`, String(activity.quantity)]);
  }
  rows.push([]);
  rows.push([
    'Type',
    'Date',
    'Client ou fournisseur',
    'Activité',
    'Catégorie',
    'Description',
    'Quantité',
    'Avant taxes',
    'TPS',
    'TVQ',
    'Autre taxe',
    'Total',
    'Paiement',
    'Statut',
    'Facture',
  ]);
  for (const detail of details) {
    const split = detail.kind === 'PAYMENT'
      ? { gst: 0, qst: 0, other: 0 }
      : splitQuebecTax(detail.amountBeforeTax, detail.taxAmount);
    const activity = detail.kind === 'SALE'
      ? ACTIVITY_LABELS[activityKeyForSaleCategory(detail.category)]
      : detail.kind === 'EXPENSE'
        ? 'Dépense'
        : 'Facture';
    const categoryLabel = detail.kind === 'PAYMENT'
      ? 'Paiement de facture'
      : detail.kind === 'EXPENSE'
        ? getFinanceCategoryLabel('EXPENSE', detail.category)
        : getFinanceCategoryLabel('SALE', detail.category);
    rows.push([
      KIND_LABELS[detail.kind],
      detail.date,
      detail.counterparty,
      activity,
      categoryLabel,
      detail.description,
      detail.quantity,
      moneyCsv(detail.amountBeforeTax),
      moneyCsv(split.gst),
      moneyCsv(split.qst),
      moneyCsv(split.other),
      moneyCsv(detail.totalAmount),
      detail.paymentMethod,
      detail.status,
      detail.invoiceNumber,
    ]);
  }
  return `\uFEFF${rows.map((row) => row.map((value) => csvCell(value)).join(';')).join('\n')}`;
}
