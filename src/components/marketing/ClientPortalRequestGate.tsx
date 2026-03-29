import Link from 'next/link';

interface ClientPortalRequestGateProps {
  nextPath: string;
  title?: string;
  description?: string;
  showBackToPortal?: boolean;
}

const steps = [
  'Creez votre compte',
  'Connectez-vous au portail',
  'Remplissez votre demande',
  'Suivez votre dossier',
];

export function ClientPortalRequestGate({
  nextPath,
  title = 'Les demandes se font maintenant a partir du portail client',
  description = 'Pour envoyer une demande de chanson, d\'atelier ou de service, vous devez d\'abord creer votre acces client. Une fois connecte, vous pourrez remplir votre demande et suivre votre dossier dans votre portail.',
  showBackToPortal = false,
}: ClientPortalRequestGateProps) {
  const encodedNext = encodeURIComponent(nextPath);

  return (
    <section className="rounded-[2rem] border border-amber-300/30 bg-[linear-gradient(155deg,rgba(120,53,15,0.10),rgba(22,18,31,0.82))] p-8 text-white shadow-card md:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200">Portail client requis</p>
      <h2 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-4xl">{title}</h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-100 md:text-base">{description}</p>

      <ol className="mt-8 grid gap-3 text-sm md:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-xs font-bold text-amber-100">
              {index + 1}
            </span>
            <span className="text-slate-100">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/inscription?next=${encodedNext}`}
          className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-5 py-3 text-sm font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
        >
          S'inscrire au portail
        </Link>
        <Link
          href={`/connexion?next=${encodedNext}`}
          className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-slate-950/45 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Se connecter
        </Link>
        {showBackToPortal ? (
          <Link
            href={nextPath}
            className="inline-flex items-center justify-center rounded-xl border border-emerald-300/35 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
          >
            Ouvrir la section portail
          </Link>
        ) : null}
      </div>
    </section>
  );
}
