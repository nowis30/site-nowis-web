'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CrmLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/crm/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Connexion impossible');
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
        <p className="mt-1 text-sm text-slate-400">Accès sécurisé au back-office immobilier.</p>
        <p className="mt-2 text-xs text-slate-500">
          Cet accès est réservé aux utilisateurs internes autorisés.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="admin@crm.local"
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
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
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
