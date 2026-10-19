import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { FINANCE_PAYMENT_METHODS } from '@/features/crm/finance/constants';
import { recordManualInvoicePayment } from '@/lib/server/manual-invoice-payments';

const paymentSchema = z.object({
  amount: z.number().finite().positive().max(99999999.99).multipleOf(0.01).optional(),
  settleBalance: z.boolean().optional(),
  paymentMethod: z.enum(FINANCE_PAYMENT_METHODS).default('OTHER'),
  note: z.string().trim().max(500).optional().nullable(),
  paidAt: z.string().datetime({ offset: true }).optional(),
  receiptDocumentId: z.string().uuid().optional().nullable(),
}).refine((value) => value.settleBalance ? value.amount === undefined : value.amount !== undefined, {
  message: 'Indique un montant ou demande le règlement du solde.',
});

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const guard = await requireApiPermission(request, 'invoices', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = paymentSchema.parse(await request.json());
    const item = await recordManualInvoicePayment(prisma, params.id, guard.session.sub, payload);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message === 'INVOICE_NOT_FOUND') return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
      const conflicts: Record<string, string> = {
        INVOICE_NOT_PAYABLE: 'Cette facture est annulée, archivée ou supprimée. Restaurez-la avant de consigner un paiement.',
        INVOICE_ALREADY_PAID: 'Cette facture est déjà payée.',
        PAYMENT_EXCEEDS_BALANCE: 'Le montant dépasse le solde de la facture.',
        INVALID_PAYMENT_AMOUNT: 'Le montant du paiement doit être positif, avec au maximum deux décimales.',
      };
      if (conflicts[error.message]) return NextResponse.json({ error: conflicts[error.message] }, { status: 409 });
      if (error.message === 'RECEIPT_NOT_FOUND') return NextResponse.json({ error: 'Reçu introuvable' }, { status: 404 });
    }

    console.error('[CRM_INVOICE_PAYMENT_POST]', error);
    return NextResponse.json({ error: 'Paiement impossible' }, { status: 500 });
  }
}

