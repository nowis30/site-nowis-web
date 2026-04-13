import Image from 'next/image';
import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import type { ArtistProfile } from '@/data/artists';

const platformStyles: Record<string, string> = {
  Spotify: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  YouTube: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
  'YouTube Music': 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
};

function sectionLink(id: string, label: string) {
  return (
    <a
      key={id}
      href={`#${id}`}
      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
    >
      {label}
    </a>
  );
}

export function ArtistProfilePage({ artist }: { artist: ArtistProfile }) {
  const embedPlatform = artist.platforms.find((platform) => platform.embedUrl);

  return (
    <div className="site-background">
      <section className="section-warm relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <Link href="/artistes" className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--site-muted)] transition hover:text-[color:var(--site-heading)]">
            <span aria-hidden="true">←</span>
            Retour aux artistes
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">{artist.role}</p>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-[color:var(--site-heading)] md:text-6xl">{artist.pageTitle}</h1>
              <p className="mt-5 max-w-3xl text-xl leading-relaxed text-[color:var(--site-text)]">{artist.hook}</p>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[color:var(--site-text)]">{artist.shortBio}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                {artist.heroHighlights.map((highlight) => (
                  <span key={highlight} className="rounded-full border border-[color:var(--site-accent)]/15 bg-white/70 px-4 py-2 text-sm font-medium text-[color:var(--site-text)]">
                    {highlight}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <ContactPrefillLink href={artist.contactHref} className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200">
                  Demander une chanson personnalisée
                </ContactPrefillLink>
                <ContactPrefillLink href="/contact?projectType=autre&message=Bonjour, je veux parler d’un projet créatif avec Création Nowis." className="inline-flex items-center justify-center rounded-xl border border-[color:var(--site-accent)]/20 bg-[color:var(--site-panel)] px-6 py-3 font-semibold text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)]/40 hover:bg-white">
                  Parler de mon projet
                </ContactPrefillLink>
              </div>
            </div>

            <div className="glass-panel-soft relative overflow-hidden rounded-[2rem] border border-[var(--site-border)] shadow-2xl">
              {artist.image?.src ? (
                <div className="relative min-h-[360px]">
                  <Image src={artist.image.src} alt={artist.image.alt} fill className="object-cover brightness-[0.92] contrast-[1.02]" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,244,234,0.02)_0%,rgba(140,102,67,0.18)_42%,rgba(53,35,23,0.48)_100%)]" />
                </div>
              ) : (
                <div className="flex min-h-[360px] flex-col justify-between bg-[radial-gradient(circle_at_top_left,_rgba(183,141,92,0.22),_transparent_30%),linear-gradient(180deg,#fbf4ea_0%,#f2e2cb_100%)] p-8 text-[color:var(--site-heading)]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[color:var(--site-accent)]/20 bg-white/70 text-3xl font-bold text-[color:var(--site-accent-strong)]">
                    {artist.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 3)}
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">Création Nowis</p>
                    <p className="mt-3 text-3xl font-semibold">{artist.name}</p>
                    <p className="mt-2 text-lg text-[color:var(--site-text)]">{artist.role}</p>
                    <p className="mt-3 max-w-md text-[color:var(--site-text)]">
                      Un univers présenté avec une direction sobre, humaine et cohérente avec le reste du site, même sans visuel dédié.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-6 py-5">
          {sectionLink('bio', artist.overviewLabel)}
          {sectionLink('parcours', artist.journeyLabel)}
          {sectionLink('sur-mesure', artist.customCreationsLabel)}
          {sectionLink('ecouter', 'Écouter')}
          {sectionLink('creation-nowis', artist.associationLabel)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-12 px-6 py-16 md:space-y-16 md:py-20">
        <section id="bio" className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[2rem] bg-white p-8 shadow-sm md:p-10">
            <h2 className="text-3xl font-bold text-slate-950">{artist.overviewTitle}</h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-slate-600">
              {artist.longBio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <aside className="warm-spotlight-panel rounded-[2rem] p-8 shadow-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Repère créatif</p>
            <h2 className="mt-4 text-3xl font-bold text-[color:var(--site-heading)]">Une démarche qui part de l’humain</h2>
            <p className="mt-5 leading-relaxed text-[color:var(--site-text)]">
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

        <section id="parcours" className="rounded-[2rem] bg-white p-8 shadow-sm md:p-10">
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-slate-950">{artist.journeyTitle}</h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-slate-600">
              {artist.journey.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          {artist.members?.length ? (
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {artist.members.map((member) => (
                <article key={member.name} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">{member.subtitle}</p>
                  <h3 className="mt-3 text-2xl font-bold text-slate-950">{member.name}</h3>
                  <p className="mt-4 leading-relaxed text-slate-600">{member.description}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section id="sur-mesure" className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="warm-cta-panel rounded-[2rem] p-8 shadow-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Sur mesure</p>
            <h2 className="mt-4 text-3xl font-bold text-[color:var(--site-heading)]">{artist.customCreationsTitle}</h2>
            <div className="mt-6 space-y-5 leading-relaxed text-[color:var(--site-text)]">
              {artist.customCreationsIntro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <p className="mt-6 rounded-2xl border border-[color:var(--site-accent)]/15 bg-white/70 px-5 py-4 text-sm leading-relaxed text-[color:var(--site-text)]">
              {artist.pricingNote}
            </p>
          </article>

          <article className="rounded-[2rem] bg-white p-8 shadow-sm md:p-10">
            <h3 className="text-2xl font-bold text-slate-950">Exemples de demandes</h3>
            <div className="mt-6 flex flex-wrap gap-3">
              {artist.customCreationsExamples.map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-8 rounded-[1.75rem] border border-emerald-100 bg-emerald-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Approche</p>
              <p className="mt-3 leading-relaxed text-emerald-900">
                Chaque projet part d’un échange humain : votre histoire, l’émotion à transmettre, le ton recherché et la meilleure forme pour lui donner de la portée.
              </p>
            </div>
            <ContactPrefillLink href={artist.contactHref} className="mt-8 inline-flex rounded-xl bg-brand-warm px-5 py-3 font-semibold text-white transition hover:brightness-110">
              Contacter Création Nowis
            </ContactPrefillLink>
          </article>
        </section>

        <section id="ecouter" className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[2rem] bg-white p-8 shadow-sm md:p-10">
            <h2 className="text-3xl font-bold text-slate-950">{artist.listeningTitle}</h2>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
              Retrouve ici les plateformes disponibles et une sélection de chansons en vedette pour mieux ressentir l’univers de l’artiste.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {artist.platforms.map((platform) => {
                const style = platformStyles[platform.label] || 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100';

                return platform.url ? (
                  <a
                    key={platform.label}
                    href={platform.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`rounded-[1.5rem] border px-5 py-5 transition ${style}`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.24em]">{platform.label}</p>
                    <p className="mt-3 text-base font-semibold">{platform.ctaLabel}</p>
                  </a>
                ) : (
                  <div key={platform.label} className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-slate-600">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em]">{platform.label}</p>
                    <p className="mt-3 text-base font-semibold">{platform.ctaLabel}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{platform.placeholder}</p>
                  </div>
                );
              })}
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
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">{song.platform}</p>
                    <h3 className="mt-3 text-xl font-bold text-slate-950">{song.title}</h3>
                    <p className="mt-3 leading-relaxed text-slate-600">{song.description}</p>
                  </Component>
                );
              })}
            </div>
          </article>

          <aside className="warm-spotlight-panel rounded-[2rem] p-8 shadow-sm md:p-10">
            <h2 className="text-3xl font-bold text-[color:var(--site-heading)]">Écoute directe</h2>
            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-[color:var(--site-accent)]/15 bg-white/75">
              {embedPlatform?.embedUrl ? (
                <iframe
                  src={embedPlatform.embedUrl}
                  title={`${artist.name} sur ${embedPlatform.label}`}
                  width="100%"
                  height="352"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="w-full"
                />
              ) : (
                <div className="flex min-h-[352px] items-center justify-center px-6 text-center text-[color:var(--site-muted)]">
                  Aucun embed disponible pour le moment. Les liens externes restent accessibles ci-contre.
                </div>
              )}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-[color:var(--site-text)]">
              Les embeds sont affichés quand une source officielle est disponible. Les autres plateformes restent préparées dans la structure de données pour être complétées facilement.
            </p>
          </aside>
        </section>

        <section id="creation-nowis" className="warm-cta-panel rounded-[2rem] p-8 shadow-sm md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Création Nowis</p>
          <h2 className="mt-4 text-3xl font-bold text-[color:var(--site-heading)]">{artist.associationTitle}</h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {artist.associationText.map((paragraph) => (
              <p key={paragraph} className="leading-relaxed text-[color:var(--site-text)]">{paragraph}</p>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <ContactPrefillLink href={artist.contactHref} className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200">
              Demander une chanson personnalisée
            </ContactPrefillLink>
            <Link href="/artistes" className="inline-flex items-center justify-center rounded-xl border border-[color:var(--site-accent)]/20 bg-[color:var(--site-panel)] px-6 py-3 font-semibold text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)]/40 hover:bg-white">
              Voir les autres artistes
            </Link>
          </div>
        </section>
      </section>
    </div>
  );
}
