import Link from 'next/link';
import { PageHero } from '@/components/marketing/PageHero';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Idées créatives — Nowis Morin',
  description:
    'Des idées concrètes signées Nowis Morin pour transformer une émotion, une promotion ou un projet en création mémorable.',
  path: '/idees',
  keywords: ['idées créatives', 'idées chansons à offrir', 'idées vidéos entreprise', 'IA pour présenter un projet'],
});

const songIdeas = [
  'Une chanson surprise pour raconter l’histoire d’un couple.',
  'Un cadeau d’anniversaire qui transforme les souvenirs en refrain.',
  'Une chanson hommage pour remercier un parent ou un grand-parent.',
  'Un texte musical pour souligner une naissance ou une nouvelle étape de vie.',
  'Une chanson de retrouvailles pour une famille séparée par la distance.',
  'Un message d’amour simple et vrai pour une demande spéciale.',
  'Une chanson humoristique à offrir lors d’une fête entre amis.',
  'Un souvenir musical pour un mariage ou un anniversaire de mariage.',
  'Une chanson motivante pour quelqu’un qui traverse un grand changement.',
  'Un thème musical personnel pour un projet ou une identité artistique.',
];

const videoIdeas = [
  'Une vidéo courte pour annoncer un nouveau service.',
  'Un teaser humain pour montrer les coulisses d’une entreprise.',
  'Une pub vidéo simple pour les réseaux sociaux avec message clair.',
  'Une capsule avant / après pour valoriser un résultat concret.',
  'Une vidéo témoignage mise en scène de façon plus dynamique.',
  'Un format vertical pour Instagram ou Facebook qui attire en quelques secondes.',
  'Une vidéo de présentation pour une page d’atterrissage ou une campagne.',
  'Un concept drôle ou surprenant pour donner plus de personnalité à une marque.',
  'Une série de micro-vidéos pour nourrir un calendrier de contenu.',
  'Une vidéo promo pour lancer un produit, un événement ou une collaboration.',
];

const aiIdeas = [
  'Créer une page web plus claire pour présenter une idée sans perdre le visiteur.',
  'Transformer un texte complexe en visuel simple et plus convaincant.',
  'Utiliser l’IA pour générer plusieurs angles de présentation avant de choisir le meilleur.',
  'Bâtir un concept interactif qui explique un projet au lieu de juste le décrire.',
  'Créer une identité visuelle cohérente plus vite pour une nouvelle offre.',
  'Préparer des contenus courts qui résument un projet sur plusieurs plateformes.',
  'Créer une maquette ou un prototype avant d’investir plus loin.',
  'Donner une ambiance plus forte à une présentation, une vidéo ou une page d’atterrissage.',
  'Trouver un ton plus humain pour parler d’une offre ou d’une mission.',
  'Utiliser l’IA comme atelier d’idées pour lancer plus vite un projet concret.',
];

interface IdeasSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  items: string[];
}

function IdeasSection({ id, eyebrow, title, intro, items }: IdeasSectionProps) {
  const headingId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={headingId} className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">
          {eyebrow}
        </p>
        <h2 id={headingId} className="mt-3 font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-base leading-8 text-[color:var(--site-muted)] sm:text-lg">{intro}</p>
      </div>

      <ol className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <li
            key={item}
            className="brand-card rounded-[1.5rem] p-5 motion-safe:transition motion-safe:hover:-translate-y-1 sm:p-6"
          >
            <span
              className="inline-flex min-h-8 items-center rounded-full bg-[color:var(--site-accent-soft)] px-3 text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--site-accent-strong)]"
              aria-hidden="true"
            >
              Idée {index + 1}
            </span>
            <p className="mt-4 text-base leading-7 text-[color:var(--site-text)]">{item}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const contactMessage = encodeURIComponent(
  'Je veux transformer une idée créative en projet concret. Voici ce que j’ai en tête.',
);

export default function IdeesPage() {
  return (
    <div className="section-soft text-[color:var(--site-text)]">
      <PageHero
        eyebrow="Idées créatives"
        title="30 pistes concrètes pour déclencher le bon projet"
        description="Chanson, vidéo ou IA : parcourez des idées simples à comprendre, puis adaptez celle qui correspond le mieux à votre objectif."
      />

      <IdeasSection
        id="chansons"
        eyebrow="Émotion et souvenirs"
        title="10 idées de chansons à offrir"
        intro="Des formats faciles à personnaliser et forts en émotion pour offrir autre chose qu’un cadeau oublié trop vite."
        items={songIdeas}
      />

      <div className="border-y border-[color:var(--site-border)]/70 bg-white/45">
        <IdeasSection
          id="videos"
          eyebrow="Visibilité et narration"
          title="10 idées de vidéos pour entreprises ou réseaux sociaux"
          intro="Des concepts humains et adaptables pour présenter une offre, une entreprise ou un message sans surcharger l’audience."
          items={videoIdeas}
        />
      </div>

      <IdeasSection
        id="ia"
        eyebrow="Clarté et prototypage"
        title="10 façons d’utiliser l’IA pour présenter un projet"
        intro="L’IA devient surtout utile lorsqu’elle aide à clarifier, tester et accélérer une idée avant d’investir plus loin."
        items={aiIdeas}
      />

      <section className="mx-auto max-w-5xl px-4 pb-16 pt-4 sm:px-6 md:pb-20" aria-labelledby="ideas-cta-title">
        <div className="warm-cta-panel px-6 py-9 sm:px-8 md:px-12 md:py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-accent-strong)]">
            Passer de l’idée au projet
          </p>
          <h2 id="ideas-cta-title" className="mt-3 font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">
            Une piste vous parle? Donnons-lui une forme concrète.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--site-muted)] sm:text-lg">
            Décrivez le résultat souhaité, le public visé et ce que vous avez déjà. Je pourrai ensuite vous orienter vers le format le plus pertinent.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/contact?message=${contactMessage}`}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[color:var(--site-accent-strong)] px-6 py-3 text-base font-semibold text-white shadow-sm motion-safe:transition motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/50 focus-visible:ring-offset-2 sm:w-auto"
            >
              Parler de mon idée
            </Link>
            <Link
              href="/avant-de-mecrire"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[color:var(--site-border)] bg-white/75 px-6 py-3 text-base font-semibold text-[color:var(--site-heading)] motion-safe:transition motion-safe:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40 sm:w-auto"
            >
              Préparer ma demande
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
