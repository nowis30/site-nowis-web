import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { formatPrice, getLaunchPrice, LAUNCH_DISCOUNT_PERCENT, REGULAR_PRICES } from '@/data/pricing';

const workshopPrices = [
  { label: '60 minutes', regular: REGULAR_PRICES.workshops.minutes60 },
  { label: '90 minutes', regular: REGULAR_PRICES.workshops.minutes90 },
  { label: '2 heures', regular: REGULAR_PRICES.workshops.hours2 },
  { label: '3 heures', regular: REGULAR_PRICES.workshops.hours3 },
];

const groupRegularPrice = REGULAR_PRICES.groupFromPerPerson;
const groupLaunchPrice = getLaunchPrice(groupRegularPrice);

export const metadata: Metadata = buildMetadata({
  title: 'Atelier de création musicale avec l\'IA | Nowis Morin',
  description:
    'Atelier de création musicale avec l\'IA animé en personne par Nowis Morin. Créez ensemble une chanson à partir d\'émotions et de souvenirs, puis repartez avec une vidéo souvenir téléchargeable. Pour tous les âges.',
  path: '/ateliers/atelier-creatif',
  keywords: [
    'atelier de création musicale avec l\'IA',
    'atelier musical IA',
    'atelier chanson souvenir',
    'atelier musique et intelligence artificielle',
    'atelier créatif pour jeunes',
    'atelier créatif pour aînés',
    'Nowis Morin atelier',
    'atelier IA Québec',
    'atelier créatif musical',
    'création musicale intelligence artificielle',
  ],
});

// ─── Données ──────────────────────────────────────────────────────────────────

const audiences = [
  {
    label: 'Jeunes',
    icon: '🎒',
    desc: 'Expression créative, identité et confiance dans un format stimulant et actuel.',
  },
  {
    label: 'Aînés',
    icon: '🎶',
    desc: 'Souvenirs, émotion et musique dans un format chaleureux, doux et très accessible.',
  },
  {
    label: 'Écoles',
    icon: '🏫',
    desc: 'Projet artistique parascolaire, sortie spéciale ou animation de groupe-classe.',
  },
  {
    label: 'Maisons des jeunes',
    icon: '🏠',
    desc: 'Activité participative, vivante et valorisante pour des jeunes en contexte communautaire.',
  },
  {
    label: 'Organismes communautaires',
    icon: '🤝',
    desc: 'Créer du lien, valoriser les membres et laisser une trace commune et durable.',
  },
  {
    label: 'Groupes intergénérationnels',
    icon: '👨‍👩‍👧',
    desc: 'Réunir plusieurs générations autour d\'un projet créatif profond et rassembleur.',
  },
  {
    label: 'Événements spéciaux',
    icon: '✨',
    desc: 'Animation originale pour un anniversaire, une célébration ou une fête de groupe.',
  },
  {
    label: 'Groupes privés',
    icon: '💼',
    desc: 'Expérience sur mesure pour un groupe corporatif, une famille ou un cercle privé.',
  },
];

const steps = [
  {
    num: '01',
    title: 'Partage d\'idées, de souvenirs ou d\'émotions',
    desc: 'Les participants sont invités à partager ce qui les touche : un souvenir, une émotion, une période de vie ou un message qu\'ils voudraient transmettre.',
  },
  {
    num: '02',
    title: 'Choix d\'un thème commun',
    desc: 'Ensemble, le groupe choisit une direction, une intention ou une émotion centrale qui guidera la création musicale.',
  },
  {
    num: '03',
    title: 'Création de l\'intention ou des paroles',
    desc: 'Les idées du groupe prennent forme en mots et en images. Chaque voix contribue à nourrir l\'œuvre collective.',
  },
  {
    num: '04',
    title: 'Découverte de l\'IA comme outil créatif',
    desc: 'Nowis Morin guide le groupe dans l\'utilisation concrète de l\'intelligence artificielle. Ce n\'est pas un cours technique — c\'est une découverte en action, dans le plaisir.',
  },
  {
    num: '05',
    title: 'Création d\'une ou de plusieurs chansons',
    desc: 'Les idées, les mots et les émotions se transforment en musique. Une vraie chanson, nourrie de l\'essence du groupe.',
  },
  {
    num: '06',
    title: 'Création d\'une vidéo souvenir',
    desc: 'Autour de l\'œuvre, une vidéo est construite pour garder une trace vivante, belle et téléchargeable de tout ce qui a été vécu.',
  },
  {
    num: '07',
    title: 'Remise du résultat téléchargeable',
    desc: 'Chaque participant peut repartir avec le résultat final : chanson(s) et vidéo souvenir, à garder, partager et faire revivre.',
  },
];

