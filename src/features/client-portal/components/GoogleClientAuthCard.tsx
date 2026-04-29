import Link from 'next/link';

interface GoogleClientAuthCardProps {
  nextPath?: string;
  title?: string;
  description?: string;
  compact?: boolean;
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" role="img">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 6.9 2.4 2.8 6.5 2.8 11.6S6.9 20.8 12 20.8c6.9 0 9.2-4.8 9.2-7.3 0-.5 0-.8-.1-1.1z" />
      <path fill="#34A853" d="M3.8 7.9l3.2 2.3c.8-2.3 2.9-3.9 5.1-3.9 1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 8.5 2.4 5.4 4.4 3.8 7.9z" />
      <path fill="#4A90E2" d="M12 20.8c2.6 0 4.8-.9 6.4-2.5l-3-2.5c-.8.6-2 1.1-3.4 1.1-3.8 0-5.2-2.5-5.5-3.7l-3.2 2.5c1.6 3.6 4.8 5.1 8.7 5.1z" />
      <path fill="#FBBC05" d="M3.3 15.7l3.2-2.5c-.1-.3-.2-.8-.2-1.2s.1-.8.2-1.2L3.3 8.3C2.9 9.4 2.8 10.5 2.8 11.6c0 1.1.1 2.2.5 3.1z" />
    </svg>
  );
}

export function GoogleClientAuthCard({
  nextPath = '/client/dashboard',
  title = 'Créer mon compte gratuitement',
  description = 'Connecte-toi avec Google pour accéder à ton portail client, faire une demande de chanson, réserver un atelier ou consulter tes documents.',
  compact = false,
}: GoogleClientAuthCardProps) {
  const href = `/api/client-auth/google/start?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="glass-panel-soft rounded-[1.6rem] border border-[rgba(131,97,67,0.18)] p-5">
      <h3 className="font-display text-2xl text-[color:var(--site-heading)]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-[rgba(131,97,67,0.22)] bg-white px-5 py-3 text-base font-semibold text-[color:var(--site-heading)] shadow-sm transition hover:bg-[rgba(255,252,248,1)]"
      >
        <GoogleIcon />
        Continuer avec Google
      </Link>
      {!compact ? (
        <p className="mt-3 text-xs leading-6 text-[color:var(--site-soft)]">
          Connecte-toi gratuitement avec Google. Aucun paiement requis. Ton espace client sera créé automatiquement.
        </p>
      ) : null}
    </div>
  );
}
