import { requireCrmSession } from '@/features/crm/auth/session';
import { CrmShell } from '@/features/crm/components/layout/CrmShell';

export default async function CrmAppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireCrmSession();

  return <CrmShell session={session}>{children}</CrmShell>;
}
