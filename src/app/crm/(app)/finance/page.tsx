import { requireCrmSession } from '@/features/crm/auth/session';
import { can } from '@/features/crm/auth/permissions';
import { prisma } from '@/lib/prisma';
import { FinancePage } from '@/features/crm/components/finance/FinancePage';
import { redirect } from 'next/navigation';

function startOfMonth(date: Date) {
  const value = new Date(date);
  value.setDate(1);
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfYear(date: Date) {
  const value = new Date(date);
  value.setMonth(0, 1);
  value.setHours(0, 0, 0, 0);
  return value;
}

export default async function FinanceDashboardPage() {
  const session = await requireCrmSession();
  if (!can(session.role, 'finance', 'read')) {
    redirect('/crm/dashboard');
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const [
    monthSales,
    monthExpenses,
    yearSales,
    yearExpenses,
    sales,
    expenses,
    inventory,
    unpaidInvoices,
    topProducts,
    yearEntries,
    songsInProgress,
    songsDelivered,
    workshopsInProgress,
    workshopsDone,
  ] = await Promise.all([
    prisma.financeEntry.aggregate({ where: { kind: 'SALE', status: { not: 'CANCELLED' }, entryDate: { gte: monthStart } }, _sum: { totalAmount: true } }),
    prisma.financeEntry.aggregate({ where: { kind: 'EXPENSE', status: { not: 'CANCELLED' }, entryDate: { gte: monthStart } }, _sum: { totalAmount: true } }),
    prisma.financeEntry.aggregate({ where: { kind: 'SALE', status: { not: 'CANCELLED' }, entryDate: { gte: yearStart } }, _sum: { totalAmount: true } }),
    prisma.financeEntry.aggregate({ where: { kind: 'EXPENSE', status: { not: 'CANCELLED' }, entryDate: { gte: yearStart } }, _sum: { totalAmount: true } }),
    prisma.financeEntry.findMany({
      where: { kind: 'SALE' },
      include: { contact: { select: { fullName: true } } },
      orderBy: { entryDate: 'desc' },
      take: 20,
    }),
    prisma.financeEntry.findMany({
      where: { kind: 'EXPENSE' },
      include: { contact: { select: { fullName: true } } },
      orderBy: { entryDate: 'desc' },
      take: 20,
    }),
    prisma.financeInventoryItem.findMany({ orderBy: { label: 'asc' } }),
    prisma.invoice.count({
      where: { status: { in: ['SENT', 'OVERDUE'] } },
    }),
    prisma.financeEntry.groupBy({
      by: ['category'],
      where: { kind: 'SALE', status: { not: 'CANCELLED' }, entryDate: { gte: yearStart } },
      _sum: { totalAmount: true, quantity: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    }),
    prisma.financeEntry.findMany({
      where: { entryDate: { gte: yearStart } },
      select: {
        kind: true,
        entryDate: true,
        category: true,
        quantity: true,
        amountBeforeTax: true,
        taxAmount: true,
        totalAmount: true,
        status: true,
      },
    }),
    prisma.songRequest.count({
      where: {
        deletedAt: null,
        archivedAt: null,
        isTest: false,
        status: { in: ['NEW', 'CONTACTED', 'QUOTED', 'IN_PROGRESS', 'IN_PRODUCTION'] },
      },
    }),
    prisma.songRequest.count({
      where: {
        deletedAt: null,
        archivedAt: null,
        isTest: false,
        status: { in: ['DELIVERED', 'COMPLETED'] },
      },
    }),
    prisma.workshopRequest.count({
      where: {
        deletedAt: null,
        archivedAt: null,
        isTest: false,
        status: { in: ['BROUILLON', 'EN_ATTENTE_RDV', 'RDV_PLANIFIE', 'CONFIRME', 'NEW', 'CONTACTED', 'SCHEDULED'] },
      },
    }),
    prisma.workshopRequest.count({
      where: {
        deletedAt: null,
        archivedAt: null,
        isTest: false,
        status: { in: ['TERMINE', 'COMPLETED'] },
      },
    }),
  ]);

  const monthRevenue = Number(monthSales._sum.totalAmount || 0);
  const monthExpense = Number(monthExpenses._sum.totalAmount || 0);
  const yearRevenue = Number(yearSales._sum.totalAmount || 0);
  const yearExpense = Number(yearExpenses._sum.totalAmount || 0);

  const totalStockRemaining = inventory.reduce((total, item) => total + item.quantityRemaining, 0);
  const usbRemaining = inventory.reduce((total, item) => (
    item.category === 'USB_KEY' || item.sku.startsWith('USB-') ? total + item.quantityRemaining : total
  ), 0);

  return (
    <FinancePage
      metrics={{
        monthRevenue: monthRevenue.toString(),
        monthExpenses: monthExpense.toString(),
        monthProfit: (monthRevenue - monthExpense).toString(),
        yearRevenue: yearRevenue.toString(),
        yearExpenses: yearExpense.toString(),
        yearProfit: (yearRevenue - yearExpense).toString(),
        unpaidInvoices,
        stockRemaining: totalStockRemaining,
      }}
      topProducts={topProducts.map((item) => ({
        category: item.category,
        revenue: item._sum.totalAmount?.toString() ?? '0',
        quantity: item._sum.quantity ?? 0,
      }))}
      sales={sales.map((item) => ({
        id: item.id,
        kind: item.kind,
        entryDate: item.entryDate.toISOString(),
        counterpartyName: item.counterpartyName,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        amountBeforeTax: item.amountBeforeTax.toString(),
        taxAmount: item.taxAmount.toString(),
        totalAmount: item.totalAmount.toString(),
        paymentMethod: item.paymentMethod,
        status: item.status,
        notes: item.notes,
        contact: item.contact,
      }))}
      expenses={expenses.map((item) => ({
        id: item.id,
        kind: item.kind,
        entryDate: item.entryDate.toISOString(),
        counterpartyName: item.counterpartyName,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        amountBeforeTax: item.amountBeforeTax.toString(),
        taxAmount: item.taxAmount.toString(),
        totalAmount: item.totalAmount.toString(),
        paymentMethod: item.paymentMethod,
        status: item.status,
        notes: item.notes,
        contact: item.contact,
      }))}
      inventory={inventory.map((item) => ({
        id: item.id,
        sku: item.sku,
        label: item.label,
        category: item.category,
        description: item.description,
        purchaseUnitCost: item.purchaseUnitCost.toString(),
        salePrice: item.salePrice.toString(),
        quantityPurchased: item.quantityPurchased,
        quantitySold: item.quantitySold,
        quantityRemaining: item.quantityRemaining,
        lowStockThreshold: item.lowStockThreshold,
        active: item.active,
      }))}
      year={now.getFullYear()}
      ledger={yearEntries.map((item) => ({
        kind: item.kind,
        year: item.entryDate.getFullYear(),
        month: item.entryDate.getMonth(),
        category: item.category,
        quantity: item.quantity,
        amountBeforeTax: Number(item.amountBeforeTax),
        taxAmount: Number(item.taxAmount),
        totalAmount: Number(item.totalAmount),
        status: item.status,
      }))}
      operations={{
        songsInProgress,
        songsDelivered,
        workshopsInProgress,
        workshopsDone,
        usbRemaining,
      }}
    />
  );
}
