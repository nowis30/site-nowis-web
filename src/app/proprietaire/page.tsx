'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import type { Listing } from '@/types';

export default function ProprietairePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/connexion');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    const fetchListings = async () => {
      setLoadingListings(true);
      try {
        const res = await fetch('/api/logements/mine', { cache: 'no-store' });
        if (!res.ok) throw new Error('Impossible de récupérer vos logements.');
        const payload = (await res.json()) as { listings: Listing[] };
        setListings(payload.listings ?? []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoadingListings(false);
      }
    };

    fetchListings();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
        <p className="text-lg font-medium text-gray-600">Chargement…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-120px)] px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Espace propriétaire</h1>
            <p className="mt-2 text-gray-600">
              Bienvenue {user?.name ?? ''}! Gèrez ici vos logements, vos photos, et votre calendrier.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => router.push('/logements')}>
              Voir les logements publics
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await logout();
                router.replace('/');
              }}
            >
              Se déconnecter
            </Button>
          </div>
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Mes logements</h2>
            <Button onClick={() => router.push('/proprietaire/ajouter')}>
              Ajouter un logement
            </Button>
          </div>

          {loadingListings ? (
            <p className="mt-6 text-gray-600">Chargement…</p>
          ) : error ? (
            <p className="mt-6 text-red-600">{error}</p>
          ) : listings.length === 0 ? (
            <p className="mt-6 text-gray-600">Aucun logement trouvé. Créez-en un pour le publier.</p>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{listing.city}</p>
                  <p className="mt-2 text-sm text-gray-700">
                    Statut: <span className="font-medium">{listing.status}</span>
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/proprietaire/${listing.slug}`)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/logements/${listing.slug}`)}
                    >
                      Voir public
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
