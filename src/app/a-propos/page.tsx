import Image from 'next/image';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { SONG_REQUEST_GOOGLE_AUTH_URL } from '@/lib/client-portal-routes';

export const metadata = buildMetadata({
  title: 'À propos de Nowis Morin | Création Nowis à Drummondville',
  description:
    'Découvrez Nowis Morin, créateur de Création Nowis à Drummondville : ateliers de création musicale avec IA, chansons personnalisées et accompagnement humain partout au Québec.',
  path: '/a-propos',
  image: '/hero.jpg',
  keywords: ['Nowis Morin', 'Création Nowis Drummondville', 'artiste IA Québec', 'ateliers création musicale avec IA'],
});

export default function AProposPage() {
  return (
    <main className="text-[color:var(--site-text)]">

      {/* ── HÉROS ── */}
      <section className="relative overflow-hidden px-6 py-16 md:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 12% 10%, rgba(184,111,61,0.12), transparent 26%),' +
              'radial-gradient(circle at 85% 8%, rgba(203,165,120,0.16), transparent 22%)',
          }}
        />
        <div className="mx-auto max-w-6xl">
          <div className="relative mx-auto mb-10 max-w-4xl">
            <div className="overflow-hidden rounded-[2rem] border border-primary-200/20 shadow-card">
              <div className="relative aspect-[16/9] sm:aspect-[3/2] md:aspect-[5/3]">
                <Image
                  src="/hero.jpg"
                  alt="Portrait de Nowis Morin, créateur de Création Nowis et animateur d ateliers IA"
                  fill
                  className="brightness-[0.78] contrast-[1.04]"
                  style={{ objectFit: 'cover', objectPosition: '50% 28%' }}
                  priority
                />
                <div className="pointer-events-none absolute inset-0 hero-overlay-warm" />
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-4xl">
          <div>
            <span className="brand-chip inline-block">À propos</span>
            <h1 className="brand-metal-text mt-5 font-display text-5xl leading-[0.95] md:text-7xl">
              Nowis Morin — Créateur, animateur, artiste
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--site-muted)]">
              Je suis Nowis Morin, créateur derrière Création Nowis. J&apos;anime des ateliers de création musicale
              avec l&apos;IA, je crée des chansons personnalisées et j&apos;explore les territoires où la sensibilité
              humaine et la technologie se rencontrent vraiment.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/ateliers"
                className="cta-primary px-7 py-4"
              >
                Découvrir les ateliers
              </Link>
              <Link
                href="/contact"
                className="cta-secondary px-7 py-4"
              >
                Me contacter
              </Link>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ── QUI JE SUIS ── */}
      <section className="section-soft px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Mon histoire</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
            Qui je suis, et ce qui me drive
          </h2>
          <div className="mt-8 grid gap-6 text-base leading-8 text-[color:var(--site-muted)] lg:grid-cols-2">
            <div className="space-y-5">
              <p>
                Je m&apos;appelle Nowis Morin. Je suis artiste, musicien et passionné de création sous toutes ses formes. Mon univers, c&apos;est la musique — mais pas seulement. C&apos;est aussi l&apos;expression, la transmission, l&apos;idée que la création peut <strong className="text-[color:var(--site-heading)]">vraiment toucher les gens</strong>.
              </p>
              <p>
                Ce qui m&apos;a amené à créer Création Nowis, c&apos;est un désir simple : rendre la création musicale <strong className="text-[color:var(--site-heading)]">accessible, vivante et signifiante</strong> — pas juste pour les artistes professionals, mais pour chaque personne qui a quelque chose à exprimer ou à vivre collectivement.
              </p>
            </div>
            <div className="space-y-5">
              <p>
                J&apos;anime chaque atelier moi-même, en personne. Parce que la présence, l&apos;écoute et la connexion humaine font partie du résultat. Ce n&apos;est pas que de la technologie — c&apos;est <strong className="text-[color:var(--site-heading)]">une expérience</strong>.
              </p>
              <p>
                Je crée aussi des chansons personnalisées pour des moments qui comptent : anniversaires, mariages, hommages, projets artistiques. Des créations sur mesure, nourries par les émotions et les mots des gens qui les commandent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MON RAPPORT À L'IA ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Pourquoi l&apos;IA</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
              L&apos;IA est un outil. Le reste, c&apos;est humain.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-[color:var(--site-muted)]">
              <p>
                Je suis fasciné par l&apos;intelligence artificielle depuis que j&apos;ai commencé à y voir ce qu&apos;elle peut vraiment faire : <strong className="text-[color:var(--site-heading)]">amplifier la créativité</strong> plutôt que la remplacer. L&apos;IA est un outil puissant. Mais c&apos;est toujours l&apos;humain qui décide de l&apos;intention, du ton, de l&apos;émotion et du résultat final.
              </p>
              <p>
                Dans mes ateliers, je ne montre pas l&apos;IA comme quelque chose d&apos;intimidant. Je la montre comme quelque chose qu&apos;on peut apprendre à utiliser — <strong className="text-[color:var(--site-heading)]">ici, maintenant, concrètement</strong> — pour créer quelque chose de beau.
              </p>
              <p>
                Ma conviction, c&apos;est que comprendre l&apos;IA, c&apos;est important. Et l&apos;apprendre par la musique, c&apos;est une façon de le faire qui reste avec les gens.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { icon: '🎯', title: 'La direction reste humaine', desc: 'L\'IA ne choisit pas l\'émotion, le ton, le message. C\'est toujours le créateur ou le groupe qui décide.' },
              { icon: '⚡', title: 'Plus rapide, plus riche', desc: 'Avec l\'IA comme outil, on peut explorer plus d\'idées, tester plus de directions et aboutir à un résultat plus fort.' },
              { icon: '🌱', title: 'Apprendre en créant', desc: 'La meilleure façon de comprendre l\'IA, c\'est de l\'utiliser pour créer quelque chose qui compte vraiment pour soi.' },
            ].map((card) => (
              <article key={card.title} className="brand-card flex gap-4 p-5">
                <span className="shrink-0 text-2xl" role="img" aria-hidden="true">{card.icon}</span>
                <div>
                  <h3 className="font-semibold text-[color:var(--site-heading)]">{card.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--site-muted)]">{card.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CE QUE JE FAIS ── */}
      <section className="section-warm px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Mes activités</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
            Ce que je fais concrètement
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: '🎵',
                title: 'Ateliers de création musicale',
                desc: 'J\'anime des ateliers en personne, adaptés à tous les âges et tous les milieux. Le groupe crée ensemble une chanson et repart avec une vidéo souvenir.',
                href: '/ateliers',
                cta: 'Voir les ateliers',
                featured: true,
              },
              {
                icon: '🎼',
                title: 'Chansons personnalisées',
                desc: 'Je crée des chansons sur mesure pour des occasions importantes : anniversaires, mariages, hommages, projets artistiques et plus encore.',
                href: SONG_REQUEST_GOOGLE_AUTH_URL,
                cta: 'Commander une chanson',
                featured: false,
              },
              {
                icon: '🎬',
                title: 'Contenus artistiques',
                desc: 'Vidéos musicales, créations visuelles, jeux interactifs et contenu artistique selon vos besoins créatifs.',
                href: '/autres-services',
                cta: 'Autres services',
                featured: false,
              },
            ].map((item) => (
              <article
                key={item.title}
                className={`flex flex-col p-7 transition hover:-translate-y-1 ${
                  item.featured
                    ? 'glass-panel-strong shadow-fire'
                    : 'brand-card'
                }`}
              >
                <span className="text-3xl" role="img" aria-hidden="true">{item.icon}</span>
                <h3 className="mt-4 font-display text-2xl text-[color:var(--site-heading)]">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-[color:var(--site-muted)]">{item.desc}</p>
                <Link
                  href={item.href}
                  className={`mt-5 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
                    item.featured
                      ? 'cta-primary'
                      : 'cta-secondary'
                  }`}
                >
                  {item.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALEURS ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-400">Mes valeurs</p>
        <h2 className="mt-4 font-display text-4xl leading-[1.05] text-[color:var(--site-heading)] md:text-5xl">
          Ce qui guide ma démarche
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: '🤝', title: 'L\'humain d\'abord', desc: 'La technologie est au service des personnes — jamais l\'inverse. Chaque atelier, chaque création part d\'un besoin humain réel.' },
            { icon: '✨', title: 'La qualité du moment', desc: 'Un atelier réussi, c\'est un moment où les gens ont vraiment vécu quelque chose. Pas juste assisté à quelque chose.' },
            { icon: '🎓', title: 'Apprendre en faisant', desc: 'On n\'apprend pas l\'IA en regardant des présentations. On l\'apprend en l\'utilisant pour créer quelque chose qui compte.' },
            { icon: '🌱', title: 'Accessibilité', desc: 'Ce n\'est pas réservé aux experts. Mes ateliers s\'adressent à tous — aucune compétence préalable n\'est nécessaire.' },
            { icon: '🎨', title: 'Authenticité artistique', desc: 'Je ne produis pas à la chaîne. Chaque création, chaque atelier est pensé pour être vrai, unique et porteur de sens.' },
            { icon: '📍', title: 'Ancrage local', desc: 'Je suis basé à Drummondville et je me déplace partout au Québec. La proximité fait partie de ma démarche.' },
          ].map((val) => (
            <article key={val.title} className="brand-card p-6">
              <span className="text-2xl" role="img" aria-hidden="true">{val.icon}</span>
              <h3 className="mt-4 font-semibold text-[color:var(--site-heading)]">{val.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">{val.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-16 md:py-24">
        <div className="warm-cta-panel mx-auto max-w-4xl p-10 text-center md:p-16">
          <h2 className="font-display text-4xl leading-[1.03] text-[color:var(--site-heading)] md:text-5xl">
            On travaille ensemble ?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-[color:var(--site-muted)]">
            Pour un atelier, une chanson personnalisée ou simplement pour discuter d&apos;un projet, je suis disponible et j&apos;aime les échanges directs.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ateliers"
              className="cta-primary px-9 py-4"
            >
              Découvrir les ateliers
            </Link>
            <Link
              href="/contact"
              className="cta-secondary px-9 py-4"
            >
              Me contacter
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
