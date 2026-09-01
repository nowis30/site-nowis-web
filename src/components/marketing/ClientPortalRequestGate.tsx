import Link from 'next/link';

interface ClientPortalRequestGateProps {
  nextPath: string;
  title?: string;
  description?: string;
  showBackToPortal?: boolean;
}

const steps = [
  'Créez votre compte',
  'Connectez-vous au portail',
  'Remplissez votre demande',
  'Suivez votre dossier',
];

export function ClientPortalRequestGate({
  nextPath,
  title = 'Les demandes se font maintenant à partir du portail client',
  description = 'Pour envoyer une demande de chanson, d\'atelier ou de service, vous devez d\'abord créer votre accès client. Une fois connecté, vous pourrez remplir votre demande et suivre votre dossier dans votre portail.',
  showBackToPortal = false,
}: ClientPortalRequestGateProps) {
  const encodedNext = encodeURIComponent(nextPath);

  return (
    <section className="warm-spotlight-panel p-7 shadow-card sm:p-8 md:p-10">
      <span className="brand-chip inline-flex">Portail client requis</span>
      <h2 className="mt-5 font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">{title}</h2>
      <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--site-muted)]">{description}</p>

      <ol className="mt-8 grid gap-3 text-sm md:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step} className="flex min-h-14 items-center gap-3 rounded-2xl border border-black/10 bg-white/72 px-4 py-3">
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(201,117,71,0.12)] text-xs font-bold text-[color:var(--site-accent-strong)]"
            >
              {index + 1}
            </span>
            <span className="font-medium text-[color:var(--site-heading)]">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={`/inscription?next=${encodedNext}`}
          className="cta-primary inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-center text-sm font-semibold shadow-fire transition hover:-translate-y-0.5 hover:brightness-110 motion-reduce:transform-none motion-reduce:transition-none"
        >
          S’inscrire au portail
        </Link>
        <Link
          href={`/connexion?next=${encodedNext}`}
          className="cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-center text-sm font-semibold"
        >
          Se connecter
        </Link>
        {showBackToPortal ? (
          <Link
            href={nextPath}
            className="cta-secondary inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-center text-sm font-semibold"
          >
            Ouvrir la section portail
          </Link>
        ) : null}
      </div>
    </section>
  );
}
