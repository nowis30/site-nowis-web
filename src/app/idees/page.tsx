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
  'Donner une ambiance plus forte à une présentation, une vidéo ou une landing page.',
  'Trouver un ton plus humain pour parler d’une offre ou d’une mission.',
  'Utiliser l’IA comme atelier d’idées pour lancer plus vite un projet concret.',
];

function IdeasSection({ title, intro, items }: { title: string; intro: string; items: string[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">{title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">{intro}</p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <article key={item} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Idée {index + 1}</p>
            <p className="mt-3 leading-7 text-slate-700">{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function IdeesPage() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <PageHero
        eyebrow="Idées créatives"
        title="Idées créatives signées Nowis Morin"
        description="Des idées concrètes pour transformer une émotion, une promotion ou un projet en création mémorable."
      />

      <IdeasSection
        title="10 idées de chansons à offrir"
        intro="Des formats simples à comprendre et forts en émotion pour offrir autre chose qu’un cadeau oublié trop vite."
        items={songIdeas}
      />

      <IdeasSection
        title="10 idées de vidéos pour entreprises ou réseaux sociaux"
        intro="Des idées humaines, visibles et faciles à adapter pour mieux présenter une offre, une entreprise ou un message."
        items={videoIdeas}
      />

      <IdeasSection
        title="10 façons d’utiliser l’IA pour présenter un projet"
        intro="L’IA peut servir de vrai levier de clarté, de vitesse et de créativité quand elle est utilisée avec une bonne direction."
        items={aiIdeas}
      />

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="rounded-3xl bg-[linear-gradient(135deg,#0f172a_0%,#111827_45%,#065f46_100%)] px-8 py-10 text-white shadow-sm md:px-12 md:py-14">
          <h2 className="text-3xl font-bold md:text-4xl">Tu veux que je crée ça pour toi?</h2>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-200">
            Si une de ces idées te parle, je peux t’aider à la transformer en projet concret, plus clair, plus fort et plus utile pour ton objectif.
          </p>
          <Link
            href="/contact?message=Je%20veux%20transformer%20une%20idee%20creative%20en%20projet%20concret.%20Voici%20ce%20que%20j%27ai%20en%20tete."
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Tu veux que je crée ça pour toi?
          </Link>
        </div>
      </section>
    </div>
  );
}
