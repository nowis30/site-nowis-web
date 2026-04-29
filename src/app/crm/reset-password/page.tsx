'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

export default function CrmResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') || '');
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Lien invalide ou incomplet.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/crm/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Réinitialisation impossible.');
        return;
      }

      setSuccess('Mot de passe CRM mis à jour. Vous pouvez vous connecter.');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <h1 className="text-2xl font-semibold text-white">Réinitialiser le mot de passe CRM</h1>
        <p className="mt-1 text-sm text-slate-400">Choisissez un nouveau mot de passe pour votre accès interne.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Nouveau mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="Minimum 8 caractères, majuscule et chiffre"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Confirmer le mot de passe</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="Répétez le mot de passe"
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
            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-400">
          Retour a la <Link href="/crm/login" className="font-medium text-primary-300 hover:text-primary-200">connexion CRM</Link>
        </p>
      </div>
    </main>
  );
}
