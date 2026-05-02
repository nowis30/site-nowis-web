import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { ClientMessagesRetiredCard } from '@/features/client-portal/components/ClientMessagesRetiredCard';

export default async function ClientMessagesPage() {
  await requireClientPortalSession();

  return <ClientMessagesRetiredCard />;
}
