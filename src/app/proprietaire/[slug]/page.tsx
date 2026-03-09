'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import type { Listing, ListingStatus } from '@/types';

const statusOptions: { value: ListingStatus; label: string }[] = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'pending', label: 'En attente de validation' },
  { value: 'approved', label: 'Approuvé (visible)' },
  { value: 'rejected', label: 'Rejeté' },
];

export default function ProprietaireListingPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug ?? '';
  const router = useRouter();
  const { user, loading } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [sector, setSector] = useState('');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [area, setArea] = useState('');
  const [descriptionShort, setDescriptionShort] = useState('');
  const [descriptionLong, setDescriptionLong] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [heating, setHeating] = useState('');
  const [parking, setParking] = useState<'yes' | 'no' | ''>('');
  const [petsAllowed, setPetsAllowed] = useState<'yes' | 'no' | ''>('');
  const [smokingAllowed, setSmokingAllowed] = useState<'yes' | 'no' | ''>('');
  const [furnished, setFurnished] = useState<'yes' | 'no' | ''>('');
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<ListingStatus>('pending');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/connexion');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!slug) return;

    const fetchListing = async () => {
      setLoadingListing(true);
      setError(null);

      try {
        const res = await fetch(`/api/logements/slug/${encodeURIComponent(slug)}`, { cache: 'no-store' });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || 'Impossible de charger le logement.');
        }

        const data = (await res.json()) as { listing: Listing };
        setListing(data.listing);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoadingListing(false);
      }
    };

    fetchListing();
  }, [slug]);

  useEffect(() => {
    if (!listing) return;
    setTitle(listing.title);
    setPrice(String(listing.price));
    setCity(listing.city);
    setSector(listing.sector ?? '');
    setBedrooms(String(listing.bedrooms));
    setBathrooms(String(listing.bathrooms));
    setArea(String(listing.area));
    setDescriptionShort(listing.descriptionShort);
    setDescriptionLong(listing.descriptionLong);
    setPropertyType(listing.propertyType ?? '');
    setAvailabilityDate(listing.availabilityDate ?? '');
    setBookingUrl(listing.bookingUrl ?? '');
    setHeating(listing.heating ?? '');
    setParking(listing.parking === true ? 'yes' : listing.parking === false ? 'no' : '');
    setPetsAllowed(listing.petsAllowed === true ? 'yes' : listing.petsAllowed === false ? 'no' : '');
    setSmokingAllowed(listing.smokingAllowed === true ? 'yes' : listing.smokingAllowed === false ? 'no' : '');
    setFurnished(listing.furnished === true ? 'yes' : listing.furnished === false ? 'no' : '');
    setImages(listing.images ?? []);
    setStatus(listing.status);
  }, [listing]);

  const canSave = useMemo(() => {
    return (
      !!listing &&
      title.trim().length > 3 &&
      price.trim().length > 0 &&
      city.trim().length > 1 &&
      descriptionShort.trim().length > 20
    );
  }, [listing, title, price, city, descriptionShort]);

  const handleDelete = async () => {
    if (!listing || isDeleting) return;
    if (!confirm('Voulez-vous vraiment supprimer ce logement ?')) return;

    setError(null);
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/logements/slug/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || 'Impossible de supprimer le logement.');
      }

      setListing(null);
      router.refresh();
      router.push('/proprietaire');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!listing) return;

    setError(null);
    setIsSaving(true);

    try {
      const payload = {
        title,
        price: Number(price),
        city,
        sector,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        area: Number(area),
        descriptionShort,
        descriptionLong,
        propertyType,
        availabilityDate: availabilityDate || undefined,
        bookingUrl: bookingUrl.trim() || undefined,
        heating: heating.trim() || undefined,
        parking: parking === 'yes' ? true : parking === 'no' ? false : undefined,
        petsAllowed: petsAllowed === 'yes' ? true : petsAllowed === 'no' ? false : undefined,
        smokingAllowed: smokingAllowed === 'yes' ? true : smokingAllowed === 'no' ? false : undefined,
        furnished: furnished === 'yes' ? true : furnished === 'no' ? false : undefined,
        images: images.filter((src) => src.trim().length > 0),
        status,
      };

      const res = await fetch(`/api/logements/slug/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || 'Échec de la mise à jour.');
      }

      router.push('/proprietaire');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || loadingListing) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
        <p className="text-lg font-medium text-gray-600">Chargement…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-120px)] px-4 py-12">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200 p-10 shadow-lg">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Modifier un logement</h1>
            <p className="mt-2 text-gray-600">Mettez à jour les informations ou supprimez l’annonce.</p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            <Button variant="outline" size="sm" onClick={() => router.push('/proprietaire')}>
              Retour à mon espace
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression…' : 'Supprimer'}
            </Button>
          </div>
        </div>

        {error && <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSave} className="mt-10 space-y-8">
          <section className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-gray-700">Titre*</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Appartement lumineux à Paris"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-gray-700">Prix (€ / mois)*</span>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1450"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-gray-700">Ville*</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Paris"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-gray-700">Quartier / secteur</span>
              <input
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Montmartre"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-gray-700">Type de bien</span>
              <input
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                placeholder="Appartement, studio, maison..."
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-gray-700">Surface (m²)</span>
              <input
                type="number"
                min={0}
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="52"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-gray-700">Chambres</span>
              <input
                type="number"
                min={0}
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-gray-700">Salles de bain</span>
              <input
                type="number"
                min={0}
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-gray-700">Date de disponibilité</span>
              <input
                type="date"
                value={availabilityDate}
                onChange={(e) => setAvailabilityDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-gray-700">Lien de réservation</span>
              <input
                value={bookingUrl}
                onChange={(e) => setBookingUrl(e.target.value)}
                placeholder="https://calendly.com/..."
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-gray-700">Statut</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ListingStatus)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Options avancées</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-gray-700">Chauffage</span>
                <input
                  value={heating}
                  onChange={(e) => setHeating(e.target.value)}
                  placeholder="Ex: Chauffage central"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-gray-700">Stationnement</span>
                <select
                  value={parking}
                  onChange={(e) => setParking(e.target.value as 'yes' | 'no' | '')}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Non précisé</option>
                  <option value="yes">Inclus</option>
                  <option value="no">Non inclus</option>
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-gray-700">Animaux</span>
                <select
                  value={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.value as 'yes' | 'no' | '')}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Non précisé</option>
                  <option value="yes">Acceptés</option>
                  <option value="no">Interdits</option>
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-gray-700">Fumeurs</span>
                <select
                  value={smokingAllowed}
                  onChange={(e) => setSmokingAllowed(e.target.value as 'yes' | 'no' | '')}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Non précisé</option>
                  <option value="yes">Autorisé</option>
                  <option value="no">Interdit</option>
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-gray-700">Meublé</span>
                <select
                  value={furnished}
                  onChange={(e) => setFurnished(e.target.value as 'yes' | 'no' | '')}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Non précisé</option>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Images</h2>
            <p className="text-sm text-gray-600">Gérez les photos du logement.</p>

            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Image ${index + 1}`}
                      className="h-28 w-full rounded-lg object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 rounded-full bg-white/80 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => router.push('/proprietaire/ajouter')}
                >
                  Ajouter une nouvelle annonce
                </Button>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-500">
              Après modification, cliquez sur « Enregistrer » pour mettre à jour l’annonce.
            </p>
            <Button type="submit" disabled={!canSave || isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
