'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import tracks from '@/data/radio-tracks.json';
import { useRadio } from './RadioProvider';

type Comment = { id: string; displayName: string; message: string; radioTrackId: string | null; createdAt: string };
type CommentPage = { comments: Comment[]; nextCursor: string | null };
const dateFormat = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Toronto' });

export function RadioComments({ displayName = '' }: { displayName?: string }) {
  const radio = useRadio();
  const [latest, setLatest] = useState<Comment[]>([]);
  const [older, setOlder] = useState<Comment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [posting, setPosting] = useState(false);
  const [name, setName] = useState(displayName);
  const [message, setMessage] = useState('');
  const [trackId, setTrackId] = useState('');
  const [openOlder, setOpenOlder] = useState(false);
  const pageGeneration = useRef(0);
  useEffect(() => { setName(displayName); }, [displayName]);
  const loadLatest = useCallback(async () => {
    const generation = ++pageGeneration.current;
    setLoading(true); setLoadError('');
    setLoadingOlder(false);
    try {
      const response = await fetch('/api/radio/comments', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (generation !== pageGeneration.current) return;
      setLatest((data as CommentPage).comments); setCursor(data.nextCursor); setOlder([]); setOpenOlder(false);
    } catch (err) { if (generation === pageGeneration.current) setLoadError(err instanceof Error ? err.message : 'Impossible de charger les commentaires.'); }
    finally { if (generation === pageGeneration.current) setLoading(false); }
  }, []);
  useEffect(() => { void loadLatest(); }, [loadLatest]);
  async function loadOlder() {
    if (!cursor || loadingOlder) return;
    const generation = pageGeneration.current;
    setLoadingOlder(true); setLoadError('');
    try {
      const response = await fetch(`/api/radio/comments?cursor=${encodeURIComponent(cursor)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (generation !== pageGeneration.current) return;
      setOlder(previous => [...previous, ...data.comments.filter((item: Comment) => !previous.some(old => old.id === item.id))]);
      setCursor(data.nextCursor);
    } catch (err) { if (generation === pageGeneration.current) setLoadError(err instanceof Error ? err.message : 'Impossible de charger la suite.'); }
    finally { if (generation === pageGeneration.current) setLoadingOlder(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (posting) return;
    const form = new FormData(event.currentTarget);
    setPosting(true); setFormError(''); setNotice('');
    try {
      const response = await fetch('/api/radio/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name, message, radioTrackId: trackId || null, website: form.get('website') || '' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(''); setNotice('Votre commentaire est publié. Merci de partager votre écoute !');
      setLatest(previous => [data.comment, ...previous].slice(0, 5));
      await loadLatest();
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Le commentaire n’a pas été publié. Vérifiez votre connexion.'); }
    finally { setPosting(false); }
  }
  function renderComment(comment: Comment) {
    const song = tracks.find(track => track.id === comment.radioTrackId);
    return <li key={comment.id} className="nr-comment"><div className="nr-comment-heading"><strong>{comment.displayName}</strong><time dateTime={comment.createdAt}>{dateFormat.format(new Date(comment.createdAt))}</time></div><p>{comment.message}</p>{song && <button type="button" className="nr-text-button" onClick={() => radio.playTrack(song.id)} aria-label={`Réécouter ${song.title}`}>▷ Réécouter : {song.title}</button>}</li>;
  }
  return <section className="nm-section nr-community" id="commentaires" aria-labelledby="radio-comments-title">
    <div className="nr-section-heading"><div><p className="nm-eyebrow">Entre nous, en musique</p><h2 id="radio-comments-title">Quelle chanson<br /><em>vous touche ?</em></h2></div><p>Un coup de cœur, un souvenir, un refrain à réécouter… Laissez quelques mots à Nowis et aux autres auditeurs.</p></div>
    <div className="nr-comments-grid"><form className="nr-form" onSubmit={submit}>
      <h3>Laisser un commentaire</h3>
      <label htmlFor="comment-name">Prénom ou pseudo</label><input id="comment-name" value={name} onChange={event => setName(event.target.value)} autoComplete="nickname" required minLength={2} maxLength={80} />
      <label htmlFor="comment-track">De quelle chanson parlez-vous ? <span className="nm-fine">(facultatif)</span></label><select id="comment-track" value={trackId} onChange={event => setTrackId(event.target.value)}><option value="">La musique de Nowis en général</option>{tracks.map(track => <option key={track.id} value={track.id}>{track.title}</option>)}</select>
      {radio.track && <button className="nr-text-button" type="button" onClick={() => setTrackId(radio.track!.id)}>Choisir le titre en cours : {radio.track.title}</button>}
      <label htmlFor="comment-message">Votre commentaire</label><textarea id="comment-message" rows={5} required minLength={3} maxLength={1200} value={message} onChange={event => setMessage(event.target.value)} aria-describedby="comment-public" />
      <p id="comment-public" className="nm-fine">Votre prénom ou pseudo et votre commentaire seront visibles par tous dès la publication. Merci de rester respectueux.</p>
      <div className="nr-honeypot" aria-hidden="true"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {formError && <p role="alert" className="nr-error">{formError}</p>}<p role="status">{notice}</p>
      <button className="cta-primary" disabled={posting}>{posting ? 'Publication…' : 'Publier mon commentaire'}</button>
    </form><div className="nr-comment-feed"><h3>Les cinq derniers commentaires</h3>
      {loading && <p role="status">Chargement des commentaires…</p>}
      {!loading && !loadError && !latest.length && <p>Soyez la première personne à partager votre coup de cœur.</p>}
      <ul aria-label="Derniers commentaires">{latest.map(renderComment)}</ul>
      {(older.length > 0 || cursor) && <details className="ng-details nr-older" open={openOlder} onToggle={event => {
        const open = event.currentTarget.open; setOpenOlder(open);
        if (open && !older.length && cursor && !loadingOlder) void loadOlder();
      }}><summary>Voir les commentaires précédents</summary><div className="nr-older-scroll" tabIndex={0} aria-label="Anciens commentaires"><ul>{older.map(renderComment)}</ul></div>{cursor && <button type="button" className="cta-secondary" disabled={loadingOlder} onClick={() => void loadOlder()}>{loadingOlder ? 'Chargement…' : 'Afficher cinq commentaires de plus'}</button>}</details>}
      {loadError && <div role="alert"><p className="nr-error">{loadError}</p><button type="button" className="nr-text-button" onClick={() => void (openOlder ? loadOlder() : loadLatest())}>Réessayer</button></div>}
    </div></div>
  </section>;
}
