import React from 'react';
import { ContactForm } from '@/components/ContactForm';
import Link from 'next/link';
import Image from 'next/image';
import { getFeaturedSongs } from '@/data/songs';
import { getAllVideos } from '@/data/videos';
import { serviceOffers } from '@/data/serviceOffers';
import { socialLinks } from '@/config/socialLinks';

export const HomeScreen: React.FC = async () => {
  const featuredSongs = await getFeaturedSongs(3);
  const videos = await getAllVideos();
  const featuredVideos = videos.filter((video) => video.featured).concat(videos.filter((video) => !video.featured)).slice(0, 2);

  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.25),_transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#111827_100%)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-[1.15fr_0.85fr] md:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Nowis Morin</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-white md:text-6xl">
              Je crée des chansons, vidéos, visuels et projets créatifs avec l’aide de l’intelligence artificielle.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
              Nowis Morin transforme des idées en créations artistiques et marketing plus fortes : musique originale, contenus YouTube, concepts visuels et projets personnalisés pensés pour émouvoir, surprendre et convertir.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/musique" className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200">Écouter mes chansons</Link>
              <Link href="/videos" className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10">Voir mes vidéos</Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-600">Me contacter</Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/80">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Nowis Morin chanson</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Musique IA Québec</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Artiste musique IA Québec</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
              <div className="grid md:grid-cols-[0.95fr_1.05fr]">
                <div className="relative min-h-[280px]">
                  <Image src="/hero.jpg" alt="Nowis Morin" fill className="object-cover" />
                </div>
                <div className="p-8 text-white">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Univers créatif</p>
                  <h2 className="mt-4 text-2xl font-bold">Une signature moderne, humaine et un peu audacieuse</h2>
                  <p className="mt-4 leading-relaxed text-slate-300">
                    J’utilise l’IA comme outil de création pour aller plus vite, explorer plus loin et produire des chansons, vidéos et concepts qui gardent une vraie sensibilité artistique.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <a href={socialLinks.spotify} target="_blank" rel="noreferrer" className="rounded-2xl bg-white p-5 font-semibold text-slate-950 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">Écouter Nowis Morin sur Spotify</a>
              <a href={socialLinks.youtube} target="_blank" rel="noreferrer" className="rounded-2xl bg-red-600 p-5 font-semibold text-white shadow-sm transition hover:-translate-y-1 hover:bg-red-700 hover:shadow-lg">Voir Nowis Morin sur YouTube</a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-4">
          {[
            'Chansons personnalisées',
            'Vidéos créatives',
            'Univers artistique cohérent',
            'Approche IA au service de l’émotion',
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-white px-5 py-5 text-center text-sm font-semibold text-slate-700 shadow-sm">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Mon univers créatif</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Le site nowis.store présente l’univers de Nowis Morin comme une vitrine artistique et commerciale : des chansons, des vidéos, une identité visuelle et une méthode de création capables de servir autant un projet personnel qu’une collaboration plus ambitieuse.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 md:py-12">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 px-8 py-10 md:grid-cols-[1.15fr_0.85fr] md:px-10 md:py-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">Jeux NOWIS</p>
              <h2 className="mt-4 text-3xl font-bold text-slate-950 md:text-4xl">Découvre Héritier Millionnaire sur le site</h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
                Un jeu de finances personnelles où tu développes ton patrimoine avec l’immobilier, la bourse, des quiz et des mini-jeux. La nouvelle page Jeux présente clairement le projet et permet de lancer la partie en quelques secondes.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link href="/jeux" className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800">
                  Voir la page Jeux
                </Link>
                <Link
                  href="/jeux/heritier-millionnaire"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-600"
                >
                  Jouer à Héritier Millionnaire
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
              {[
                'Cashflow, immobilier et bourse dans une même progression.',
                'Accessible sur mobile et ordinateur.',
                'Univers NOWIS relié à d’autres expériences comme Drag Shift Duel.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-sm font-medium leading-relaxed text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Mes créations récentes</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">Une sélection de chansons et formats visuels pour découvrir rapidement le style Nowis Morin.</p>
          </div>
          <Link href="/musique" className="hidden rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100 md:inline-flex">Voir toute la musique</Link>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {featuredSongs.map((song) => (
            <article key={song.slug} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-56">
                <Image src={song.image} alt={song.title} fill className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold text-slate-950">{song.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">{song.shortDescription}</p>
                <Link href={`/chanson/${song.slug}`} className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800">Voir la chanson</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Pourquoi travailler avec moi</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">Nowis Morin propose une approche à la fois créative, agile et structurée pour transformer une idée en contenu qui capte l’attention et donne envie d’aller plus loin.</p>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {serviceOffers.map((offer) => (
              <article key={offer.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
                <h3 className="text-xl font-semibold">{offer.title}</h3>
                <p className="mt-3 text-sm font-medium text-emerald-300">{offer.subtitle}</p>
                <p className="mt-4 leading-relaxed text-slate-300">{offer.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Vidéo et présence artistique</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">Nowis Morin développe aussi une présence visuelle pensée pour YouTube, les clips, les teasers et les formats qui prolongent l’impact des chansons.</p>
            <div className="mt-8 grid gap-6">
              {featuredVideos.map((video) => (
                <article key={video.slug} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-slate-950">{video.title}</h3>
                  <p className="mt-3 text-slate-600">{video.shortDescription}</p>
                  <a href={video.youtubeUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700">Voir la vidéo</a>
                </article>
              ))}
            </div>
          </div>

          <div id="contact" className="space-y-6">
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-950">Parlons de ton projet</h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">Si tu veux une création personnalisée, une collaboration ou simplement discuter d’une idée, utilise ce formulaire. Le but du site nowis.store est aussi de transformer les visiteurs intéressés en vrais contacts qualifiés.</p>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
};
