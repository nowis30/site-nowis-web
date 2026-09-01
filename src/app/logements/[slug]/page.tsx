import Image from 'next/image';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { getPublishedListingBySlug, getPublishedListings } from '@/lib/logements';

interface PageProps {
  params: { slug: string };
}

function formatRent(amount: number) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatAvailabilityDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long', timeZone: 'UTC' }).format(parsed);
}

export async function generateMetadata({ params }: PageProps) {
  const logement = await getPublishedListingBySlug(params.slug);

  if (!logement) {
    return buildMetadata({
      title: 'Logement introuvable - NOWIS',
      description: 'Le logement demandé est introuvable.',
      path: `/logements/${params.slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${logement.title} | Logement à ${logement.city} - NOWIS`,
    description: logement.descriptionShort,
    path: `/logements/${logement.slug}`,
    image: logement.images[0] || '/hero.jpg',
    keywords: [logement.title, logement.city, 'logement à louer'],
  });
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

  const galleryImages = logement.images.length > 0 ? logement.images.slice(0, 4) : [''];

  return (
    <main className="text-[color:var(--site-text)]">
      <section className="relative overflow-hidden px-4 py-10 sm:px-6 md:py-16" aria-labelledby="rental-title">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 8% 6%, rgba(184,111,61,0.1), transparent 26%),' +
              'radial-gradient(circle at 92% 8%, rgba(203,165,120,0.14), transparent 22%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl">
          <Link
            href="/logements"
            className="inline-flex min-h-11 items-center rounded-xl px-1 text-sm font-semibold text-[color:var(--site-accent-strong)] underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] hover:underline"
          >
            ← Retour aux logements
          </Link>

          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-start">
            <div className="min-w-0">
              <section className="brand-card overflow-hidden rounded-[1.75rem]" aria-label={`Galerie photo de ${logement.title}`}>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {galleryImages.map((image, index) => (
                    <div
                      key={`${logement.id}-${index}`}
                      className={`relative bg-[rgba(131,97,67,0.08)] ${index === 0 ? 'h-72 sm:col-span-2 sm:h-96' : 'h-52 sm:h-56'}`}
                    >
                      {image ? (
                        <Image
                          src={image}
                          alt={`${logement.title}, photo ${index + 1} du logement à ${logement.city}`}
                          fill
                          priority={index === 0}
                          className="object-cover"
                          sizes={index === 0 ? '(max-width: 1023px) 100vw, 66vw' : '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw'}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[color:var(--site-muted)]">
                          Photo à venir
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <article className="brand-card mt-6 rounded-[1.75rem] p-6 sm:p-8">
                <span className="brand-chip inline-block">À louer</span>
                <h1 id="rental-title" className="brand-metal-text mt-4 font-display text-4xl leading-[1.04] sm:text-5xl">
                  {logement.title}
                </h1>
                <p className="mt-3 text-base font-medium text-[color:var(--site-muted)] sm:text-lg">
                  {logement.city}{logement.sector ? `, ${logement.sector}` : ''}
                </p>
                <p className="mt-6 whitespace-pre-line text-base leading-8 text-[color:var(--site-muted)]">
                  {logement.descriptionLong || logement.descriptionShort}
                </p>
              </article>
            </div>

            <aside className="lg:sticky lg:top-24" aria-labelledby="rental-summary-title">
              <div className="warm-cta-panel rounded-[1.75rem] p-6 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">Résumé</p>
                <h2 id="rental-summary-title" className="mt-3 text-3xl font-bold tracking-tight text-[color:var(--site-heading)]">
                  {formatRent(logement.price)}
                </h2>

                <dl className="mt-6 divide-y divide-[rgba(131,97,67,0.14)] text-sm">
                  <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
                    <dt className="text-[color:var(--site-muted)]">Chambres</dt>
                    <dd className="font-semibold text-[color:var(--site-heading)]">{logement.bedrooms}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-[color:var(--site-muted)]">Salles de bain</dt>
                    <dd className="font-semibold text-[color:var(--site-heading)]">{logement.bathrooms}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-[color:var(--site-muted)]">Superficie</dt>
                    <dd className="font-semibold text-[color:var(--site-heading)]">{logement.area} m²</dd>
                  </div>
                  {logement.propertyType ? (
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-[color:var(--site-muted)]">Type</dt>
                      <dd className="text-right font-semibold text-[color:var(--site-heading)]">{logement.propertyType}</dd>
                    </div>
                  ) : null}
                  {logement.availabilityDate ? (
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-[color:var(--site-muted)]">Disponible</dt>
                      <dd className="text-right font-semibold text-[color:var(--site-heading)]">{formatAvailabilityDate(logement.availabilityDate)}</dd>
                    </div>
                  ) : null}
                  {typeof logement.furnished === 'boolean' ? (
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-[color:var(--site-muted)]">Meublé</dt>
                      <dd className="font-semibold text-[color:var(--site-heading)]">{logement.furnished ? 'Oui' : 'Non'}</dd>
                    </div>
                  ) : null}
                  {typeof logement.parking === 'boolean' ? (
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-[color:var(--site-muted)]">Stationnement</dt>
                      <dd className="font-semibold text-[color:var(--site-heading)]">{logement.parking ? 'Oui' : 'Non'}</dd>
                    </div>
                  ) : null}
                  {typeof logement.petsAllowed === 'boolean' ? (
                    <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
                      <dt className="text-[color:var(--site-muted)]">Animaux</dt>
                      <dd className="font-semibold text-[color:var(--site-heading)]">{logement.petsAllowed ? 'Acceptés' : 'Non'}</dd>
                    </div>
                  ) : null}
                </dl>

                <a
                  href={logement.bookingUrl || `mailto:${logement.ownerEmail}`}
                  target={logement.bookingUrl ? '_blank' : undefined}
                  rel={logement.bookingUrl ? 'noopener noreferrer' : undefined}
                  aria-label={logement.bookingUrl ? `Réserver une visite pour ${logement.title} dans un nouvel onglet` : undefined}
                  className="cta-primary mt-7 min-h-12 w-full justify-center px-5 py-3 text-center"
                >
                  {logement.bookingUrl ? 'Réserver une visite' : 'Contacter le propriétaire'}
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
