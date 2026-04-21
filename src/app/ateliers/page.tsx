import Script from 'next/script';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { buildFaqSchema, buildServiceSchema } from '@/lib/structured-data';

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const faqItems = [
  {
    q: 'À qui s\'adresse cet atelier ?',
    a: 'À tous les âges : aînés, jeunes, adultes, groupes intergénérationnels. L\'atelier s\'adapte à la composition et aux besoins du groupe. Aucune compétence musicale ou technologique n\'est requise.',
  },
  {
    q: 'Est-ce que les participants doivent connaître l\'intelligence artificielle ?',
    a: 'Pas du tout. L\'atelier est pensé pour des personnes qui n\'ont jamais touché à l\'IA. La découverte se fait de façon progressive, guidée et sans pression. L\'accent est mis sur la création, pas sur la technologie.',
  },
  {
    q: 'Combien de personnes peuvent participer ?',
    a: 'L\'atelier peut accueillir des petits groupes comme des groupes plus larges. La formule s\'ajuste selon la taille, le contexte et ce que vous souhaitez accomplir.',
  },
  {
    q: 'Quelle est la durée habituelle ?',
    a: 'Les formats affiches sont clairs : 60 minutes, 90 minutes, 2 heures ou 3 heures. Cela permet de choisir une formule adaptee a votre groupe sans ambiguite.',
  },
  {
    q: 'Quel est le coût d\'un atelier ?',
    a: 'Les ateliers suivent la grille officielle : 60 minutes = 120 $, 90 minutes = 180 $, 2 heures = 240 $ et 3 heures = 360 $. Pour certains groupes, une formule lancement peut aussi etre offerte a partir de 10 $ par personne.',
  },
  {
    q: 'Est-ce que Nowis Morin se déplace jusqu\'à chez nous ?',
    a: 'Oui. Les ateliers sont animes en personne dans un rayon d environ 100 km aller-retour autour de Drummondville. Pour un projet en dehors de ce rayon, une soumission speciale peut etre discutee.',
  },
  {
    q: 'Qu\'est-ce que le groupe repart avec ?',
    a: 'Une ou plusieurs chansons créées collectivement et une vidéo souvenir téléchargeable. Une création réelle, nourrie des émotions et des mots du groupe — que les participants peuvent garder, partager et faire revivre.',
  },
];

// ─── Milieux ──────────────────────────────────────────────────────────────────

const milieux = [
  { icon: '🎶', label: 'Résidences pour aînés', desc: 'Musique, mémoire, valorisation et découverte douce de la technologie dans un cadre bienveillant.' },
  { icon: '📚', label: 'Bibliothèques', desc: 'Médiation culturelle, animation créative et initiation concrète à l\'intelligence artificielle.' },
  { icon: '🤝', label: 'Centres communautaires', desc: 'Activité rassembleuse et expressive pour des groupes de tous âges et de tous horizons.' },
  { icon: '🏛️', label: 'Organismes publics', desc: 'Projet collectif, participation et découverte actuelle d\'un outil numérique contemporain.' },
  { icon: '🏫', label: 'Écoles et maisons des jeunes', desc: 'Créativité, écriture, musique, expression et découverte technologique pour enfants et adolescents.' },
  { icon: '👨‍👩‍👧', label: 'Groupes intergénérationnels', desc: 'Relier les générations par la musique, les souvenirs, la création et le partage d\'un moment fort.' },
  { icon: '✨', label: 'Événements et groupes privés', desc: 'Une activité unique, mémorable et créative pour un événement, une fête ou une occasion spéciale.' },
  { icon: '🌐', label: 'Milieu scolaire (adapté)', desc: 'Ateliers conçus pour s\'adapter aux réalités pédagogiques, aux niveaux et aux groupes-classes.' },
];

// ─── Déroulement ─────────────────────────────────────────────────────────────

