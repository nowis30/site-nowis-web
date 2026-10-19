import { Prisma, type PrismaClient } from '@prisma/client';

export interface ManualInvoicePayment {
  amount?: number;
  settleBalance?: boolean;
  paymentMethod: 'CASH' | 'DEBIT' | 'CREDIT' | 'PAYPAL' | 'TRANSFER' | 'OTHER';
  paidAt?: string;
  note?: string | null;
  receiptDocumentId?: string | null;
}

// Serializable transactions prevent concurrent submissions from settling the same balance twice.
export async function recordManualInvoicePayment(db: PrismaClient, invoiceId: string, actorId: string, input: ManualInvoicePayment) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
        if (!invoice) throw new Error('INVOICE_NOT_FOUND');
        if (['CANCELLED', 'ARCHIVED', 'DELETED'].includes(invoice.status)) throw new Error('INVOICE_NOT_PAYABLE');
        if (invoice.status === 'PAID' || invoice.paymentStatus === 'PAID') {
          if (input.settleBalance) return { invoice, payment: null, alreadyPaid: true };
          throw new Error('INVOICE_ALREADY_PAID');
        }
        const history = await tx.invoicePaymentHistory.aggregate({ where: { invoiceId }, _sum: { amount: true } });
        // Older invoices and provider payments may have a total without a manual history row.
        const recorded = new Prisma.Decimal(invoice.paymentAmount || 0);
        const historyAmount = new Prisma.Decimal(history._sum.amount || 0);
        const paid = Prisma.Decimal.max(recorded, historyAmount);
        const target = new Prisma.Decimal(invoice.totalAmount ?? invoice.amount);
        const balance = target.sub(paid);
        if (balance.lessThanOrEqualTo(0)) throw new Error('INVOICE_ALREADY_PAID');
        const amount = input.settleBalance ? balance : new Prisma.Decimal(input.amount ?? 0);
        if (!amount.isFinite() || amount.lessThanOrEqualTo(0) || amount.decimalPlaces() > 2) throw new Error('INVALID_PAYMENT_AMOUNT');
        if (amount.greaterThan(balance)) throw new Error('PAYMENT_EXCEEDS_BALANCE');
        if (input.receiptDocumentId) {
          const receipt = await tx.fileDocument.findUnique({ where: { id: input.receiptDocumentId }, select: { id: true } });
          if (!receipt) throw new Error('RECEIPT_NOT_FOUND');
        }
        const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
        const nextPaid = paid.add(amount);
        const fullyPaid = nextPaid.greaterThanOrEqualTo(target);
        const payment = await tx.invoicePaymentHistory.create({ data: {
          invoiceId, createdById: actorId, amount, paidAt,
          paymentMethod: input.paymentMethod, note: input.note?.trim() || null,
          receiptDocumentId: input.receiptDocumentId ?? null,
        } });
        const updated = await tx.invoice.update({ where: { id: invoiceId }, data: {
          paymentAmount: nextPaid,
          paymentStatus: fullyPaid ? 'PAID' : 'PARTIAL',
          status: fullyPaid ? 'PAID' : invoice.status === 'DRAFT' ? 'SENT' : invoice.status,
          paymentProvider: input.paymentMethod,
        } });
        return { payment, invoice: updated, alreadyPaid: false };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2) continue;
      throw error;
    }
  }
}
