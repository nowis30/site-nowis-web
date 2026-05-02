import type { Metadata } from 'next';
import { getClientPortalSessionServer } from '@/features/client-portal/auth/session';
import { ClientPortalShell } from '@/features/client-portal/components/ClientPortalShell';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ClientAreaLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await getClientPortalSessionServer();
  } catch {
    session = null;
  }

  if (!session) {
    return <>{children}</>;
  }

  return <ClientPortalShell session={session}>{children}</ClientPortalShell>;
}