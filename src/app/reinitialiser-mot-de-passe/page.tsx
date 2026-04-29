'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

export default function ClientResetPasswordPage() {
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
      const response = await fetch('/api/client-auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Réinitialisation impossible.');
        return;
      }

      setSuccess('Mot de passe mis à jour. Vous pouvez vous connecter.');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200 p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Réinitialiser le mot de passe</h1>
        <p className="text-sm text-gray-600 mb-6">Choisissez un nouveau mot de passe pour votre portail client.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Minimum 8 caractères, majuscule et chiffre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Répétez le mot de passe"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600">
          Retour a la <Link href="/connexion" className="text-primary-600 hover:underline">connexion</Link>
        </p>
      </div>
    </div>
  );
}
