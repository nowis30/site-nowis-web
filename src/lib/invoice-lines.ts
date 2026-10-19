export interface ParsedInvoiceLine {
  description: string;
  amount: number | null;
}

export interface RentalInvoiceDraftLine {
  tenantName: string;
  rentalLabel: string;
  amount: number;
}

export interface TimeInvoiceDraftLine {
  description: string;
  hours: number;
  hourlyRate: number;
}

export function timeInvoiceLineAmount(line: TimeInvoiceDraftLine) {
  if (!Number.isFinite(line.hours) || line.hours <= 0 || line.hours > 100000
    || !Number.isFinite(line.hourlyRate) || line.hourlyRate <= 0 || line.hourlyRate > 100000) {
    throw new Error('Les heures et le tarif horaire doivent être supérieurs à 0 et ne pas dépasser 100 000.');
  }
  const amount = Math.round((line.hours * line.hourlyRate + Number.EPSILON) * 100) / 100;
  if (amount <= 0) throw new Error('Le montant de chaque prestation doit être au moins 0,01 $.');
  return amount;
}

export function buildTimeInvoiceDescription(lines: TimeInvoiceDraftLine[]) {
  if (lines.length === 0) throw new Error('Ajoutez au moins une prestation.');
  return lines.map((line) => {
    const description = line.description.replace(/[\r\n|]/g, ' ').trim();
    if (!description) throw new Error('Décrivez chaque prestation.');
    const amount = timeInvoiceLineAmount(line);
    return `${description} — ${line.hours} h x ${line.hourlyRate} $/h | ${amount.toFixed(2)} $`;
  }).join('\n');
}

const STRUCTURED_AMOUNT_SUFFIX = /^(.*?)\s+\|\s+([0-9]+(?:[.,][0-9]{1,2})?)\s*\$$/;

export function buildRentalInvoiceDescription(lines: RentalInvoiceDraftLine[]) {
  return lines
    .map((line) => {
      const tenant = line.tenantName.trim() || 'Locataire';
      const rental = line.rentalLabel.trim() || 'Logement';
      const amount = Math.max(0, Number(line.amount) || 0).toFixed(2);
      return `Logement loué — ${tenant} — ${rental} | ${amount} $`;
    })
    .join('\n');
}

export function parseInvoiceDescriptionLines(
  description: string | null | undefined,
  totalAmount: string | number,
): ParsedInvoiceLine[] {
  const rawLines = (description || 'Prestation professionnelle')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return rawLines.map((line, index) => {
    const match = line.match(STRUCTURED_AMOUNT_SUFFIX);
    if (match) {
      const parsedAmount = Number(match[2].replace(',', '.'));
      return {
        description: match[1].trim(),
        amount: Number.isFinite(parsedAmount) ? parsedAmount : null,
      };
    }

    return {
      description: line,
      amount: index === 0 ? Number(totalAmount) : null,
    };
  });
}

