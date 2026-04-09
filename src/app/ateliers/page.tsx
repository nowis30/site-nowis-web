import Link from 'next/link';

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
    a: 'La durée de base est d\'environ 90 minutes. Des formules adaptées — plus courtes ou plus longues — peuvent être discutées selon vos besoins et le cadre de votre activité.',
  },
  {
    q: 'Quel est le coût d\'un atelier ?',
    a: 'Les ateliers sont offerts sur soumission. Le coût varie selon la durée, le nombre de participants, le déplacement et les besoins spécifiques. Écrivez-nous pour obtenir une soumission personnalisée.',
  },
  {
    q: 'Est-ce que Nowis Morin se déplace jusqu\'à chez nous ?',
    a: 'Oui. Les ateliers sont animés en personne dans un rayon d\'environ 150 km autour de Drummondville. Pour un projet en dehors de ce rayon, une soumission spéciale peut être discutée.',
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AteliersPage() {
  return (
    <main className="text-slate-100">

      {/* ── HÉROS ── */}
      <section className="relative overflow-hidden px-6 py-16 md:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 10% 12%, rgba(96,165,250,0.12), transparent 26%),' +
              'radial-gradient(circle at 86% 8%, rgba(139,92,246,0.1), transparent 22%)',
          }}
        />
        <div className="mx-auto max-w-5xl">
          <span className="brand-chip inline-block">Ateliers de création musicale avec l&apos;IA</span>
          <h1 className="brand-metal-text mt-5 font-display text-5xl leading-[0.95] md:text-7xl">
            Un atelier vivant, humain et accessible pour tous
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
            Animés en personne par Nowis Morin, les ateliers de création musicale avec l&apos;IA invitent chaque groupe à créer une chanson à partir de ses propres émotions, souvenirs et idées — et à repartir avec une vidéo souvenir téléchargeable.
          </p>
          <p className="mt-3 max-w-2xl text-base leading-8 text-slate-300">
            Tous les âges, tous les milieux. Adaptable en durée, en formule et en intention.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/ateliers/demande"
              className="rounded-xl bg-brand-warm px-7 py-4 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Demander un atelier
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-white/15 bg-white/5 px-7 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              Poser une question
            </Link>
          </div>
        </div>
      </section>

      {/* ── MILIEUX VISÉS ── */}
      <section className="bg-steel-950/50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Pour qui</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
              Un atelier fait pour plusieurs milieux
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              L&apos;atelier s&apos;adapte au groupe, à l&apos;âge, au contexte et aux objectifs. Il n&apos;y a pas deux ateliers identiques.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {milieux.map((m) => (
              <article
                key={m.label}
                className="rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-[rgba(14,20,44,0.78)] to-[rgba(9,14,28,0.65)] p-5 backdrop-blur-sm transition hover:border-white/20"
              >
                <span className="text-2xl" role="img" aria-hidden="true">{m.icon}</span>
                <h3 className="mt-3 font-semibold text-white">{m.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{m.desc}</p>
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
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
              L&apos;IA comme outil, pas comme remplacement
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-slate-300">
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
              <h3 className="mt-4 font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{card.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── DÉROULEMENT ── */}
      <section className="bg-steel-950/50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Déroulement</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
              Comment se déroule un atelier
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Environ 90 minutes de création collective, guidée du début à la fin par Nowis Morin.
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
                  <h3 className="font-semibold text-white">{e.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{e.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── RÉSULTATS ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="rounded-[2.5rem] border border-amber-400/20 p-8 md:p-12" style={{ background: 'linear-gradient(145deg, rgba(55,32,0,0.35) 0%, rgba(100,60,0,0.20) 60%, rgba(18,12,0,0.28) 100%)' }}>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Ce que le groupe repart avec</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
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
      <section className="bg-steel-950/50 px-6 py-12 md:py-16">
        <div className="mx-auto max-w-5xl grid gap-4 md:grid-cols-2">
          <div className="rounded-[2rem] border border-primary-400/20 bg-primary-500/[0.07] p-7">
            <span className="text-3xl" role="img" aria-hidden="true">⏱️</span>
            <h3 className="mt-4 font-display text-2xl text-white">Durée adaptable</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              La durée habituelle est d&apos;environ <strong className="text-white">90 minutes</strong>. Des formules plus courtes ou plus longues sont possibles selon le groupe, le milieu et les objectifs visés.
            </p>
          </div>
          <div className="rounded-[2rem] border border-emerald-400/15 bg-emerald-500/[0.06] p-7">
            <span className="text-3xl" role="img" aria-hidden="true">📍</span>
            <h3 className="mt-4 font-display text-2xl text-white">Rayon de déplacement</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Les ateliers sont animés en personne dans un rayon d&apos;environ <strong className="text-white">150 km autour de Drummondville</strong>. Pour un projet en dehors de cette zone, une soumission spéciale peut être discutée.
            </p>
          </div>
        </div>
      </section>

      {/* ── TARIFICATION ── */}
      <section className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-center md:p-10">
          <span className="text-3xl" role="img" aria-hidden="true">💬</span>
          <h2 className="mt-4 font-display text-3xl text-white md:text-4xl">Tarification sur soumission</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300">
            Le coût d&apos;un atelier dépend de la durée, du nombre de participants, des besoins spécifiques et du déplacement. Écrivez-nous pour obtenir une soumission claire, sans surprise.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex rounded-xl bg-brand-warm px-7 py-3.5 font-semibold text-white shadow-fire transition hover:brightness-110"
          >
            Demander une soumission
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-steel-950/50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Questions fréquentes</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-white md:text-5xl">
            On répond à vos questions
          </h2>
          <div className="mt-10 space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-6 py-5 transition hover:border-white/20"
              >
                <summary className="cursor-pointer list-none font-semibold text-white group-open:text-primary-200">
                  <span className="flex items-start justify-between gap-4">
                    {item.q}
                    <span className="mt-0.5 shrink-0 text-slate-400 transition group-open:rotate-180">▾</span>
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-slate-300">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── ATELIER CREATIF LINK ── */}
      <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="rounded-[2.5rem] border border-primary-400/20 bg-[linear-gradient(145deg,rgba(14,20,44,0.92),rgba(22,30,60,0.86))] p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-300">Atelier spécifique</p>
              <h2 className="mt-3 font-display text-3xl leading-[1.05] text-white md:text-4xl">
                Atelier de création musicale avec l&apos;IA
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Découvrez la page dédiée à notre atelier phare, avec tous les détails sur le contenu, les objectifs et les modalités.
              </p>
            </div>
            <Link
              href="/ateliers/atelier-creatif"
              className="shrink-0 rounded-xl border border-primary-400/30 bg-primary-500/10 px-7 py-3.5 font-semibold text-white transition hover:bg-primary-500/20"
            >
              Voir la page complète →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-6 py-16 md:py-24">
        <div
          className="mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-primary-400/20 p-10 text-center md:p-16"
          style={{ background: 'linear-gradient(145deg, rgba(8,14,38,0.97) 0%, rgba(16,26,62,0.93) 100%)' }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-300">Prêt à vous lancer</p>
          <h2 className="mt-5 font-display text-4xl leading-[1.03] text-white md:text-5xl">
            Offrir un atelier différent, humain et actuel
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300">
            Pour un atelier unique dans votre milieu, prenez contact avec Nowis Morin. On discutera ensemble du format, du groupe et des objectifs — et vous obtiendrez une soumission claire.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ateliers/demande"
              className="rounded-xl bg-brand-warm px-9 py-4 font-semibold text-white shadow-fire transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Demander un atelier
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-white/15 bg-white/5 px-9 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              Poser une question
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
