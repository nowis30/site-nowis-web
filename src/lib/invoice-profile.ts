export interface InvoiceBusinessProfile {
  displayName: string;
  companyName: string;
  legalLabel?: string;
  tradeName?: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: string;
  footerNote?: string;
}

export function getInvoiceBusinessProfile(): InvoiceBusinessProfile {
  const displayName =
    process.env.INVOICE_DISPLAY_NAME ||
    process.env.COMPANY_NAME ||
    'Votre nom';

  return {
    displayName,
    companyName: process.env.COMPANY_NAME || displayName,
    legalLabel: process.env.COMPANY_LEGAL_LABEL || 'Travailleur autonome',
    tradeName: process.env.COMPANY_TRADE_NAME || '',
    email: process.env.COMPANY_EMAIL || 'contact@nowis.store',
    phone: process.env.COMPANY_PHONE || '',
    website: process.env.COMPANY_WEBSITE || '',
    addressLine1: process.env.COMPANY_ADDRESS_LINE1 || '',
    addressLine2: process.env.COMPANY_ADDRESS_LINE2 || '',
    city: process.env.COMPANY_CITY || '',
    postalCode: process.env.COMPANY_POSTAL_CODE || '',
    country: process.env.COMPANY_COUNTRY || 'Canada',
    taxId: process.env.COMPANY_TAX_ID || '',
    paymentTerms: process.env.INVOICE_PAYMENT_TERMS || 'Paiement à réception de facture.',
    footerNote: process.env.INVOICE_FOOTER_NOTE || 'Merci pour votre confiance.',
  };
}
