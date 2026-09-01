import Image from 'next/image';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { getPublishedListings } from '@/lib/logements';

export const metadata = buildMetadata({
  title: 'Logements à louer | NOWIS',
  description:
    'Explorez les logements publiés sur NOWIS : photos, caractéristiques, localisation et prise de contact pour organiser une visite.',
  path: '/logements',
  keywords: ['logements à louer', 'annonces logements NOWIS', 'visite logement'],
});

function formatRent(amount: number) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function LogementsPage() {
  const listings = await getPublishedListings();

  return (
    <main className="text-[color:var(--site-text)]">
      <section className="relative overflow-hidden px-4 py-12 sm:px-6 md:py-20" aria-labelledby="rentals-title">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 12% 8%, rgba(184,111,61,0.12), transparent 28%),' +
              'radial-gradient(circle at 88% 10%, rgba(203,165,120,0.15), transparent 24%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="brand-chip inline-block">Logements disponibles</span>
            <h1 id="rentals-title" className="brand-metal-text mt-5 font-display text-4xl leading-[1.02] sm:text-5xl md:text-6xl">
              Logements à louer
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--site-muted)] sm:text-lg sm:leading-8">
              Explorez les logements actuellement publiés, leurs caractéristiques et les moyens simples de demander une visite ou un contact direct.
            </p>
          </div>

          {listings.length === 0 ? (
            <div className="brand-card mt-10 rounded-[1.75rem] p-6 sm:p-8" role="status">
              <h2 className="text-lg font-semibold text-[color:var(--site-heading)]">Aucun logement disponible pour le moment</h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">
                Revenez bientôt pour voir les nouvelles disponibilités publiées sur NOWIS.
              </p>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((logement) => (
                <article key={logement.id} className="brand-card overflow-hidden rounded-[1.75rem]">
                  <div className="relative h-56 bg-[rgba(131,97,67,0.08)] sm:h-60">
                    {logement.images[0] ? (
                      <Image
                        src={logement.images[0]}
                        alt={`${logement.title}, photo principale du logement à ${logement.city}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[color:var(--site-muted)]">
                        Photo à venir
                      </div>
                    )}
                  </div>

                  <div className="flex h-full flex-col p-5 sm:p-6">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--site-heading)]">{logement.title}</h2>
                      <p className="mt-2 text-sm text-[color:var(--site-muted)]">
                        {logement.city}{logement.sector ? `, ${logement.sector}` : ''}
                      </p>
                      <p className="mt-4 text-sm leading-6 text-[color:var(--site-muted)]">{logement.descriptionShort}</p>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[rgba(131,97,67,0.14)] pt-5 text-sm">
                      <div>
                        <dt className="text-[color:var(--site-muted)]">Configuration</dt>
                        <dd className="mt-1 font-semibold text-[color:var(--site-heading)]">
                          {logement.bedrooms} ch. · {logement.bathrooms} sdb · {logement.area} m²
                        </dd>
                      </div>
                      <div className="text-right">
                        <dt className="text-[color:var(--site-muted)]">Loyer</dt>
                        <dd className="mt-1 font-semibold text-[color:var(--site-heading)]">{formatRent(logement.price)}</dd>
                      </div>
                    </dl>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Link
                        href={`/logements/${logement.slug}`}
                        className="cta-primary min-h-12 w-full justify-center px-5 py-3 text-center sm:w-auto"
                      >
                        Voir le logement
                      </Link>
                      <a
                        href={logement.bookingUrl || `mailto:${logement.ownerEmail}`}
                        target={logement.bookingUrl ? '_blank' : undefined}
                        rel={logement.bookingUrl ? 'noopener noreferrer' : undefined}
                        aria-label={logement.bookingUrl ? `Réserver une visite pour ${logement.title} dans un nouvel onglet` : undefined}
                        className="cta-secondary min-h-12 w-full justify-center px-5 py-3 text-center sm:w-auto"
                      >
                        {logement.bookingUrl ? 'Réserver' : 'Contacter'}
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
