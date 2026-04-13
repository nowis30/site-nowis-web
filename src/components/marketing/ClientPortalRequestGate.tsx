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
    <section className="warm-spotlight-panel p-8 shadow-card md:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">Portail client requis</p>
      <h2 className="mt-4 text-3xl font-semibold leading-tight text-[color:var(--site-heading)] md:text-4xl">{title}</h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--site-muted)] md:text-base">{description}</p>

      <ol className="mt-8 grid gap-3 text-sm md:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-3 rounded-xl border border-[rgba(131,97,67,0.12)] bg-white/72 px-4 py-3">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(201,117,71,0.12)] text-xs font-bold text-[color:var(--site-accent-strong)]">
              {index + 1}
            </span>
            <span className="text-[color:var(--site-heading)]">{step}</span>
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
          className="inline-flex items-center justify-center rounded-xl border border-[rgba(131,97,67,0.12)] bg-white/75 px-5 py-3 text-sm font-semibold text-[color:var(--site-heading)] transition hover:bg-white"
        >
          Se connecter
        </Link>
        {showBackToPortal ? (
          <Link
            href={nextPath}
            className="inline-flex items-center justify-center rounded-xl border border-[rgba(131,97,67,0.12)] bg-white/75 px-5 py-3 text-sm font-semibold text-[color:var(--site-accent-strong)] transition hover:bg-white"
          >
            Ouvrir la section portail
          </Link>
        ) : null}
      </div>
    </section>
  );
}
