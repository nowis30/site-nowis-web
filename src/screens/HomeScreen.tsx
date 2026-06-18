import Link from 'next/link';
import { ArrowRight, Disc3, FolderOpen, Gamepad2, Music2, Sparkles, UsersRound, Video } from 'lucide-react';
import { LaunchOfferBanner } from '@/components/marketing/LaunchOfferBanner';
import { HeroVideoPlaceholder } from '@/components/marketing/HeroVideoPlaceholder';

const HOME_INTRO_VIDEO_URL = process.env.NEXT_PUBLIC_HOME_INTRO_VIDEO_URL?.trim() || '';

const primaryActions = [
  {
    title: 'Écouter mes chansons',
    description: 'Découvre mes MP3, MP4, clips et créations musicales.',
    href: '/musique',
    cta: 'Ouvrir la bibliothèque',
    icon: Music2,
  },
  {
    title: 'Accéder à mon portail',
    description: 'Retrouve tes chansons, vidéos, documents et projets.',
    href: '/connexion',
    cta: 'Entrer dans le portail',
    icon: FolderOpen,
  },
  {
    title: 'Me rejoindre',
    description: 'Pour une chanson personnalisée, un atelier, une vidéo ou une question.',
    href: '/contact',
    cta: 'Écrire à Nowis',
    icon: UsersRound,
  },
  {
    title: 'Jeux NOWIS',
    description: 'Lance des mini-jeux et garde ta musique en écoute.',
    href: '/jeux',
    cta: 'Ouvrir la page Jeux',
    icon: Gamepad2,
  },
];

const quickLinks = [
  { label: 'À propos', href: '/a-propos' },
  { label: 'Services', href: '/services' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Ateliers', href: '/ateliers' },
  { label: 'Créations', href: '/creations' },
  { label: 'Vidéos', href: '/videos' },
];

const captureBlocks = [
  {
    title: 'Bibliothèque musicale',
    description: 'Écoute mes chansons, extraits et clips en un seul endroit.',
    href: '/musique',
    cta: 'Écouter les chansons',
  },
  {
    title: 'Portail client',
    description: 'Suis ton projet, tes documents et tes prochaines étapes.',
    href: '/connexion',
    cta: 'Se connecter au portail',
  },
  {
    title: 'Services et ateliers',
    description: 'Choisis la formule qui te ressemble: atelier, vidéo ou création.',
    href: '/services',
    cta: 'Découvrir les services',
  },
  {
    title: 'Contact direct',
    description: 'Parle-moi de ton idée et on la transforme en projet concret.',
    href: '/contact',
    cta: 'Commander ou me contacter',
  },
];

export function HomeScreen() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-12 text-[color:var(--site-text)] md:pt-16">
      <section className="mt-6 rounded-3xl border border-[color:var(--site-border)] bg-[color:var(--site-panel)] p-6 shadow-soft md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Accueil</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-[color:var(--site-heading)] md:text-6xl">Création Nowis, de la guitare à l’IA</h1>
            <p className="mt-3 text-lg font-medium text-[color:var(--site-accent)] md:text-xl">
              Chansons personnalisées, musique IA, vidéos, ateliers et portail client.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[color:var(--site-muted)] md:text-lg">
              Tu arrives au bon endroit pour écouter, te connecter ou me parler de ton projet.
            </p>

            {/* Zone facile à capturer pour la vidéo de présentation */}
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {primaryActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group rounded-2xl border border-[color:var(--site-border)] bg-white/80 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--site-accent)]/35 hover:shadow-lg"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--site-accent-soft)] text-[color:var(--site-accent-strong)]">
                      <Icon size={22} />
                    </span>
                    <h2 className="mt-4 text-xl font-bold text-[color:var(--site-heading)]">{action.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">{action.description}</p>
                    <span className="mt-4 inline-flex items-center text-sm font-semibold text-[color:var(--site-accent-strong)] transition group-hover:brightness-110">
                      {action.cta}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <HeroVideoPlaceholder videoUrl={HOME_INTRO_VIDEO_URL} className="h-full" />
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-[color:var(--site-border)] bg-[linear-gradient(140deg,rgba(255,250,245,0.95),rgba(242,231,216,0.95))] p-6 md:p-8">
        {/* Bloc destiné à être montré dans la vidéo IA */}
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--site-accent-soft)] text-[color:var(--site-accent-strong)]">
            <Sparkles size={18} />
          </span>
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--site-heading)] md:text-3xl">De la guitare à l’IA</h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--site-muted)] md:text-base">
              Je pars de l’émotion et de la musique. J’utilise l’IA comme outil, pas comme raccourci, pour créer quelque chose d’humain, personnel et accessible.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            'Création de chansons personnalisées',
            'Vidéos IA',
            'Ateliers créatifs',
            'Bibliothèque musicale',
            'Portail client simple',
            'Accompagnement humain',
          ].map((item) => (
            <div key={item} className="rounded-xl border border-[color:var(--site-border)] bg-white/75 px-4 py-3 text-sm text-[color:var(--site-text)]">
              <span className="inline-flex items-center gap-2">
                <Disc3 size={15} className="text-[color:var(--site-accent-strong)]" />
                {item}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-panel)] p-6 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--site-heading)] md:text-2xl">Parcours rapide</h2>
            <p className="mt-1 text-sm leading-6 text-[color:var(--site-muted)] md:text-base">
              Quatre étapes simples pour passer à l’action sans te perdre.
            </p>
          </div>
          <Link href="/ateliers" className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--site-accent-strong)] hover:brightness-110">
            Voir les ateliers
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {captureBlocks.map((block) => (
            <article
              key={block.href}
              data-capture-zone={block.title}
              className="rounded-xl border border-[color:var(--site-border)] bg-white/80 p-4 shadow-sm"
            >
              <h3 className="text-base font-semibold text-[color:var(--site-heading)] md:text-lg">{block.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[color:var(--site-muted)]">{block.description}</p>
              <Link
                href={block.href}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--site-accent-strong)] hover:brightness-110"
              >
                {block.cta}
                <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-panel)] p-6 md:p-8">
        <h2 className="text-xl font-semibold text-[color:var(--site-heading)] md:text-2xl">Explorer le reste du site</h2>
        <p className="mt-2 text-sm leading-7 text-[color:var(--site-muted)] md:text-base">
          Toutes les sections importantes restent accessibles en tout temps.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center justify-between rounded-xl border border-[color:var(--site-border)] bg-white/70 px-4 py-3 text-sm font-semibold text-[color:var(--site-heading)] transition hover:bg-white"
            >
              {link.label}
              <Video size={16} className="text-[color:var(--site-accent-strong)]" />
            </Link>
          ))}
        </div>
      </section>

      <LaunchOfferBanner variant="hero" compact />
    </div>
  );
}
