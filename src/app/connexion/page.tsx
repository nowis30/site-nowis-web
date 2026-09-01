'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { GoogleClientAuthCard } from '@/features/client-portal/components/GoogleClientAuthCard';
import { getApiErrorMessage, readApiJson } from '@/lib/api-client';
import { sanitizeNextPath } from '@/lib/safe-next';

const inputClassName =
  'mt-2 block min-h-12 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-4 py-3 text-base text-[color:var(--site-heading)] shadow-sm outline-none transition placeholder:text-[#827468] focus:border-[color:var(--site-accent)] focus:ring-2 focus:ring-[color:var(--site-accent)]/20';

const benefits = [
  'Suivre une demande de chanson ou d’atelier',
  'Retrouver vos rendez-vous, échanges et documents',
  'Accéder à un espace client protégé et centralisé',
];

const externalErrorMessages: Record<string, string> = {
  'invalid-link': 'Le lien de connexion est invalide ou expiré.',
  'account-not-found': "Aucun compte client n’est relié à ce lien.",
  'google-unavailable': 'La connexion Google est temporairement indisponible.',
  'google-access-denied': 'Connexion Google annulée.',
  'google-provider-error': 'Google a refusé la connexion. Réessayez.',
  'google-state-invalid': 'Session Google expirée. Réessayez la connexion.',
  'google-token-exchange-failed': 'Échec de validation Google. Vérifiez la configuration OAuth.',
  'google-token-missing': 'Jeton Google manquant. Réessayez.',
  'google-profile-fetch-failed': 'Impossible de lire votre profil Google. Réessayez.',
  'google-db-schema-missing': 'Connexion Google temporairement indisponible : migration de base de données requise.',
  'google-auth-failed': 'La connexion Google a échoué. Réessayez.',
  'google-email-invalid': 'Votre compte Google doit avoir une adresse e-mail vérifiée.',
  'google-role-mismatch': 'Cette adresse est déjà utilisée pour un compte interne. Utilisez la connexion CRM.',
  'google-account-disabled': 'Ce compte est désactivé. Contactez le support.',
  'google-account-conflict': 'Un conflit de connexion Google est survenu. Contactez le support.',
};

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [externalErrorCode, setExternalErrorCode] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState('/client/dashboard');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setExternalErrorCode(params.get('error'));
    setNextPath(sanitizeNextPath(params.get('next'), '/client/dashboard'));
  }, []);

  const externalErrorMessage = externalErrorCode ? externalErrorMessages[externalErrorCode] ?? null : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/client-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, next: nextPath }),
      });
      const data = await readApiJson(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, 'Impossible de se connecter.'));
      }
      router.replace(data.redirectTo || '/client/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Impossible de se connecter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-120px)] overflow-hidden px-4 py-10 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 14% 12%, rgba(184,111,61,0.14), transparent 24%),' +
            'radial-gradient(circle at 86% 14%, rgba(203,165,120,0.18), transparent 20%)',
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="warm-cta-panel p-6 sm:p-8 md:p-10" aria-labelledby="connexion-title">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">
            Portail client
          </p>
          <h1
            id="connexion-title"
            className="mt-4 font-display text-4xl leading-[1.02] text-[color:var(--site-heading)] md:text-5xl"
          >
            Retrouvez votre projet NOWIS sans chercher dans vos courriels
          </h1>
          <p className="mt-5 text-base leading-8 text-[color:var(--site-muted)]">
            Connectez-vous pour consulter vos demandes, vos rendez-vous, vos échanges et vos documents dans un espace
            client simple et sécurisé.
          </p>

          <div className="mt-8 grid gap-3">
            {benefits.map((item) => (
              <div key={item} className="brand-card flex items-start gap-3 rounded-[1.25rem] px-4 py-3">
                <span
                  className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--site-accent-soft)] text-xs font-bold text-[color:var(--site-accent-strong)]"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="text-sm leading-6 text-[color:var(--site-text)]">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full max-w-xl lg:justify-self-end" aria-labelledby="connexion-form-title">
          <div className="brand-card rounded-[2rem] p-5 shadow-card sm:p-8">
            <h2 id="connexion-form-title" className="text-2xl font-bold text-[color:var(--site-heading)]">
              Connexion au portail client
            </h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">
              Google est le chemin le plus rapide. La connexion par adresse e-mail reste disponible juste en dessous.
            </p>

            {nextPath !== '/client/dashboard' ? (
              <div
                className="mt-5 rounded-xl border border-[color:var(--site-accent)]/20 bg-[color:var(--site-accent-soft)] px-4 py-3 text-sm leading-6 text-[color:var(--site-accent-strong)]"
                role="status"
              >
                Connectez-vous pour continuer vers la page demandée.
              </div>
            ) : null}

            {externalErrorMessage ? (
              <div
                className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
                role="alert"
                aria-live="polite"
              >
                {externalErrorMessage}
              </div>
            ) : null}

            <div className="mt-5">
              <GoogleClientAuthCard
                nextPath={nextPath}
                title="Connexion rapide avec Google"
                description="Utilisez votre compte Google pour ouvrir votre espace client en quelques secondes."
              />
            </div>

            <details className="group mt-5 rounded-[1.35rem] border border-[color:var(--site-border)] bg-white/80 p-4 sm:p-5">
              <summary className="flex min-h-12 cursor-pointer list-none items-center rounded-xl text-base font-semibold text-[color:var(--site-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40">
                Autre méthode : connexion avec adresse e-mail et mot de passe
              </summary>

              <form onSubmit={handleSubmit} className="mt-5 space-y-5" aria-busy={isSubmitting}>
                <div>
                  <label htmlFor="login-email" className="block text-sm font-semibold text-[color:var(--site-heading)]">
                    Adresse e-mail
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    inputMode="email"
                    className={inputClassName}
                    placeholder="vous@exemple.com"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-semibold text-[color:var(--site-heading)]">
                    Mot de passe
                  </label>
                  <input
                    id="login-password"
                    name="current-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    className={inputClassName}
                    placeholder="Votre mot de passe"
                  />
                  <div className="mt-2 flex justify-end">
                    <Link
                      href="/mot-de-passe-oublie"
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-[color:var(--site-accent-strong)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                </div>

                {error ? (
                  <div
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </div>
                ) : null}

                <Button type="submit" className="min-h-12 w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Connexion en cours…' : 'Se connecter'}
                </Button>
              </form>
            </details>

            <p className="mt-6 text-sm leading-6 text-[color:var(--site-muted)]">
              Pas encore d’accès ?{' '}
              <Link
                href={`/inscription?next=${encodeURIComponent(nextPath)}`}
                className="inline-flex min-h-11 items-center font-semibold text-[color:var(--site-accent-strong)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40"
              >
                Créer mon accès
              </Link>
            </p>

            <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">
              Espace équipe interne :{' '}
              <Link
                href="/crm/login"
                className="inline-flex min-h-11 items-center font-semibold text-[color:var(--site-accent-strong)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40"
              >
                connexion CRM
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
