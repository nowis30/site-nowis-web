import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Atelier créatif avec l\'IA – Créer une chanson ensemble | Nowis Morin',
  description:
    'Atelier créatif animé par Nowis Morin : créez ensemble une chanson à partir d\'émotions et de souvenirs, puis repartez avec une vidéo souvenir téléchargeable. Accessible à tous les âges.',
  path: '/ateliers/atelier-creatif',
  keywords: [
    'atelier intelligence artificielle',
    'atelier créatif musique',
    'atelier pour jeunes',
    'atelier pour aînés',
    'atelier chanson souvenir',
    'atelier IA Québec',
    'atelier musical avec IA',
    'Nowis Morin atelier',
    'atelier créatif scolaire',
    'création musicale IA',
  ],
});

// ─── Données ──────────────────────────────────────────────────────────────────

const audiences = [
  { label: 'Jeunes et adolescents', icon: '🎒', desc: 'Expression, identité, créativité dans un format qui les rejoint.' },
  { label: 'Aînés', icon: '🎶', desc: 'Souvenirs, émotion et musique dans un format doux, accessible et humain.' },
  { label: 'Écoles et classes', icon: '🏫', desc: 'Projet artistique, sortie parascolaire ou activité spéciale.' },
  { label: 'Maisons des jeunes', icon: '🏠', desc: 'Atelier participatif, vivant et valorisant pour les jeunes.' },
  { label: 'Organismes communautaires', icon: '🤝', desc: 'Créer du lien, valoriser les membres et laisser une trace collective.' },
  { label: 'Groupes intergénérationnels', icon: '👨‍👩‍👧', desc: 'Réunir plusieurs générations autour d\'un projet créatif commun.' },
  { label: 'Événements spéciaux', icon: '✨', desc: 'Animation originale pour un anniversaire, une fête ou une célébration.' },
  { label: 'Groupes corporatifs créatifs', icon: '💼', desc: 'Team building humain, original et ancré dans la collaboration.' },
];

const steps = [
  {
    num: '01',
    title: 'Partage d\'émotions et de souvenirs',
    desc: 'Les participants partagent ce qui les touche, ce qu\'ils veulent transmettre, ou un moment de vie à faire vivre en musique.',
  },
  {
    num: '02',
    title: 'Choix d\'un thème commun',
    desc: 'Le groupe choisit ensemble une direction, une intention, une émotion centrale qui guidera la création.',
  },
  {
    num: '03',
    title: 'Création des paroles ou de l\'intention musicale',
    desc: 'Les idées, les mots et les images deviennent des paroles. Chaque voix contribue à l\'œuvre collective.',
  },
  {
    num: '04',
    title: 'Découverte de l\'IA comme outil créatif',
    desc: 'Nowis Morin guide le groupe dans l\'utilisation concrète de l\'intelligence artificielle. Ce n\'est pas un cours. C\'est une découverte en action.',
  },
  {
    num: '05',
    title: 'Transformation en chanson',
    desc: 'Les idées prennent forme musicale. Une création réelle, nourrie des émotions du groupe.',
  },
  {
    num: '06',
    title: 'Création de la vidéo souvenir',
    desc: 'Une vidéo est construite autour de l\'œuvre finale pour conserver une trace vivante et téléchargeable de l\'expérience.',
  },
];

const highlights = [
  { icon: '🎵', title: 'Musique', desc: 'Une vraie chanson créée par le groupe, pas un gabarit.' },
  { icon: '🤖', title: 'IA accessible', desc: 'Un outil moderne qu\'on apprend ensemble, sans panique ni jargon.' },
  { icon: '❤️', title: 'Émotions au centre', desc: 'Chaque création découle d\'un vécu réel, pas d\'un exercice.' },
  { icon: '🎬', title: 'Vidéo souvenir', desc: 'Le groupe repart avec un résultat téléchargeable et durable.' },
  { icon: '👤', title: 'Animation en personne', desc: 'Nowis Morin est présent, disponible et attentif à chaque participant.' },
  { icon: '🔄', title: 'Format adaptable', desc: 'Durée, taille de groupe, contexte — tout peut être ajusté.' },
];

