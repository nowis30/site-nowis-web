import { redirect } from 'next/navigation';
import { can } from '@/features/crm/auth/permissions';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { FinanceSaleFormPage } from '@/features/crm/components/finance/FinanceFormPages';

export default async function FinanceSalePage() {
  const session = await requireCrmSession();
  if (!can(session.role, 'finance', 'create')) {
    redirect('/crm/finance');
  }

  const [contacts, invoices, inventory] = await Promise.all([
    prisma.contact.findMany({
      where: { crmStatus: { not: 'DELETED' } },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
      take: 120,
    }),
    prisma.invoice.findMany({
      where: { status: { in: ['DRAFT', 'SENT', 'OVERDUE'] } },
      include: { contact: { select: { fullName: true } } },
      orderBy: { dueDate: 'asc' },
      take: 80,
    }),
    prisma.financeInventoryItem.findMany({
      where: { active: true },
      orderBy: { label: 'asc' },
      select: {
        id: true,
        sku: true,
        label: true,
        category: true,
        salePrice: true,
        quantityRemaining: true,
        lowStockThreshold: true,
      },
    }),
  ]);

  return (
    <FinanceSaleFormPage
      contacts={contacts.map((contact) => ({ id: contact.id, label: contact.fullName }))}
      invoices={invoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        contact: { fullName: invoice.contact.fullName },
      }))}
      inventory={inventory.map((item) => ({
        id: item.id,
        sku: item.sku,
        label: item.label,
        category: item.category,
        salePrice: item.salePrice.toString(),
        quantityRemaining: item.quantityRemaining,
        lowStockThreshold: item.lowStockThreshold,
      }))}
    />
  );
}
