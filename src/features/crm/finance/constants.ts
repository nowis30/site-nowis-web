export const FINANCE_SALE_TYPES = [
  'USB_2GB',
  'USB_16GB',
  'CUSTOM_SONG',
  'WORKSHOP',
  'AI_VIDEO',
  'SHOW',
  'OTHER',
] as const;

export const FINANCE_EXPENSE_CATEGORIES = [
  'MATERIAL',
  'AI_SOFTWARE',
  'WEB_HOSTING',
  'ADVERTISING',
  'TRAVEL',
  'EQUIPMENT',
  'BANK_FEES',
  'SUBCONTRACTING',
  'OTHER',
] as const;

export const FINANCE_PAYMENT_METHODS = [
  'CASH',
  'DEBIT',
  'CREDIT',
  'PAYPAL',
  'TRANSFER',
  'OTHER',
] as const;

export const FINANCE_ENTRY_STATUSES = [
  'PAID',
  'PARTIAL',
  'UNPAID',
  'CANCELLED',
] as const;

export const FINANCE_INVENTORY_SKUS = [
  'USB-2GB',
  'USB-16GB',
] as const;

export const FINANCE_INVENTORY_CATEGORIES = [
  'USB_KEY',
  'TSHIRT',
  'AUDIO_SPEAKER',
  'PHONE_ACCESSORY',
  'MERCHANDISE',
  'OTHER',
] as const;

export const FINANCE_SALE_TYPE_LABELS: Record<(typeof FINANCE_SALE_TYPES)[number], string> = {
  USB_2GB: 'Clé USB 2 GB à 20 $',
  USB_16GB: 'Clé USB 16 GB à 40 $',
  CUSTOM_SONG: 'Chanson personnalisée',
  WORKSHOP: 'Atelier',
  AI_VIDEO: 'Vidéo IA',
  SHOW: 'Spectacle',
  OTHER: 'Autre',
};

export const FINANCE_EXPENSE_CATEGORY_LABELS: Record<(typeof FINANCE_EXPENSE_CATEGORIES)[number], string> = {
  MATERIAL: 'Matériel',
  AI_SOFTWARE: 'Logiciels IA',
  WEB_HOSTING: 'Hébergement web',
  ADVERTISING: 'Publicité',
  TRAVEL: 'Déplacement',
  EQUIPMENT: 'Équipement',
  BANK_FEES: 'Frais bancaires',
  SUBCONTRACTING: 'Sous-traitance',
  OTHER: 'Autre',
};

export const FINANCE_PAYMENT_METHOD_LABELS: Record<(typeof FINANCE_PAYMENT_METHODS)[number], string> = {
  CASH: 'Cash',
  DEBIT: 'Débit',
  CREDIT: 'Crédit',
  PAYPAL: 'PayPal',
  TRANSFER: 'Virement',
  OTHER: 'Autre',
};

export const FINANCE_ENTRY_STATUS_LABELS: Record<(typeof FINANCE_ENTRY_STATUSES)[number], string> = {
  PAID: 'Payé',
  PARTIAL: 'Partiel',
  UNPAID: 'Non payé',
  CANCELLED: 'Annulé',
};

export const FINANCE_INVENTORY_CATEGORY_LABELS: Record<(typeof FINANCE_INVENTORY_CATEGORIES)[number], string> = {
  USB_KEY: 'Clé USB',
  TSHIRT: 'T-shirt',
  AUDIO_SPEAKER: 'Audio / Speaker',
  PHONE_ACCESSORY: 'Accessoire téléphone',
  MERCHANDISE: 'Marchandise',
  OTHER: 'Autre',
};

export function isFinanceSaleType(value: string): value is (typeof FINANCE_SALE_TYPES)[number] {
  return (FINANCE_SALE_TYPES as readonly string[]).includes(value);
}

export function isFinanceExpenseCategory(value: string): value is (typeof FINANCE_EXPENSE_CATEGORIES)[number] {
  return (FINANCE_EXPENSE_CATEGORIES as readonly string[]).includes(value);
}

export function isFinancePaymentMethod(value: string): value is (typeof FINANCE_PAYMENT_METHODS)[number] {
  return (FINANCE_PAYMENT_METHODS as readonly string[]).includes(value);
}

export function isFinanceEntryStatus(value: string): value is (typeof FINANCE_ENTRY_STATUSES)[number] {
  return (FINANCE_ENTRY_STATUSES as readonly string[]).includes(value);
}

export function isFinanceInventoryCategory(value: string): value is (typeof FINANCE_INVENTORY_CATEGORIES)[number] {
  return (FINANCE_INVENTORY_CATEGORIES as readonly string[]).includes(value);
}

export function getFinanceCategoryLabel(kind: 'SALE' | 'EXPENSE', value: string) {
  if (kind === 'SALE' && value in FINANCE_SALE_TYPE_LABELS) {
    return FINANCE_SALE_TYPE_LABELS[value as keyof typeof FINANCE_SALE_TYPE_LABELS];
  }
  if (kind === 'SALE' && value in FINANCE_INVENTORY_CATEGORY_LABELS) {
    return FINANCE_INVENTORY_CATEGORY_LABELS[value as keyof typeof FINANCE_INVENTORY_CATEGORY_LABELS];
  }
  if (kind === 'EXPENSE' && value in FINANCE_EXPENSE_CATEGORY_LABELS) {
    return FINANCE_EXPENSE_CATEGORY_LABELS[value as keyof typeof FINANCE_EXPENSE_CATEGORY_LABELS];
  }
  return value;
}

export function getInventoryCategoryLabel(value: string) {
  if (value in FINANCE_INVENTORY_CATEGORY_LABELS) {
    return FINANCE_INVENTORY_CATEGORY_LABELS[value as keyof typeof FINANCE_INVENTORY_CATEGORY_LABELS];
  }
  return value;
}
