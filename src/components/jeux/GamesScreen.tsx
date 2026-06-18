import Link from 'next/link';
import { Home, Sparkles, Zap, ExternalLink } from 'lucide-react';
import { GamesGrid } from './GamesGrid';

export function GamesScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background animated elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Header/Navigation */}
        <header className="sticky top-0 z-50 backdrop-blur-sm bg-slate-950/80 border-b border-sky-400/10">
          <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-black text-white hidden sm:block">NOWIS Games</h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-white text-sm font-semibold transition"
            >
              <Home size={16} />
              Accueil
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-4 md:px-6 pt-12 md:pt-16 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-6 mb-12">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-400/30 bg-sky-500/10 text-white text-xs font-bold uppercase tracking-wider">
                <Zap size={12} />
                Zone Jeux NOWIS
              </div>

              {/* Main Title */}
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                  <span className="bg-gradient-to-r from-sky-200 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                    Joue, écoute, découvre
                  </span>
                </h2>
                <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl">
                  Amuse-toi avec des mini-jeux simples pendant que la musique NOWIS joue en arrière-plan. Une vraie salle d'arcade musicale pour passer un bon moment !
                </p>
              </div>

              {/* Features Pills */}
              <div className="flex flex-wrap gap-3 pt-4">
                {[
                  { icon: '🎮', text: '37+ mini-jeux' },
                  { icon: '🎵', text: 'Radio NOWIS' },
                  { icon: '📱', text: 'Mobile friendly' },
                  { icon: '⚡', text: 'Sans inscription' },
                ].map((feature) => (
                  <div
                    key={feature.text}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-sky-400/30 hover:bg-sky-500/10 transition"
                  >
                    <span className="text-lg">{feature.icon}</span>
                    <span className="text-sm font-semibold text-white">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* Games Grid Section */}
        <section className="px-4 md:px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Section Title */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-1 w-12 bg-gradient-to-r from-sky-400 to-cyan-400 rounded" />
                <h3 className="text-sm font-bold text-sky-300 uppercase tracking-wider">Tous les jeux</h3>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white">Choisissez votre jeu</h2>
              <p className="text-slate-400 mt-2">Cliquez sur une carte pour commencer à jouer</p>
            </div>

            {/* Games Grid */}
            <GamesGrid />
          </div>
        </section>

        {/* Footer CTA */}
        <section className="px-4 md:px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-2xl border border-sky-400/20 bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-blue-500/10 backdrop-blur-sm p-8 md:p-12 text-center space-y-6">
              <h3 className="text-2xl md:text-3xl font-black text-white">
                Découvrez l'univers NOWIS
              </h3>
              <p className="text-slate-300 max-w-2xl mx-auto">
                NOWIS est un projet de musique, création avec IA, spectacles et divertissement. Explorez notre univers artistique et festif.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-slate-950 font-bold hover:bg-slate-100 transition"
                >
                  <Home size={16} />
                  Retour à l'accueil
                </Link>
                <a
                  href="https://nowis.store"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-sky-400/30 bg-sky-500/10 text-white font-bold hover:bg-sky-500/20 transition"
                >
                  <ExternalLink size={16} />
                  Visiter nowis.store
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
