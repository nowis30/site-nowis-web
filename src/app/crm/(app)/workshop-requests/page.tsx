import Link from 'next/link';
import { requireCrmSession } from '@/features/crm/auth/session';
import { ModulePage } from '@/features/crm/components/modules/ModulePage';

export default async function WorkshopRequestsPage() {
  const session = await requireCrmSession();
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-primary-500/25 bg-primary-500/10 p-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-semibold text-white">Section atelier</h1>
            <p className="mt-1 text-sm text-primary-50">Créez un atelier pour une organisation ou un client individuel, puis partagez le lien de rendez-vous.</p>
          </div>
          <Link href="/crm/workshop-requests/create" className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-500">
            Créer un atelier
          </Link>
        </div>
      </div>

      <ModulePage role={session.role} moduleKey="workshopRequests" />
    </section>
  );
}
