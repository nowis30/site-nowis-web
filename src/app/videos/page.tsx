import { PageHero } from '@/components/marketing/PageHero';
import { VideoCard } from '@/components/videos/VideoCard';
import { getAllVideos } from '@/data/videos';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Vidéos — Nowis Morin | Clips, concepts visuels et créations IA',
  description:
    'Explore les vidéos et concepts visuels de Nowis Morin : clips créatifs, présentations artistiques et formats conçus pour YouTube et les réseaux sociaux.',
  path: '/videos',
  keywords: ['Nowis Morin', 'vidéos Nowis Morin', 'clip IA Québec', 'création vidéo IA'],
});

export default async function VideosPage() {
  const videos = await getAllVideos();

  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Vidéos"
        title="Les vidéos de Nowis Morin : une extension visuelle de l’univers musical et créatif"
        description="Cette section regroupe les vidéos YouTube, clips et concepts visuels conçus pour mettre en valeur des chansons, une identité artistique ou une idée de marque."
        primaryCta={{ label: 'Voir la musique', href: '/musique' }}
        secondaryCta={{ label: 'Me contacter', href: '/contact' }}
      />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Une structure simple pour faire grandir la section vidéo</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Les vidéos sont centralisées dans un fichier de données, ce qui te permet d’ajouter facilement de nouvelles pièces sans refaire les pages. Chaque carte est optimisée pour la lisibilité, le mobile et la conversion vers YouTube ou le contact direct.
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
