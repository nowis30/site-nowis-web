import { PageHero } from '@/components/marketing/PageHero';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'À propos — Nowis Morin | Artiste, créateur et approche IA au Québec',
  description:
    'Découvre qui est Nowis Morin, sa vision artistique, sa manière d’utiliser l’intelligence artificielle et ce qu’il peut créer pour les particuliers et les entreprises.',
  path: '/a-propos',
  keywords: ['Nowis Morin', 'à propos Nowis Morin', 'artiste IA Québec'],
});

export default function AProposPage() {
  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="À propos"
        title="Nowis Morin : une approche créative, humaine et résolument tournée vers l’avenir"
        description="Je crée des chansons, vidéos, visuels et concepts artistiques avec l’aide de l’intelligence artificielle. Mon objectif n’est pas de remplacer la sensibilité humaine, mais de l’amplifier pour produire des créations plus fortes, plus rapides et plus mémorables."
        primaryCta={{ label: 'Découvrir ma musique', href: '/musique' }}
        secondaryCta={{ label: 'Me contacter', href: '/contact' }}
      />

      <section className="mx-auto max-w-7xl space-y-10 px-6 py-16 md:py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Qui je suis</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Je suis Nowis Morin, artiste et créateur basé au Québec. Mon travail s’appuie sur une direction artistique claire : prendre une idée, une émotion ou un message, puis le transformer en chanson, vidéo ou concept visuel capable de toucher, surprendre et marquer.
            </p>
          </article>
          <article className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Comment j’utilise l’IA</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              L’IA fait partie de mon atelier créatif. Elle m’aide à explorer plus vite, à tester différentes directions et à produire des bases solides. Ensuite, je sélectionne, affine, assemble et dirige le rendu final pour qu’il reste cohérent, crédible et aligné avec l’intention du projet.
            </p>
          </article>
          <article className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Pourquoi je fais ça</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Parce que la création peut devenir un véritable levier d’émotion, d’identité et de visibilité. J’aime l’idée de rendre possible des projets qui, autrement, resteraient seulement dans l’imagination. Avec la bonne méthode, une idée simple peut devenir une œuvre forte.
            </p>
          </article>
          <article className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
            <h2 className="text-2xl font-bold">Ce que je peux offrir</h2>
            <p className="mt-4 leading-relaxed text-slate-300">
              Des chansons personnalisées, des vidéos créatives, des visuels, des concepts marketing et des collaborations artistiques. Que tu sois un artiste, une entreprise, une famille ou une personne avec une idée précise, Nowis Morin peut transformer ton projet en création concrète et mémorable.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
