import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { InvoiceBusinessProfile } from '@/lib/invoice-profile';

interface InvoicePdfInput {
  number: string;
  issueDate: Date;
  dueDate: Date;
  amount: string | number;
  description: string | null;
  contact: {
    fullName: string;
    email: string | null;
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

  page.drawText('FACTURE', {
    x: left,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.09, 0.11, 0.14),
  });

  y -= 30;
  page.drawText(`${businessProfile.displayName}`, {
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
  ].filter(Boolean) as string[];

  for (const line of providerLines) {
    page.drawText(line, { x: left, y, size: 10, font, color: rgb(0.25, 0.29, 0.35) });
    y -= 14;
  }

  y -= 10;
  page.drawText(`Numero: ${invoice.number}`, { x: left, y, size: 10, font: fontBold });
  y -= 14;
  page.drawText(`Emise le: ${formatDate(invoice.issueDate)}`, { x: left, y, size: 10, font });
  y -= 14;
  page.drawText(`Echeance: ${formatDate(invoice.dueDate)}`, { x: left, y, size: 10, font });

  y -= 24;
  page.drawText('Facture a:', { x: left, y, size: 11, font: fontBold });
  y -= 16;
  page.drawText(invoice.contact.fullName, { x: left, y, size: 10, font });
  if (invoice.contact.email) {
    y -= 14;
    page.drawText(invoice.contact.email, { x: left, y, size: 10, font, color: rgb(0.25, 0.29, 0.35) });
  }

  y -= 26;
  page.drawRectangle({
    x: left,
    y: y - 22,
    width: 499,
    height: 22,
    color: rgb(0.94, 0.96, 0.98),
  });
  page.drawText('Description', { x: left + 8, y: y - 15, size: 10, font: fontBold });
  page.drawText('Montant', { x: left + 420, y: y - 15, size: 10, font: fontBold });

  y -= 38;
  const lines = (invoice.description || 'Prestation professionnelle')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10);

  for (const [index, line] of lines.entries()) {
    page.drawText(line.slice(0, 86), { x: left + 8, y, size: 10, font, color: rgb(0.09, 0.11, 0.14) });
    if (index === 0) {
      page.drawText(formatMoney(invoice.amount), { x: left + 420, y, size: 10, font });
    }
    y -= 16;
  }

  y -= 12;
  page.drawLine({ start: { x: left, y }, end: { x: left + 499, y }, thickness: 1, color: rgb(0.88, 0.9, 0.93) });
  y -= 20;

  page.drawText('Total', { x: left + 350, y, size: 11, font: fontBold });
  page.drawText(formatMoney(invoice.amount), { x: left + 420, y, size: 12, font: fontBold });

  y -= 30;
  page.drawText(businessProfile.paymentTerms || 'Paiement a reception de facture.', {
    x: left,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.45, 0.5),
  });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
