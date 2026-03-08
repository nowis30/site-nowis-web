'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import type { ListingStatus } from '@/types';

const statusOptions: { value: ListingStatus; label: string }[] = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'pending', label: 'En attente de validation' },
  { value: 'approved', label: 'Approuvé (visible)' },
  { value: 'rejected', label: 'Rejeté' },
];

export default function ProprietaireAjouterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

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
  const [images, setImages] = useState<string[]>(['']);
  const [status, setStatus] = useState<ListingStatus>('pending');

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/connexion');
    }
  }, [loading, user, router]);

  const allFieldsValid = useMemo(() => {
    return (
      title.trim().length > 3 &&
      price.trim().length > 0 &&
      city.trim().length > 1 &&
      descriptionShort.trim().length > 20
    );
  }, [title, price, city, descriptionShort]);

  const handleAddImage = () => setImages((prev) => [...prev, '']);
  const handleRemoveImage = (index: number) =>
    setImages((prev) => prev.filter((_, i) => i !== index));
  const handleImageChange = (index: number, value: string) =>
    setImages((prev) => prev.map((img, i) => (i === index ? value : img)));

  const handleUploadFile = async (file: File) => {
    setUploadError(null);
    setUploading(true);

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || 'Échec de l’upload.');
      }

      const data = (await res.json()) as { url?: string };
      if (!data?.url) {
        throw new Error('Réponse invalide du serveur.');
      }

      setImages((prev) => [...prev, data.url as string]);
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!allFieldsValid) {
      setError('Veuillez remplir tous les champs obligatoires correctement.');
      return;
    }

    setIsSubmitting(true);

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

      const res = await fetch('/api/logements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || 'Erreur lors de la création du logement.');
      }

      router.push('/proprietaire');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="mx-auto max-w-4xl rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200 p-10 shadow-lg">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ajouter un logement</h1>
            <p className="mt-2 text-gray-600">
              Remplissez les informations ci-dessous pour créer un nouveau logement. Le statut
              déterminera sa visibilité publique.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/proprietaire')}>
            Retour à mon espace
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

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
            <p className="text-sm text-gray-600">
              Vous pouvez uploader des images depuis votre ordinateur ou indiquer des URLs.
            </p>

            <div className="space-y-3">
              {uploadError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {uploadError}
                </div>
              )}

              <label className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadFile(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <span className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50">
                  {uploading ? 'Upload en cours…' : 'Uploader une photo'}
                </span>
              </label>

              <div className="space-y-3">
                {images.map((image, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      value={image}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder="https://..."
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
                      disabled={images.length === 1}
                    >
                      Suppr.
                    </button>
                  </div>
                ))}
              </div>

              <Button variant="secondary" type="button" onClick={handleAddImage}>
                Ajouter un champ URL
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Descriptions</h2>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-gray-700">Résumé (court)*</span>
              <textarea
                value={descriptionShort}
                onChange={(e) => setDescriptionShort(e.target.value)}
                rows={3}
                placeholder="Petit texte qui décrit le logement en quelques phrases."
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-gray-700">Description détaillée</span>
              <textarea
                value={descriptionLong}
                onChange={(e) => setDescriptionLong(e.target.value)}
                rows={6}
                placeholder="Décrivez le logement, l'ambiance, les équipements, le voisinage, etc."
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </label>
          </section>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-500">
              Après création, vous pourrez modifier le logement depuis votre espace propriétaire.
            </p>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Créer le logement'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
