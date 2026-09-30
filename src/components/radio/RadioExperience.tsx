'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Heart, Play } from 'lucide-react';
import { RadioControls, useRadio } from './RadioProvider';
import { useRadioFavorites } from './useRadioFavorites';
import { RadioComments } from './RadioComments';
import { FeaturedAlbum } from '@/components/marketing/FeaturedAlbum';
import { itunesUrl, musicStoreLink } from '@/lib/music-store';
import tracks from '@/data/radio-tracks.json';

type Track = (typeof tracks)[number];
export function RadioExperience() {
  const radio = useRadio();
  const favorites = useRadioFavorites();
  const [query, setQuery] = useState('');
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
  const visible = tracks.filter(track => normalize(track.title).includes(normalize(query.trim())));
  const selected = favorites.ids.map(id => tracks.find(track => track.id === id)).filter((track): track is Track => Boolean(track));
  function favoriteButton(track: Track) {
    const saved = favorites.ids.includes(track.id);
    return favorites.user
      ? <button type="button" className={`nr-icon nr-heart ${saved ? 'is-saved' : ''}`} disabled={favorites.busy} aria-pressed={saved} aria-label={`${saved ? 'Retirer' : 'Ajouter'} ${track.title} ${saved ? 'des' : 'aux'} favoris`} onClick={() => void favorites.toggle(track.id)}><Heart size={19} fill={saved ? 'currentColor' : 'none'} /></button>
      : <Link className="nr-icon nr-heart" href="/radio/compte" aria-label={`Créer un compte ou se connecter pour garder ${track.title}`}><Heart size={19} /></Link>;
  }
  function songRow(track: Track) {
    const store = musicStoreLink(track.id);
    return <li key={track.id} data-track-id={track.id} className={radio.track?.id === track.id ? 'is-current' : ''}>
      <div className="nr-song-title"><strong>{track.title}</strong>{radio.track?.id === track.id && <small>{radio.playing ? 'En cours d’écoute' : 'Titre sélectionné'}</small>}</div>
      <div className="nr-song-actions"><button type="button" className="nr-icon" onClick={() => radio.playTrack(track.id)} aria-label={`Écouter ${track.title}`}><Play size={18} /></button>{favoriteButton(track)}{store && <a href={itunesUrl(store.url)} target="_blank" rel="noopener noreferrer" aria-label={`Acheter ${store.title} sur iTunes`}>iTunes ↗</a>}<a href={track.sunoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Voir ${track.title} sur Suno`}>Suno ↗</a></div>
    </li>;
  }
  const currentStore = radio.track ? musicStoreLink(radio.track.id) : null;
  return <>
    <section className="nr-player" aria-label="Écouter Radio Nowis">
      <div className={`nr-disc ${radio.playing ? 'is-playing' : ''}`} aria-hidden="true"><span>NOWIS<br /><small>RADIO</small></span></div>
      <div className="nr-player-copy"><p className="nm-eyebrow">{radio.isSelection ? 'Ma sélection de favoris' : radio.playing ? 'À l’écoute' : 'Appuyez sur Lecture'}</p><h2>{radio.track?.title ?? 'Toutes mes chansons. En continu.'}</h2><p>{radio.isSelection ? 'Vos chansons préférées se suivent dans l’ordre de votre liste, puis recommencent.' : `${tracks.length} chansons et versions de mon profil Suno. Un tour complet du catalogue, puis un nouveau mélange.`}</p><RadioControls />{radio.track && <p className="nr-progress" data-testid="radio-cycle-progress">Titre {radio.positionInCycle} sur {radio.totalTracks} · {radio.isSelection ? 'Mes favoris' : 'Tour en cours'}</p>}<p className="nm-fine">La lecture continue pendant votre visite. Votre avancement est conservé si vous rechargez cette page ou fermez le lecteur.</p>{radio.message && <p role="status">{radio.message}</p>}
        {radio.track && <div className="nr-current-actions">{favoriteButton(radio.track)}<span className="nm-fine">Garder ce titre</span>{currentStore && <a href={itunesUrl(currentStore.url)} target="_blank" rel="noopener noreferrer">Acheter ce titre sur iTunes ↗</a>}<a href={radio.track.sunoUrl} target="_blank" rel="noopener noreferrer">Suno ↗</a></div>}
        {radio.isSelection && <button type="button" className="nr-text-button" onClick={radio.playRadio}>Revenir aux 139 chansons de la radio</button>}
        <div className="nr-player-links"><a href="#mes-favoris">Mes favoris ♡</a><a href="#commentaires">Laisser un commentaire</a><a href="#nouvel-album">Le nouvel album ↗</a></div>
      </div>
    </section>
    <RadioComments displayName={favorites.user?.displayName} />
    <section className="nm-section nr-favorites" id="mes-favoris" aria-labelledby="favorites-title">
      <div className="nr-section-heading"><div><p className="nm-eyebrow">Votre petite collection</p><h2 id="favorites-title">À garder.<br /><em>À réécouter.</em></h2></div><p>Un cœur sur une chanson, et elle rejoint votre liste personnelle.</p></div>
      {favorites.loading ? <p role="status">Chargement de vos favoris…</p> : favorites.user ? <>
        <div className="nr-favorites-heading"><p>Bonjour {favorites.user.displayName}. <strong>{selected.length} favori{selected.length > 1 ? 's' : ''}</strong>, retrouvés sur tous vos appareils.</p><button type="button" className="nr-text-button" disabled={favorites.busy} onClick={async () => { if (await favorites.logout()) radio.clearSelection(); }}>Me déconnecter</button></div>
        {selected.length ? <><button type="button" className="cta-primary" onClick={() => radio.playSelection(selected.map(track => track.id))}><Play size={18} /> Écouter ma sélection</button><ul className="nr-song-list" aria-label="Mes chansons favorites">{selected.map(songRow)}</ul></> : <p>Votre liste attend son premier coup de cœur. Choisissez un titre dans le catalogue ci-dessous ou gardez la chanson en cours.</p>}
      </> : <div className="nr-signup-invite"><p>Créez votre compte gratuit pour retrouver vos chansons préférées sur votre Samsung, votre ordinateur et vos autres appareils.</p><Link className="cta-primary" href="/radio/compte">Créer mon compte ou me connecter</Link></div>}
      {favorites.error && <div role="alert"><p className="nr-error">{favorites.error}</p><button type="button" className="nr-text-button" onClick={() => void favorites.refresh()}>Réessayer</button></div>}
      {favorites.busy && <p role="status">Enregistrement…</p>}
    </section>
    <FeaturedAlbum showTracks />
    <details className="ng-details nr-catalogue"><summary>Les {tracks.length} chansons de la radio</summary><p>Écoutez un titre, ajoutez-le à vos favoris ou retrouvez-le dans les boutiques lorsqu’il y est disponible.</p><label htmlFor="radio-search">Retrouver un titre</label><input id="radio-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Un titre, un souvenir…" /><p aria-live="polite">{visible.length} titre{visible.length > 1 ? 's' : ''}</p><ul className="nr-song-list" aria-label="Catalogue de la radio">{visible.map(songRow)}</ul></details>
  </>;
}
