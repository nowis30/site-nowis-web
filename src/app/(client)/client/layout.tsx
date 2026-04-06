import { getClientPortalSessionServer } from '@/features/client-portal/auth/session';
import { ClientPortalShell } from '@/features/client-portal/components/ClientPortalShell';
import { safeCountUnreadAdminMessages } from '@/lib/messages-store';

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

  let unreadMessages = 0;
  try {
    unreadMessages = await safeCountUnreadAdminMessages(session.contactId);
  } catch {
    unreadMessages = 0;
  }

  return <ClientPortalShell session={session} unreadMessages={unreadMessages}>{children}</ClientPortalShell>;
}