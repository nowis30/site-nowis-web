import Link from 'next/link';
import { redirect } from 'next/navigation';
import { can } from '@/features/crm/auth/permissions';
import { requireCrmSession } from '@/features/crm/auth/session';
import { immobilierServiceUrl } from '@/lib/immobilier-service';

const ROLES = [
  { title: 'Gestionnaire', detail: 'Immeubles, logements, suivis et équipe.' },
  { title: 'Équipe de location', detail: 'Logements confiés, contacts et visites.' },
  { title: 'Propriétaire', detail: 'Ses immeubles et les pièces qui le concernent.' },
  { title: 'Locataire', detail: 'Son logement, ses demandes et ses documents.' },
  { title: 'Recherche de logement', detail: 'Une demande, puis le catalogue quand il est ouvert.' },
];

export default async function CrmImmobilierPage() {
  const session = await requireCrmSession();
  if (!can(session.role, 'dashboard', 'read')) {
    redirect('/crm/dashboard');
  }

  const crm = immobilierServiceUrl(process.env.NOWIS_IMMOBILIER_URL);

  return (
    <section className="space-y-5 pb-10">
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 sm:p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-primary-300">NOWIS Immobilier</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Le bureau des immeubles</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Les immeubles, les baux, les loyers et les accès de l’équipe vivent dans NOWIS Immobilier, un logiciel distinct de ce registre de chansons, de spectacles et d’ateliers.
        </p>
      </div>

      <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-white">Les rôles du bureau</h2>
        <p className="mt-1 text-sm text-slate-400">
          Le même découpage que le portail déjà en service chez une entreprise cliente : chacun ouvre seulement les dossiers de son rôle.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {ROLES.map((role) => (
            <div key={role.title} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="font-medium text-white">{role.title}</p>
              <p className="mt-1 text-sm text-slate-400">{role.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-white">Où travailler</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Les anciennes adresses de logements de ce CRM sont retirées. Les ventes de musique restent ici. Les dossiers d’immeubles s’ouvrent dans l’espace immobilier, une fois qu’il est activé pour ton entreprise.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {crm ? (
            <a href={`${crm}/connexion/gestionnaire`} className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white">
              Ouvrir NOWIS Immobilier
            </a>
          ) : (
            <p className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300">
              L’accès immobilier n’est pas encore activé sur ce site.
            </p>
          )}
          <Link href="/immobilier" className="rounded-xl border border-slate-700 px-4 py-2 text-slate-200">
            Voir la page publique
          </Link>
          <Link href="/crm/finance" className="rounded-xl border border-slate-700 px-4 py-2 text-slate-200">
            Revenir au registre musique
          </Link>
        </div>
      </article>
    </section>
  );
}
