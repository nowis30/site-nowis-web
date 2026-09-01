import Image from 'next/image';
import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import type { ArtistProfile } from '@/data/artists';
import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';

function sectionLink(id: string, label: string) {
  return (
    <a
      key={id}
      href={`#${id}`}
      className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-panel)] px-4 py-2 text-sm font-medium text-[color:var(--site-text)] motion-safe:transition motion-safe:hover:border-[color:var(--site-accent)]/40 motion-safe:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] focus-visible:ring-offset-2"
    >
      {label}
    </a>
  );
}

export function ArtistProfilePage({ artist }: { artist: ArtistProfile }) {
  const embedPlatform = artist.platforms.find((platform) => platform.embedUrl);
  const creativeContactHref = `/contact?projectType=autre&message=${encodeURIComponent(
    'Bonjour, je veux parler d’un projet créatif avec Création Nowis.',
  )}`;

  return (
    <div className="section-soft text-[color:var(--site-text)]">
      <section className="section-warm relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-24">
          <Link
            href="/artistes"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-medium text-[color:var(--site-muted)] motion-safe:transition motion-safe:hover:text-[color:var(--site-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] focus-visible:ring-offset-2"
          >
            <span aria-hidden="true">←</span>
            Retour aux artistes
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">{artist.role}</p>
              <h1 className="mt-5 font-display text-4xl leading-tight text-[color:var(--site-heading)] md:text-6xl">{artist.pageTitle}</h1>
              <p className="mt-5 max-w-3xl text-xl leading-relaxed text-[color:var(--site-text)]">{artist.hook}</p>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[color:var(--site-muted)] sm:text-lg">{artist.shortBio}</p>

              <div className="mt-8 flex flex-wrap gap-3" aria-label={`Repères artistiques de ${artist.name}`}>
                {artist.heroHighlights.map((highlight) => (
                  <span key={highlight} className="rounded-full border border-[color:var(--site-accent)]/15 bg-white/70 px-4 py-2 text-sm font-medium text-[color:var(--site-text)]">
                    {highlight}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href={SONG_REQUEST_GOOGLE_AUTH_URL}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-warm px-6 py-3 text-center font-semibold text-white motion-safe:transition motion-safe:hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] focus-visible:ring-offset-2 sm:w-auto"
                >
                  Demander une chanson personnalisée
                </Link>
                <ContactPrefillLink
                  href={creativeContactHref}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[color:var(--site-accent)]/20 bg-[color:var(--site-panel)] px-6 py-3 text-center font-semibold text-[color:var(--site-heading)] motion-safe:transition motion-safe:hover:border-[color:var(--site-accent)]/40 motion-safe:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] focus-visible:ring-offset-2 sm:w-auto"
                >
                  Parler de mon projet
                </ContactPrefillLink>
              </div>
            </div>

            <div className="brand-card relative overflow-hidden rounded-[2rem] shadow-xl">
              {artist.image?.src ? (
                <div className="relative min-h-[360px] sm:min-h-[440px]">
                  <Image
                    src={artist.image.src}
                    alt={artist.image.alt}
                    fill
                    sizes="(min-width: 1024px) 42vw, 100vw"
                    className="object-cover brightness-[0.92] contrast-[1.02]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(251,244,234,0.02)_0%,rgba(140,102,67,0.18)_42%,rgba(53,35,23,0.48)_100%)]" />
                </div>
              ) : (
                <div className="flex min-h-[360px] flex-col justify-between bg-[radial-gradient(circle_at_top_left,_rgba(183,141,92,0.22),_transparent_30%),linear-gradient(180deg,#fbf4ea_0%,#f2e2cb_100%)] p-8 text-[color:var(--site-heading)] sm:min-h-[440px]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[color:var(--site-accent)]/20 bg-white/70 text-3xl font-bold text-[color:var(--site-accent-strong)]">
                    {artist.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 3)}
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">Création Nowis</p>
                    <p className="mt-3 font-display text-3xl">{artist.name}</p>
                    <p className="mt-2 text-lg text-[color:var(--site-text)]">{artist.role}</p>
                    <p className="mt-3 max-w-md leading-7 text-[color:var(--site-muted)]">
                      Un univers présenté avec une direction sobre, humaine et cohérente avec le reste du site, même sans visuel dédié.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Navigation dans le profil de l’artiste" className="border-b border-[color:var(--site-border)] bg-[color:var(--site-panel)]">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-4 py-5 sm:px-6">
          {sectionLink('bio', artist.overviewLabel)}
          {sectionLink('parcours', artist.journeyLabel)}
          {sectionLink('sur-mesure', artist.customCreationsLabel)}
          {sectionLink('ecouter', 'Écouter')}
          {sectionLink('creation-nowis', artist.associationLabel)}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-14 sm:px-6 md:space-y-16 md:py-20">
        <section id="bio" aria-labelledby="artist-bio-title" className="scroll-mt-28 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="brand-card rounded-[2rem] p-6 sm:p-8 md:p-10">
            <h2 id="artist-bio-title" className="font-display text-3xl text-[color:var(--site-heading)]">{artist.overviewTitle}</h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-[color:var(--site-muted)] sm:text-lg">
              {artist.longBio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <aside className="warm-spotlight-panel rounded-[2rem] p-6 shadow-sm sm:p-8 md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Repère créatif</p>
            <h2 className="mt-4 font-display text-3xl text-[color:var(--site-heading)]">Une démarche qui part de l’humain</h2>
            <p className="mt-5 leading-7 text-[color:var(--site-text)]">
              Ici, l’intelligence artificielle n’est pas une finalité. Elle sert à conserver une émotion, structurer une idée, prolonger une chanson et rendre un projet plus concret, sans effacer la sensibilité de départ.
            </p>
            <div className="mt-8 grid gap-3">
              {artist.heroHighlights.map((highlight) => (
                <div key={highlight} className="rounded-2xl border border-[color:var(--site-accent)]/15 bg-white/70 px-4 py-4 text-[color:var(--site-text)]">
                  {highlight}
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section id="parcours" aria-labelledby="artist-journey-title" className="brand-card scroll-mt-28 rounded-[2rem] p-6 sm:p-8 md:p-10">
          <div className="max-w-4xl">
            <h2 id="artist-journey-title" className="font-display text-3xl text-[color:var(--site-heading)]">{artist.journeyTitle}</h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-[color:var(--site-muted)] sm:text-lg">
              {artist.journey.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          {artist.members?.length ? (
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {artist.members.map((member) => (
                <article key={member.name} className="rounded-[1.75rem] border border-[color:var(--site-border)] bg-[color:var(--site-soft)] p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">{member.subtitle}</p>
                  <h3 className="mt-3 font-display text-2xl text-[color:var(--site-heading)]">{member.name}</h3>
                  <p className="mt-4 leading-7 text-[color:var(--site-muted)]">{member.description}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section id="sur-mesure" aria-labelledby="custom-creations-title" className="scroll-mt-28 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="warm-cta-panel rounded-[2rem] p-6 shadow-sm sm:p-8 md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Sur mesure</p>
            <h2 id="custom-creations-title" className="mt-4 font-display text-3xl text-[color:var(--site-heading)]">{artist.customCreationsTitle}</h2>
            <div className="mt-6 space-y-5 leading-7 text-[color:var(--site-text)]">
              {artist.customCreationsIntro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <p className="mt-6 rounded-2xl border border-[color:var(--site-accent)]/15 bg-white/70 px-5 py-4 text-sm leading-7 text-[color:var(--site-text)]">
              {artist.pricingNote}
            </p>
          </article>

          <article className="brand-card rounded-[2rem] p-6 sm:p-8 md:p-10">
            <h3 className="font-display text-2xl text-[color:var(--site-heading)]">Exemples de demandes</h3>
            <div className="mt-6 flex flex-wrap gap-3">
              {artist.customCreationsExamples.map((item) => (
                <span key={item} className="rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-soft)] px-4 py-2 text-sm font-medium text-[color:var(--site-text)]">
                  {item}
                </span>
              ))}
            </div>
            <div className="warm-spotlight-panel mt-8 rounded-[1.75rem] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">Approche</p>
              <p className="mt-3 leading-7 text-[color:var(--site-text)]">
                Chaque projet part d’un échange humain : votre histoire, l’émotion à transmettre, le ton recherché et la meilleure forme pour lui donner de la portée.
              </p>
            </div>
            <ContactPrefillLink
              href={artist.contactHref}
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-warm px-5 py-3 text-center font-semibold text-white motion-safe:transition motion-safe:hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] focus-visible:ring-offset-2 sm:w-auto"
            >
              Contacter Création Nowis
            </ContactPrefillLink>
          </article>
        </section>

        <section id="ecouter" aria-labelledby="artist-listening-title" className="scroll-mt-28 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="brand-card rounded-[2rem] p-6 sm:p-8 md:p-10">
            <h2 id="artist-listening-title" className="font-display text-3xl text-[color:var(--site-heading)]">{artist.listeningTitle}</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--site-muted)] sm:text-lg">
              Retrouve ici les plateformes disponibles et une sélection de chansons en vedette pour mieux ressentir l’univers de l’artiste.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {artist.platforms.map((platform) =>
                platform.url ? (
                  <a
                    key={platform.label}
                    href={platform.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${platform.ctaLabel} — ${platform.label} (nouvel onglet)`}
                    className="brand-card min-h-24 rounded-[1.5rem] border px-5 py-5 text-[color:var(--site-text)] motion-safe:transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-[color:var(--site-accent)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] focus-visible:ring-offset-2"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">{platform.label}</p>
                    <p className="mt-3 text-base font-semibold text-[color:var(--site-heading)]">{platform.ctaLabel}</p>
                  </a>
                ) : (
                  <div key={platform.label} className="min-h-24 rounded-[1.5rem] border border-dashed border-[color:var(--site-border)] bg-[color:var(--site-soft)] px-5 py-5 text-[color:var(--site-muted)]">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">{platform.label}</p>
                    <p className="mt-3 text-base font-semibold text-[color:var(--site-heading)]">{platform.ctaLabel}</p>
                    <p className="mt-2 text-sm leading-6">{platform.placeholder}</p>
                  </div>
                ),
              )}
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {artist.featuredSongs.map((song) => {
                const Component = song.external ? 'a' : Link;
                const componentProps = song.external
                  ? { href: song.href, target: '_blank', rel: 'noreferrer' }
                  : { href: song.href };

                return (
                  <Component
                    key={song.title}
                    {...componentProps}
                    className="rounded-[1.5rem] border border-[color:var(--site-border)] bg-[color:var(--site-soft)] p-5 motion-safe:transition motion-safe:hover:border-[color:var(--site-accent)]/40 motion-safe:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] focus-visible:ring-offset-2"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">{song.platform}</p>
                    <h3 className="mt-3 font-display text-xl text-[color:var(--site-heading)]">{song.title}</h3>
                    <p className="mt-3 leading-7 text-[color:var(--site-muted)]">{song.description}</p>
                    {song.external ? <span className="sr-only"> (nouvel onglet)</span> : null}
                  </Component>
                );
              })}
            </div>
          </article>

          <aside className="warm-spotlight-panel rounded-[2rem] p-6 shadow-sm sm:p-8 md:p-10">
            <h2 className="font-display text-3xl text-[color:var(--site-heading)]">Écoute directe</h2>
            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-[color:var(--site-accent)]/15 bg-white/75">
              {embedPlatform?.embedUrl ? (
                <iframe
                  src={embedPlatform.embedUrl}
                  title={`${artist.name} sur ${embedPlatform.label}`}
                  width="100%"
                  height="352"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="w-full"
                />
              ) : (
                <div className="flex min-h-[352px] items-center justify-center px-6 text-center leading-7 text-[color:var(--site-muted)]">
                  Aucun lecteur intégré disponible pour le moment. Les liens externes restent accessibles ci-contre.
                </div>
              )}
            </div>
            <p className="mt-5 text-sm leading-7 text-[color:var(--site-text)]">
              Les lecteurs intégrés sont affichés quand une source officielle est disponible. Les autres plateformes restent préparées dans la structure de données pour être complétées facilement.
            </p>
          </aside>
        </section>

        <section id="creation-nowis" aria-labelledby="association-title" className="warm-cta-panel scroll-mt-28 rounded-[2rem] p-6 shadow-sm sm:p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Création Nowis</p>
          <h2 id="association-title" className="mt-4 font-display text-3xl text-[color:var(--site-heading)]">{artist.associationTitle}</h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {artist.associationText.map((paragraph) => (
              <p key={paragraph} className="leading-7 text-[color:var(--site-text)]">{paragraph}</p>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href={SONG_REQUEST_GOOGLE_AUTH_URL}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-warm px-6 py-3 text-center font-semibold text-white motion-safe:transition motion-safe:hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] focus-visible:ring-offset-2 sm:w-auto"
            >
              Demander une chanson personnalisée
            </Link>
            <Link
              href="/artistes"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[color:var(--site-accent)]/20 bg-[color:var(--site-panel)] px-6 py-3 text-center font-semibold text-[color:var(--site-heading)] motion-safe:transition motion-safe:hover:border-[color:var(--site-accent)]/40 motion-safe:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] focus-visible:ring-offset-2 sm:w-auto"
            >
              Voir les autres artistes
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
