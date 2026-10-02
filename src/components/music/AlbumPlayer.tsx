'use client';

import { Pause, Play, SkipForward } from 'lucide-react';
import { useRadio } from '@/components/radio/RadioProvider';
import { albumRelease, albumTracks, nounoursTrack } from '@/data/album';

const ids = albumTracks.map(track => track.id);

export function AlbumListenButton({ nounours = false }: { nounours?: boolean }) {
  const radio = useRadio();
  const albumSelected = radio.isSelection && radio.selectionLabel === albumRelease.title
    && ids.includes(radio.selectedTrack?.id ?? '');
  const canResume = albumSelected && (!nounours || radio.selectedTrack?.id === nounoursTrack.id);
  const playbackActive = canResume && (radio.playing || radio.loading);
  const label = playbackActive ? nounours ? 'Pause · Le gros nounours' : 'Mettre l’album en pause'
    : canResume ? nounours ? 'Reprendre Le gros nounours' : 'Reprendre l’album'
    : nounours ? 'Écouter Le gros nounours' : 'Écouter l’album ici';
  return <button type="button" className={nounours ? 'na-button na-button-outline' : 'na-button na-button-primary'}
    onClick={() => canResume ? radio.toggle() : radio.playSelection(ids, { label: albumRelease.title, ...(nounours ? { startId: nounoursTrack.id } : {}) })}>
    {playbackActive ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}{label}
  </button>;
}

export function AlbumPlayer() {
  const radio = useRadio();
  const currentTrack = albumTracks.find(track => track.id === radio.selectedTrack?.id);
  const albumSelected = radio.isSelection && radio.selectionLabel === albumRelease.title;
  const active = Boolean(currentTrack && albumSelected);
  const playbackActive = active && (radio.playing || radio.loading);

  function listen(trackId?: string) {
    radio.playSelection(ids, { label: albumRelease.title, ...(trackId ? { startId: trackId } : {}) });
  }

  return <section className="na-listening" id="ecouter" aria-labelledby="album-listening-title">
    <div className="na-section-heading">
      <div><p className="na-eyebrow">L’album, du début à la fin</p><h2 id="album-listening-title">32 chansons.<br /><em>Votre prochain coup de cœur.</em></h2></div>
      <p>Écoutez gratuitement ici. Choisissez un titre : la suite de l’album se joue dans l’ordre, puis recommence.</p>
    </div>
    <div className="na-player" aria-label="Lecteur de L’amour de Nowis">
      <div className="na-current"><span className={`na-status-dot ${playbackActive ? 'is-playing' : ''}`} aria-hidden="true" />
        <div><small>{radio.loading && active ? 'Chargement…' : radio.playing && active ? 'À l’écoute' : active ? 'Votre titre sélectionné' : 'Prêt à écouter'}</small><strong>{currentTrack?.title ?? albumRelease.title}</strong></div>
      </div>
      <div className="na-player-controls">
        <button type="button" className="na-button na-button-dark" onClick={() => active ? radio.toggle() : listen()}
          aria-label={playbackActive ? 'Mettre l’album en pause' : active ? 'Reprendre l’album' : 'Écouter les 32 chansons de l’album'}>
          {playbackActive ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          {playbackActive ? 'Pause' : active ? 'Reprendre' : 'Écouter l’album'}
        </button>
        {active && <button type="button" className="na-next" onClick={radio.next} aria-label="Chanson suivante de l’album"><SkipForward size={21} aria-hidden="true" /></button>}
      </div>
      {active && <p className="na-player-position" data-testid="album-cycle-progress">Titre {currentTrack!.number} / {albumTracks.length}</p>}
      {active && radio.message && <p className="na-player-message" role="status">{radio.message}</p>}
    </div>
    <p className="na-listening-note">La lecture continue pendant votre visite sur nowis.store. Aucun compte nécessaire.</p>
    <ol className="na-track-list" aria-label="Les 32 titres dans l’ordre de l’album">
      {albumTracks.map(track => {
        const current = active && currentTrack?.id === track.id;
        return <li key={track.id} data-track-id={track.id} className={current ? 'is-current' : ''} aria-current={current ? 'true' : undefined}>
          <span className="na-track-number" aria-hidden="true">{String(track.number).padStart(2, '0')}</span>
          <button className="na-track-play" type="button" onClick={() => current ? radio.toggle() : listen(track.id)}
            aria-label={current && playbackActive ? `Mettre ${track.title} en pause` : `Écouter ${track.title}`}>
            <span>{track.title}{current && <small>{radio.loading ? 'Chargement…' : radio.playing ? 'En cours d’écoute' : 'En pause'}</small>}</span>
            <span className="na-track-icon" aria-hidden="true">{current && playbackActive ? <Pause size={16} /> : <Play size={16} />}</span>
          </button>
          <a className="na-track-buy" href={track.itunesUrl} target="_blank" rel="noopener noreferrer" aria-label={`Acheter ${track.title} sur iTunes`}>Acheter <span aria-hidden="true">↗</span></a>
        </li>;
      })}
    </ol>
  </section>;
}