const faqs = [
  {
    q: 'Est-ce que l\'atelier convient à tous les âges ?',
    a: 'Oui. L\'atelier est conçu pour être modulable selon l\'âge et le contexte. Il a été offert à des jeunes, à des aînés et à des groupes intergénérationnels. Le contenu et le rythme s\'ajustent naturellement.',
  },
  {
    q: 'Faut-il être à l\'aise avec la technologie ?',
    a: 'Non, aucune compétence technique n\'est requise. L\'atelier guide chaque participant pas à pas. L\'IA est présentée comme un outil simple à expérimenter, pas comme une matière à maîtriser.',
  },
  {
    q: 'Combien de personnes peuvent participer ?',
    a: 'Le format s\'adapte à la taille du groupe. Que vous soyez 10 ou 40 participants, Nowis Morin adapte le déroulement pour que chacun puisse contribuer et vivre l\'expérience pleinement.',
  },
  {
    q: 'Est-ce que le groupe repart avec un résultat concret ?',
    a: 'Oui. À la fin de l\'atelier, le groupe repart avec une ou plusieurs chansons et une vidéo souvenir téléchargeable. C\'est un résultat réel, porteur de sens et de mémoire collective.',
  },
  {
    q: 'Est-ce que l\'atelier peut être adapté à notre milieu ?',
    a: 'Absolument. Que ce soit pour une école, une résidence pour aînés, un organisme communautaire ou un événement spécial, le format peut être ajusté selon vos besoins, votre contexte et votre public.',
  },
  {
    q: 'Combien de temps dure l\'activité ?',
    a: 'Le format de base est prévu pour environ 90 minutes. Il peut être allongé selon le nombre de participants ou l\'intensité de l\'engagement du groupe.',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AtelierCreatifPage() {
  return (
    <main className="text-slate-100">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[linear-gradient(160deg,rgba(8,12,24,0.98),rgba(20,14,40,0.96))] px-6 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.14),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.10),transparent_40%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">
            Atelier créatif · Animation en personne · Tous âges
          </p>
          <h1 className="mt-5 font-display text-5xl leading-[1.0] text-white md:text-6xl lg:text-7xl">
            Créer une chanson ensemble avec l'IA
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
            Un atelier créatif, humain et accessible pour transformer des émotions, des souvenirs et des idées en une ou plusieurs chansons — puis en une <strong className="text-white">vidéo souvenir téléchargeable</strong>.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ateliers/demande"
              className="rounded-xl bg-brand-warm px-8 py-4 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Demander cet atelier
            </Link>
            <a
              href="#deroulement"
              className="rounded-xl border border-white/15 bg-white/5 px-8 py-4 font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              Découvrir le déroulement
            </a>
          </div>
        </div>
      </section>

      {/* ── PRÉSENTATION ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">L'atelier en quelques mots</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
              Une expérience musicale unique, guidée en personne
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-slate-300">
            <p>
              Cet <strong className="text-white">atelier créatif</strong> permet à des participants de tous âges de vivre une expérience musicale unique, où l'on crée ensemble une ou plusieurs chansons à partir d'émotions, de souvenirs et d'idées personnelles.
            </p>
            <p>
              L'<strong className="text-white">intelligence artificielle</strong> y est présentée comme un nouvel outil d'expression et de création — simple à découvrir, fascinant à utiliser, mais toujours <em>au service de l'humain</em>. Ce sont vos idées, vos mots et vos émotions qui créent. L'IA aide à les mettre en forme.
            </p>
            <p>
              L'atelier est animé par <strong className="text-white">Nowis Morin en personne</strong>, dans une approche chaleureuse, professionnelle et accessible, quel que soit le contexte ou le niveau des participants.
            </p>
          </div>
        </div>
      </section>

      {/* ── POUR QUI ── */}
      <section className="bg-slate-950/60 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Pour qui</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
              Un format qui s'adapte à votre groupe
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              L'atelier se module selon l'âge, le contexte, la taille du groupe et le niveau de familiarité avec le numérique.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((a) => (
              <article key={a.label} className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(14,20,44,0.80),rgba(9,14,28,0.70))] p-5 backdrop-blur-sm">
                <span className="text-2xl" role="img" aria-hidden="true">{a.icon}</span>
                <h3 className="mt-3 font-semibold text-white">{a.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{a.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── DÉROULEMENT ── */}
      <section id="deroulement" className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Ce que les participants vivent</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
            Une expérience créative guidée, étape par étape
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Ce n'est pas un cours téchnique d'informatique. C'est une expérience <em>créative</em>, <em>émotionnelle</em> et <em>collective</em>.
          </p>
        </div>
        <div className="mt-12 space-y-6">
          {steps.map((step, i) => (
            <article
              key={step.num}
              className={`flex gap-6 rounded-2xl border p-6 ${i % 2 === 0 ? 'border-primary-500/20 bg-primary-500/5' : 'border-white/10 bg-white/[0.03]'}`}
            >
              <div className="shrink-0">
                <span className="font-display text-3xl font-bold text-primary-400/60">{step.num}</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-7 text-slate-300">{step.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── RÉSULTAT FINAL ── */}
      <section className="bg-slate-950/60 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[2.5rem] border border-amber-300/20 bg-[linear-gradient(145deg,rgba(60,40,0,0.30),rgba(120,80,0,0.15))] p-8 md:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Ce que le groupe repart avec</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
              Plus qu'un atelier — un souvenir concret
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-amber-50/90 md:text-lg">
              À la fin de l'atelier, le groupe repart avec bien plus qu'une découverte de l'IA : il repart avec une <strong className="text-white">création commune</strong>, une <strong className="text-white">chanson porteuse de sens</strong> et une <strong className="text-white">vidéo souvenir téléchargeable</strong> qui garde une trace vivante de l'expérience.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                'Une ou plusieurs chansons créées ensemble',
                'Une vidéo souvenir téléchargeable',
                'Une expérience collective marquante',
                'Un souvenir créatif lié aux émotions du groupe',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-7 text-amber-100/90">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── POINTS FORTS ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Les points forts</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
            Ce qui rend cet atelier différent
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((h) => (
            <article key={h.title} className="brand-card p-7">
              <span className="text-2xl" role="img" aria-hidden="true">{h.icon}</span>
              <h3 className="mt-4 font-display text-2xl text-white">{h.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">{h.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── FORMAT ── */}
      <section className="bg-slate-950/60 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Format de l'atelier</p>
              <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
                Souple, adaptable et pensé pour votre réalité
              </h2>
            </div>
            <div className="space-y-5 text-sm leading-8 text-slate-300">
              <p>
                Le format de base de l'atelier est prévu pour environ <strong className="text-white">90 minutes</strong>. Il peut être ajusté selon le nombre de participants, le rythme du groupe et le contexte.
              </p>
              <p>
                Lorsqu'un groupe est plus grand ou particulièrement engagé, l'atelier peut se prolonger afin de permettre une expérience complète et de qualité.
              </p>
              <ul className="space-y-2">
                {[
                  'Durée de base : ~90 minutes',
                  'Adaptable selon la taille du groupe',
                  'Aucun équipement requis de votre côté',
                  'Possible en salle de classe, salle communautaire ou autre',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOWIS MORIN ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="rounded-[2.5rem] border border-primary-300/20 bg-[linear-gradient(145deg,rgba(14,20,44,0.96),rgba(22,30,60,0.90))] p-8 md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">
            L'animateur
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] text-white md:text-5xl">
            Nowis Morin anime chaque atelier en personne
          </h2>
          <div className="mt-6 max-w-2xl space-y-4 text-base leading-8 text-slate-300">
            <p>
              Nowis Morin n'envoie pas une ressource à sa place. Il est là, en personne, à guider chaque participant avec attention, sensibilité et clarté.
            </p>
            <p>
              Son approche marie la <strong className="text-white">musique</strong>, la <strong className="text-white">créativité humaine</strong> et les <strong className="text-white">nouvelles technologies</strong> dans un format qui inspire sans intimider. Il sait rejoindre les jeunes comme les aînés, les groupes scolaires comme les équipes corporatives.
            </p>
            <p>
              L'intelligence artificielle est entre ses mains un outil pédagogique vivant : il la présente, l'utilise devant le groupe et accompagne chaque personne dans la découverte — sans jargon, sans pression.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-slate-950/60 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Questions fréquentes</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
            Ce que les gens demandent souvent
          </h2>
          <dl className="mt-10 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-white/10 pb-6">
                <dt className="font-semibold text-white">{faq.q}</dt>
                <dd className="mt-2 text-sm leading-7 text-slate-300">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-emerald-400/20 bg-[linear-gradient(145deg,rgba(4,33,32,0.94),rgba(10,48,47,0.88))] p-10 text-center md:p-16">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Prêt à organiser l'atelier ?</p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] text-white md:text-5xl">
            Organisez un atelier créatif marquant
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-emerald-50/90">
            Offrez à votre groupe une expérience humaine, musicale et actuelle, où l'intelligence artificielle devient un outil de création au service des souvenirs, de l'expression et du plaisir.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ateliers/demande"
              className="rounded-xl bg-emerald-600 px-8 py-4 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-500"
            >
              Demander cet atelier
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-white/15 bg-white/5 px-8 py-4 font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              Poser une question
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
