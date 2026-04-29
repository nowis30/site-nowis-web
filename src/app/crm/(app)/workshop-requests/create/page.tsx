import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireCrmSession } from '@/features/crm/auth/session';
import { CrmWorkshopCreateForm } from '@/features/workshops/components/CrmWorkshopCreateForm';

export default async function CreateWorkshopPage() {
  await requireCrmSession();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-white">Créer un atelier</h1>
        <Link
          href="/crm/workshop-requests"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 hover:border-primary-500/40 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </div>
      <CrmWorkshopCreateForm />
    </section>
  );
}
