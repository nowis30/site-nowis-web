export function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function formatMoney(value: string | number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(value));
}

export function buildDefaultInvoiceNumber(contactId: string) {
  return `INV-${contactId.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;
}

export function buildDefaultLeaseNumber(contactId: string) {
  return `LEA-${contactId.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-5)}`;
}
