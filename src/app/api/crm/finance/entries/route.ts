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

const entrySchema = z.object({
  kind: z.enum(['SALE', 'EXPENSE']),
  entryDate: z.string().optional(),
  inventoryItemId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  invoiceId: z.string().uuid().optional().nullable(),
  receiptDocumentId: z.string().uuid().optional().nullable(),
  counterpartyName: z.string().trim().max(120).optional().nullable(),
  category: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  quantity: z.number().int().positive().optional(),
  amountBeforeTax: z.number().nonnegative(),
  taxAmount: z.number().nonnegative().optional(),
  paymentMethod: z.string().trim().optional(),
  status: z.string().trim().optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'finance', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = entrySchema.parse(await request.json());
    const paymentMethod = (isFinancePaymentMethod(payload.paymentMethod || '') ? payload.paymentMethod : 'OTHER') as (typeof FINANCE_PAYMENT_METHODS)[number];
    const status = (isFinanceEntryStatus(payload.status || '') ? payload.status : 'PAID') as (typeof FINANCE_ENTRY_STATUSES)[number];
    const quantity = payload.kind === 'SALE' ? (payload.quantity ?? 1) : 1;
    const payloadCategory = (payload.category || '').trim();
    const fallbackCategory: string = payload.kind === 'EXPENSE'
      ? (isFinanceExpenseCategory(payloadCategory) ? payloadCategory : 'OTHER')
      : (isFinanceSaleType(payloadCategory) || isFinanceInventoryCategory(payloadCategory) ? payloadCategory : 'OTHER');

    const item = await prisma.$transaction(async (tx) => {
      let amountBeforeTax = payload.amountBeforeTax;
      const taxAmount = payload.taxAmount ?? 0;
      let category = fallbackCategory;
      let description = payload.description?.trim() || null;

      if (payload.contactId) {
        const contact = await tx.contact.findUnique({ where: { id: payload.contactId }, select: { id: true } });
        if (!contact) {
          throw new Error('CONTACT_NOT_FOUND');
        }
      }

      if (payload.invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: payload.invoiceId }, select: { id: true } });
        if (!invoice) {
          throw new Error('INVOICE_NOT_FOUND');
        }
      }

      if (payload.receiptDocumentId) {
        const receipt = await tx.fileDocument.findUnique({ where: { id: payload.receiptDocumentId }, select: { id: true } });
        if (!receipt) {
          throw new Error('RECEIPT_NOT_FOUND');
        }
      }

      let inventoryItemForSale: {
        id: string;
        sku: string;
        label: string;
        category: string;
        active: boolean;
        quantityRemaining: number;
        quantitySold: number;
        salePrice: Prisma.Decimal;
      } | null = null;

      if (payload.kind === 'SALE' && payload.inventoryItemId) {
        const inventoryItem = await tx.financeInventoryItem.findUnique({
          where: { id: payload.inventoryItemId },
          select: {
            id: true,
            sku: true,
            label: true,
            category: true,
            active: true,
            quantityRemaining: true,
            quantitySold: true,
            salePrice: true,
          },
        });

        if (!inventoryItem) {
          throw new Error('INVENTORY_ITEM_NOT_FOUND');
        }
        if (!inventoryItem.active) {
          throw new Error('INVENTORY_ITEM_INACTIVE');
        }
        if (inventoryItem.quantityRemaining < quantity) {
          throw new Error('INSUFFICIENT_STOCK');
        }

        inventoryItemForSale = inventoryItem;
        const normalizedInventoryCategory = isFinanceInventoryCategory(inventoryItem.category)
          ? inventoryItem.category
          : inventoryItem.sku.startsWith('USB-')
            ? 'USB_KEY'
            : 'OTHER';
        category = normalizedInventoryCategory;
        description = payload.description?.trim() || inventoryItem.label;
        amountBeforeTax = Number(inventoryItem.salePrice) * quantity;

        if (inventoryItem.category !== normalizedInventoryCategory) {
          await tx.financeInventoryItem.update({
            where: { id: inventoryItem.id },
            data: { category: normalizedInventoryCategory },
          });
        }
      }

      const totalAmount = amountBeforeTax + taxAmount;

      const created = await tx.financeEntry.create({
        data: {
          kind: payload.kind,
          entryDate: payload.entryDate ? new Date(payload.entryDate) : new Date(),
          contactId: payload.contactId ?? null,
          invoiceId: payload.invoiceId ?? null,
          receiptDocumentId: payload.receiptDocumentId ?? null,
          createdById: guard.session.sub,
          counterpartyName: payload.counterpartyName?.trim() || null,
          category,
          description,
          quantity,
          amountBeforeTax: new Prisma.Decimal(amountBeforeTax),
          taxAmount: new Prisma.Decimal(taxAmount),
          totalAmount: new Prisma.Decimal(totalAmount),
          paymentMethod,
          status,
          notes: payload.notes?.trim() || null,
        },
      });

      if (payload.kind === 'SALE' && inventoryItemForSale) {
        await tx.financeInventoryItem.update({
          where: { id: inventoryItemForSale.id },
          data: {
            quantitySold: { increment: quantity },
            quantityRemaining: { decrement: quantity },
          },
        });
        await tx.financeInventoryMovement.create({
          data: {
            inventoryItemId: inventoryItemForSale.id,
            financeEntryId: created.id,
            kind: 'SALE',
            quantityDelta: -quantity,
            reason: `Vente ${inventoryItemForSale.label}`,
          },
        });
      }

      // Compatibilité rétroactive pour les anciennes ventes USB basées sur la catégorie.
      if (payload.kind === 'SALE' && !payload.inventoryItemId && isFinanceSaleType(payload.category || '')) {
        const sku = payload.category === 'USB_2GB' ? 'USB-2GB' : payload.category === 'USB_16GB' ? 'USB-16GB' : null;
        if (sku) {
          const inventoryItem = await tx.financeInventoryItem.findUnique({ where: { sku } });
          if (inventoryItem) {
            if (inventoryItem.quantityRemaining < quantity) {
              throw new Error('INSUFFICIENT_STOCK');
            }
            await tx.financeInventoryItem.update({
              where: { sku },
              data: {
                quantitySold: { increment: quantity },
                quantityRemaining: { decrement: quantity },
              },
            });
            await tx.financeInventoryMovement.create({
              data: {
                inventoryItemId: inventoryItem.id,
                financeEntryId: created.id,
                kind: 'SALE',
                quantityDelta: -quantity,
                reason: `Vente ${payload.category}`,
              },
            });
          }
        }
      }

      return created;
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message === 'CONTACT_NOT_FOUND') return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
      if (error.message === 'INVOICE_NOT_FOUND') return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
      if (error.message === 'RECEIPT_NOT_FOUND') return NextResponse.json({ error: 'Reçu introuvable' }, { status: 404 });
      if (error.message === 'INVENTORY_ITEM_NOT_FOUND') return NextResponse.json({ error: 'Produit d’inventaire introuvable' }, { status: 404 });
      if (error.message === 'INVENTORY_ITEM_INACTIVE') return NextResponse.json({ error: 'Ce produit est inactif et ne peut pas être vendu' }, { status: 400 });
      if (error.message === 'INSUFFICIENT_STOCK') return NextResponse.json({ error: 'Stock insuffisant pour la quantité demandée' }, { status: 400 });
    }

    console.error('[CRM_FINANCE_ENTRY_POST]', error);
    return NextResponse.json({ error: 'Création impossible' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'finance', 'read');
  if (guard.error) return guard.error;

  const kind = request.nextUrl.searchParams.get('kind');
  const items = await prisma.financeEntry.findMany({
    where: kind === 'SALE' || kind === 'EXPENSE' ? { kind } : {},
    include: {
      contact: { select: { id: true, fullName: true } },
      invoice: { select: { id: true, number: true, status: true } },
      receiptDocument: { select: { id: true, originalName: true } },
    },
    orderBy: { entryDate: 'desc' },
    take: 150,
  });

  return NextResponse.json({ items });
}
