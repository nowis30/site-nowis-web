import Link from 'next/link';
import { can } from '@/features/crm/auth/permissions';
import { requireCrmSession } from '@/features/crm/auth/session';
import { NewOrganizationForm } from '@/features/crm/components/organizations/NewOrganizationForm';

export default async function NewOrganizationPage() {
  const session = await requireCrmSession();

  if (!can(session.role, 'organizations', 'create')) {
    return (
      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-2xl font-semibold text-white">Creation non autorisee</h2>
        <p className="text-sm text-slate-300">Votre role ne permet pas de creer une organisation.</p>
        <div>
          <Link
            href="/crm/organizations"
            className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-primary-500/40 hover:text-white"
          >
            Retour aux organisations
          </Link>
        </div>
      </section>
    );
  }

  return <NewOrganizationForm />;
}
