'use client';

import { useId, useMemo, useState } from 'react';
import { SongCard, type LibrarySong } from './SongCard';

const PAGE_SIZE = 12;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-CA');

export function MusicLibrary({ songs }: { songs: LibrarySong[] }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const filtered = useMemo(() => {
    const words = normalize(query).trim().split(/\s+/).filter(Boolean);
    return songs.filter((song) => {
      const text = normalize(`${song.title} ${song.shortDescription}`);
      return words.every((word) => text.includes(word)) && (platform === 'all' || (platform === 'youtube' ? Boolean(song.youtubeUrl) : Boolean(song.spotifyUrl)));
    });
  }, [songs, query, platform]);
  const shown = Math.min(limit, filtered.length);

  return (
    <div className="mt-8">
      <div className="brand-card grid gap-4 p-5 md:grid-cols-[2fr_1fr_auto] md:items-end">
        <div>
          <label htmlFor={`${id}-search`} className="block text-sm font-semibold">Rechercher une chanson</label>
          <input id={`${id}-search`} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(PAGE_SIZE); }} placeholder="Titre ou mot dans la description" className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-[color:var(--site-border)] bg-white px-4 text-base" aria-controls={`${id}-results`} />
        </div>
        <div>
          <label htmlFor={`${id}-platform`} className="block text-sm font-semibold">Plateforme d’écoute</label>
          <select id={`${id}-platform`} value={platform} onChange={(event) => { setPlatform(event.target.value); setLimit(PAGE_SIZE); }} className="mt-2 min-h-12 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 text-base" aria-controls={`${id}-results`}>
            <option value="all">Toutes les plateformes</option><option value="youtube">YouTube</option><option value="spotify">Spotify</option>
          </select>
        </div>
        <button type="button" className="cta-secondary min-h-12 px-4 py-3" onClick={() => { setQuery(''); setPlatform('all'); setLimit(PAGE_SIZE); }}>Réinitialiser</button>
      </div>
      <p role="status" className="mt-5 text-sm text-[color:var(--site-muted)]">{filtered.length} chanson{filtered.length === 1 ? '' : 's'} trouvée{filtered.length === 1 ? '' : 's'} · {shown} affichée{shown === 1 ? '' : 's'}</p>
      <div id={`${id}-results`} className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.slice(0, limit).map((song) => <SongCard key={song.slug} song={song} />)}
      </div>
      {!filtered.length && <p className="brand-card mt-5 p-6">Aucune chanson ne correspond à votre recherche. Essayez un autre mot ou réinitialisez les filtres.</p>}
      {shown < filtered.length && <button type="button" className="cta-primary mx-auto mt-8 flex min-h-12 px-6 py-3" onClick={() => setLimit((value) => value + PAGE_SIZE)}>Afficher {Math.min(PAGE_SIZE, filtered.length - shown)} chansons supplémentaires</button>}
    </div>
  );
}
