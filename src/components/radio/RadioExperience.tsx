'use client';
import { useState } from 'react';
import { RadioControls, useRadio } from './RadioProvider';
import tracks from '@/data/radio-tracks.json';

export function RadioExperience() {
  const radio = useRadio();
  const [query, setQuery] = useState('');
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
  const visible = tracks.filter(track => normalize(track.title).includes(normalize(query.trim())));
  return <>
    <section className="nr-player" aria-label="Écouter Radio Nowis">
      <div className={`nr-disc ${radio.playing ? 'is-playing' : ''}`} aria-hidden="true"><span>NOWIS<br /><small>RADIO</small></span></div>
      <div className="nr-player-copy"><p className="nm-eyebrow">{radio.playing ? 'À l’écoute' : 'Appuyez sur Lecture'}</p><h2>{radio.track?.title ?? 'Toutes mes chansons. En continu.'}</h2><p>{tracks.length} chansons et versions de mon profil Suno. Un tour complet du catalogue, puis un nouveau mélange.</p><RadioControls />{radio.track && <p className="nr-progress" data-testid="radio-cycle-progress">Titre {radio.positionInCycle} sur {radio.totalTracks} · Tour en cours</p>}<p className="nm-fine">Les titres s’enchaînent automatiquement jusqu’à la fin du tour. La radio garde votre avancement si vous rechargez cette page ou fermez le lecteur.</p>{radio.message && <p role="status">{radio.message}</p>}{radio.track && <a href={radio.track.sunoUrl} target="_blank" rel="noopener noreferrer">Voir cette chanson sur Suno ↗</a>}</div>
    </section>
    <details className="ng-details nr-catalogue"><summary>Les {tracks.length} chansons de la radio</summary><label htmlFor="radio-search">Retrouver un titre</label><input id="radio-search" type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Un titre, un souvenir…" /><p aria-live="polite">{visible.length} titre{visible.length > 1 ? 's' : ''}</p><ul>{visible.map(track=><li key={track.id}><span>{track.title}</span><a href={track.sunoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Voir ${track.title} sur Suno (nouvel onglet)`}>Suno ↗</a></li>)}</ul></details>
  </>;
}
