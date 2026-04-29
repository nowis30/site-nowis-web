'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function CrmForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/crm/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Envoi impossible.');
        return;
      }

      setSuccess(data?.message || 'Si cet email est autorisé CRM, un lien a été envoyé.');
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <h1 className="text-2xl font-semibold text-white">Mot de passe CRM oublié</h1>
        <p className="mt-1 text-sm text-slate-400">Entrez votre email interne pour recevoir un lien de réinitialisation.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="admin@nowis.store"
              required
            />
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-400">
          Retour a la <Link href="/crm/login" className="font-medium text-primary-300 hover:text-primary-200">connexion CRM</Link>
        </p>
      </div>
    </main>
  );
}
