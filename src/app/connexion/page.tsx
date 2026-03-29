'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
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
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200 p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connexion au portail client</h1>
        <p className="text-sm text-gray-600 mb-6">
          Connectez-vous pour envoyer une demande de chanson ou d'atelier, puis suivre vos rendez-vous et echanges avec Nowis.
        </p>

        {nextPath !== '/client/dashboard' ? (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Connexion requise pour continuer vers la page demandee.
          </div>
        ) : null}

        {externalErrorMessage ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {externalErrorMessage}
          </div>
        ) : null}

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

          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-gray-600">
          Pas encore d'acces ?{' '}
          <Link href={`/inscription?next=${encodeURIComponent(nextPath)}`} className="text-primary-600 hover:underline">
            Créer mon accès
          </Link>
        </p>

        <p className="mt-3 text-sm text-gray-600">
          Espace equipe interne: <Link href="/crm/login" className="font-medium text-primary-600 hover:underline">connexion CRM</Link>
        </p>
      </div>
    </div>
  );
}
