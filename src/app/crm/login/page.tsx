'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiErrorMessage, readApiJson } from '@/lib/api-client';

export default function CrmLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!otpStep) {
        const response = await fetch('/api/crm/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await readApiJson(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, 'Connexion impossible'));
        }

        if (data.requiresOtp) {
          setOtpStep(true);
          return;
        }

  // Mode sans SMS (Twilio non configuré) : session déjà créée
  router.push(data.redirectTo || '/crm');
  router.refresh();
  return;
      }

      const otpResponse = await fetch('/api/crm/auth/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode }),
      });

      const otpData = await readApiJson(otpResponse);
      if (!otpResponse.ok) {
        throw new Error(getApiErrorMessage(otpData, 'Vérification SMS impossible'));
      }

      router.push('/crm/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <h1 className="text-2xl font-semibold text-white">Connexion CRM</h1>
        <p className="mt-1 text-sm text-slate-400">Accès sécurisé au back-office Nowis.</p>
        <p className="mt-2 text-xs text-slate-500">
          Cet accès est réservé aux utilisateurs internes autorisés.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {!otpStep ? (
            <>
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="simonmorin30@gmail.com"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Mot de passe</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="Votre mot de passe"
                  required
                />
                <div className="mt-2 text-right">
                  <a href="/crm/forgot-password" className="text-xs font-medium text-primary-300 hover:text-primary-200">
                    Mot de passe oublié ?
                  </a>
                </div>
              </label>
            </>
          ) : (
            <>
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                Un code SMS a été envoyé. Entre le code pour finaliser la connexion.
              </p>

              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Code SMS</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="123456"
                  required
                />
              </label>
            </>
          )}

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Connexion...' : otpStep ? 'Valider le code SMS' : 'Se connecter'}
          </button>

          {otpStep ? (
            <button
              type="button"
              className="w-full rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200"
              onClick={() => {
                setOtpStep(false);
                setOtpCode('');
                setError(null);
              }}
            >
              Changer identifiants
            </button>
          ) : null}
        </form>

        <p className="mt-5 text-sm text-slate-400">
          Vous cherchez l’espace utilisateur public ?{' '}
          <a href="/connexion" className="font-medium text-primary-300 hover:text-primary-200">
            Aller à la connexion utilisateur
          </a>
        </p>
      </div>
    </main>
  );
}
