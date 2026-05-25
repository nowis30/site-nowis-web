import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { isFinancePaymentMethod } from '@/features/crm/finance/constants';

const paymentSchema = z.object({
  amount: z.number().nonnegative(),
  paymentMethod: z.string().trim().optional(),
  note: z.string().trim().max(500).optional().nullable(),
  paidAt: z.string().optional(),
  receiptDocumentId: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireApiPermission(request, 'invoices', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = paymentSchema.parse(await request.json());
    const paymentMethod = (isFinancePaymentMethod(payload.paymentMethod || '') ? payload.paymentMethod : 'OTHER') as 'CASH' | 'DEBIT' | 'CREDIT' | 'PAYPAL' | 'TRANSFER' | 'OTHER';

    const item = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: params.id } });
      if (!invoice) {
        throw new Error('INVOICE_NOT_FOUND');
      }

      if (payload.receiptDocumentId) {
        const receipt = await tx.fileDocument.findUnique({ where: { id: payload.receiptDocumentId }, select: { id: true } });
        if (!receipt) {
          throw new Error('RECEIPT_NOT_FOUND');
        }
      }

      const totalPaid = await tx.invoicePaymentHistory.aggregate({
        where: { invoiceId: invoice.id },
        _sum: { amount: true },
      });

      const nextTotalPaid = new Prisma.Decimal(totalPaid._sum.amount || 0).add(payload.amount);
      const invoiceTarget = invoice.totalAmount ?? invoice.amount;
      const shouldBePaid = nextTotalPaid.greaterThanOrEqualTo(new Prisma.Decimal(invoiceTarget));

      const payment = await tx.invoicePaymentHistory.create({
        data: {
          invoiceId: invoice.id,
          receiptDocumentId: payload.receiptDocumentId ?? null,
          createdById: guard.session.sub,
          paidAt: payload.paidAt ? new Date(payload.paidAt) : new Date(),
          amount: new Prisma.Decimal(payload.amount),
          paymentMethod,
          note: payload.note?.trim() || null,
        },
      });

      const updated = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paymentAmount: nextTotalPaid,
          paymentStatus: shouldBePaid ? 'PAID' : 'PARTIAL',
          status: shouldBePaid ? 'PAID' : invoice.status === 'DRAFT' ? 'SENT' : invoice.status,
          paypalPaidAt: shouldBePaid ? payload.paidAt ? new Date(payload.paidAt) : new Date() : invoice.paypalPaidAt,
          paymentProvider: paymentMethod,
        },
      });

      return { payment, invoice: updated };
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message === 'INVOICE_NOT_FOUND') return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
      if (error.message === 'RECEIPT_NOT_FOUND') return NextResponse.json({ error: 'Reçu introuvable' }, { status: 404 });
    }

    console.error('[CRM_INVOICE_PAYMENT_POST]', error);
    return NextResponse.json({ error: 'Paiement impossible' }, { status: 500 });
  }
}