const etapes = [
  { num: '01', title: 'Accueil du groupe', desc: 'Nowis Morin prend le temps de créer un espace de confiance, de curiosité et de bienveillance.' },
  { num: '02', title: 'Partage d\'idées et d\'émotions', desc: 'Les participants partagent des souvenirs, des émotions ou des idées qu\'ils veulent mettre en musique.' },
  { num: '03', title: 'Choix d\'un thème commun', desc: 'Le groupe choisit ensemble une direction créative qui reflète ses intentions.' },
  { num: '04', title: 'Création des paroles ou de l\'intention', desc: 'Les mots et les images du groupe prennent forme, guidés par Nowis.' },
  { num: '05', title: 'Découverte de l\'IA', desc: 'L\'IA est présentée comme outil créatif concret — guidé en temps réel, accessible à tous.' },
  { num: '06', title: 'Création d\'une ou plusieurs chansons', desc: 'Le groupe co-crée une œuvre musicale réelle, nourrie de ses propres émotions et mots.' },
  { num: '07', title: 'Résultat final et vidéo souvenir', desc: 'Une vidéo est créée autour de l\'œuvre — téléchargeable, partageable et durable.' },
];

export const metadata = buildMetadata({
  title: 'Ateliers de création musicale avec IA | Création Nowis à Drummondville',
  description:
    'Découvrez les ateliers de création musicale avec l IA de Création Nowis : une formule humaine, adaptée aux écoles, aux aînés, aux organismes et aux groupes partout à Drummondville et au Québec.',
  path: '/ateliers',
  image: '/hero.jpg',
  keywords: [
    'ateliers IA Drummondville',
    'création musicale avec IA Québec',
    'atelier pour écoles Québec',
    'atelier pour aînés Drummondville',
    'Nowis Morin ateliers',
  ],
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AteliersPage() {
  const faqSchema = buildFaqSchema(faqItems.map((item) => ({ question: item.q, answer: item.a })));
  const serviceSchema = buildServiceSchema({
    name: 'Ateliers de création musicale avec IA',
    description:
      'Des ateliers animés en personne par Nowis Morin pour écoles, aînés, organismes et groupes qui veulent découvrir l intelligence artificielle par la musique.',
    path: '/ateliers',
    serviceType: 'Atelier de création musicale avec IA',
    audience: ['Écoles', 'Aînés', 'Organismes communautaires', 'Groupes intergénérationnels'],
  });

  return (
    <main className="text-[color:var(--site-text)]">
      <Script id="ateliers-service-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id="ateliers-faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ── HÉROS ── */}
      <section className="relative overflow-hidden px-6 py-16 md:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 10% 12%, rgba(184,111,61,0.12), transparent 26%),' +
              'radial-gradient(circle at 86% 8%, rgba(203,165,120,0.16), transparent 22%)',
          }}
        />
        <div className="mx-auto max-w-5xl">
          <span className="brand-chip inline-block">Ateliers de création musicale avec l&apos;IA</span>
          <h1 className="brand-metal-text mt-5 font-display text-5xl leading-[0.95] md:text-7xl">
            Un atelier vivant, humain et accessible pour tous
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[color:var(--site-muted)]">
            Animés en personne par Nowis Morin, les ateliers de création musicale avec l&apos;IA invitent chaque groupe à créer une chanson à partir de ses propres émotions, souvenirs et idées, puis à repartir avec une vidéo souvenir téléchargeable.
          </p>
          <p className="mt-3 max-w-2xl text-base leading-8 text-[color:var(--site-muted)]">
            Une formule pensee pour les ecoles, les aines, les organismes et les groupes de Drummondville et partout au Quebec. Le tarif suit une grille simple : 120 $ pour 60 minutes, 180 $ pour 90 minutes, 240 $ pour 2 heures et 360 $ pour 3 heures.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/ateliers/demande"
              className="cta-primary w-full justify-center px-7 py-4 sm:w-auto"
            >
              Demander un atelier
            </Link>
            <Link
              href="/contact"
              className="cta-secondary w-full justify-center px-7 py-4 sm:w-auto"
            >
              Poser une question
            </Link>
          </div>
        </div>
      </section>

      {/* ── MILIEUX VISÉS ── */}
      <section className="section-soft px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Pour qui</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
              Un atelier fait pour plusieurs milieux
            </h2>
            <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">
              L&apos;atelier s&apos;adapte au groupe, à l&apos;âge, au contexte et aux objectifs. Il n&apos;y a pas deux ateliers identiques.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {milieux.map((m) => (
              <article
                key={m.label}
                className="brand-card rounded-[1.5rem] p-5 transition"
              >
                <span className="text-2xl" role="img" aria-hidden="true">{m.icon}</span>
                <h3 className="mt-3 font-semibold text-[color:var(--site-heading)]">{m.label}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">{m.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── LE RÔLE DE L'IA ── */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">L&apos;IA dans l&apos;atelier</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
              L&apos;IA comme outil, pas comme remplacement
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-[color:var(--site-muted)]">
            <p>Dans l&apos;atelier, l&apos;intelligence artificielle est <strong className="text-white">un outil de création</strong>. Un outil puissant, concret — qu&apos;on peut apprendre à utiliser intelligemment.</p>
            <p>Nowis Morin guide chaque groupe à travers cette découverte, pas à pas, de façon accessible et rassurante. <strong className="text-white">L&apos;humain reste au centre</strong>. Les émotions, les souvenirs et les mots des participants nourrissent tout le processus.</p>
            <p>L&apos;IA ne décide pas. Elle aide à transformer ce que les gens ont à l&apos;intérieur en quelque chose de beau et de réel.</p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { icon: '🤖', title: 'Outil, pas maîtresse', desc: 'L\'IA est guidée par les participants et par Nowis Morin. Elle n\'impose rien.' },
            { icon: '🎓', title: 'Apprentissage concret', desc: 'On apprend en créant — pas en théorisant. La découverte est réelle et mémorable.' },
            { icon: '💡', title: 'Accessible à tous', desc: 'Aucune compétence préalable n\'est requise. L\'atelier s\'adapte à chaque profil.' },
          ].map((card) => (
            <article key={card.title} className="brand-card p-6">
              <span className="text-2xl" role="img" aria-hidden="true">{card.icon}</span>
              <h3 className="mt-4 font-semibold text-[color:var(--site-heading)]">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">{card.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── DÉROULEMENT ── */}
      <section className="section-warm px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Déroulement</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
              Comment se déroule un atelier
            </h2>
            <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)]">
              Un format au choix de 60 minutes, 90 minutes, 2 heures ou 3 heures, guide du debut a la fin par Nowis Morin.
            </p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {etapes.map((e, i) => (
              <article
                key={e.num}
                className={`flex gap-4 rounded-[1.5rem] border p-5 ${
                  i % 2 === 0
                    ? 'border-primary-500/20 bg-primary-500/[0.06]'
                    : 'border-white/10 bg-white/[0.025]'
                }`}
              >
                <span className="font-display text-2xl font-bold text-primary-400/50 tabular-nums">{e.num}</span>
                <div>
                  <h3 className="font-semibold text-[color:var(--site-heading)]">{e.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--site-muted)]">{e.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── RÉSULTATS ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="warm-spotlight-panel p-8 md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Ce que le groupe repart avec</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
            Un résultat concret, pas juste une expérience
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {[
              { icon: '🎵', title: 'Une ou plusieurs chansons créées', desc: 'Nées des émotions, des mots et du thème choisi par le groupe.' },
              { icon: '📱', title: 'Une vidéo souvenir téléchargeable', desc: 'À garder, partager, et qui survit longtemps après l\'atelier.' },
              { icon: '🌟', title: 'Une expérience collective forte', desc: 'Quelque chose de vrai, de beau, et qui a du sens pour ceux qui l\'ont vécu.' },
              { icon: '🔍', title: 'Une compréhension concrète de l\'IA', desc: 'Pas de la théorie : une vraie découverte en action, applicable au quotidien.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="shrink-0 text-2xl" role="img" aria-hidden="true">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-amber-100">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-amber-100/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DURÉE ET RAYON ── */}
      <section className="section-soft px-6 py-12 md:py-16">
        <div className="mx-auto max-w-5xl grid gap-4 md:grid-cols-2">
          <div className="rounded-[2rem] border border-primary-400/20 bg-primary-500/[0.07] p-7">
            <span className="text-3xl" role="img" aria-hidden="true">⏱️</span>
            <h3 className="mt-4 font-display text-2xl text-white">Durée adaptable</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Choisissez la formule qui convient a votre groupe : <strong className="text-white">60 minutes a 120 $</strong>, <strong className="text-white">90 minutes a 180 $</strong>, <strong className="text-white">2 heures a 240 $</strong> ou <strong className="text-white">3 heures a 360 $</strong>.
            </p>
          </div>
          <div className="rounded-[2rem] border border-emerald-400/15 bg-emerald-500/[0.06] p-7">
            <span className="text-3xl" role="img" aria-hidden="true">📍</span>
            <h3 className="mt-4 font-display text-2xl text-white">Rayon de déplacement</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Les ateliers sont animes en personne dans un rayon d&apos;environ <strong className="text-white">100 km aller-retour autour de Drummondville</strong>. Pour un projet en dehors de cette zone, une soumission speciale peut etre discutee.
            </p>
          </div>
        </div>
      </section>

      {/* ── TARIFICATION ── */}
      <section className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        <div className="glass-panel-soft p-8 text-center md:p-10">
          <span className="text-3xl" role="img" aria-hidden="true">💬</span>
          <h2 className="mt-4 font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">Tarifs des ateliers</h2>
          <div className="mx-auto mt-6 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
            {[
              '60 minutes : 120 $',
              '90 minutes : 180 $',
              '2 heures : 240 $',
              '3 heures : 360 $',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-[color:var(--site-heading)]">
                {item}
              </div>
            ))}
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[color:var(--site-muted)]">
            Formule groupe disponible. Certaines activites peuvent aussi etre offertes a partir de 10 $ par personne pour les ecoles, maisons des jeunes, residences pour aines, organismes communautaires et groupes prives.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[color:var(--site-muted)]">
            Le deplacement est inclus jusqu a 100 km aller-retour depuis Drummondville. Au-dela, une soumission complementaire peut etre discutee.
          </p>
          <Link
            href="/contact"
            className="cta-primary mt-6 w-full justify-center px-7 py-3.5 sm:w-auto"
          >
            Demander une soumission
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section-warm px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Questions fréquentes</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
            On répond à vos questions
          </h2>
          <div className="mt-10 space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-6 py-5 transition hover:border-white/20"
              >
                <summary className="cursor-pointer list-none font-semibold text-[color:var(--site-heading)] group-open:text-[color:var(--site-accent-strong)]">
                  <span className="flex items-start justify-between gap-4">
                    {item.q}
                    <span className="mt-0.5 shrink-0 text-[color:var(--site-soft)] transition group-open:rotate-180">▾</span>
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── ATELIER CREATIF LINK ── */}
      <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="glass-panel-strong p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-300">Atelier spécifique</p>
              <h2 className="mt-3 font-display text-3xl leading-[1.05] text-[color:var(--site-heading)] md:text-4xl">
                Atelier de création musicale avec l&apos;IA
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[color:var(--site-muted)]">
                Découvrez la page dédiée à notre atelier phare, avec tous les détails sur le contenu, les objectifs et les modalités.
              </p>
            </div>
            <Link
              href="/ateliers/atelier-creatif"
              className="cta-secondary shrink-0 px-7 py-3.5"
            >
              Voir la page complète →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-6 py-16 md:py-24">
        <div className="warm-cta-panel mx-auto max-w-4xl overflow-hidden p-10 text-center md:p-16">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-300">Prêt à vous lancer</p>
          <h2 className="mt-5 font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
            Offrir un atelier différent, humain et actuel
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[color:var(--site-muted)]">
            Pour un atelier unique dans votre milieu, prenez contact avec Nowis Morin. On discutera ensemble du format, du groupe et des objectifs, avec une grille deja claire pour partir sur une base simple.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ateliers/demande"
              className="cta-primary px-9 py-4"
            >
              Demander un atelier
            </Link>
            <Link
              href="/ateliers/atelier-creatif"
              className="cta-secondary px-9 py-4"
            >
              Voir l'atelier détaillé
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
