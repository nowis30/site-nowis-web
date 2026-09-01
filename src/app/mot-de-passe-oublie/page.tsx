'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage, readApiJson } from '@/lib/api-client';

const inputClassName =
  'mt-2 block min-h-12 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-4 py-3 text-base text-[color:var(--site-heading)] shadow-sm outline-none motion-safe:transition placeholder:text-[#827468] focus:border-[color:var(--site-accent)] focus:ring-2 focus:ring-[color:var(--site-accent)]/20 motion-reduce:transition-none';

const recoveryNotes = [
  'Le lien de réinitialisation est valide pendant 30 minutes.',
  'Nous répondons de façon identique, que l’adresse existe ou non, pour protéger les comptes.',
  'Si vous n’avez rien demandé, vous pouvez simplement ignorer le courriel reçu.',
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/client-auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await readApiJson(response);
      if (!response.ok) {
        setError(getApiErrorMessage(data, 'Envoi impossible.'));
        return;
      }

      setSuccess(data.message || 'Si votre adresse e-mail existe, un lien de réinitialisation a été envoyé.');
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
        <section className="warm-cta-panel p-6 sm:p-8 md:p-10" aria-labelledby="forgot-password-title">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">
            Accès au portail
          </p>
          <h1
            id="forgot-password-title"
            className="mt-4 font-display text-4xl leading-[1.02] text-[color:var(--site-heading)] md:text-5xl"
          >
            Récupérez votre accès sans compliquer les choses
          </h1>
          <p className="mt-5 text-base leading-8 text-[color:var(--site-muted)]">
            Indiquez l’adresse e-mail associée à votre portail client. Si un compte correspondant existe, NOWIS vous
            enverra un lien sécurisé pour choisir un nouveau mot de passe.
          </p>

          <div className="mt-8 grid gap-3">
            {recoveryNotes.map((item) => (
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

        <section className="w-full max-w-xl lg:justify-self-end" aria-labelledby="forgot-password-form-title">
          <div className="brand-card rounded-[2rem] p-5 shadow-card sm:p-8">
            <h2 id="forgot-password-form-title" className="text-2xl font-bold text-[color:var(--site-heading)]">
              Demander un lien de réinitialisation
            </h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">
              Utilisez la même adresse e-mail que pour votre compte client.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5" aria-busy={loading}>
              <div>
                <label htmlFor="forgot-password-email" className="block text-sm font-semibold text-[color:var(--site-heading)]">
                  Adresse e-mail
                </label>
                <input
                  id="forgot-password-email"
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

              {error ? (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              ) : null}

              {success ? (
                <div
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
                  role="status"
                  aria-live="polite"
                >
                  {success}
                </div>
              ) : null}

              <Button type="submit" className="min-h-12 w-full" disabled={loading}>
                {loading ? 'Envoi en cours…' : 'Envoyer le lien sécurisé'}
              </Button>
            </form>

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