const highlights = [
  {
    icon: '🔍',
    title: 'Découverte numérique',
    desc: 'Les participants apprennent à utiliser un outil d\'IA moderne sans pression ni jargon — juste de la curiosité.',
  },
  {
    icon: '😄',
    title: 'Plaisir',
    desc: 'L\'atelier est vivant, léger et engageant. Le plaisir est au cœur de chaque étape, pas l\'obligation.',
  },
  {
    icon: '🎵',
    title: 'Musique',
    desc: 'Une vraie chanson originale naît du groupe. Ce n\'est pas un gabarit — c\'est votre création.',
  },
  {
    icon: '💛',
    title: 'Souvenirs',
    desc: 'La matière première vient des participants eux-mêmes : leurs vécus, leurs émotions, leurs images.',
  },
  {
    icon: '🗣️',
    title: 'Expression personnelle',
    desc: 'Chaque personne contribue, peu importe son niveau, son âge ou son rapport au numérique.',
  },
  {
    icon: '🌟',
    title: 'Activité valorisante',
    desc: 'Chaque participant repart avec le sentiment réel d\'avoir créé quelque chose de vrai et de beau.',
  },
  {
    icon: '🔄',
    title: 'Formule adaptable',
    desc: 'Durée, nombre de participants, contexte, public — tout peut être modulé selon votre réalité.',
  },
  {
    icon: '👤',
    title: 'Nowis Morin en personne',
    desc: 'L\'animateur est là, présent et attentif à chaque participant, du début à la fin de l\'atelier.',
  },
];

