'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
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
      const response = await fetch('/api/client-auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Envoi impossible.');
        return;
      }

      setSuccess(data?.message || 'Si votre email existe, un lien a été envoyé.');
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200 p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe oublié</h1>
        <p className="text-sm text-gray-600 mb-6">Entrez votre email client. Nous vous enverrons un lien de réinitialisation.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Adresse e-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="vous@exemple.com"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600">
          Retour a la <Link href="/connexion" className="text-primary-600 hover:underline">connexion</Link>
        </p>
      </div>
    </div>
  );
}
