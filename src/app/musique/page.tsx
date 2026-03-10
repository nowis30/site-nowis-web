import { SongCard } from '@/components/music/SongCard';
import { PageHero } from '@/components/marketing/PageHero';
import { getAllSongs } from '@/data/songs';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Musique — Nowis Morin | Chansons IA, créations musicales et univers artistique',
  description:
    'Découvre la musique de Nowis Morin : chansons originales, projets artistiques assistés par intelligence artificielle et créations musicales conçues au Québec.',
  path: '/musique',
  keywords: ['Nowis Morin', 'musique Nowis Morin', 'Nowis Morin chanson', 'chanson IA Québec', 'artiste musique IA Québec'],
});

export default async function MusiquePage() {
  const songs = await getAllSongs();

  return (
    <div className="bg-slate-50">
      <PageHero
        eyebrow="Musique"
        title="Les chansons de Nowis Morin : une direction artistique humaine, amplifiée par l’IA"
        description="Cette page rassemble les chansons, ma démarche créative et l’univers musical Nowis Morin. Chaque morceau dispose d’une page dédiée, pensée pour l’écoute, le référencement et la découverte de mon travail."
        primaryCta={{ label: 'Me contacter', href: '/contact' }}
        secondaryCta={{ label: 'Voir les vidéos', href: '/videos' }}
      />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Les créations musicales de Nowis Morin</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Cette page est alimentée par un catalogue synchronisé depuis YouTube et Spotify. Chaque chanson affiche uniquement les données réellement récupérées, avec une correspondance Spotify ajoutée seulement lorsqu’elle est certaine.
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
