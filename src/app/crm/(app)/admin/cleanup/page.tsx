import { requireCrmSession } from '@/features/crm/auth/session';
import { redirect } from 'next/navigation';
import { CrmCleanupPage } from '@/features/crm/components/cleanup/CrmCleanupPage';

export const metadata = { title: 'Nettoyage CRM — Admin' };

export default async function AdminCleanupPage() {
  const session = await requireCrmSession();

  if (session.role !== 'ADMIN') {
    redirect('/crm/dashboard');
  }

  return <CrmCleanupPage />;
}
