import Image from 'next/image';
import Link from 'next/link';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';

// ─── Données statiques ────────────────────────────────────────────────────────

const offres = [
  {
    icon: '🎵',
    chip: 'Offre principale',
    title: 'Ateliers de création musicale avec l\'IA',
    desc: 'Des ateliers animés en personne par Nowis Morin pour tous les âges. On crée ensemble une chanson à partir d\'émotions et de souvenirs, puis le groupe repart avec une vidéo souvenir téléchargeable.',
    href: '/ateliers',
    cta: 'Découvrir les ateliers',
    accent: 'primary',
    featured: true,
  },
  {
    icon: '🎼',
    chip: 'Création sur mesure',
    title: 'Chansons personnalisées',
    desc: 'Une chanson créée sur mesure pour un anniversaire, un mariage, un hommage ou tout projet qui mérite plus qu\'un simple message.',
    href: '/commander-une-chanson',
    cta: 'Parler de mon projet',
    accent: 'amber',
    featured: false,
  },
  {
    icon: '🎬',
    chip: 'Univers créatif',
    title: 'Contenu artistique et vidéo',
    desc: 'Créations visuelles, vidéos musicales, jeux interactifs et contenu artistique adapté à vos projets créatifs particuliers.',
    href: '/autres-services',
    cta: 'Explorer',
    accent: 'violet',
    featured: false,
  },
];

const audiences = [
  { icon: '🎶', label: 'Aînés', desc: 'Souvenirs, musique, valorisation et découverte numérique douce et accessible.' },
  { icon: '📚', label: 'Bibliothèques', desc: 'Médiation culturelle, activité créative et exploration de l\'IA simplement.' },
  { icon: '🤝', label: 'Centres communautaires', desc: 'Activité rassembleuse, humaine et expressive pour des groupes variés.' },
  { icon: '🏛️', label: 'Organismes', desc: 'Projet collectif, participation et découverte actuelle de l\'intelligence artificielle.' },
  { icon: '🏫', label: 'Écoles', desc: 'Créativité, écriture, musique, expression et découverte technologique pour les jeunes.' },
  { icon: '🏠', label: 'Maisons des jeunes', desc: 'Atelier vivant, participatif et valorisant dans un cadre communautaire.' },
  { icon: '👨‍👩‍👧', label: 'Intergénérationnel', desc: 'Relier les générations par la musique, les souvenirs et la création collective.' },
  { icon: '✨', label: 'Groupes privés', desc: 'Activité spéciale ou projet unique pour un événement, une fête ou un groupe sur mesure.' },
];

const deroulementSteps = [
  { num: '01', title: 'Accueil du groupe', desc: 'Nowis Morin prend le temps de créer un espace de confiance et de curiosité.' },
  { num: '02', title: 'Partage d\'idées et d\'émotions', desc: 'Les participants partagent des souvenirs, des émotions ou des idées qu\'ils veulent mettre en musique.' },
  { num: '03', title: 'Choix d\'un thème commun', desc: 'Le groupe choisit ensemble une direction créative.' },
  { num: '04', title: 'Création des paroles ou de l\'intention', desc: 'Les mots et les images du groupe prennent forme.' },
  { num: '05', title: 'Découverte de l\'IA', desc: 'L\'IA est utilisée comme outil créatif concret, guidé par Nowis Morin en temps réel.' },
  { num: '06', title: 'Création d\'une ou plusieurs chansons', desc: 'Le groupe co-crée une œuvre musicale réelle, nourrie de ses propres émotions.' },
  { num: '07', title: 'Vidéo souvenir et résultat téléchargeable', desc: 'Une vidéo est créée autour de l\'œuvre — téléchargeable, partageable et durable.' },
];

// ─── Composant principal ──────────────────────────────────────────────────────

