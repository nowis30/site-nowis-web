import { getClientPortalSessionServer } from '@/features/client-portal/auth/session';
import { ClientPortalShell } from '@/features/client-portal/components/ClientPortalShell';
import { safeCountUnreadAdminMessages } from '@/lib/messages-store';

export default async function ClientAreaLayout({ children }: { children: React.ReactNode }) {
  const session = await getClientPortalSessionServer();

  if (!session) {
    return <>{children}</>;
  }

  const unreadMessages = await safeCountUnreadAdminMessages(session.contactId);

  return <ClientPortalShell session={session} unreadMessages={unreadMessages}>{children}</ClientPortalShell>;
}