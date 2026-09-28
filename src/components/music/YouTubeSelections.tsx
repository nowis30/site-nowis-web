import type { Song } from '@/data/songs';
import { getYouTubeSelections, youtubeSelectionSnapshot } from '@/data/youtubeSelections';
import { SongCard } from './SongCard';

export function YouTubeSelections({ songs }: { songs: Song[] }) {
  const { latest, popular } = getYouTubeSelections(songs);
  const verifiedDate = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(youtubeSelectionSnapshot.verifiedAt));
  const sections = [
    { id: 'dernieres-chansons', title: 'Mes 10 dernières chansons', description: 'Les nouveautés de ma chaîne YouTube, de la plus récente à la plus ancienne.', items: latest, popular: false },
    { id: 'chansons-populaires', title: 'Mes 10 chansons les plus populaires sur YouTube', description: 'Les chansons qui cumulent le plus de vues sur ma chaîne.', items: popular, popular: true },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:px-6 md:py-14">
      <nav aria-label="Sélections musicales" className="flex flex-wrap gap-3">
        <a href="#dernieres-chansons" className="cta-primary min-h-12 px-5 py-3">Les 10 dernières</a>
        <a href="#chansons-populaires" className="cta-secondary min-h-12 px-5 py-3">Les 10 plus populaires</a>
      </nav>
      {sections.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-32">
          <h2 id={`${section.id}-title`} className="font-display text-3xl leading-tight text-[color:var(--site-heading)] md:text-4xl">{section.title}</h2>
          <p className="mt-3 max-w-3xl leading-7 text-[color:var(--site-muted)]">{section.description}</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {section.items.map(({ song, viewCount }, index) => (
              <div key={song.youtubeVideoId} className="min-w-0">
                <p className="mb-2 text-sm font-semibold text-[color:var(--site-accent-strong)]">Nº {index + 1}{section.popular ? ` · ${viewCount.toLocaleString('fr-CA')} vues sur YouTube` : ''}</p>
                <SongCard song={song} compact />
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="text-sm leading-6 text-[color:var(--site-muted)]">Sélections et nombres de vues vérifiés le <time dateTime={youtubeSelectionSnapshot.verifiedAt}>{verifiedDate}</time>. Les compteurs peuvent évoluer sur <a className="font-semibold underline" href={youtubeSelectionSnapshot.channelUrl} target="_blank" rel="noopener noreferrer">la chaîne YouTube de Nowis Morin (nouvel onglet)</a>.</p>
    </div>
  );
}
