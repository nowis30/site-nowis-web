import Image from 'next/image';
import Link from 'next/link';
import { LaunchOfferBanner } from '@/components/marketing/LaunchOfferBanner';
import { HomepageMediaShowcase, type HomepageMediaItem } from '@/components/marketing/HomepageMediaShowcase';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import { getYouTubeThumbnailUrl } from '@/lib/seo';

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

const proofCards = [
  {
    icon: '🤝',
    title: 'Une approche profondément humaine',
    desc: 'La chaleur, l’écoute et l’émotion sont au centre. L’IA sert la création, elle ne remplace jamais le lien humain.',
  },
  {
    icon: '🎵',
    title: 'Un résultat concret et mémorable',
    desc: 'Le groupe repart avec une chanson, une vidéo souvenir ou une direction claire pour passer à l’action.',
  },
  {
    icon: '📱',
    title: 'L’IA rendue simple et rassurante',
    desc: 'La technologie devient accessible, compréhensible et utile, même pour un public qui part de zéro.',
  },
  {
    icon: '✨',
    title: 'Une offre qui donne envie d’agir',
    desc: 'Atelier, chanson personnalisée ou accompagnement créatif : le visiteur comprend vite ce qu’il peut demander.',
  },
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

const featuredVideoUrl = 'https://www.youtube.com/watch?v=Vu-UxATjw2o';

const mediaExamples: HomepageMediaItem[] = [
  {
    id: 'intergenerationnel',
    eyebrow: 'Ateliers intergénérationnels',
    title: 'Créer un moment fort entre plusieurs générations',
    description: 'Une activité sensible, douce et actuelle où les souvenirs deviennent chanson et vidéo souvenir.',
    posterSrc: '/hero.jpg',
    posterAlt: 'Nowis Morin dans un univers musical chaleureux',
    href: '/ateliers',
    ctaLabel: 'Demander un atelier',
    videoUrl: featuredVideoUrl,
  },
  {
    id: 'ecoles-aines',
    eyebrow: 'Écoles, aînés, maisons des jeunes',
    title: 'Adapter l’expérience au milieu et à l’âge du groupe',
    description: 'Un format pensé pour les organismes, les bibliothèques, les écoles, les aînés et les groupes qui veulent vivre quelque chose de concret.',
    posterSrc: '/images/hero.jpg',
    posterAlt: 'Atelier de création musicale adapté à plusieurs publics',
    href: '/ateliers/atelier-creatif',
    ctaLabel: 'Voir l’atelier créatif',
    videoUrl: featuredVideoUrl,
  },
  {
    id: 'chanson-personnalisee',
    eyebrow: 'Chanson personnalisée',
    title: 'Transformer une histoire vraie en chanson marquante',
    description: 'Pour un anniversaire, un hommage, un mariage ou un souvenir de famille : une création qui touche pour vrai.',
    posterSrc: getYouTubeThumbnailUrl('https://www.youtube.com/watch?v=VbcHV4K72-Q', 'hqdefault') || '/hero.jpg',
    posterAlt: 'Exemple de chanson personnalisée',
    href: '/commander-une-chanson',
    ctaLabel: 'Commander une chanson',
    videoUrl: 'https://www.youtube.com/watch?v=VbcHV4K72-Q',
  },
  {
    id: 'musique-ia-telephone',
    eyebrow: 'Musique + IA simplifiée',
    title: 'Montrer que l’IA peut devenir un outil créatif simple',
    description: 'Une démonstration claire, concrète et accessible de ce que l’IA permet quand elle est bien guidée et bien expliquée.',
    posterSrc: getYouTubeThumbnailUrl('https://www.youtube.com/watch?v=hvyftoI3CSA', 'hqdefault') || '/logo_creation_nowis_1mo_max.jpg',
    posterAlt: 'Musique et intelligence artificielle utilisées simplement',
    href: '/a-propos',
    ctaLabel: 'Comprendre l’approche',
    videoUrl: 'https://www.youtube.com/watch?v=hvyftoI3CSA',
  },
];

// ─── Composant principal ──────────────────────────────────────────────────────

export const HomeScreen = async () => {
  const [featuredMedia, ...mediaCards] = mediaExamples;

  return (
    <div className="relative overflow-hidden bg-transparent text-[color:var(--site-text)]">

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
            <span className="brand-chip inline-block">Ateliers · Chansons · Création · IA rendue simple</span>
            <h1 className="brand-metal-text mt-6 font-display text-5xl leading-[0.95] md:text-7xl xl:text-[5.5rem]">
              Des ateliers musicaux et des créations qui touchent, rassurent et donnent envie d’agir
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--site-muted)] md:text-xl">
              Nowis Morin transforme la musique, les souvenirs et l’intelligence artificielle en expériences simples, humaines et marquantes. Le visiteur comprend vite ce qu’il peut vivre, offrir ou demander.
            </p>

            <LaunchOfferBanner variant="hero" />

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/ateliers"
                className="cta-primary w-full justify-center px-7 py-4 sm:w-auto"
              >
                Demander un atelier
              </Link>
              <Link
                href="#exemples"
                className="cta-secondary w-full justify-center px-7 py-4 sm:w-auto"
              >
                Voir des exemples
              </Link>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--site-soft)]">
              Soumissions sur demande, réponse humaine et ateliers animés par Nowis Morin à Drummondville et partout au Québec.
            </p>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="glass-panel-soft px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--site-accent-strong)]">Ateliers</p>
                <p className="mt-1.5 text-sm leading-6 text-[color:var(--site-muted)]">Animés en personne. Tous âges. Adaptés à votre milieu.</p>
              </div>
              <div className="glass-panel-soft px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--site-accent-strong)]">Chansons</p>
                <p className="mt-1.5 text-sm leading-6 text-[color:var(--site-muted)]">Des créations sur mesure pour un moment important ou un souvenir à offrir.</p>
              </div>
              <div className="glass-panel-soft px-4 py-4 sm:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--site-accent-strong)]">IA simplifiée</p>
                <p className="mt-1.5 text-sm leading-6 text-[color:var(--site-muted)]">Compréhensible, concrète et utilisée comme un outil créatif rassurant.</p>
              </div>
            </div>
          </div>

          {/* Image hero */}
          <div className="relative z-10">
            <div className="warm-spotlight-panel overflow-hidden">
              <div className="relative aspect-[4/5.15] md:aspect-[4/5]">
                <Image
                  src="/hero.jpg"
                  alt="Nowis Morin présente des ateliers de création musicale avec l IA chez Création Nowis"
                  fill
                  className="object-cover object-[50%_28%] brightness-[0.88] contrast-[1.05] saturate-[1.02] md:object-[50%_35%] md:brightness-[0.84] md:contrast-[1.03]"
                  priority
                />
                <div className="pointer-events-none absolute inset-0 hero-overlay-warm" />
              </div>
              <div className="px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--site-accent-strong)]">Une présence vraie</p>
                <p className="mt-1.5 text-sm leading-6 text-[color:var(--site-muted)]">
                  Nowis Morin anime chaque atelier en personne. La technologie reste claire, l’expérience reste vivante et le résultat reste humain.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8 pt-2 md:pb-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {proofCards.map((card) => (
            <article key={card.title} className="glass-panel-soft p-6">
              <span className="text-2xl" role="img" aria-hidden="true">{card.icon}</span>
              <h2 className="mt-4 font-display text-2xl leading-[1.05] text-[color:var(--site-heading)]">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">{card.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <HomepageMediaShowcase featured={featuredMedia} items={mediaCards} />

      {/* ════ CE QUE JE FAIS ════ */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Services principaux</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
            Ce que le visiteur peut demander immédiatement
          </h2>
          <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">
            Une offre claire, rapide à comprendre et pensée pour convertir sans perdre la chaleur artistique du projet.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {offres.map((offre) => (
            <article
              key={offre.href}
              className={`flex flex-col p-8 transition hover:-translate-y-1 ${
                offre.featured
                  ? 'glass-panel-strong shadow-fire'
                  : 'brand-card'
              }`}
            >
              {offre.featured && (
                <span className="mb-4 inline-block self-start rounded-full bg-[rgba(201,117,71,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--site-accent-strong)]">
                  {offre.chip}
                </span>
              )}
              <span className="text-3xl" role="img" aria-hidden="true">{offre.icon}</span>
              <h3 className="mt-4 font-display text-3xl leading-[1.05] text-[color:var(--site-heading)]">{offre.title}</h3>
              <p className="mt-4 flex-1 text-sm leading-7 text-[color:var(--site-muted)]">{offre.desc}</p>
              <Link
                href={offre.href}
                className={`mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold transition ${
                  offre.featured
                    ? 'cta-primary'
                    : 'cta-secondary'
                }`}
              >
                {offre.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ════ POUR QUI ════ */}
      <section className="section-warm px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Pour qui</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
              Des usages concrets qui parlent vite au bon visiteur
            </h2>
            <p className="mt-4 text-[1rem] leading-8 text-slate-300">
              Le site doit immédiatement aider chacun à se reconnaître : organisme, école, famille, client qui veut offrir une chanson ou personne curieuse de comprendre l’IA sans pression.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: '🎶', label: 'Aînés et intergénérationnel', desc: 'Pour réveiller les souvenirs, créer du lien et vivre un moment touchant.' },
              { icon: '🏫', label: 'Écoles et maisons des jeunes', desc: 'Pour découvrir l’IA autrement, par la musique, l’écriture et la participation.' },
              { icon: '🎁', label: 'Familles et cadeaux marquants', desc: 'Pour offrir une chanson personnalisée qui garde une vraie valeur émotionnelle.' },
              { icon: '📱', label: 'Curieux et créatifs', desc: 'Pour comprendre comment l’IA peut devenir un outil simple, utile et artistique.' },
            ].map((a) => (
              <article
                key={a.label}
                className="brand-card rounded-[1.5rem] p-5 transition"
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
              className="cta-secondary gap-2 px-6 py-3.5"
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
              L’IA devient rassurante quand on la voit dans un vrai usage humain.
            </h2>
          </div>
          <div className="space-y-5 text-[1rem] leading-8 text-slate-300">
            <p>
              L'intelligence artificielle est un <strong className="text-white">outil nouveau</strong>, mais elle n’a pas besoin d’être froide, abstraite ou compliquée. Ici, elle est expliquée par la création, par la musique et par l’expérience vécue.
            </p>
            <p>
              Ce n'est pas réservé aux experts. On peut l'utiliser pour créer, réfléchir, apprendre et exprimer des idées — et <strong className="text-white">l'humain reste au centre</strong>.
            </p>
            <p>
              Nowis Morin montre comment <strong className="text-white">utiliser l'IA intelligemment</strong>, avec tact, émotion et simplicité, pour faire émerger quelque chose de beau et d’utile.
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
      <section className="section-soft px-6 py-16 md:py-20">
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
        <div className="warm-spotlight-panel p-8 md:p-12">
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
      <section className="section-warm px-6 py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="glass-panel-soft flex flex-col gap-4 p-7 text-center md:flex-row md:items-center md:gap-8 md:p-8 md:text-left">
            <span className="shrink-0 text-4xl" role="img" aria-hidden="true">📍</span>
            <div>
              <h3 className="font-display text-2xl text-white md:text-3xl">Ateliers dans un rayon de 150 km autour de Drummondville</h3>
              <p className="mt-2 text-sm leading-7 text-emerald-100/70">
                Création Nowis offre ses ateliers en personne dans la région. Pour un projet particulier ou un déplacement spécial, une soumission personnalisée peut être proposée.
              </p>
            </div>
            <Link
              href="/contact"
              className="rounded-xl border border-[rgba(131,97,67,0.12)] bg-white/75 px-6 py-3 text-center font-semibold text-[color:var(--site-accent-strong)] transition hover:bg-white md:shrink-0 md:self-center"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      {/* ════ TÉMOIGNAGES ════ */}
      <section className="section-warm px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Commentaires visiteurs</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">Ce que les visiteurs disent après leur expérience</h2>
            <p className="mt-4 text-[1rem] leading-8 text-slate-300">
              Les visiteurs peuvent laisser leur commentaire directement sur le site avec leur nom, leur email et une note sur 5 étoiles. Chaque avis est validé avant publication.
            </p>
          </div>
          <div className="mt-10 grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
            <div>
              <ReviewsSection />
            </div>
            <div className="xl:sticky xl:top-36">
              <ReviewForm />
            </div>
          </div>
        </div>
      </section>

      {/* ════ À PROPOS NOWIS ════ */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="warm-spotlight-panel overflow-hidden">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-[360px] lg:min-h-[460px]">
              <Image
                src="/hero.jpg"
                alt="Nowis Morin, artiste et animateur de Création Nowis à Drummondville"
                fill
                className="object-cover brightness-[0.84] contrast-[1.04]"
                style={{ objectPosition: '50% 25%' }}
              />
              <div className="pointer-events-none absolute inset-0 hero-overlay-warm" />
            </div>
            <div className="bg-[linear-gradient(145deg,rgba(255,252,247,0.94),rgba(243,228,207,0.92))] p-8 md:p-10 lg:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Nowis Morin</p>
              <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
                Créateur, animateur, artiste
              </h2>
              <div className="mt-5 space-y-4 text-[1rem] leading-8 text-[color:var(--site-muted)]">
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
                className="mt-6 inline-flex rounded-xl border border-[rgba(131,97,67,0.12)] bg-white/75 px-6 py-3.5 font-semibold text-[color:var(--site-heading)] transition hover:bg-white"
              >
                En savoir plus →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════ CTA FINAL ════ */}
      <section className="px-6 py-16 md:py-28">
        <div className="warm-cta-panel relative mx-auto max-w-4xl overflow-hidden p-10 text-center md:p-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(138,92,60,0.4)_0.7px,transparent_0.7px)] [background-size:22px_22px]"
          />
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">Passez à l'action</p>
          <h2 className="mt-5 font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl lg:text-6xl">
            Prêt à offrir un atelier différent, humain et actuel ?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-[1rem] leading-8 text-[color:var(--site-muted)]">
            Création Nowis propose des ateliers artistiques pour mieux comprendre l'intelligence artificielle et apprendre à l'utiliser comme un outil de création, de réflexion et d'expression. Chaque atelier est adapté au groupe, au milieu et à l'objectif visé.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/ateliers/demande"
              className="cta-primary w-full justify-center px-9 py-4 sm:w-auto"
            >
              Demander un atelier
            </Link>
            <Link
              href="/commander-une-chanson"
              className="cta-secondary w-full justify-center px-9 py-4 sm:w-auto"
            >
              Demander une chanson
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
