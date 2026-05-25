import { redirect } from 'next/navigation';
import { can } from '@/features/crm/auth/permissions';
import { requireCrmSession } from '@/features/crm/auth/session';
import { FinanceExpenseFormPage } from '@/features/crm/components/finance/FinanceFormPages';

export default async function FinanceExpensePage() {
  const session = await requireCrmSession();
  if (!can(session.role, 'finance', 'create')) {
    redirect('/crm/finance');
  }

  return <FinanceExpenseFormPage />;
}
