import Link from 'next/link';

const highlights = [
  'Fais grandir ton patrimoine avec l’immobilier, la bourse et une vraie logique de progression.',
  'Débloque des gains grâce aux quiz, événements et mini-jeux intégrés.',
  'Joue facilement sur mobile ou ordinateur avec une expérience pensée pour être fluide et rapide.',
];

const pillars = [
  {
    title: 'Gestion financière',
    description: 'Apprends à arbitrer entre liquidités, investissements et rendement à long terme.',
  },
  {
    title: 'Immobilier',
    description: 'Développe un parc immobilier et optimise tes décisions pour faire croître ton actif net.',
  },
  {
    title: 'Bourse',
    description: 'Observe le marché, prends position et fais évoluer ta stratégie selon les opportunités.',
  },
  {
    title: 'Quiz et mini-jeux',
    description: 'Ajoute du rythme à ta partie avec des mécaniques ludiques et des récompenses supplémentaires.',
  },
];

const steps = [
  'Lance Héritier Millionnaire depuis ton navigateur.',
  'Commence à investir, répondre aux quiz et faire évoluer ton profil.',
  'Reviens régulièrement pour optimiser ta progression et viser le statut de millionnaire.',
];

const otherGames = [
  {
    title: 'Drag Shift Duel',
    description: 'Un jeu de drag racing 1 contre 1 plus arcade, connecté à l’univers NOWIS.',
    href: 'https://nowis30.github.io/drag/',
    label: 'Découvrir Drag Shift Duel',
  },
];

export const JeuxScreen = () => {
  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#111827_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-[1.15fr_0.85fr] md:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Jeux NOWIS</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-white md:text-6xl">
              Joue à Héritier Millionnaire directement depuis le site.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
              Héritier Millionnaire est un jeu de finances personnelles où tu construis ton avenir avec le cashflow, l’immobilier, la bourse, les quiz et des mini-jeux. Cette page te permet de le découvrir et d’y accéder rapidement.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/jeux/HéritierMillionaire"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Jouer à Héritier Millionnaire
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Parler d’un projet de jeu
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/80">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Immobilier</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Bourse</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Quiz</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Mobile & desktop</span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Pourquoi ce jeu plaît</p>
            <div className="mt-6 space-y-4">
              {highlights.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-emerald-500/10 p-5 text-sm text-emerald-100 ring-1 ring-emerald-400/20">
              Accès rapide, univers clair et progression motivante: la page est pensée pour convertir les visiteurs du site en joueurs.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Ce que propose Héritier Millionnaire</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Le jeu mélange stratégie, progression personnelle et plaisir de jeu. Il ne se contente pas d’un seul système: il réunit plusieurs leviers de croissance dans une même expérience.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-950">{pillar.title}</h3>
              <p className="mt-3 leading-relaxed text-slate-600">{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Commencer</p>
              <h2 className="mt-4 text-3xl font-bold">Comment jouer</h2>
              <ol className="mt-6 space-y-4">
                {steps.map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-semibold text-white">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-slate-300">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-950">Accès principal</h3>
                <p className="mt-3 text-lg leading-relaxed text-slate-600">
                  La meilleure porte d’entrée pour présenter le jeu reste la version web, accessible immédiatement depuis un lien simple à partager.
                </p>
                <Link
                  href="/jeux/HéritierMillionaire"
                  className="mt-6 inline-flex rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600"
                >
                  Ouvrir le jeu
                </Link>
              </div>

              {otherGames.map((game) => (
                <div key={game.title} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-950">Autre jeu à découvrir</h3>
                  <p className="mt-4 text-lg font-semibold text-slate-900">{game.title}</p>
                  <p className="mt-3 leading-relaxed text-slate-600">{game.description}</p>
                  <a
                    href={game.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    {game.label}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="rounded-3xl bg-[linear-gradient(135deg,#0f172a_0%,#111827_45%,#065f46_100%)] px-8 py-10 text-white shadow-sm md:px-12 md:py-14">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Page Jeux en ligne</p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">Le jeu a maintenant une vraie vitrine sur le site.</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-200">
              Utilise cette page pour partager Héritier Millionnaire plus facilement, améliorer sa visibilité et guider les visiteurs vers une action claire.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/jeux/HéritierMillionaire"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Lancer le jeu
              </Link>
              <Link
                href="/booking"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Réserver un appel
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
