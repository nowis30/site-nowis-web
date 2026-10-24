import type { Prisma } from '@prisma/client';

/** Bills a customer may see. Drafts stay internal unless a PayPal payment link already exists. */
const issuedStatuses = ['SENT', 'PAID', 'OVERDUE', 'CANCELLED'] as const;

export function clientVisibleInvoiceWhere(contactId?: string): Prisma.InvoiceWhereInput {
  return {
    ...(contactId ? { contactId } : {}),
    isTest: false,
    deletedAt: null,
    archivedAt: null,
    OR: [
      { status: { in: [...issuedStatuses] } },
      { paypalInvoiceUrl: { not: null } },
    ],
  };
}
