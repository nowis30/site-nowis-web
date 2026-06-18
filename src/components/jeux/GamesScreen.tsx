'use client';

import Link from 'next/link';
import { ExternalLink, Gamepad2, Music3, PlayCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { NowisRadio } from './NowisRadio';
import { gameCatalog } from './gameCatalog';

const vibePills = ['Arcade', 'Radio', 'Création', 'Jeux'] as const;
const vibePillClasses = [
  'border-fuchsia-400/35 bg-fuchsia-500/12 text-white',
  'border-cyan-400/35 bg-cyan-500/12 text-white',
  'border-amber-300/35 bg-amber-500/12 text-white',
  'border-emerald-400/35 bg-emerald-500/12 text-white',
] as const;

export function GamesScreen() {
  return (
    <div className="arcade-yellow-text mx-auto max-w-7xl px-4 pb-16 pt-6 text-slate-100 md:px-6 md:pt-10">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-sky-400/20 bg-[radial-gradient(circle_at_10%_10%,rgba(59,130,246,0.26),transparent_22%),radial-gradient(circle_at_92%_12%,rgba(34,211,238,0.20),transparent_18%),radial-gradient(circle_at_52%_0%,rgba(96,165,250,0.14),transparent_20%),linear-gradient(180deg,rgba(8,15,32,0.99),rgba(6,28,68,0.98))] px-5 py-7 shadow-[0_30px_80px_rgba(0,0,0,0.42)] md:px-8 md:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_10%_10%,rgba(59,130,246,0.26),transparent_22%),radial-gradient(circle_at_92%_12%,rgba(34,211,238,0.20),transparent_18%),radial-gradient(circle_at_52%_0%,rgba(96,165,250,0.14),transparent_20%)]">
          <div className="absolute left-[-5rem] top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.4),transparent_65%)] blur-2xl" />
          <div className="absolute right-[-4rem] top-28 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.34),transparent_62%)] blur-2xl" />
          <div className="absolute bottom-[-5rem] left-1/3 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.28),transparent_65%)] blur-2xl" />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {vibePills.map((pill, index) => (
                <span key={pill} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${vibePillClasses[index]}`}>
                  <Sparkles size={12} className="text-white" />
                  {pill}
                </span>
              ))}
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-yellow-100">Jeux NOWIS</p>
              <h1 className="mt-4 max-w-3xl bg-[linear-gradient(90deg,#ffffff_0%,#ffe4a3_26%,#86efff_55%,#ff9ed1_82%,#ffffff_100%)] bg-clip-text text-4xl font-black leading-[0.95] tracking-tight text-transparent md:text-6xl xl:text-7xl">
                Une arcade musicale pour jouer, écouter et vibrer.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100 md:text-lg">
                Lance un mini-jeu, garde la radio en fond, et profite d’une page pensée comme une vraie salle d’arcade moderne, jeune et lumineuse.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                'Mini-jeux HTML/JavaScript',
                'Radio NOWIS en boucle',
                'Interface mobile friendly',
              ].map((item, index) => (
                <div key={item} className={`rounded-2xl border px-4 py-4 text-sm font-semibold text-yellow-50 shadow-[0_16px_40px_rgba(0,0,0,0.22)] ${['border-sky-300/35 bg-sky-500/14', 'border-cyan-300/35 bg-cyan-500/14', 'border-blue-200/35 bg-blue-500/14'][index]}`}>
                  {item}
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {gameCatalog.map((game, index) => (
                <article
                  key={game.src}
                  className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.04))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.25)] transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${index % 4 === 0 ? 'bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.30),transparent_45%)]' : index % 4 === 1 ? 'bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.26),transparent_45%)]' : index % 4 === 2 ? 'bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.26),transparent_45%)]' : 'bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.22),transparent_45%)]'}`} />
                  <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${index % 4 === 0 ? 'bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.30),transparent_45%)]' : index % 4 === 1 ? 'bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.26),transparent_45%)]' : index % 4 === 2 ? 'bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.26),transparent_45%)]' : 'bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.22),transparent_45%)]'}`} />
                  <div className="relative">
                    <div className="mb-4 flex items-center gap-3 text-white">
                      <Gamepad2 size={16} />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white">Arcade</span>
                    </div>
                    <p className="text-lg font-black text-white md:text-xl">{game.name}</p>
                    <Link
                      href={`/jeux/${game.slug}`}
                      className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-slate-950 shadow-[0_12px_30px_rgba(255,255,255,0.15)] transition hover:scale-[1.02] hover:bg-slate-200 ${index % 4 === 0 ? 'bg-sky-200' : index % 4 === 1 ? 'bg-cyan-200' : index % 4 === 2 ? 'bg-blue-200' : 'bg-indigo-200'}`}
                    >
                      <PlayCircle size={16} />
                      Jouer
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[2rem] border border-sky-300/20 bg-[linear-gradient(180deg,rgba(8,18,38,0.96),rgba(10,30,64,0.96))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] md:p-5">
              <NowisRadio />
            </div>
            <div className="rounded-[1.75rem] border border-sky-300/20 bg-[linear-gradient(180deg,rgba(8,18,38,0.96),rgba(10,30,64,0.96))] p-5 text-sm text-yellow-50">
              <p className="flex items-center gap-2 font-semibold text-white">
                <Music3 size={16} className="text-white" />
                  Mode lecture continue
              </p>
              <p className="mt-2 leading-6">
                La radio suit la playlist définie dans un seul tableau facile à modifier. Les titres passent automatiquement au suivant et reviennent au début à la fin.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-sky-400/15 bg-[linear-gradient(180deg,rgba(8,18,38,0.96),rgba(10,30,64,0.96))] p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white">Navigation arcade</p>
        <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">Une page dédiée pour chaque jeu</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white">
          Choisis un jeu dans la galerie ci-dessus. Chaque bouton ouvre maintenant une page dédiée avec le jeu en grand, puis la radio NOWIS juste en dessous.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-sky-300/20 bg-[linear-gradient(135deg,rgba(8,32,64,0.96),rgba(18,74,120,0.92))] p-5 text-yellow-50 xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-yellow-50">Découvre aussi Création Nowis</p>
          <h3 className="mt-3 text-2xl font-black text-yellow-50">Liens utiles</h3>
          <p className="mt-2 text-sm leading-6 text-yellow-50">
            Pour continuer la visite, voici les autres portes d’entrée vers l’univers Création Nowis.
          </p>
        </div>

        {[
          { label: 'Site officiel', href: 'https://nowis.store' },
          { label: 'YouTube', href: 'https://www.youtube.com/@nowis30' },
          { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61581050842840' },
          { label: 'Revid IA', href: 'https://www.revid.ai/?via=simon-morin' },
          { label: 'Spotify', href: 'https://open.spotify.com/intl-fr/artist/2zH00JaaHdcg4eII8dZUts?si=v0WmyoYsTBik3xG7iX6kYw' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl border border-sky-300/15 bg-[linear-gradient(180deg,rgba(8,18,38,0.96),rgba(10,30,64,0.96))] p-5 text-yellow-50 transition hover:border-sky-200/30 hover:bg-sky-500/10"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-yellow-50">{link.label}</p>
            <p className="mt-3 break-words text-sm leading-6 text-yellow-50">{link.href}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-yellow-50">
              Ouvrir
              <ExternalLink size={15} />
            </span>
          </a>
        ))}
      </section>

      <section className="mt-8 rounded-3xl border border-sky-300/15 bg-[linear-gradient(180deg,rgba(8,18,38,0.96),rgba(10,30,64,0.96))] p-5 text-xs leading-6 text-yellow-50 md:p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[color:var(--site-accent-soft)]" />
          <p>
            Certains mini-jeux sont adaptés à partir de projets open source. Les licences originales sont conservées dans les dossiers des jeux.
          </p>
        </div>
      </section>
    </div>
  );
}