export const HomeScreen = async () => {
  return (
    <div className="relative overflow-hidden bg-transparent text-slate-100">

      {/* ════ HERO ════ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 md:hidden"
          style={{
            background:
              'radial-gradient(circle at 15% 12%, rgba(96,165,250,0.08), transparent 22%),' +
              'radial-gradient(circle at 86% 10%, rgba(139,92,246,0.07), transparent 18%),' +
              'radial-gradient(circle at 76% 38%, rgba(59,130,246,0.04), transparent 20%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden md:block"
          style={{
            background:
              'radial-gradient(circle at 15% 12%, rgba(96,165,250,0.13), transparent 24%),' +
              'radial-gradient(circle at 86% 10%, rgba(139,92,246,0.12), transparent 20%),' +
              'radial-gradient(circle at 76% 38%, rgba(59,130,246,0.08), transparent 22%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04] md:opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.5)_0.7px,transparent_0.7px)] [background-size:22px_22px]"
        />

        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-24 lg:py-32">
          {/* Texte hero */}
          <div className="relative z-10">
            <span className="brand-chip inline-block">
              Ateliers · Chansons · Création · Intelligence artificielle
            </span>
            <h1 className="brand-metal-text mt-6 font-display text-5xl leading-[0.95] md:text-7xl xl:text-[5.5rem]">
              Créer avec l'IA, en restant profondément humain
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
              Nowis Morin vous accompagne à travers des ateliers et des créations musicales où
              l'intelligence artificielle devient un outil puissant pour apprendre, s'exprimer,
              créer et rassembler.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/ateliers"
                className="inline-flex items-center justify-center rounded-xl bg-brand-warm px-7 py-4 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Demander un atelier
              </Link>
              <Link
                href="/connexion"
                className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/12 px-7 py-4 font-semibold text-white backdrop-blur-sm transition hover:bg-primary-500/22"
              >
                Portail client
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4 backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-200">Ateliers</p>
                <p className="mt-1.5 text-sm leading-6 text-slate-200">
                  Animés en personne. Tous âges. Adaptés à votre milieu.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4 backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Rayon de service</p>
                <p className="mt-1.5 text-sm leading-6 text-slate-200">
                  Environ 150 km autour de Drummondville.
                </p>
              </div>
            </div>
          </div>

          {/* Image hero */}
          <div className="relative z-10">
            <div
              className="overflow-hidden rounded-[2rem] border border-primary-200/20 shadow-card"
              style={{ background: 'linear-gradient(180deg, #07101f 0%, #10182d 100%)' }}
            >
              <div className="relative aspect-[4/5.15] md:aspect-[4/5]">
                <Image
                  src="/hero.jpg"
                  alt="Nowis Morin, créateur principal de Création Nowis"
                  fill
                  className="object-cover object-[50%_28%] brightness-[0.8] contrast-[1.12] saturate-[1.05] md:object-[50%_35%] md:brightness-[0.72] md:contrast-[1.05] md:saturate-100"
                  priority
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0.04)_0%,rgba(5,8,22,0.14)_35%,rgba(5,8,22,0.8)_100%)] md:bg-[linear-gradient(180deg,rgba(5,8,22,0.08)_0%,rgba(5,8,22,0.24)_38%,rgba(5,8,22,0.88)_100%)]" />
              </div>
              <div className="px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-200">Création Nowis</p>
                <p className="mt-1.5 text-sm leading-6 text-slate-200">
                  Nowis Morin anime chaque atelier en personne. Musique, IA et créativité humaine réunies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ CE QUE JE FAIS ════ */}
      <section className="mx-auto max-w-7xl px-6 pb-4 pt-6 md:pb-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Ce que je propose</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
            Des expériences créatives autour de la musique et de l'IA
          </h2>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {offres.map((offre) => (
            <article
              key={offre.href}
              className={`flex flex-col rounded-[2rem] border p-8 transition hover:-translate-y-1 ${
                offre.featured
                  ? 'border-primary-400/30 bg-[linear-gradient(145deg,rgba(14,25,55,0.96),rgba(20,35,75,0.90))] shadow-fire'
                  : 'border-white/10 bg-[linear-gradient(180deg,rgba(10,15,28,0.82),rgba(15,23,42,0.68))]'
              }`}
            >
              {offre.featured && (
                <span className="mb-4 inline-block self-start rounded-full bg-primary-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary-300">
                  {offre.chip}
                </span>
              )}
              <span className="text-3xl" role="img" aria-hidden="true">{offre.icon}</span>
              <h3 className="mt-4 font-display text-3xl leading-[1.05] text-white">{offre.title}</h3>
              <p className="mt-4 flex-1 text-sm leading-7 text-slate-300">{offre.desc}</p>
              <Link
                href={offre.href}
                className={`mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold transition ${
                  offre.featured
                    ? 'bg-brand-warm text-white shadow-fire hover:brightness-110'
                    : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                {offre.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ════ ATELIER EN VEDETTE ════ */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="overflow-hidden rounded-[2.5rem] border border-primary-400/25 shadow-card" style={{ background: 'linear-gradient(145deg, rgba(8,14,38,0.97) 0%, rgba(16,26,60,0.93) 100%)' }}>
          <div className="grid gap-10 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-0 lg:p-0">
            <div className="lg:p-12">
              <span className="brand-chip inline-block">Atelier en vedette</span>
              <h2 className="mt-5 font-display text-4xl leading-[1.03] text-white md:text-5xl lg:text-6xl">
                Atelier de création musicale avec&nbsp;l'IA
              </h2>
              <p className="mt-5 max-w-lg text-[1rem] leading-8 text-slate-300">
                Une expérience créative, humaine et accessible pour découvrir l'intelligence
                artificielle à travers la musique, les émotions, les souvenirs et la création
                collective. Animé en personne par Nowis Morin.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Accessible à tous les âges',
                  'Adaptable selon le milieu et la taille du groupe',
                  'L\'IA est découverte comme outil, pas comme remplacement',
                  'Le groupe repart avec une chanson et une vidéo souvenir',
                  'Durée de base : environ 90 minutes',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-200">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-xs font-bold text-primary-300">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/ateliers/demande"
                  className="rounded-xl bg-brand-warm px-7 py-3.5 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Demander cet atelier
                </Link>
                <Link
                  href="/ateliers/atelier-creatif"
                  className="rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
                >
                  Voir la page complète
                </Link>
              </div>
            </div>
            <div
              className="relative hidden min-h-[420px] lg:block"
              style={{ background: 'linear-gradient(90deg, rgba(8,14,38,0.0) 0%, rgba(8,14,38,1) 5%)' }}
            >
              <Image
                src="/hero.jpg"
                alt="Atelier de création musicale avec Nowis Morin"
                fill
                className="object-cover opacity-50"
                style={{ objectPosition: '60% 20%' }}
              />
              <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(270deg, rgba(8,14,38,0.0) 40%, rgba(8,14,38,1) 100%)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ════ POUR QUI ════ */}
      <section className="bg-steel-950/50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Pour qui</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
              Un atelier fait pour plusieurs milieux
            </h2>
            <p className="mt-4 text-[1rem] leading-8 text-slate-300">
              L'atelier n'est jamais le même pour deux groupes. Il s'adapte à l'âge, au contexte, au nombre de participants et aux objectifs.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((a) => (
              <article
                key={a.label}
                className="rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-[rgba(14,20,44,0.78)] to-[rgba(9,14,28,0.65)] p-5 backdrop-blur-sm transition hover:border-white/20"
              >
                <span className="text-2xl" role="img" aria-hidden="true">{a.icon}</span>
                <h3 className="mt-3 font-semibold text-white">{a.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{a.desc}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/ateliers"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-6 py-3.5 font-semibold text-amber-200 transition hover:bg-amber-500/20"
            >
              Voir tous les détails de l'atelier →
            </Link>
          </div>
        </div>
      </section>

      {/* ════ COMPRENDRE L'IA SIMPLEMENT ════ */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">L'IA simplement</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
              Ce n'est pas sorcier. C'est juste un nouvel outil à apprendre.
            </h2>
          </div>
          <div className="space-y-5 text-[1rem] leading-8 text-slate-300">
            <p>
              L'intelligence artificielle est un <strong className="text-white">nouvel outil</strong>. Comme tout outil puissant, il faut apprendre à l'utiliser. Dans les ateliers de Nowis Morin, on l'aborde de façon <em>simple, humaine, créative et concrète</em>.
            </p>
            <p>
              Ce n'est pas réservé aux experts. Ce n'est pas quelque chose de froid ou de compliqué. On peut l'utiliser pour créer, réfléchir, apprendre et exprimer des idées — et <strong className="text-white">l'humain reste au centre</strong>.
            </p>
            <p>
              Nowis Morin ne remplace pas la sensibilité humaine par une machine. Il enseigne comment <strong className="text-white">utiliser l'IA intelligemment</strong> — comme un outil de création au service des souvenirs, de l'expression et du plaisir.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            { icon: '🤖', title: 'L\'IA ne crée pas à votre place', desc: 'Elle aide à transformer vos idées, vos mots et vos émotions en musique. Vous restez le moteur.' },
            { icon: '🎓', title: 'Pas besoin d\'être expert', desc: 'L\'atelier est conçu pour des personnes qui n\'ont jamais touché à l\'IA. La découverte se fait en douceur.' },
            { icon: '💡', title: 'Un outil moderne à maîtriser', desc: 'Comprendre l\'IA, c\'est important. Dans un atelier, on l\'apprend par la pratique, pas par la théorie.' },
          ].map((card) => (
            <article key={card.title} className="brand-card p-6">
              <span className="text-2xl" role="img" aria-hidden="true">{card.icon}</span>
              <h3 className="mt-4 font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{card.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ════ DÉROULEMENT ════ */}
      <section className="bg-steel-950/50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Comment ça se passe</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
              Comment se déroule un atelier
            </h2>
            <p className="mt-4 text-[1rem] leading-8 text-slate-300">
              Environ 90 minutes de création collective, guidée du début à la fin.
            </p>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {deroulementSteps.map((step, i) => (
              <article
                key={step.num}
                className={`flex gap-4 rounded-[1.5rem] border p-5 ${
                  i % 2 === 0
                    ? 'border-primary-500/20 bg-primary-500/[0.06]'
                    : 'border-white/10 bg-white/[0.025]'
                }`}
              >
                <span className="font-display text-2xl font-bold text-primary-400/50 tabular-nums">{step.num}</span>
                <div>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{step.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ════ RÉSULTAT FINAL ════ */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="rounded-[2.5rem] border border-amber-400/20 p-8 md:p-12" style={{ background: 'linear-gradient(145deg, rgba(55,32,0,0.35) 0%, rgba(100,60,0,0.20) 60%, rgba(18,12,0,0.28) 100%)' }}>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Ce que le groupe garde</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">Plus qu'un souvenir — un résultat concret</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {[
              { icon: '🎵', title: 'Une ou plusieurs chansons', desc: 'Créées ensemble, avec les émotions et les mots du groupe.' },
              { icon: '📱', title: 'Une vidéo souvenir téléchargeable', desc: 'À garder, partager et faire revivre longtemps après l\'atelier.' },
              { icon: '🌟', title: 'Une expérience collective marquante', desc: 'Quelque chose de vrai, de beau et de porteur de sens.' },
              { icon: '🔍', title: 'Une compréhension concrète de l\'IA', desc: 'Pas de la théorie — une véritable découverte en action.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="text-2xl shrink-0" role="img" aria-hidden="true">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-amber-100">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-amber-100/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ RAYON DE DÉPLACEMENT ════ */}
      <section className="bg-steel-950/50 px-6 py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-emerald-400/15 bg-[linear-gradient(145deg,rgba(3,22,18,0.88),rgba(6,34,28,0.80))] p-7 text-center md:flex-row md:items-center md:gap-8 md:p-8 md:text-left">
            <span className="shrink-0 text-4xl" role="img" aria-hidden="true">📍</span>
            <div>
              <h3 className="font-display text-2xl text-white md:text-3xl">Ateliers dans un rayon de 150 km autour de Drummondville</h3>
              <p className="mt-2 text-sm leading-7 text-emerald-100/70">
                Création Nowis offre ses ateliers en personne dans la région. Pour un projet particulier ou un déplacement spécial, une soumission personnalisée peut être proposée.
              </p>
            </div>
            <Link
              href="/contact"
              className="shrink-0 rounded-xl border border-emerald-400/30 bg-emerald-500/12 px-6 py-3 font-semibold text-emerald-200 transition hover:bg-emerald-500/22 md:self-center"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      {/* ════ VIDÉO ════ */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">L'univers Création Nowis</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">Découvrir en image</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[1rem] leading-8 text-slate-300">
            Plongez dans l'univers artistique de Nowis Morin : musique, création, intelligence artificielle et expression humaine.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10 shadow-card">
          <div className="relative aspect-video w-full">
            <iframe
              src="https://www.youtube.com/embed/Vu-UxATjw2o"
              title="Création Nowis — Univers de Nowis Morin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </section>

      {/* ════ TÉMOIGNAGES ════ */}
      <section className="bg-steel-950/50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Témoignages</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">Ce que disent les gens</h2>
            <p className="mt-4 text-[1rem] leading-8 text-slate-300">
              Des retours vrais, laissés par des personnes qui ont vécu l'expérience.
            </p>
          </div>
          <div className="mt-10">
            <ReviewsSection />
          </div>
        </div>
      </section>

      {/* ════ À PROPOS NOWIS ════ */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 shadow-card">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-[360px] lg:min-h-[460px]">
              <Image
                src="/hero.jpg"
                alt="Nowis Morin"
                fill
                className="object-cover brightness-[0.85]"
                style={{ objectPosition: '50% 25%' }}
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0.08)_0%,rgba(5,8,22,0.22)_40%,rgba(5,8,22,0.82)_100%)] lg:bg-[linear-gradient(90deg,rgba(5,8,22,0.06)_0%,rgba(5,8,22,0.18)_55%,rgba(5,8,22,0.82)_100%)]" />
            </div>
            <div className="bg-[linear-gradient(145deg,rgba(9,14,28,0.96),rgba(14,22,44,0.92))] p-8 md:p-10 lg:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-300">Nowis Morin</p>
              <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
                Créateur, animateur, artiste
              </h2>
              <div className="mt-5 space-y-4 text-[1rem] leading-8 text-slate-300">
                <p>
                  Nowis Morin est le créateur derrière <strong className="text-white">Création Nowis</strong>. Artiste, musicien et passionné de technologie créative, il anime lui-même chaque atelier — présent, disponible et attentif à chaque participant.
                </p>
                <p>
                  Sa démarche marie la <strong className="text-white">musique</strong>, la <strong className="text-white">créativité humaine</strong> et les <strong className="text-white">nouvelles technologies</strong> dans un format qui inspire sans jamais intimider.
                </p>
                <p>
                  Son rapport à l'IA est clair : c'est un outil puissant qu'on peut apprendre à utiliser intelligemment — et c'est exactement ce qu'il enseigne dans ses ateliers.
                </p>
              </div>
              <Link
                href="/a-propos"
                className="mt-6 inline-flex rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                En savoir plus →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════ CTA FINAL ════ */}
      <section className="px-6 py-16 md:py-28">
        <div
          className="mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-primary-400/20 p-10 text-center md:p-16"
          style={{ background: 'linear-gradient(145deg, rgba(8,14,38,0.97) 0%, rgba(16,26,62,0.93) 100%)' }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.5)_0.7px,transparent_0.7px)] [background-size:22px_22px]"
          />
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-300">Passez à l'action</p>
          <h2 className="mt-5 font-display text-4xl leading-[1.03] text-white md:text-5xl lg:text-6xl">
            Prêt à offrir un atelier différent, humain et actuel ?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-[1rem] leading-8 text-slate-300">
            Création Nowis propose des ateliers artistiques pour mieux comprendre l'intelligence artificielle et apprendre à l'utiliser comme un outil de création, de réflexion et d'expression. Chaque atelier est adapté au groupe, au milieu et à l'objectif visé.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ateliers/demande"
              className="rounded-xl bg-brand-warm px-9 py-4 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Demander un atelier
            </Link>
            <Link
              href="/connexion"
              className="rounded-xl border border-primary-300/40 bg-primary-500/12 px-9 py-4 font-semibold text-white transition hover:bg-primary-500/22"
            >
              Accéder au portail client
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
