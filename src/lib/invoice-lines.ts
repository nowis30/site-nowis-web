export interface ParsedInvoiceLine {
  description: string;
  amount: number | null;
}

export interface RentalInvoiceDraftLine {
  tenantName: string;
  rentalLabel: string;
  amount: number;
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
