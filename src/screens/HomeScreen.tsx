import Link from 'next/link';
import { LaunchOfferBanner } from '@/components/marketing/LaunchOfferBanner';

const quickOffers = [
  {
    title: 'Ateliers IA',
    description: 'Créez une chanson en groupe avec guitare, discussion, ChatGPT et Suno.',
    href: '/booking',
    cta: 'Réserver un atelier',
  },
  {
    title: 'Chansons personnalisées',
    description: 'Une chanson pour une personne, une famille, un événement ou un souvenir.',
    href: '/commander-une-chanson',
    cta: 'Demander une chanson',
  },
  {
    title: 'Créations vidéo',
    description: 'Des visuels et vidéos pour accompagner vos chansons, ateliers ou projets.',
    href: '/videos',
    cta: 'Voir les vidéos',
  },
];

const reasons = [
  'Simple à vivre',
  'Adapté à tous les âges',
  'Créatif et personnalisé',
  'Accompagné par Nowis Morin',
];

export function HomeScreen() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-12 text-slate-100 md:pt-16">
      <LaunchOfferBanner variant="hero" />

      <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-300">Création musicale et IA</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-6xl">Création Nowis</h1>
        <p className="mt-2 text-lg font-medium text-primary-200">De la guitare à l’IA</p>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
          Ateliers musicaux, chansons personnalisées et créations vidéo avec l’intelligence artificielle.
          Une approche simple, humaine et créative pour transformer une idée en chanson, en souvenir ou en projet.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Link href="/booking" className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-500">
            Réserver un atelier
          </Link>
          <Link href="/commander-une-chanson" className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950/70 px-5 py-3 text-sm font-semibold text-slate-100 hover:border-primary-500/50 hover:text-white">
            Demander une chanson
          </Link>
          <Link href="/creations" className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950/70 px-5 py-3 text-sm font-semibold text-slate-100 hover:border-primary-500/50 hover:text-white">
            Voir mes créations
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">Ce que je fais</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {quickOffers.map((offer) => (
            <article key={offer.title} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <h3 className="text-lg font-semibold text-white">{offer.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{offer.description}</p>
              <Link href={offer.href} className="mt-4 inline-flex text-sm font-semibold text-primary-200 hover:text-white">
                {offer.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-2xl font-semibold text-white">Pourquoi Création Nowis</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
          Une approche humaine, accessible et créative. Pas besoin d’être musicien : on part d’une idée,
          d’une histoire ou d’un moment, puis on crée quelque chose de vrai.
        </p>
        <ul className="mt-4 grid gap-2 text-sm text-slate-200 md:grid-cols-2">
          {reasons.map((item) => (
            <li key={item} className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center md:p-10">
        <h2 className="text-2xl font-bold text-white md:text-4xl">Vous avez une idée de chanson ou d’atelier ?</h2>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-200 md:text-base">
          Parlez-moi de votre projet. On peut partir d’un souvenir, d’une personne, d’un groupe ou d’une simple idée.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950/70 px-6 py-3 text-sm font-semibold text-slate-100 hover:border-primary-500/50 hover:text-white">
            Me contacter
          </Link>
          <Link href="/booking" className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-500">
            Demander un atelier
          </Link>
        </div>
      </section>
    </div>
  );
}
