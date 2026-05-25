import { redirect } from 'next/navigation';
import { can } from '@/features/crm/auth/permissions';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { FinanceInventoryFormPage } from '@/features/crm/components/finance/FinanceFormPages';

export default async function FinanceInventoryPage() {
  const session = await requireCrmSession();
  if (!can(session.role, 'finance', 'create')) {
    redirect('/crm/finance');
  }

  const inventory = await prisma.financeInventoryItem.findMany({ orderBy: { label: 'asc' } });

  return (
    <FinanceInventoryFormPage
      inventory={inventory.map((item) => ({
        id: item.id,
        sku: item.sku,
        label: item.label,
        category: item.category,
        description: item.description,
        active: item.active,
        lowStockThreshold: item.lowStockThreshold,
        quantityPurchased: item.quantityPurchased,
        quantitySold: item.quantitySold,
        quantityRemaining: item.quantityRemaining,
        purchaseUnitCost: item.purchaseUnitCost.toString(),
        salePrice: item.salePrice.toString(),
      }))}
    />
  );
}
