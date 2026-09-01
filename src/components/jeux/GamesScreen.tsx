import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Crown,
  ExternalLink,
  Gamepad2,
  Spade,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { GamesGrid } from './GamesGrid';

const featuredGames = [
  {
    name: 'Village IA',
    eyebrow: 'Univers social',
    description:
      'Explore ton village, développe ta maison, retrouve d’autres joueurs et découvre l’univers social NOWIS.',
    href: 'https://village-ia.vercel.app',
    cta: 'Entrer dans le village',
    icon: <Users size={28} />,
    external: true,
    border: 'border-emerald-300/25 hover:border-emerald-200/55',
    glow: 'from-emerald-400/20 via-cyan-400/10 to-transparent',
    iconStyle: 'border-emerald-200/30 bg-emerald-300/15 text-emerald-100',
    badgeStyle: 'border-emerald-200/20 bg-emerald-300/10 text-emerald-100',
    buttonStyle: 'bg-emerald-300 text-emerald-950 hover:bg-emerald-200',
  },
  {
    name: 'Poker Menteur',
    eyebrow: 'Jeu multijoueur',
    description:
      'Bluffe, lis les autres joueurs et tente de survivre aux manches dans le jeu de cartes social de NOWIS.',
    href: 'https://poker-menteur-self.vercel.app',
    cta: 'Jouer à Poker Menteur',
    icon: <Spade size={28} />,
    external: true,
    border: 'border-fuchsia-300/25 hover:border-fuchsia-200/55',
    glow: 'from-fuchsia-400/20 via-violet-400/10 to-transparent',
    iconStyle: 'border-fuchsia-200/30 bg-fuchsia-300/15 text-fuchsia-100',
    badgeStyle: 'border-fuchsia-200/20 bg-fuchsia-300/10 text-fuchsia-100',
    buttonStyle: 'bg-fuchsia-300 text-fuchsia-950 hover:bg-fuchsia-200',
  },
  {
    name: 'Héritier Millionnaire',
    eyebrow: 'Grande aventure',
    description:
      'Construis ta progression et relève les défis de l’expérience Héritier Millionnaire directement dans NOWIS.',
    href: 'https://client-jeux-millionnaire.vercel.app/',
    cta: 'Jouer à Héritier Millionnaire',
    icon: <Crown size={28} />,
    external: true,
    border: 'border-amber-300/25 hover:border-amber-200/55',
    glow: 'from-amber-400/20 via-orange-400/10 to-transparent',
    iconStyle: 'border-amber-200/30 bg-amber-300/15 text-amber-100',
    badgeStyle: 'border-amber-200/20 bg-amber-300/10 text-amber-100',
    buttonStyle: 'bg-amber-300 text-amber-950 hover:bg-amber-200',
  },
];

function FeaturedGameCard({ game }: { game: (typeof featuredGames)[number] }) {
  const content = (
    <>
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${game.glow} opacity-80 transition duration-300 group-hover:opacity-100`}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
        aria-hidden="true"
      />

      <div className="relative flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg ${game.iconStyle}`}>
            {game.icon}
          </div>
          <span className={`rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.15em] ${game.badgeStyle}`}>
            {game.eyebrow}
          </span>
        </div>

        <div className="mt-7 flex-1">
          <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{game.name}</h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">{game.description}</p>
        </div>

        <div className={`mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black shadow-lg transition ${game.buttonStyle}`}>
          <span>{game.cta}</span>
          {game.external ? <ExternalLink size={16} /> : <ArrowRight size={16} />}
        </div>
      </div>
    </>
  );

  const className = `group relative min-h-[300px] overflow-hidden rounded-[1.7rem] border bg-slate-950/75 shadow-[0_22px_70px_rgba(0,0,0,0.38)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_85px_rgba(0,0,0,0.48)] ${game.border}`;

  if (game.external) {
    return (
      <a href={game.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={game.href} className={className}>
      {content}
    </Link>
  );
}

export function GamesScreen() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#02030a] text-white">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.18),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(168,85,247,0.14),transparent_26%),radial-gradient(circle_at_50%_92%,rgba(6,182,212,0.13),transparent_30%),linear-gradient(180deg,#010207_0%,#040714_48%,#02030a_100%)]" />
        <div className="absolute inset-0 opacity-80 [background-image:radial-gradient(circle,rgba(255,255,255,0.95)_1px,transparent_1.4px),radial-gradient(circle,rgba(125,211,252,0.7)_1px,transparent_1.5px),radial-gradient(circle,rgba(196,181,253,0.65)_1px,transparent_1.5px)] [background-position:0_0,37px_53px,91px_19px] [background-size:73px_73px,113px_113px,157px_157px]" />
        <div className="absolute left-[-12rem] top-[18%] h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[110px]" />
        <div className="absolute right-[-10rem] top-[8%] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute bottom-[-12rem] left-[28%] h-[30rem] w-[30rem] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 md:pt-12">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-slate-200 backdrop-blur-xl transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-white"
          >
            <ArrowLeft size={16} />
            <span>Retour</span>
          </Link>

          <div className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 backdrop-blur-xl">
            <Gamepad2 size={15} />
            Arcade NOWIS
          </div>
        </div>

        <section className="relative mx-auto max-w-4xl pb-8 pt-12 text-center sm:pt-16 md:pb-12">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-violet-100 shadow-[0_0_35px_rgba(139,92,246,0.12)]">
            <Sparkles size={14} />
            Entre dans le monde des jeux
          </div>

          <h1 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-5xl md:text-7xl">
            Choisis ton univers.
            <span className="mt-2 block bg-[linear-gradient(90deg,#67e8f9,#a78bfa,#f0abfc)] bg-clip-text text-transparent">
              Joue tout de suite.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
            Trois grandes expériences NOWIS et 37 mini-jeux rapides, colorés et pensés pour le téléphone.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs font-bold text-slate-200">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">🎮 40 expériences</span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">⭐ 3 univers vedettes</span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">📱 Téléphone d’abord</span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">⚡ 37 mini-jeux instantanés</span>
          </div>
        </section>

        <section className="relative mb-14 sm:mb-16">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-white/10 pb-4 sm:mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-200">
                <Sparkles size={14} />
                Expériences NOWIS
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Les grands univers à découvrir</h2>
            </div>
            <span className="hidden text-sm font-semibold text-slate-400 sm:block">Trois expériences, trois styles de jeu</span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
            {featuredGames.map((game) => (
              <FeaturedGameCard key={game.name} game={game} />
            ))}
          </div>
        </section>

        <section className="relative">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-white/10 pb-4 sm:mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                <Zap size={14} />
                37 mini-jeux
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">À quoi veux-tu jouer maintenant?</h2>
            </div>
            <span className="hidden text-sm font-semibold text-slate-400 sm:block">Touche une carte pour commencer</span>
          </div>

          <GamesGrid />
        </section>
      </div>
    </div>
  );
}
