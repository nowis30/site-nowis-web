import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPublishedListingBySlug, getPublishedListings } from '@/lib/logements';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const logement = await getPublishedListingBySlug(params.slug);

  if (!logement) {
    return {
      title: 'Logement introuvable - NOWIS',
      description: 'Le logement demandé est introuvable.',
    };
  }

  return {
    title: `${logement.title} – Logement`,
    description: logement.descriptionShort,
  };
}

export async function generateStaticParams() {
  const logements = await getPublishedListings();
  return logements.map((logement) => ({ slug: logement.slug }));
}

export default async function LogementPage({ params }: PageProps) {
  const logement = await getPublishedListingBySlug(params.slug);
  if (!logement) {
    notFound();
  }

  return (
    <div className="bg-slate-50 px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <a href="/logements" className="text-sm font-semibold text-emerald-700 hover:underline">
          Retour aux logements
        </a>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <div className="grid gap-2 md:grid-cols-2">
                {(logement.images.length > 0 ? logement.images : ['']).slice(0, 4).map((image, index) => (
                  <div key={`${logement.id}-${index}`} className="relative h-64 bg-slate-100">
                    {image ? (
                      <Image
                        src={image}
                        alt={`${logement.title} ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">Aucune image</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <article className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
              <h1 className="text-4xl font-bold text-slate-950">{logement.title}</h1>
              <p className="mt-3 text-lg text-slate-600">{logement.city}{logement.sector ? `, ${logement.sector}` : ''}</p>
              <p className="mt-6 text-base leading-8 text-slate-700">{logement.descriptionLong || logement.descriptionShort}</p>
            </article>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Resume</p>
              <p className="mt-4 text-3xl font-bold">{logement.price.toLocaleString('fr-CA')} €</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                <li>{logement.bedrooms} chambre(s)</li>
                <li>{logement.bathrooms} salle(s) de bain</li>
                <li>{logement.area} m²</li>
                {logement.propertyType ? <li>Type: {logement.propertyType}</li> : null}
                {logement.availabilityDate ? <li>Disponible le {logement.availabilityDate}</li> : null}
                {typeof logement.furnished === 'boolean' ? <li>Meuble: {logement.furnished ? 'Oui' : 'Non'}</li> : null}
                {typeof logement.parking === 'boolean' ? <li>Stationnement: {logement.parking ? 'Oui' : 'Non'}</li> : null}
                {typeof logement.petsAllowed === 'boolean' ? <li>Animaux: {logement.petsAllowed ? 'Acceptes' : 'Non'}</li> : null}
              </ul>
              <a
                href={logement.bookingUrl || `mailto:${logement.ownerEmail}`}
                target={logement.bookingUrl ? '_blank' : undefined}
                rel={logement.bookingUrl ? 'noreferrer' : undefined}
                className="mt-8 inline-flex w-full justify-center rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                {logement.bookingUrl ? 'Reserver une visite' : 'Contacter le proprietaire'}
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
