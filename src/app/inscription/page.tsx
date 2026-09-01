'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { clientRegisterSchema } from '@/features/client-portal/auth/validators';
import { GoogleClientAuthCard } from '@/features/client-portal/components/GoogleClientAuthCard';
import { sanitizeNextPath } from '@/lib/safe-next';

const inputClassName =
  'mt-2 block min-h-12 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-4 py-3 text-base text-[color:var(--site-heading)] shadow-sm outline-none transition placeholder:text-[#827468] focus:border-[color:var(--site-accent)] focus:ring-2 focus:ring-[color:var(--site-accent)]/20';

const benefits = [
  'Envoyer une demande de chanson ou d’atelier',
  'Retrouver vos rendez-vous, échanges et documents',
  'Accéder à un espace client protégé et centralisé',
];

interface RegistrationResponse {
  redirectTo?: string;
  error?: string;
  details?: Array<{ message?: string }>;
}

export default function InscriptionPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextPath, setNextPath] = useState('/client/dashboard');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setNextPath(sanitizeNextPath(params.get('next'), '/client/dashboard'));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = clientRegisterSchema.safeParse({
      fullName,
      email,
      phone,
      password,
      address: '',
      message: '',
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Formulaire invalide.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/client-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, next: nextPath }),
      });
      const data = (await response.json().catch(() => ({}))) as RegistrationResponse;

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Un compte existe déjà avec cette adresse e-mail. Essayez de vous connecter.');
        }
        if (response.status === 400 && Array.isArray(data.details) && data.details.length > 0) {
          throw new Error(data.details[0]?.message || data.error || 'Impossible de créer le compte.');
        }
        throw new Error(data.error || 'Impossible de créer le compte.');
      }

      router.replace(data.redirectTo || '/client/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Impossible de créer le compte.');
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
        <section className="warm-cta-panel p-6 sm:p-8 md:p-10" aria-labelledby="inscription-title">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">
            Portail client
          </p>
          <h1
            id="inscription-title"
            className="mt-4 font-display text-4xl leading-[1.02] text-[color:var(--site-heading)] md:text-5xl"
          >
            Créez votre accès NOWIS et gardez votre projet au même endroit
          </h1>
          <p className="mt-5 text-base leading-8 text-[color:var(--site-muted)]">
            Votre compte client vous permet de démarrer une demande, suivre les prochaines étapes et retrouver les
            informations importantes sans multiplier les courriels.
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

        <section className="w-full max-w-xl lg:justify-self-end" aria-labelledby="registration-form-title">
          <div className="brand-card rounded-[2rem] p-5 shadow-card sm:p-8">
            <h2 id="registration-form-title" className="text-2xl font-bold text-[color:var(--site-heading)]">
              Créer mon compte
            </h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">
              Google est le chemin le plus rapide. L’inscription par adresse e-mail reste disponible juste en dessous.
            </p>

            {nextPath !== '/client/dashboard' ? (
              <div
                className="mt-5 rounded-xl border border-[color:var(--site-accent)]/20 bg-[color:var(--site-accent-soft)] px-4 py-3 text-sm leading-6 text-[color:var(--site-accent-strong)]"
                role="status"
              >
                Créez votre compte pour continuer vers la page demandée.
              </div>
            ) : null}

            <div className="mt-5">
              <GoogleClientAuthCard nextPath={nextPath} />
            </div>

            <details className="group mt-5 rounded-[1.35rem] border border-[color:var(--site-border)] bg-white/80 p-4 sm:p-5">
              <summary className="flex min-h-12 cursor-pointer list-none items-center rounded-xl text-base font-semibold text-[color:var(--site-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40">
                Autre méthode : inscription avec adresse e-mail et mot de passe
              </summary>

              <form onSubmit={handleSubmit} className="mt-5 space-y-5" aria-busy={isSubmitting}>
                <div>
                  <label htmlFor="registration-full-name" className="block text-sm font-semibold text-[color:var(--site-heading)]">
                    Nom complet
                  </label>
                  <input
                    id="registration-full-name"
                    name="name"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    autoComplete="name"
                    className={inputClassName}
                    placeholder="Prénom Nom"
                  />
                </div>

                <div>
                  <label htmlFor="registration-email" className="block text-sm font-semibold text-[color:var(--site-heading)]">
                    Adresse e-mail
                  </label>
                  <input
                    id="registration-email"
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
                  <label htmlFor="registration-phone" className="block text-sm font-semibold text-[color:var(--site-heading)]">
                    Téléphone
                  </label>
                  <input
                    id="registration-phone"
                    name="tel"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    className={inputClassName}
                    placeholder="+1 819 000 0000"
                  />
                </div>

                <div>
                  <label htmlFor="registration-password" className="block text-sm font-semibold text-[color:var(--site-heading)]">
                    Mot de passe
                  </label>
                  <input
                    id="registration-password"
                    name="new-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                    aria-describedby="registration-password-help"
                    className={inputClassName}
                    placeholder="Votre mot de passe"
                  />
                  <p id="registration-password-help" className="mt-2 text-xs leading-5 text-[color:var(--site-soft)]">
                    Minimum 8 caractères, avec au moins une majuscule et un chiffre.
                  </p>
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
                  {isSubmitting ? 'Création en cours…' : 'Créer mon accès'}
                </Button>
              </form>
            </details>

            <p className="mt-6 text-sm leading-6 text-[color:var(--site-muted)]">
              Vous avez déjà un compte ?{' '}
              <Link
                href={`/connexion?next=${encodeURIComponent(nextPath)}`}
                className="inline-flex min-h-11 items-center font-semibold text-[color:var(--site-accent-strong)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
