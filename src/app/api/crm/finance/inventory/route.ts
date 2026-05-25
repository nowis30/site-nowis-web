import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { isFinanceInventoryCategory } from '@/features/crm/finance/constants';

const inventoryCreateSchema = z.object({
  sku: z.string().trim().max(80).optional().nullable(),
  label: z.string().trim().min(1).max(160),
  category: z.string().trim().optional(),
  description: z.string().trim().max(500).optional().nullable(),
  purchaseUnitCost: z.number().nonnegative(),
  salePrice: z.number().nonnegative(),
  quantityPurchased: z.number().int().nonnegative(),
  quantityRemaining: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

const inventoryUpdateSchema = z.object({
  id: z.string().uuid(),
  sku: z.string().trim().max(80).optional().nullable(),
  label: z.string().trim().min(1).max(160).optional(),
  category: z.string().trim().optional(),
  description: z.string().trim().max(500).optional().nullable(),
  purchaseUnitCost: z.number().nonnegative().optional(),
  salePrice: z.number().nonnegative().optional(),
  restockQuantity: z.number().int().nonnegative().optional(),
  quantityRemaining: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

function normalizeInventoryCategory(value: string | undefined) {
  if (!value) return 'OTHER';
  return isFinanceInventoryCategory(value) ? value : 'OTHER';
}

function sanitizeSku(value: string | null | undefined) {
  const raw = (value || '').trim().toUpperCase();
  return raw.length > 0 ? raw : null;
}

async function ensureUniqueSku(tx: Prisma.TransactionClient, baseSku: string) {
  let nextSku = baseSku;
  let suffix = 1;
  while (await tx.financeInventoryItem.findUnique({ where: { sku: nextSku }, select: { id: true } })) {
    nextSku = `${baseSku}-${suffix}`;
    suffix += 1;
  }
  return nextSku;
}

async function buildSku(tx: Prisma.TransactionClient, requestedSku: string | null, label: string) {
  const compactLabel = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  const fallbackBase = compactLabel || 'PRODUIT';
  const baseSku = requestedSku ?? `${fallbackBase}-${Date.now().toString().slice(-6)}`;
  return ensureUniqueSku(tx, baseSku);
}

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'finance', 'read');
  if (guard.error) return guard.error;

  const items = await prisma.financeInventoryItem.findMany({
    include: {
      movements: {
        orderBy: { movedAt: 'desc' },
        take: 10,
      },
    },
    orderBy: { label: 'asc' },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const guard = requireApiPermission(request, 'finance', 'create');
  if (guard.error) return guard.error;

  try {
    const payload = inventoryCreateSchema.parse(await request.json());
    const item = await prisma.$transaction(async (tx) => {
      const sku = await buildSku(tx, sanitizeSku(payload.sku), payload.label);
      const quantityRemaining = payload.quantityRemaining ?? payload.quantityPurchased;
      const created = await tx.financeInventoryItem.create({
        data: {
          sku,
          label: payload.label,
          category: normalizeInventoryCategory(payload.category),
          description: payload.description?.trim() || null,
          purchaseUnitCost: new Prisma.Decimal(payload.purchaseUnitCost),
          salePrice: new Prisma.Decimal(payload.salePrice),
          quantityPurchased: payload.quantityPurchased,
          quantityRemaining,
          quantitySold: 0,
          lowStockThreshold: payload.lowStockThreshold ?? 3,
          active: payload.active ?? true,
        },
      });

      if (payload.quantityPurchased > 0) {
        await tx.financeInventoryMovement.create({
          data: {
            inventoryItemId: created.id,
            kind: 'PURCHASE',
            quantityDelta: payload.quantityPurchased,
            reason: 'Stock initial',
          },
        });
      }

      return created;
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    console.error('[CRM_FINANCE_INVENTORY_POST]', error);
    return NextResponse.json({ error: 'Création impossible' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const guard = requireApiPermission(request, 'finance', 'update');
  if (guard.error) return guard.error;

  try {
    const payload = inventoryUpdateSchema.parse(await request.json());
    const item = await prisma.$transaction(async (tx) => {
      const existing = await tx.financeInventoryItem.findUnique({ where: { id: payload.id } });
      if (!existing) {
        throw new Error('ITEM_NOT_FOUND');
      }

      const data: Prisma.FinanceInventoryItemUpdateInput = {};

      if (typeof payload.label === 'string') data.label = payload.label;
      if (typeof payload.category === 'string') data.category = normalizeInventoryCategory(payload.category);
      if (payload.description !== undefined) data.description = payload.description?.trim() || null;
      if (typeof payload.purchaseUnitCost === 'number') data.purchaseUnitCost = new Prisma.Decimal(payload.purchaseUnitCost);
      if (typeof payload.salePrice === 'number') data.salePrice = new Prisma.Decimal(payload.salePrice);
      if (typeof payload.lowStockThreshold === 'number') data.lowStockThreshold = payload.lowStockThreshold;
      if (typeof payload.active === 'boolean') data.active = payload.active;

      if (payload.sku !== undefined) {
        const requestedSku = sanitizeSku(payload.sku);
        if (!requestedSku) {
          throw new Error('SKU_EMPTY');
        }
        if (requestedSku !== existing.sku) {
          const duplicate = await tx.financeInventoryItem.findUnique({ where: { sku: requestedSku }, select: { id: true } });
          if (duplicate) {
            throw new Error('SKU_EXISTS');
          }
          data.sku = requestedSku;
        }
      }

      let remainingAfter = existing.quantityRemaining;
      let purchasedAfter = existing.quantityPurchased;
      const restockQuantity = payload.restockQuantity ?? 0;

      if (restockQuantity > 0) {
        purchasedAfter += restockQuantity;
        remainingAfter += restockQuantity;
      }

      if (typeof payload.quantityRemaining === 'number') {
        remainingAfter = payload.quantityRemaining;
      }

      if (restockQuantity > 0 || typeof payload.quantityRemaining === 'number') {
        data.quantityPurchased = purchasedAfter;
        data.quantityRemaining = remainingAfter;
      }

      const updated = await tx.financeInventoryItem.update({
        where: { id: payload.id },
        data,
      });

      if (restockQuantity > 0) {
        await tx.financeInventoryMovement.create({
          data: {
            inventoryItemId: updated.id,
            kind: 'PURCHASE',
            quantityDelta: restockQuantity,
            reason: 'Réapprovisionnement manuel',
          },
        });
      }

      if (typeof payload.quantityRemaining === 'number') {
        const delta = payload.quantityRemaining - (existing.quantityRemaining + restockQuantity);
        if (delta !== 0) {
          await tx.financeInventoryMovement.create({
            data: {
              inventoryItemId: updated.id,
              kind: 'ADJUSTMENT',
              quantityDelta: delta,
              reason: 'Ajustement manuel du stock',
            },
          });
        }
      }

      return updated;
    });

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message === 'ITEM_NOT_FOUND') return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
      if (error.message === 'SKU_EMPTY') return NextResponse.json({ error: 'Le SKU ne peut pas être vide' }, { status: 400 });
      if (error.message === 'SKU_EXISTS') return NextResponse.json({ error: 'Ce SKU est déjà utilisé' }, { status: 409 });
    }

    console.error('[CRM_FINANCE_INVENTORY_PATCH]', error);
    return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 500 });
  }
}
