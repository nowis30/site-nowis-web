import { PageHero } from '@/components/marketing/PageHero';
import { VideoCard } from '@/components/videos/VideoCard';
import { getAllVideos } from '@/data/videos';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Vidéos IA | Création Nowis',
  description:
    'Découvre les options visuelles et vidéos IA de Création Nowis, pensées comme compléments créatifs autour des chansons et projets musicaux.',
  path: '/videos',
  keywords: ['vidéo IA Québec', 'capsule vidéo chanson', 'visuel chanson', 'Création Nowis vidéos'],
});

export default async function VideosPage() {
  const videos = await getAllVideos();

  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Vidéos"
        title="Des options visuelles et vidéos IA pour accompagner une chanson"
        description="Cette section présente les vidéos et formats visuels comme compléments créatifs autour de la musique, et non comme le service principal."
        primaryCta={{ label: 'Commander une chanson', href: '/commander-une-chanson' }}
        secondaryCta={{ label: 'Parler de mon projet', href: '/contact?projectType=video&message=Bonjour, je veux discuter d’une option visuelle ou vidéo IA pour accompagner une chanson.' }}
      />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Des compléments visuels pour prolonger l’émotion d’une chanson</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Les vidéos présentées ici servent à montrer la couleur visuelle possible autour d’un projet musical. Elles peuvent accompagner une chanson, une sortie ou un souvenir, sans prendre la place de l’offre principale.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <VideoCard key={video.slug} {...video} />
          ))}
        </div>
      </section>
    </div>
  );
}
