import Image from 'next/image';
import Link from 'next/link';
import { getPublishedListings } from '@/lib/logements';

export const metadata = {
  title: 'Logements à louer - NOWIS',
  description:
    'Explorez nos logements à louer : photos, tarifs, localisation et réservation de visite. Découvrez votre prochain logement en quelques clics.',
};

export default async function LogementsPage() {
  const listings = await getPublishedListings();

  return (
    <div className="bg-slate-50 px-6 py-16 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">Logements</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-950 md:text-5xl">Logements a louer</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Explore les logements actuellement publies, leurs caracteristiques et les options de reservation disponibles.
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white p-8 text-slate-600 shadow-sm">
            Aucun logement n'est publie pour le moment.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((logement) => (
              <article key={logement.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="relative h-56 bg-slate-100">
                  {logement.images[0] ? (
                    <Image
                      src={logement.images[0]}
                      alt={logement.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">Aucune image</div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-semibold text-slate-950">{logement.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">{logement.city}{logement.sector ? `, ${logement.sector}` : ''}</p>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{logement.descriptionShort}</p>
                  <div className="mt-5 flex items-center justify-between text-sm text-slate-700">
                    <span>{logement.bedrooms} ch. • {logement.bathrooms} sdb • {logement.area} m²</span>
                    <span className="font-semibold">{logement.price.toLocaleString('fr-CA')} €</span>
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link href={`/logements/${logement.slug}`} className="inline-flex w-full justify-center rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 sm:w-auto">
                      Voir le logement
                    </Link>
                    <a
                      href={logement.bookingUrl || `mailto:${logement.ownerEmail}`}
                      target={logement.bookingUrl ? '_blank' : undefined}
                      rel={logement.bookingUrl ? 'noreferrer' : undefined}
                      className="inline-flex w-full justify-center rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100 sm:w-auto"
                    >
                      {logement.bookingUrl ? 'Reserver' : 'Contacter'}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
