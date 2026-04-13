import type { Metadata } from 'next';
import { requireCrmSession } from '@/features/crm/auth/session';
import { CrmShell } from '@/features/crm/components/layout/CrmShell';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CrmAppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireCrmSession();

  return <CrmShell session={session}>{children}</CrmShell>;
}
