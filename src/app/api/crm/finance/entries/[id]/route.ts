import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import {
  FINANCE_ENTRY_STATUSES,
  FINANCE_EXPENSE_CATEGORIES,
  FINANCE_PAYMENT_METHODS,
  FINANCE_SALE_TYPES,
  isFinanceEntryStatus,
  isFinanceExpenseCategory,
  isFinanceInventoryCategory,
  isFinancePaymentMethod,
  isFinanceSaleType,
} from '@/features/crm/finance/constants';

const entryUpdateSchema = z.object({
  entryDate: z.string().optional(),
  counterpartyName: z.string().trim().max(120).optional().nullable(),
  category: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  quantity: z.number().int().positive().optional(),
  amountBeforeTax: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(),
  paymentMethod: z.string().trim().optional(),
  status: z.string().trim().optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

type RouteParams = {
  params: {
    id: string;
  };
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'finance', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = entryUpdateSchema.parse(await request.json());

    const item = await prisma.$transaction(async (tx) => {
      const existing = await tx.financeEntry.findUnique({
        where: { id: params.id },
      });

      if (!existing) {
        throw new Error('ENTRY_NOT_FOUND');
      }

      const data: Prisma.FinanceEntryUpdateInput = {};

      if (payload.entryDate) {
        data.entryDate = new Date(payload.entryDate);
      }
      if (payload.counterpartyName !== undefined) {
        data.counterpartyName = payload.counterpartyName?.trim() || null;
      }
      if (payload.description !== undefined) {
        data.description = payload.description?.trim() || null;
      }
      if (payload.notes !== undefined) {
        data.notes = payload.notes?.trim() || null;
      }

      if (payload.paymentMethod !== undefined) {
        const paymentMethod = isFinancePaymentMethod(payload.paymentMethod)
          ? payload.paymentMethod
          : 'OTHER';
        data.paymentMethod = paymentMethod as (typeof FINANCE_PAYMENT_METHODS)[number];
      }

      if (payload.status !== undefined) {
        const status = isFinanceEntryStatus(payload.status) ? payload.status : existing.status;
        data.status = status as (typeof FINANCE_ENTRY_STATUSES)[number];
      }

      if (payload.category !== undefined) {
        const normalized = payload.category.trim();
        if (existing.kind === 'SALE') {
          const validSaleCategory = isFinanceSaleType(normalized) || isFinanceInventoryCategory(normalized) ? normalized : 'OTHER';
          data.category = validSaleCategory;
        } else {
          const validExpenseCategory = isFinanceExpenseCategory(normalized) ? normalized : 'OTHER';
          data.category = validExpenseCategory;
        }
      }

      const nextAmountBeforeTax = payload.amountBeforeTax ?? Number(existing.amountBeforeTax);
      const nextTaxAmount = payload.taxAmount ?? Number(existing.taxAmount);

      if (payload.amountBeforeTax !== undefined) {
        data.amountBeforeTax = new Prisma.Decimal(nextAmountBeforeTax);
      }
      if (payload.taxAmount !== undefined) {
        data.taxAmount = new Prisma.Decimal(nextTaxAmount);
      }
      if (payload.amountBeforeTax !== undefined || payload.taxAmount !== undefined) {
        data.totalAmount = new Prisma.Decimal(nextAmountBeforeTax + nextTaxAmount);
      }

      if (payload.quantity !== undefined) {
        if (existing.kind === 'SALE') {
          throw new Error('SALE_QUANTITY_IMMUTABLE');
        }
        data.quantity = payload.quantity;
      }

      return tx.financeEntry.update({
        where: { id: existing.id },
        data,
      });
    });

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message === 'ENTRY_NOT_FOUND') return NextResponse.json({ error: 'Écriture introuvable' }, { status: 404 });
      if (error.message === 'SALE_QUANTITY_IMMUTABLE') {
        return NextResponse.json({ error: 'La quantité d’une vente ne peut pas être modifiée (supprime puis recrée la vente).' }, { status: 400 });
      }
    }

    console.error('[CRM_FINANCE_ENTRY_PATCH]', error);
    return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const guard = requireApiPermission(request, 'finance', 'delete');
  if (guard.error) return guard.error;

  try {
    await prisma.$transaction(async (tx) => {
      const entry = await tx.financeEntry.findUnique({
        where: { id: params.id },
        include: {
          inventoryMovements: {
            include: {
              inventoryItem: {
                select: {
                  id: true,
                  quantitySold: true,
                  quantityRemaining: true,
                },
              },
            },
          },
        },
      });

      if (!entry) {
        throw new Error('ENTRY_NOT_FOUND');
      }

      // On annule les impacts stock de la vente avant suppression.
      if (entry.kind === 'SALE') {
        for (const movement of entry.inventoryMovements) {
          const deltaAbs = Math.abs(movement.quantityDelta);
          if (deltaAbs === 0) continue;

          const currentSold = movement.inventoryItem.quantitySold;
          const currentRemaining = movement.inventoryItem.quantityRemaining;

          await tx.financeInventoryItem.update({
            where: { id: movement.inventoryItem.id },
            data: {
              quantitySold: Math.max(0, currentSold - deltaAbs),
              quantityRemaining: currentRemaining + deltaAbs,
            },
          });
        }
      }

      await tx.financeInventoryMovement.deleteMany({
        where: { financeEntryId: entry.id },
      });

      await tx.financeEntry.delete({
        where: { id: entry.id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'ENTRY_NOT_FOUND') {
      return NextResponse.json({ error: 'Écriture introuvable' }, { status: 404 });
    }

    console.error('[CRM_FINANCE_ENTRY_DELETE]', error);
    return NextResponse.json({ error: 'Suppression impossible' }, { status: 500 });
  }
}
