'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage, readApiJson } from '@/lib/api-client';

const inputClassName =
  'mt-2 block min-h-12 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-4 py-3 text-base text-[color:var(--site-heading)] shadow-sm outline-none motion-safe:transition placeholder:text-[#827468] focus:border-[color:var(--site-accent)] focus:ring-2 focus:ring-[color:var(--site-accent)]/20 motion-reduce:transition-none';

const passwordRules = [
  'Au moins 8 caractères',
  'Au moins une lettre majuscule et une lettre minuscule',
  'Au moins un chiffre',
];

export default function ClientResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token')?.trim() || '');
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Lien invalide ou incomplet. Demandez un nouveau lien de réinitialisation.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/client-auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await readApiJson(response);

      if (!response.ok) {
        setError(getApiErrorMessage(data, 'Réinitialisation impossible.'));
        return;
      }

      setSuccess('Mot de passe mis à jour. Vous pouvez maintenant vous connecter avec votre nouvel accès.');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

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
        <section className="warm-cta-panel p-6 sm:p-8 md:p-10" aria-labelledby="reset-password-title">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">
            Sécurité du compte
          </p>
          <h1
            id="reset-password-title"
            className="mt-4 font-display text-4xl leading-[1.02] text-[color:var(--site-heading)] md:text-5xl"
          >
            Choisissez un mot de passe solide et facile à retenir
          </h1>
          <p className="mt-5 text-base leading-8 text-[color:var(--site-muted)]">
            Le nouveau mot de passe remplacera immédiatement l’ancien pour votre portail client NOWIS. Le lien reçu par
            courriel ne peut être utilisé qu’une seule fois.
          </p>

          <div id="password-requirements" className="mt-8 grid gap-3" aria-label="Exigences du mot de passe">
            {passwordRules.map((item) => (
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

        <section className="w-full max-w-xl lg:justify-self-end" aria-labelledby="reset-password-form-title">
          <div className="brand-card rounded-[2rem] p-5 shadow-card sm:p-8">
            <h2 id="reset-password-form-title" className="text-2xl font-bold text-[color:var(--site-heading)]">
              Réinitialiser le mot de passe
            </h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">
              Saisissez deux fois votre nouveau mot de passe pour éviter les erreurs de frappe.
            </p>

            {token === null ? (
              <div
                className="mt-6 rounded-xl border border-[color:var(--site-border)] bg-white/80 px-4 py-3 text-sm leading-6 text-[color:var(--site-muted)]"
                role="status"
                aria-live="polite"
              >
                Validation du lien de réinitialisation…
              </div>
            ) : null}

            {token === '' ? (
              <div className="mt-6 space-y-4">
                <div
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
                  role="alert"
                >
                  Ce lien de réinitialisation est incomplet. Demandez un nouveau lien avant de continuer.
                </div>
                <Link
                  href="/mot-de-passe-oublie"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[color:var(--site-accent)] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm motion-safe:transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40 motion-reduce:transition-none"
                >
                  Demander un nouveau lien
                </Link>
              </div>
            ) : null}

            {token && success ? (
              <div className="mt-6 space-y-4">
                <div
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
                  role="status"
                  aria-live="polite"
                >
                  {success}
                </div>
                <Link
                  href="/connexion"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[color:var(--site-accent)] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm motion-safe:transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40 motion-reduce:transition-none"
                >
                  Aller à la connexion
                </Link>
              </div>
            ) : null}

            {token && !success ? (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5" aria-busy={loading}>
                <div>
                  <label htmlFor="reset-password" className="block text-sm font-semibold text-[color:var(--site-heading)]">
                    Nouveau mot de passe
                  </label>
                  <input
                    id="reset-password"
                    name="new-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    aria-describedby="password-requirements"
                    className={inputClassName}
                    placeholder="Votre nouveau mot de passe"
                  />
                </div>

                <div>
                  <label htmlFor="reset-password-confirm" className="block text-sm font-semibold text-[color:var(--site-heading)]">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="reset-password-confirm"
                    name="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className={inputClassName}
                    placeholder="Répétez le mot de passe"
                  />
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

                <Button type="submit" className="min-h-12 w-full" disabled={loading}>
                  {loading ? 'Mise à jour en cours…' : 'Mettre à jour le mot de passe'}
                </Button>
              </form>
            ) : null}

            <div className="mt-6 border-t border-[color:var(--site-border)] pt-4">
              <Link
                href="/connexion"
                className="inline-flex min-h-11 items-center font-semibold text-[color:var(--site-accent-strong)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
