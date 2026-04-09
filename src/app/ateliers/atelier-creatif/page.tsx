import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

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
    a: 'La durée de base est d\'environ 90 minutes. Elle peut être prolongée selon le nombre de participants ou l\'intensité de l\'engagement du groupe, pour s\'assurer que chacun vive une expérience complète.',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AtelierCreatifPage() {
  return (
    <main className="text-slate-100">

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative overflow-hidden px-6 py-24 md:py-32">
        {/* Fonds lumineux */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 20% 0%, rgba(96,165,250,0.14) 0%, transparent 60%),' +
              'radial-gradient(ellipse 55% 55% at 85% 100%, rgba(139,92,246,0.12) 0%, transparent 55%),' +
              'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(59,130,246,0.06) 0%, transparent 50%)',
          }}
        />
        {/* Grille subtile */}
        <div aria-hidden="true" className="brand-grid pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative mx-auto max-w-4xl text-center">
          <span className="brand-chip mb-6 inline-block">
            Animé en personne · Tous âges · Formule adaptable
          </span>

          <h1 className="font-display text-5xl leading-[0.97] text-white md:text-6xl lg:text-7xl">
            Atelier de création musicale avec&nbsp;l'IA
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-9 text-slate-300 md:text-xl">
            Créez ensemble une ou plusieurs chansons à partir d'émotions, de souvenirs et d'idées
            personnelles — puis repartez avec une{' '}
            <strong className="font-semibold text-white">vidéo souvenir téléchargeable</strong>.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ateliers/demande"
              className="rounded-xl bg-brand-warm px-8 py-4 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-coal-950"
            >
              Demander cet atelier
            </Link>
            <a
              href="#deroulement"
              className="rounded-xl border border-white/15 bg-white/5 px-8 py-4 font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-coal-950"
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
            <h2 className="mt-4 font-display text-4xl leading-[1.03] text-white md:text-5xl">
              Une expérience musicale collective guidée en personne
            </h2>
          </div>
          <div className="space-y-5 text-[1rem] leading-8 text-slate-300">
            <p>
              Cet atelier permet à des participants de tous âges de vivre une expérience créative
              profonde : transformer des{' '}
              <strong className="text-white">souvenirs, des émotions et des idées personnelles</strong>{' '}
              en une ou plusieurs chansons, avec l'aide de l'intelligence artificielle.
            </p>
            <p>
              L'IA y est présentée comme un outil nouveau à découvrir — simple, fascinant, mais
              toujours <em>au service de l'humain</em>. Ce sont vos mots, vos émotions et votre
              intention qui créent. L'IA aide à les mettre en forme musicale.
            </p>
            <p>
              L'expérience est animée par{' '}
              <strong className="text-white">Nowis Morin en personne</strong>, dans un cadre
              chaleureux, professionnel et accessible — peu importe le profil ou le contexte du
              groupe.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════ POUR QUI ════════════════ */}
      <section className="bg-steel-950/50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
              Pour qui
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[1.03] text-white md:text-5xl">
              Un format qui s'adapte à votre groupe
            </h2>
            <p className="mt-4 text-[1rem] leading-8 text-slate-300">
              L'atelier se module selon l'âge, le contexte, la taille du groupe et le niveau de
              confort avec le numérique.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((a) => (
              <article
                key={a.label}
                className="rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-[rgba(14,20,44,0.78)] to-[rgba(9,14,28,0.65)] p-5 backdrop-blur-sm transition hover:border-white/20 hover:from-[rgba(20,28,60,0.85)]"
              >
                <span className="text-2xl" role="img" aria-hidden="true">
                  {a.icon}
                </span>
                <h3 className="mt-3 font-semibold text-white">{a.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{a.desc}</p>
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
          <h2 className="mt-4 font-display text-4xl leading-[1.03] text-white md:text-5xl">
            Une création guidée étape par étape
          </h2>
          <p className="mt-4 text-[1rem] leading-8 text-slate-300">
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
                <h3 className="font-semibold leading-snug text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">{step.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ════════════════ RÉSULTAT FINAL ════════════════ */}
      <section className="bg-steel-950/50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div
            className="rounded-[2.5rem] border border-amber-400/20 p-8 md:p-12"
            style={{
              background:
                'linear-gradient(145deg, rgba(55,32,0,0.38) 0%, rgba(100,60,0,0.22) 60%, rgba(18,12,0,0.30) 100%)',
            }}
          >
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
          <h2 className="mt-4 font-display text-4xl leading-[1.03] text-white md:text-5xl">
            Ce qui rend cet atelier différent
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h) => (
            <article key={h.title} className="brand-card p-6">
              <span className="text-2xl" role="img" aria-hidden="true">
                {h.icon}
              </span>
              <h3 className="mt-4 font-semibold text-white">{h.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{h.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ════════════════ FORMAT ════════════════ */}
      <section className="bg-steel-950/50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">
                Format
              </p>
              <h2 className="mt-4 font-display text-4xl leading-[1.03] text-white md:text-5xl">
                Souple, adaptable et pensé pour votre réalité
              </h2>
            </div>
            <div className="space-y-5 text-[1rem] leading-8 text-slate-300">
              <p>
                Le format de base est prévu pour environ{' '}
                <strong className="text-white">90 minutes</strong>. Il peut être ajusté selon le
                nombre de participants, le rythme du groupe et le contexte.
              </p>
              <p>
                Lorsqu'un groupe est plus grand ou particulièrement participatif, l'atelier peut se
                prolonger naturellement pour offrir une expérience complète et de qualité.
              </p>
              <ul className="mt-2 space-y-3">
                {[
                  'Durée de base : environ 90 minutes',
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

      {/* ════════════════ NOWIS MORIN ════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div
          className="rounded-[2.5rem] border border-primary-400/20 p-8 md:p-12"
          style={{
            background:
              'linear-gradient(145deg, rgba(14,20,44,0.97) 0%, rgba(22,30,60,0.90) 100%)',
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">
            L'animateur
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.03] text-white md:text-5xl">
            Nowis Morin anime chaque atelier en personne
          </h2>
          <div className="mt-6 max-w-2xl space-y-4 text-[1rem] leading-8 text-slate-300">
            <p>
              Nowis Morin ne délègue pas et n'envoie pas une ressource à sa place.{' '}
              <strong className="text-white">Il est là, en personne</strong>, à guider chaque
              participant avec attention, sensibilité et clarté — du premier échange jusqu'à la
              remise du résultat.
            </p>
            <p>
              Son approche marie la{' '}
              <strong className="text-white">musique</strong>, la{' '}
              <strong className="text-white">créativité humaine</strong> et les{' '}
              <strong className="text-white">nouvelles technologies</strong> dans un format qui
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
      <section className="bg-steel-950/50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">
            FAQ
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.03] text-white md:text-5xl">
            Questions fréquentes
          </h2>

          <dl className="mt-10 divide-y divide-white/10">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-6 first:pt-0 last:pb-0">
                <dt className="font-semibold leading-snug text-white">{faq.q}</dt>
                <dd className="mt-2.5 text-sm leading-7 text-slate-300">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ════════════════ CTA FINAL ════════════════ */}
      <section className="px-6 py-16 md:py-28">
        <div
          className="mx-auto max-w-3xl rounded-[2.5rem] border border-emerald-400/20 p-10 text-center md:p-16"
          style={{
            background:
              'linear-gradient(145deg, rgba(3,28,26,0.96) 0%, rgba(8,44,40,0.90) 100%)',
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">
            Prêt à organiser l'atelier ?
          </p>
          <h2 className="mt-5 font-display text-4xl leading-[1.03] text-white md:text-5xl">
            Organisez un atelier créatif marquant
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[1rem] leading-8 text-emerald-50/80">
            Offrez à votre groupe une expérience humaine, musicale et actuelle, où l'intelligence
            artificielle devient un outil de création au service des souvenirs, de l'expression et
            du plaisir.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ateliers/demande"
              className="rounded-xl bg-emerald-600 px-9 py-4 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-coal-950"
            >
              Demander cet atelier
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-white/15 bg-white/5 px-9 py-4 font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-coal-950"
            >
              Poser une question
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
