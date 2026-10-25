import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { InvoiceBusinessProfile } from '@/lib/invoice-profile';
import { parseInvoiceDescriptionLines } from '@/lib/invoice-lines';
import { presentInvoiceTaxes } from '@/lib/quebec-fiscal';

interface InvoicePdfInput {
  number: string;
  issueDate: Date;
  dueDate: Date;
  amount: string | number;
  subtotal?: string | number | null;
  taxAmount?: string | number | null;
  totalAmount?: string | number | null;
  taxesEnabled?: boolean | null;
  taxRateGst?: number | null;
  taxRateQst?: number | null;
  description: string | null;
  contact: {
    fullName: string;
    email: string | null;
    companyName?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
    taxId?: string | null;
  };
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value));
}

function formatDate(value: Date) {
  return value.toLocaleDateString('fr-CA');
}

function formatRate(rate: number) {
  return `${new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 3 }).format(rate * 100)} %`;
}

function pdfSafe(value: string) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u202f\u00a0]/g, ' ')
    .replace(/\u0153/g, 'oe')
    .replace(/\u0152/g, 'OE')
    .replace(/[^\u0000-\u00ff]/g, '');
}

export function safeInvoiceFilename(number: string) {
  const safe = number.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80) || 'document';
  return `facture-${safe}.pdf`;
}

export async function buildInvoicePdfBuffer(
  invoice: InvoicePdfInput,
  businessProfile: InvoiceBusinessProfile,
): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 790;
  const left = 48;

  const draw = (text: string, options: Parameters<typeof page.drawText>[1]) => {
    page.drawText(pdfSafe(text), options);
  };

  page.drawText('FACTURE', {
    x: left,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.09, 0.11, 0.14),
  });

  y -= 30;
  draw(businessProfile.displayName, {
    x: left,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.09, 0.11, 0.14),
  });

  y -= 18;
  const providerLines = [
    businessProfile.tradeName,
    businessProfile.email,
    businessProfile.phone,
    [businessProfile.addressLine1, businessProfile.addressLine2].filter(Boolean).join(', '),
    [businessProfile.city, businessProfile.postalCode, businessProfile.country].filter(Boolean).join(', '),
    businessProfile.neq ? `NEQ : ${businessProfile.neq}` : '',
    businessProfile.gstNumber ? `TPS : ${businessProfile.gstNumber}` : '',
    businessProfile.qstNumber ? `TVQ : ${businessProfile.qstNumber}` : '',
  ].filter(Boolean) as string[];

  for (const line of providerLines) {
    draw(line, { x: left, y, size: 10, font, color: rgb(0.25, 0.29, 0.35) });
    y -= 14;
  }

  y -= 10;
  draw(`Numéro : ${invoice.number}`, { x: left, y, size: 10, font: fontBold });
  y -= 14;
  draw(`Émise le : ${formatDate(invoice.issueDate)}`, { x: left, y, size: 10, font });
  y -= 14;
  draw(`Échéance : ${formatDate(invoice.dueDate)}`, { x: left, y, size: 10, font });

  y -= 24;
  draw('Facturée à :', { x: left, y, size: 11, font: fontBold });
  y -= 16;
  draw(invoice.contact.fullName, { x: left, y, size: 10, font });
  if (invoice.contact.companyName) {
    y -= 14;
    draw(invoice.contact.companyName, { x: left, y, size: 10, font, color: rgb(0.25, 0.29, 0.35) });
  }
  if (invoice.contact.email) {
    y -= 14;
    draw(invoice.contact.email, { x: left, y, size: 10, font, color: rgb(0.25, 0.29, 0.35) });
  }
  const customerAddress = [
    invoice.contact.addressLine1,
    invoice.contact.addressLine2,
    [invoice.contact.city, invoice.contact.state, invoice.contact.postalCode].filter(Boolean).join(', '),
    invoice.contact.country,
  ].filter(Boolean) as string[];
  for (const line of customerAddress) {
    y -= 14;
    draw(line, { x: left, y, size: 10, font, color: rgb(0.25, 0.29, 0.35) });
  }
  if (invoice.contact.taxId) {
    y -= 14;
    draw(`Numéro de taxe : ${invoice.contact.taxId}`, { x: left, y, size: 10, font, color: rgb(0.25, 0.29, 0.35) });
  }

  y -= 26;
  page.drawRectangle({
    x: left,
    y: y - 22,
    width: 499,
    height: 22,
    color: rgb(0.94, 0.96, 0.98),
  });
  draw('Description', { x: left + 8, y: y - 15, size: 10, font: fontBold });
  draw('Montant', { x: left + 420, y: y - 15, size: 10, font: fontBold });

  y -= 38;
  const lines = parseInvoiceDescriptionLines(invoice.description, invoice.amount).slice(0, 10);

  for (const line of lines) {
    draw(line.description.slice(0, 86), { x: left + 8, y, size: 10, font, color: rgb(0.09, 0.11, 0.14) });
    if (line.amount !== null) {
      draw(formatMoney(line.amount), { x: left + 420, y, size: 10, font });
    }
    y -= 16;
  }

  y -= 12;
  page.drawLine({ start: { x: left, y }, end: { x: left + 499, y }, thickness: 1, color: rgb(0.88, 0.9, 0.93) });
  y -= 20;

  const taxes = presentInvoiceTaxes(invoice);
  if (taxes.showBreakdown) {
    draw('Sous-total', { x: left + 300, y, size: 10, font });
    draw(formatMoney(taxes.subtotal), { x: left + 420, y, size: 10, font });
    y -= 16;
    if (taxes.gstAmount > 0) {
      draw(`TPS (${formatRate(Number(invoice.taxRateGst) || 0)})`, { x: left + 300, y, size: 10, font });
      draw(formatMoney(taxes.gstAmount), { x: left + 420, y, size: 10, font });
      y -= 16;
    }
    if (taxes.qstAmount > 0) {
      draw(`TVQ (${formatRate(Number(invoice.taxRateQst) || 0)})`, { x: left + 300, y, size: 10, font });
      draw(formatMoney(taxes.qstAmount), { x: left + 420, y, size: 10, font });
      y -= 16;
    }
  }
  draw('Total', { x: left + 300, y, size: 11, font: fontBold });
  draw(formatMoney(taxes.total || invoice.amount), { x: left + 420, y, size: 12, font: fontBold });

  y -= 30;
  draw(businessProfile.paymentTerms || 'Paiement à réception de facture.', {
    x: left,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.45, 0.5),
  });

  if (businessProfile.email) {
    y -= 16;
    draw(`Paiement par virement Interac à : ${businessProfile.email}`, {
      x: left,
      y,
      size: 10,
      font: fontBold,
      color: rgb(0.09, 0.11, 0.14),
    });
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
