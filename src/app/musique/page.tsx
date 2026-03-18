import { SongCard } from '@/components/music/SongCard';
import { PageHero } from '@/components/marketing/PageHero';
import { getAllSongs } from '@/data/songs';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Musique | Création Nowis',
  description:
    'Écoute des exemples de chansons de Création Nowis pour découvrir le ton, l’émotion et la qualité des créations musicales personnalisées.',
  path: '/musique',
  keywords: ['musique Création Nowis', 'exemples chansons personnalisées', 'Nowis Morin musique', 'chansons Québec'],
});

export default async function MusiquePage() {
  const songs = await getAllSongs();

  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Musique"
        title="Des exemples pour entendre le style des chansons Création Nowis"
        description="Cette page rassemble les chansons publiées pour te permettre d’écouter des exemples concrets avant de commander une création sur mesure."
        primaryCta={{ label: 'Commander une chanson', href: '/commander-une-chanson' }}
        secondaryCta={{ label: 'Voir les vidéos', href: '/videos' }}
      />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Les créations musicales de Nowis Morin</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Ces chansons servent d’exemples d’écoute. Elles montrent la direction émotionnelle, la couleur musicale et l’approche générale avant de passer à une demande personnalisée.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {songs.map((song) => (
            <SongCard key={song.slug} song={song} />
          ))}
        </div>
      </section>
    </div>
  );
}
