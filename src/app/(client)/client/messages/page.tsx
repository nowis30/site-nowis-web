import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { ClientMessagesPanel } from '@/features/client-portal/components/ClientMessagesPanel';
import { safeListMessages } from '@/lib/messages-store';

export default async function ClientMessagesPage() {
  const session = await requireClientPortalSession();

  const messages = await safeListMessages(session.contactId);

  return (
    <ClientMessagesPanel
      initialItems={messages.map((item) => ({
        id: item.id,
        senderType: item.senderType,
        content: item.content,
        createdAt: item.createdAt.toISOString(),
        isRead: item.isRead,
      }))}
    />
  );
}
