'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { GoogleClientAuthCard } from '@/features/client-portal/components/GoogleClientAuthCard';
import { getApiErrorMessage, readApiJson } from '@/lib/api-client';
import { sanitizeNextPath } from '@/lib/safe-next';

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

  const externalErrorMessage =
    externalErrorCode === 'invalid-link'
      ? 'Le lien de connexion est invalide ou expiré.'
      : externalErrorCode === 'account-not-found'
        ? "Aucun compte client n'est relié à ce lien."
        : externalErrorCode === 'google-unavailable'
          ? 'La connexion Google est temporairement indisponible.'
          : externalErrorCode === 'google-access-denied'
            ? 'Connexion Google annulée.'
            : externalErrorCode === 'google-provider-error'
              ? 'Google a refusé la connexion. Réessayez.'
              : externalErrorCode === 'google-state-invalid'
                ? 'Session Google expirée. Réessayez la connexion.'
                : externalErrorCode === 'google-token-exchange-failed'
                  ? 'Échec de validation Google. Vérifiez la configuration OAuth.'
                  : externalErrorCode === 'google-token-missing'
                    ? 'Jeton Google manquant. Réessayez.'
                    : externalErrorCode === 'google-profile-fetch-failed'
                      ? 'Impossible de lire votre profil Google. Réessayez.'
                      : externalErrorCode === 'google-db-schema-missing'
                        ? 'Connexion Google temporairement indisponible: migration base de données requise.'
          : externalErrorCode === 'google-auth-failed'
            ? 'La connexion Google a échoué. Réessayez.'
            : externalErrorCode === 'google-email-invalid'
              ? 'Votre compte Google doit avoir une adresse email vérifiée.'
              : externalErrorCode === 'google-role-mismatch'
                ? 'Cette adresse est déjà utilisée pour un compte interne. Utilisez la connexion CRM.'
                : externalErrorCode === 'google-account-disabled'
                  ? 'Ce compte est désactivé. Contactez le support.'
                  : externalErrorCode === 'google-account-conflict'
                    ? 'Un conflit de connexion Google est survenu. Contactez le support.'
        : null;

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
    <div className="relative min-h-[calc(100vh-120px)] overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 14% 12%, rgba(184,111,61,0.14), transparent 24%),' +
            'radial-gradient(circle at 86% 14%, rgba(203,165,120,0.18), transparent 20%)',
        }}
      />
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="warm-cta-panel p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Portail client</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.02] text-[color:var(--site-heading)] md:text-5xl">Un accès simple pour suivre votre projet sans friction</h1>
          <p className="mt-5 text-base leading-8 text-[color:var(--site-muted)]">
            Connectez-vous pour retrouver vos demandes, vos rendez-vous, vos échanges et les prochaines étapes. L’espace reste clair, humain et centré sur votre projet.
          </p>
          <div className="mt-8 grid gap-3">
            {[
              'Suivre une demande de chanson ou d’atelier',
              'Retrouver vos rendez-vous et messages',
              'Accéder à un espace protégé par session sécurisée',
            ].map((item) => (
              <div key={item} className="glass-panel-soft flex items-start gap-3 rounded-[1.25rem] px-4 py-3">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--site-accent-soft)] text-xs font-bold text-[color:var(--site-accent-strong)]">✓</span>
                <span className="text-sm leading-6 text-[color:var(--site-text)]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-xl lg:justify-self-end">
          <div className="glass-panel-strong rounded-[2rem] p-8 shadow-card">
            <h2 className="text-2xl font-bold text-[color:var(--site-heading)] mb-2">Connexion au portail client</h2>
            <p className="text-sm text-[color:var(--site-muted)] mb-6">
              Utilisez votre adresse e-mail et votre mot de passe pour entrer dans votre espace client sécurisé.
            </p>

            {nextPath !== '/client/dashboard' ? (
              <div className="mb-4 rounded-lg border border-[color:var(--site-accent)]/20 bg-[color:var(--site-accent-soft)] px-3 py-2 text-sm text-[color:var(--site-accent-strong)]">
                Connexion requise pour continuer vers la page demandee.
              </div>
            ) : null}

            {externalErrorMessage ? (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {externalErrorMessage}
              </div>
            ) : null}

            <div className="mb-5">
              <GoogleClientAuthCard nextPath={nextPath} />
            </div>

            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[color:var(--site-border)]" />
              <span className="text-xs uppercase tracking-[0.22em] text-[color:var(--site-soft)]">ou avec email</span>
              <div className="h-px flex-1 bg-[color:var(--site-border)]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--site-heading)]">Adresse e-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-[color:var(--site-border)] bg-white px-4 py-3 text-sm text-[color:var(--site-heading)] shadow-sm focus:border-[color:var(--site-accent)] focus:ring-[color:var(--site-accent)]"
                  placeholder="vous@exemple.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--site-heading)]">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-[color:var(--site-border)] bg-white px-4 py-3 text-sm text-[color:var(--site-heading)] shadow-sm focus:border-[color:var(--site-accent)] focus:ring-[color:var(--site-accent)]"
                  placeholder="••••••••"
                />
                <div className="mt-2 text-right">
                  <Link href="/mot-de-passe-oublie" className="text-xs font-medium text-[color:var(--site-accent-strong)] hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>

              {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>

            <p className="mt-6 text-sm text-[color:var(--site-muted)]">
              Pas encore d'acces ?{' '}
              <Link href={`/inscription?next=${encodeURIComponent(nextPath)}`} className="text-[color:var(--site-accent-strong)] hover:underline">
                Créer mon accès
              </Link>
            </p>

            <p className="mt-3 text-sm text-[color:var(--site-muted)]">
              Espace equipe interne: <Link href="/crm/login" className="font-medium text-[color:var(--site-accent-strong)] hover:underline">connexion CRM</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