const faqs = [
  {
    q: 'Est-ce que l\'atelier convient à tous les âges ?',
    a: 'Oui. L\'atelier est conçu pour être modulable selon l\'âge et le contexte. Il peut rassembler des enfants, des adolescents, des adultes ou des aînés — séparément ou en groupe mixte. Le contenu et le rythme s\'ajustent naturellement.',
  },
  {
    q: 'Faut-il être bon en technologie ?',
    a: 'Non. Aucune compétence technique n\'est requise. L\'atelier accompagne chaque participant pas à pas. L\'intelligence artificielle est présentée comme un outil simple à expérimenter, pas comme une matière à maîtriser.',
  },
  {
    q: 'Combien de personnes peuvent participer ?',
    a: 'Le format s\'adapte à la taille du groupe. Que vous soyez une dizaine ou une quarantaine de participants, Nowis Morin ajuste le déroulement pour que chacun contribue et vive l\'expérience pleinement.',
  },
  {
    q: 'Est-ce qu\'on repart avec un résultat concret ?',
    a: 'Oui. Le groupe repart avec une ou plusieurs chansons créées ensemble et une vidéo souvenir téléchargeable. C\'est un résultat réel, porteur de sens et ancré dans la mémoire collective du groupe.',
  },
  {
    q: 'Est-ce que l\'atelier peut être adapté à notre milieu ?',
    a: 'Absolument. Que vous représentiez une école, une résidence pour aînés, un organisme communautaire ou un groupe privé, le format s\'ajuste selon votre contexte, votre public et vos intentions.',
  },
  {
    q: 'Combien de temps dure l\'activité ?',
    a: 'L atelier peut etre propose en 60 minutes, 90 minutes, 2 heures ou 3 heures. La formule est choisie selon votre groupe et votre contexte, avec une grille simple et affichee clairement.',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AtelierCreatifPage() {
  return (
    <main className="text-[color:var(--site-text)]">

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative overflow-hidden px-6 py-24 md:py-32">
        {/* Fonds lumineux */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 20% 0%, rgba(184,111,61,0.14) 0%, transparent 60%),' +
              'radial-gradient(ellipse 55% 55% at 85% 100%, rgba(203,165,120,0.12) 0%, transparent 55%),' +
              'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(184,111,61,0.06) 0%, transparent 50%)',
          }}
        />
        {/* Grille subtile */}
        <div aria-hidden="true" className="brand-grid pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative mx-auto max-w-4xl text-center">
          <span className="brand-chip mb-6 inline-block">
            Animé en personne · Tous âges · Formule adaptable
          </span>

          <h1 className="font-display text-5xl leading-[0.97] text-[color:var(--site-heading)] md:text-6xl lg:text-7xl">
            Atelier de création musicale avec&nbsp;l'IA
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-9 text-[color:var(--site-muted)] md:text-xl">
            Créez ensemble une ou plusieurs chansons à partir d'émotions, de souvenirs et d'idées
            personnelles — puis repartez avec une{' '}
            <strong className="font-semibold text-[color:var(--site-heading)]">vidéo souvenir téléchargeable</strong>.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ateliers/demande"
              className="cta-primary px-8 py-4 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-coal-950"
            >
              Demander cet atelier
            </Link>
            <a
              href="#deroulement"
              className="cta-secondary px-8 py-4 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-coal-950"
            >
              Voir le déroulement ↓
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════ PRÉSENTATION ════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">
              L'atelier en quelques mots
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
              Une expérience musicale collective guidée en personne
            </h2>
          </div>
          <div className="space-y-5 text-[1rem] leading-8 text-[color:var(--site-muted)]">
            <p>
              Cet atelier permet à des participants de tous âges de vivre une expérience créative
              profonde : transformer des{' '}
              <strong className="text-[color:var(--site-heading)]">souvenirs, des émotions et des idées personnelles</strong>{' '}
              en une ou plusieurs chansons, avec l'aide de l'intelligence artificielle.
            </p>
            <p>
              L'IA y est présentée comme un outil nouveau à découvrir — simple, fascinant, mais
              toujours <em>au service de l'humain</em>. Ce sont vos mots, vos émotions et votre
              intention qui créent. L'IA aide à les mettre en forme musicale.
            </p>
            <p>
              L'expérience est animée par{' '}
              <strong className="text-[color:var(--site-heading)]">Nowis Morin en personne</strong>, dans un cadre
              chaleureux, professionnel et accessible — peu importe le profil ou le contexte du
              groupe.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════ POUR QUI ════════════════ */}
      <section className="section-soft px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
              Pour qui
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
              Un format qui s'adapte à votre groupe
            </h2>
            <p className="mt-4 text-[1rem] leading-8 text-[color:var(--site-muted)]">
              L'atelier se module selon l'âge, le contexte, la taille du groupe et le niveau de
              confort avec le numérique.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((a) => (
              <article
                key={a.label}
                className="brand-card rounded-[1.5rem] p-5 transition"
              >
                <span className="text-2xl" role="img" aria-hidden="true">
                  {a.icon}
                </span>
                <h3 className="mt-3 font-semibold text-[color:var(--site-heading)]">{a.label}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">{a.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ DÉROULEMENT ════════════════ */}
      <section id="deroulement" className="mx-auto max-w-5xl px-6 py-16 scroll-mt-20 md:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">
            Ce que les participants vivent
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
            Une création guidée étape par étape
          </h2>
          <p className="mt-4 text-[1rem] leading-8 text-[color:var(--site-muted)]">
            Ce n'est pas un cours d'informatique. C'est une expérience{' '}
            <em>créative, émotionnelle et collective</em>.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {steps.map((step, i) => (
            <article
              key={step.num}
              className={`flex gap-5 rounded-[1.5rem] border p-6 transition hover:border-opacity-50 ${
                i % 2 === 0
                  ? 'border-primary-500/20 bg-primary-500/[0.06]'
                  : 'border-white/10 bg-white/[0.025]'
              }`}
            >
              <div className="shrink-0 pt-0.5">
                <span className="font-display text-2xl font-bold text-primary-400/50 tabular-nums">
                  {step.num}
                </span>
              </div>
              <div>
                <h3 className="font-semibold leading-snug text-[color:var(--site-heading)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[color:var(--site-muted)]">{step.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ════════════════ RÉSULTAT FINAL ════════════════ */}
      <section className="section-warm px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="warm-spotlight-panel p-8 md:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
              Ce que le groupe repart avec
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[1.03] text-white md:text-5xl">
              Plus qu'un atelier — un souvenir réel
            </h2>
            <p className="mt-5 max-w-2xl text-[1rem] leading-8 text-amber-50/80 md:text-lg">
              À la fin de l'atelier, le groupe ne repart pas seulement avec une découverte de l'IA.
              Il repart avec une{' '}
              <strong className="text-amber-100">création commune</strong>, une{' '}
              <strong className="text-amber-100">chanson porteuse de sens</strong> et une{' '}
              <strong className="text-amber-100">vidéo souvenir téléchargeable</strong> qui garde une
              trace vivante et concrète de ce qui a été vécu.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                'Une ou plusieurs chansons créées ensemble',
                'Une vidéo souvenir téléchargeable',
                'Une expérience collective significative',
                'Un souvenir créatif ancré dans les émotions du groupe',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-7 text-amber-100/80"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ════════════════ POINTS FORTS ════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">
            Les points forts
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
            Ce qui rend cet atelier différent
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h) => (
            <article key={h.title} className="brand-card p-6">
              <span className="text-2xl" role="img" aria-hidden="true">
                {h.icon}
              </span>
              <h3 className="mt-4 font-semibold text-[color:var(--site-heading)]">{h.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">{h.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ════════════════ MILIEUX VISÉS ════════════════ */}
      <section className="section-soft px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
              Milieux et clientèles
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
              Un atelier conçu pour plusieurs types de groupes
            </h2>
            <p className="mt-4 text-[1rem] leading-8 text-[color:var(--site-muted)]">
              L'atelier n'est pas réservé à un seul milieu. Il s'adapte au contexte, au public et
              aux objectifs de chaque groupe.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {/* Aînés */}
            <article className="warm-spotlight-panel group p-7 transition">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-lg" aria-hidden="true">🎶</span>
                <h3 className="font-display text-xl text-[color:var(--site-heading)]">Aînés</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">
                Pour résidences, groupes d'aînés et milieux de vie. L'atelier offre une activité de
                valorisation centrée sur les souvenirs, la musique et l'expression personnelle, dans
                un découvs numérique doux et très accessible.
              </p>
              <ul className="mt-4 space-y-1.5">
                {['Résidences pour aînés', 'Groupes de vie communautaire', 'Activités de valorisation'].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-xs text-amber-200/70">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-amber-400/60" />{t}
                  </li>
                ))}
              </ul>
            </article>

            {/* Bibliothèques */}
            <article className="glass-panel-strong group p-7 transition">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-400/15 text-lg" aria-hidden="true">📚</span>
                <h3 className="font-display text-xl text-[color:var(--site-heading)]">Bibliothèques</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">
                Pour activités culturelles et médiation numérique. L'atelier s'inscrit naturellement
                dans une programmation autour de la créativité, de l'intelligence artificielle et
                des projets intergénérationnels.
              </p>
              <ul className="mt-4 space-y-1.5">
                {['Activités culturelles', 'Médiation numérique', 'Projets intergénérationnels'].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-xs text-primary-300/70">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-primary-400/60" />{t}
                  </li>
                ))}
              </ul>
            </article>

            {/* Centres communautaires */}
            <article className="glass-panel-soft group p-7 transition">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-lg" aria-hidden="true">🤝</span>
                <h3 className="font-display text-xl text-[color:var(--site-heading)]">Centres communautaires</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">
                Pour groupes variés et projets collectifs. L'atelier rassemble, valorise et crée du
                lien, avec une initiation accessible à l'IA et une création musicale commune.
              </p>
              <ul className="mt-4 space-y-1.5">
                {['Organismes communautaires', 'Groupes de rassemblement', 'Projets collectifs'].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-xs text-emerald-300/70">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-emerald-400/60" />{t}
                  </li>
                ))}
              </ul>
            </article>

            {/* Écoles et jeunesse */}
            <article className="brand-card group p-7 transition">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-400/15 text-lg" aria-hidden="true">🏫</span>
                <h3 className="font-display text-xl text-[color:var(--site-heading)]">Écoles et jeunesse</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">
                Pour ateliers éducatifs, créatifs et musicaux adaptés aux jeunes. Participation,
                écriture, émotions et création d'une œuvre commune dans un format stimulant et
                actuel.
              </p>
              <ul className="mt-4 space-y-1.5">
                {['Groupes scolaires', 'Maisons des jeunes', 'Ateliers parascolaires'].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-xs text-violet-300/70">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-violet-400/60" />{t}
                  </li>
                ))}
              </ul>
            </article>

            {/* Groupes intergénérationnels */}
            <article className="brand-card group p-7 transition">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/15 text-lg" aria-hidden="true">👨‍👩‍👧</span>
                <h3 className="font-display text-xl text-[color:var(--site-heading)]">Groupes intergénérationnels</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">
                Pour vivre une activité commune entre générations, autour des souvenirs, de la
                musique, de la créativité et de la découverte d'un outil moderne qui réunit plutôt
                qu'il n'isole.
              </p>
              <ul className="mt-4 space-y-1.5">
                {['Activités multigénérationnelles', 'Projets famille ou communauté', 'Rencontres entre groupes d\'âge'].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-xs text-sky-300/70">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-sky-400/60" />{t}
                  </li>
                ))}
              </ul>
            </article>

            {/* Groupes privés */}
            <article className="warm-spotlight-panel group p-7 transition">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-400/15 text-lg" aria-hidden="true">✨</span>
                <h3 className="font-display text-xl text-[color:var(--site-heading)]">Groupes privés et événements</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">
                Pour activités sur mesure, projets de groupe, événements thématiques ou expériences
                créatives uniques. L'atelier peut être façonné autour d'une intention ou d'un
                moment particulier.
              </p>
              <ul className="mt-4 space-y-1.5">
                {['Anniversaires et fêtes', 'Groupes corporatifs', 'Projets sur mesure'].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-xs text-rose-300/70">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-rose-400/60" />{t}
                  </li>
                ))}
              </ul>
            </article>

          </div>

          {/* Appel à l'action discret */}
          <p className="mt-10 text-center text-sm text-[color:var(--site-soft)]">
            Votre milieu n'est pas dans cette liste ?{' '}
            <Link href="/contact" className="font-medium text-primary-300 underline-offset-4 hover:underline">
              Parlez-nous de votre contexte
            </Link>{' '}
            — l'atelier peut très probablement s'y adapter.
          </p>
        </div>
      </section>

      {/* ════════════════ FORMAT ════════════════ */}
      <section className="section-warm px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">
                Format
              </p>
              <h2 className="mt-4 font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
                Souple, adaptable et pensé pour votre réalité
              </h2>
            </div>
            <div className="space-y-5 text-[1rem] leading-8 text-[color:var(--site-muted)]">
              <p>
                L atelier est offert en{' '}
                <strong className="text-[color:var(--site-heading)]">60 minutes, 90 minutes, 2 heures ou 3 heures</strong>, selon
                le rythme du groupe, le cadre de l activite et le niveau d implication souhaite.
              </p>
              <p>
                La meme logique tarifaire s applique partout : chaque duree affiche un prix regulier et un prix avec rabais {LAUNCH_DISCOUNT_PERCENT} %. Pour certains groupes, une formule lancement peut aussi etre offerte a {formatPrice(groupRegularPrice, ' / personne')} en prix regulier, ou {formatPrice(groupLaunchPrice, ' / personne')} avec rabais.
              </p>
              <ul className="mt-2 space-y-3">
                {[
                  ...workshopPrices.map((item) => `${item.label} : prix régulier ${formatPrice(item.regular)} · rabais ${formatPrice(getLaunchPrice(item.regular))}`),
                  'Adaptable selon la taille du groupe',
                  'Aucun équipement spécial requis de votre côté',
                  'En salle de classe, salle communautaire ou autre',
                  'Formule souple, sans contrainte technique',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ TARIFS ════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="glass-panel-soft p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">
            Tarifs
          </p>
          <h2 className="mt-4 font-display text-3xl leading-[1.03] text-[color:var(--site-heading)] md:text-4xl">
            Une grille simple pour reserver l atelier
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {workshopPrices.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-semibold text-[color:var(--site-heading)]">
                <p>{item.label}</p>
                <p className="mt-1 text-xs text-[color:var(--site-soft)]">Prix régulier : {formatPrice(item.regular)}</p>
                <p className="mt-1 text-sm text-emerald-300">Avec rabais {LAUNCH_DISCOUNT_PERCENT} % : {formatPrice(getLaunchPrice(item.regular))}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-[color:var(--site-muted)]">
            Formule groupe disponible. Certaines activites peuvent aussi etre offertes a {formatPrice(groupRegularPrice, ' / personne')} en prix regulier, ou {formatPrice(groupLaunchPrice, ' / personne')} avec rabais {LAUNCH_DISCOUNT_PERCENT} % pour les ecoles, maisons des jeunes, residences pour aines, organismes communautaires et groupes prives.
          </p>
        </div>
      </section>

      {/* ════════════════ NOWIS MORIN ════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="glass-panel-strong p-8 md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">
            L'animateur
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
            Nowis Morin anime chaque atelier en personne
          </h2>
          <div className="mt-6 max-w-2xl space-y-4 text-[1rem] leading-8 text-[color:var(--site-muted)]">
            <p>
              Nowis Morin ne délègue pas et n'envoie pas une ressource à sa place.{' '}
              <strong className="text-[color:var(--site-heading)]">Il est là, en personne</strong>, à guider chaque
              participant avec attention, sensibilité et clarté — du premier échange jusqu'à la
              remise du résultat.
            </p>
            <p>
              Son approche marie la{' '}
              <strong className="text-[color:var(--site-heading)]">musique</strong>, la{' '}
              <strong className="text-[color:var(--site-heading)]">créativité humaine</strong> et les{' '}
              <strong className="text-[color:var(--site-heading)]">nouvelles technologies</strong> dans un format qui
              inspire sans jamais intimider. Il sait rejoindre les jeunes comme les aînés, les
              groupes scolaires comme les équipes corporatives.
            </p>
            <p>
              L'intelligence artificielle est entre ses mains un outil pédagogique vivant : il la
              présente, l'utilise devant le groupe et accompagne chaque personne dans sa découverte
              — sans jargon, sans pression, avec beaucoup de plaisir.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════ FAQ ════════════════ */}
      <section className="section-soft px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">
            FAQ
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
            Questions fréquentes
          </h2>

          <dl className="mt-10 divide-y divide-[rgba(131,97,67,0.12)]">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-6 first:pt-0 last:pb-0">
                <dt className="font-semibold leading-snug text-[color:var(--site-heading)]">{faq.q}</dt>
                <dd className="mt-2.5 text-sm leading-7 text-[color:var(--site-muted)]">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ════════════════ CTA FINAL ════════════════ */}
      <section className="px-6 py-16 md:py-28">
        <div className="warm-cta-panel mx-auto max-w-3xl p-10 text-center md:p-16">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--site-accent-strong)]">
            Prêt à organiser l'atelier ?
          </p>
          <h2 className="mt-5 font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
            Organisez un atelier créatif marquant
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[1rem] leading-8 text-[color:var(--site-muted)]">
            Offrez à votre groupe une expérience humaine, musicale et actuelle, où l'intelligence
            artificielle devient un outil de création au service des souvenirs, de l'expression et
            du plaisir.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ateliers/demande"
              className="cta-primary px-9 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-coal-950"
            >
              Demander cet atelier
            </Link>
            <Link
              href="/contact"
              className="cta-secondary px-9 py-4 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-coal-950"
            >
              Poser une question
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
