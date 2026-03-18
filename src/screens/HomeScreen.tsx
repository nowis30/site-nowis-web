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
    <div className="bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#111827_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-28">
          <div>
            <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200">
              Service principal : chansons personnalisées
            </p>
            <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight text-white md:text-6xl">
              Je transforme votre histoire en chanson personnalisée
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
              Mariage, anniversaire, naissance, hommage, amour, famille.
              Création musicale sur mesure, avec option visuelle et vidéo IA.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href={songSalesCtas.order.href}
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                {songSalesCtas.order.label}
              </Link>
              <Link
                href={songSalesCtas.listen.href}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                {songSalesCtas.listen.label}
              </Link>
            </div>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-400">
              Création Nowis vend d’abord la musique. Les visuels et vidéos IA sont proposés ensuite comme compléments, quand ils servent vraiment la chanson.
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-sm">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/10">
                <Image src="/hero.jpg" alt="Nowis Morin, Création Nowis" fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">Création Nowis</p>
                  <p className="mt-2 text-2xl font-bold">Une chanson pensée pour un vrai moment de vie</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-white">
                  <p className="text-sm text-slate-400">Formats demandés</p>
                  <p className="mt-2 font-semibold">Mariage, hommage, anniversaire, famille</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-white">
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
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">Exemples</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-950 md:text-4xl">Des réalisations pour entendre le ton, l’émotion et la direction</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Voici quelques chansons déjà publiées pour montrer la couleur du projet. Elles servent de repères concrets avant de commander une création sur mesure.
            </p>
          </div>
          <Link
            href={songSalesCtas.listen.href}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            {songSalesCtas.listen.label}
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {songs.map((song) => (
              <Link key={song.slug} href={`/chanson/${song.slug}`} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Exemple musical</p>
                <h3 className="mt-4 text-2xl font-bold text-slate-950">{song.title}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">{song.shortDescription}</p>
                <p className="mt-6 font-semibold text-slate-900">Écouter cet exemple →</p>
              </Link>
            ))}
          </div>

          <article className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Demandes fréquentes</p>
            <h3 className="mt-4 text-3xl font-bold">Une même offre, plusieurs histoires possibles</h3>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              Le point commun reste toujours le même : partir d’un vrai vécu et lui donner une forme musicale stable, touchante et facile à offrir.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {songProjectTypes.map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
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

          <article className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Artistes / univers</p>
            <h2 className="mt-4 text-3xl font-bold">Création Nowis, un univers d’abord musical</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              La bannière Création Nowis met en avant Nowis Morin comme artiste principal, puis ouvre vers des collaborations et artistes associés qui élargissent l’univers sans brouiller l’offre principale.
            </p>
            <div className="mt-8 grid gap-4">
              {artists.map((artist) => (
                <Link key={artist.slug} href={`/artistes/${artist.slug}`} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">{artist.role}</p>
                  <h3 className="mt-3 text-2xl font-bold">{artist.name}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{artist.cardSummary}</p>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">Autres services créatifs</p>
          <h2 className="mt-4 text-3xl font-bold text-slate-950 md:text-4xl">Des services secondaires pour prolonger l’univers</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Quand la chanson est en place, Création Nowis peut aussi ajouter des éléments visuels, promotionnels ou interactifs. Ces services restent volontairement en second plan.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {secondaryCreativeServices.map((service) => (
            <Link key={service.title} href={service.href} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:bg-slate-100/60">
              <h3 className="text-xl font-bold text-slate-950">{service.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.2),_transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center text-white md:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">CTA final</p>
          <h2 className="mt-4 text-3xl font-bold md:text-5xl">Une offre plus claire pour commander la musique en premier</h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
            Si tu veux offrir ou faire créer une chanson sur mesure, tout est maintenant pensé pour être simple : forfaits fixes, exemples d’écoute, options vidéo en extra et contact direct.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={songSalesCtas.order.href}
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              {songSalesCtas.order.label}
            </Link>
            <ContactPrefillLink
              href={songSalesCtas.talk.href}
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              {songSalesCtas.talk.label}
            </ContactPrefillLink>
          </div>
        </div>
      </section>
    </div>
  );
};
