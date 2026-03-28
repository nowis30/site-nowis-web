import { requireCrmSession } from '@/features/crm/auth/session';
import { ModulePage } from '@/features/crm/components/modules/ModulePage';

export default async function WorkshopRequestsPage() {
  const session = await requireCrmSession();
  return <ModulePage role={session.role} moduleKey="workshopRequests" />;
}
