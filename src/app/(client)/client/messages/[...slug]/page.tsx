import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { ClientMessagesRetiredCard } from '@/features/client-portal/components/ClientMessagesRetiredCard';

export default async function LegacyClientMessagesPage() {
  await requireClientPortalSession();

  return <ClientMessagesRetiredCard />;
}