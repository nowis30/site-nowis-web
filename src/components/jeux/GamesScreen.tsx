import Link from 'next/link';
import { ArrowLeft, Gamepad2, Sparkles, Zap } from 'lucide-react';
import { GamesGrid } from './GamesGrid';

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
            Choisis ton jeu.
            <span className="mt-2 block bg-[linear-gradient(90deg,#67e8f9,#a78bfa,#f0abfc)] bg-clip-text text-transparent">
              Joue tout de suite.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
            Des jeux rapides, colorés et pensés pour le téléphone. Appuie sur une carte et le jeu s’ouvre directement en plein écran.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs font-bold text-slate-200">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">🎮 37 jeux</span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">📱 Téléphone d’abord</span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">⚡ Sans inscription</span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">🌌 Plein écran</span>
          </div>
        </section>

        <section className="relative">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-white/10 pb-4 sm:mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                <Zap size={14} />
                Tous les jeux
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">À quoi veux-tu jouer?</h2>
            </div>
            <span className="hidden text-sm font-semibold text-slate-400 sm:block">Touchez une carte pour commencer</span>
          </div>

          <GamesGrid />
        </section>
      </div>
    </div>
  );
}
