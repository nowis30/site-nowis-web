import Image from 'next/image';
import Link from 'next/link';
import { ContactPrefillLink } from '@/components/ContactPrefillLink';
import {
  SongHowItWorksSection,
  SongPackagesSection,
  SongTrustStrip,
  SongVideoExtrasSection,
  WhyNowisSection,
} from '@/components/marketing/SongSalesSections';
import { getAllArtists } from '@/data/artists';
import { getFeaturedSongs } from '@/data/songs';
import { secondaryCreativeServices, songProjectTypes, songSalesCtas } from '@/data/songSales';

export const HomeScreen = async () => {
  const [songs] = await Promise.all([getFeaturedSongs(3)]);
  const artists = getAllArtists();

  return (
    <div className="bg-transparent text-slate-100">
      <section className="brand-shell brand-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-coal-950/50" />
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-28">
          <div className="relative z-10">
            <p className="brand-chip">
              Service principal : chansons personnalisées
            </p>
            <h1 className="brand-metal-text mt-6 max-w-4xl font-display text-5xl leading-[0.95] md:text-7xl xl:text-8xl">
              Je transforme votre histoire en chanson personnalisée
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
              Mariage, anniversaire, naissance, hommage, amour, famille.
              Création musicale sur mesure, avec option visuelle et vidéo IA.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Ambiance vintage</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Direction premium</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Palette feu + acier</span>
            </div>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href={songSalesCtas.order.href}
                className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-6 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
              >
                {songSalesCtas.order.label}
              </Link>
              <Link
                href={songSalesCtas.listen.href}
                className="inline-flex items-center justify-center rounded-xl border border-primary-300/30 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-primary-500/10"
              >
                {songSalesCtas.listen.label}
              </Link>
            </div>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-400">
              Création Nowis vend d’abord la musique. Les visuels et vidéos IA sont proposés ensuite comme compléments, quand ils servent vraiment la chanson.
            </p>
          </div>

          <div className="relative z-10 animate-float">
            <div className="brand-panel p-4">
              <div className="absolute -left-6 top-10 hidden h-24 w-24 rounded-full bg-primary-500/20 blur-3xl md:block" />
              <div className="absolute -right-6 bottom-16 hidden h-28 w-28 rounded-full bg-secondary-500/20 blur-3xl md:block" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-[#f4e1b7]/20 bg-[radial-gradient(circle_at_center,_rgba(255,122,43,0.18),_transparent_45%),linear-gradient(180deg,#120f11_0%,#191312_100%)]">
                <Image src="/nowis.png" alt="Logo Nowis, Création Nowis" fill className="object-contain p-5 md:p-8" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-coal-950/35 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-sm uppercase tracking-[0.24em] text-primary-200">Création Nowis</p>
                  <p className="brand-metal-text mt-2 font-display text-3xl leading-none">Une chanson pensée pour un vrai moment de vie</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-coal-950/70 p-4 text-white">
                  <p className="text-sm text-slate-400">Formats demandés</p>
                  <p className="mt-2 font-semibold">Mariage, hommage, anniversaire, famille</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-coal-950/70 p-4 text-white">
                  <p className="text-sm text-slate-400">Logique d’offre</p>
                  <p className="mt-2 font-semibold">Forfaits fixes et options claires</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SongTrustStrip />

      <SongHowItWorksSection />

      <SongPackagesSection />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-500">Exemples</p>
            <h2 className="mt-4 font-display text-5xl leading-none text-white md:text-6xl">Des réalisations pour entendre le ton, l’émotion et la direction</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              Voici quelques chansons déjà publiées pour montrer la couleur du projet. Elles servent de repères concrets avant de commander une création sur mesure.
            </p>
          </div>
          <Link
            href={songSalesCtas.listen.href}
            className="inline-flex items-center justify-center rounded-xl border border-primary-300/30 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-primary-500/10"
          >
            {songSalesCtas.listen.label}
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {songs.map((song) => (
              <Link key={song.slug} href={`/chanson/${song.slug}`} className="brand-card p-6 transition hover:-translate-y-1 hover:border-primary-400/40">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-300">Exemple musical</p>
                <h3 className="mt-4 font-display text-4xl leading-none text-white">{song.title}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-300">{song.shortDescription}</p>
                <p className="mt-6 font-semibold text-primary-200">Écouter cet exemple →</p>
              </Link>
            ))}
          </div>

          <article className="brand-panel p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-200">Demandes fréquentes</p>
            <h3 className="mt-4 font-display text-5xl leading-none">Une même offre, plusieurs histoires possibles</h3>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              Le point commun reste toujours le même : partir d’un vrai vécu et lui donner une forme musicale stable, touchante et facile à offrir.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {songProjectTypes.map((item) => (
                <span key={item} className="rounded-full border border-primary-300/30 bg-primary-500/10 px-4 py-2 text-sm text-primary-100">
                  {item}
                </span>
              ))}
            </div>
          </article>
        </div>
      </section>

      <SongVideoExtrasSection />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <WhyNowisSection />

          <article className="brand-panel p-8 text-white md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-200">Artistes / univers</p>
            <h2 className="mt-4 font-display text-5xl leading-none">Création Nowis, un univers d’abord musical</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              La bannière Création Nowis met en avant Nowis Morin comme artiste principal, puis ouvre vers des collaborations et artistes associés qui élargissent l’univers sans brouiller l’offre principale.
            </p>
            <div className="mt-8 grid gap-4">
              {artists.map((artist) => (
                <Link key={artist.slug} href={`/artistes/${artist.slug}`} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-primary-500/10">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-200">{artist.role}</p>
                  <h3 className="mt-3 font-display text-4xl leading-none">{artist.name}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{artist.cardSummary}</p>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-500">Autres services créatifs</p>
          <h2 className="mt-4 font-display text-5xl leading-none text-white md:text-6xl">Des services secondaires pour prolonger l’univers</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            Quand la chanson est en place, Création Nowis peut aussi ajouter des éléments visuels, promotionnels ou interactifs. Ces services restent volontairement en second plan.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {secondaryCreativeServices.map((service) => (
            <Link key={service.title} href={service.href} className="brand-card p-6 transition hover:border-primary-400/40 hover:bg-primary-500/10">
              <h3 className="font-display text-3xl leading-none text-white">{service.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{service.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="brand-shell">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center text-white md:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-200">CTA final</p>
          <h2 className="mt-4 font-display text-5xl leading-none md:text-7xl">Une offre plus claire pour commander la musique en premier</h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
            Si tu veux offrir ou faire créer une chanson sur mesure, tout est maintenant pensé pour être simple : forfaits fixes, exemples d’écoute, options vidéo en extra et contact direct.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={songSalesCtas.order.href}
              className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-6 py-3 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
            >
              {songSalesCtas.order.label}
            </Link>
            <ContactPrefillLink
              href={songSalesCtas.talk.href}
              className="inline-flex items-center justify-center rounded-xl border border-primary-300/30 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-primary-500/10"
            >
              {songSalesCtas.talk.label}
            </ContactPrefillLink>
          </div>
        </div>
      </section>
    </div>
  );
};
