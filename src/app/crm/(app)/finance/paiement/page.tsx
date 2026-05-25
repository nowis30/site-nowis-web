import { redirect } from 'next/navigation';
import { can } from '@/features/crm/auth/permissions';
import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { FinancePaymentFormPage } from '@/features/crm/components/finance/FinanceFormPages';

export default async function FinancePaymentPage() {
  const session = await requireCrmSession();
  if (!can(session.role, 'invoices', 'update')) {
    redirect('/crm/finance');
  }

  const invoices = await prisma.invoice.findMany({
    where: { status: { in: ['DRAFT', 'SENT', 'OVERDUE'] } },
    include: { contact: { select: { fullName: true } } },
    orderBy: { dueDate: 'asc' },
    take: 80,
  });

  return (
    <FinancePaymentFormPage
      invoices={invoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        contact: { fullName: invoice.contact.fullName },
      }))}
    />
  );
}
