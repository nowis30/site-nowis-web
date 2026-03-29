'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { clientRegisterSchema } from '@/features/client-portal/auth/validators';
import { sanitizeNextPath } from '@/lib/safe-next';

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
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Un compte existe déjà avec cet email. Essaie de te connecter.');
        }
        if (response.status === 400 && Array.isArray(data?.details) && data.details.length > 0) {
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
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200 p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Inscription</h1>
        <p className="text-sm text-gray-600 mb-6">
          Creez votre acces Nowis pour envoyer vos demandes de chanson ou d'atelier, puis suivre messages, rendez-vous et documents.
        </p>

        {nextPath !== '/client/dashboard' ? (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Creez votre compte pour continuer vers la page demandee.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Prénom Nom"
            />
          </div>

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
            <label className="block text-sm font-medium text-gray-700">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="+1 819 000 0000"
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
              placeholder="Min. 8 caractères, avec majuscule et chiffre"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Création en cours...' : 'Créer mon accès'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-gray-600">
          Vous avez deja un compte ?{' '}
          <Link href={`/connexion?next=${encodeURIComponent(nextPath)}`} className="text-primary-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
