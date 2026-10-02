'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';

type AiComment = {
  id: string;
  displayName: string;
  message: string;
  createdAt: string;
};

type AiMusicShare = {
  id: string;
  artistName: string;
  title: string;
  aiTool: string;
  genre: string | null;
  listenUrl: string;
  coverUrl: string | null;
  description: string | null;
  createdAt: string;
  artistProfile: { slug: string; displayName: string; avatarUrl: string | null } | null;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  comments: AiComment[];
};

type MeResponse = {
  authenticated: boolean;
  user: { id: string; fullName: string } | null;
  profile: {
    id: string;
    slug: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
  } | null;
};

const AI_TOOLS = ['Suno', 'Udio', 'Kits AI', 'Stable Audio', 'AIVA', 'Boomy', 'Autre'];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(new Date(value));
}

function sourceLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Lien externe';
  }
}

function isDirectAudioUrl(url: string) {
  try {
    const parsed = new URL(url);
    return /\.(mp3|m4a|wav|ogg)(?:$|\?)/i.test(parsed.pathname + parsed.search);
  } catch {
    return false;
  }
}

export function AiMusicCommunity() {
  const router = useRouter();
  const [shares, setShares] = useState<AiMusicShare[]>([]);
  const [me, setMe] = useState<MeResponse>({ authenticated: false, user: null, profile: null });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [artistName, setArtistName] = useState('');
  const [title, setTitle] = useState('');
  const [aiTool, setAiTool] = useState('Suno');
  const [customTool, setCustomTool] = useState('');
  const [genre, setGenre] = useState('');
  const [listenUrl, setListenUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState('Tous');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [socialBusy, setSocialBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [sharesResponse, meResponse] = await Promise.all([
          fetch('/api/ai-music/shares', { cache: 'no-store' }),
          fetch('/api/ai-music/me', { cache: 'no-store' }),
        ]);
        const sharesData = await sharesResponse.json().catch(() => null) as { shares?: AiMusicShare[]; message?: string } | null;
        const meData = await meResponse.json().catch(() => null) as MeResponse | null;
        if (!sharesResponse.ok) throw new Error(sharesData?.message || 'Impossible de charger les créations.');
        if (active) {
          setShares(sharesData?.shares || []);
          if (meResponse.ok && meData) {
            setMe(meData);
            setArtistName(meData.profile?.displayName || meData.user?.fullName || '');
          }
        }
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Impossible de charger les créations.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const toolFilters = useMemo(() => {
    const tools = Array.from(new Set(shares.map((share) => share.aiTool))).sort((a, b) => a.localeCompare(b, 'fr'));
    return ['Tous', ...tools];
  }, [shares]);

  const visibleShares = useMemo(
    () => (filter === 'Tous' ? shares : shares.filter((share) => share.aiTool === filter)),
    [filter, shares],
  );

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!me.authenticated) {
      router.push('/communaute-ia/compte');
      return;
    }

    setUploadingCover(true);
    setSubmitError(null);
    try {
      const presign = await fetch('/api/ai-music/upload-image/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, size: file.size, purpose: 'song-cover' }),
      });
      const data = await presign.json().catch(() => null) as { uploadUrl?: string; file?: { url: string }; message?: string } | null;
      if (!presign.ok || !data?.uploadUrl || !data.file?.url) throw new Error(data?.message || 'Impossible de préparer la pochette.');
      const upload = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!upload.ok) throw new Error('Le téléversement de la pochette a échoué.');
      setCoverUrl(data.file.url);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Impossible d’envoyer la pochette.');
    } finally {
      setUploadingCover(false);
      event.target.value = '';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSuccess(null);

    if (!rightsConfirmed) {
      setSubmitError('Confirmez que vous avez le droit de partager cette création.');
      return;
    }

    const resolvedTool = aiTool === 'Autre' ? customTool.trim() : aiTool;
    if (!resolvedTool) {
      setSubmitError('Indiquez l’outil IA utilisé.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/ai-music/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName,
          title,
          aiTool: resolvedTool,
          genre: genre.trim() || null,
          listenUrl,
          coverUrl,
          description: description.trim() || null,
          rightsConfirmed,
          website,
        }),
      });

      const data = await response.json().catch(() => null) as { share?: AiMusicShare; message?: string } | null;
      if (!response.ok) throw new Error(data?.message || 'Publication impossible.');

      if (data?.share) setShares((current) => [data.share!, ...current]);
      setTitle('');
      setGenre('');
      setListenUrl('');
      setCoverUrl(null);
      setDescription('');
      setRightsConfirmed(false);
      setWebsite('');
      setSuccess(me.profile
        ? 'Votre chanson est publiée et ajoutée à votre page d’artiste.'
        : 'Votre chanson est maintenant publiée dans la communauté.');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLike(share: AiMusicShare) {
    if (!me.authenticated) {
      router.push('/communaute-ia/compte');
      return;
    }
    setSocialBusy(`like:${share.id}`);
    try {
      const response = await fetch(`/api/ai-music/shares/${share.id}/like`, { method: 'POST' });
      const data = await response.json().catch(() => null) as { liked?: boolean; likesCount?: number; message?: string } | null;
      if (!response.ok) throw new Error(data?.message || 'Action impossible.');
      setShares((current) => current.map((item) => item.id === share.id
        ? { ...item, likedByMe: Boolean(data?.liked), likesCount: data?.likesCount ?? item.likesCount }
        : item));
    } finally {
      setSocialBusy(null);
    }
  }

  async function addComment(share: AiMusicShare) {
    if (!me.authenticated) {
      router.push('/communaute-ia/compte');
      return;
    }
    const message = (commentDrafts[share.id] || '').trim();
    if (!message) return;

    setSocialBusy(`comment:${share.id}`);
    try {
      const response = await fetch(`/api/ai-music/shares/${share.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json().catch(() => null) as { comment?: AiComment; commentsCount?: number; message?: string } | null;
      if (!response.ok || !data?.comment) throw new Error(data?.message || 'Commentaire impossible.');
      setShares((current) => current.map((item) => item.id === share.id
        ? {
            ...item,
            commentsCount: data.commentsCount ?? item.commentsCount + 1,
            comments: [data.comment!, ...item.comments].slice(0, 3),
          }
        : item));
      setCommentDrafts((current) => ({ ...current, [share.id]: '' }));
    } finally {
      setSocialBusy(null);
    }
  }

  return (
    <>
      <section className="nm-section">
        <div className="brand-card flex flex-col gap-5 rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="font-semibold text-[color:var(--site-heading)]">
              {me.authenticated ? `Bonjour ${me.profile?.displayName || me.user?.fullName || ''}` : 'Créez votre identité d’artiste'}
            </p>
            <p className="mt-1 text-sm leading-6 text-[color:var(--site-muted)]">
              {me.profile
                ? 'Vos prochaines chansons seront automatiquement regroupées sur votre page publique.'
                : me.authenticated
                  ? 'Ajoutez un nom d’artiste, une photo et une bannière pour obtenir votre page publique.'
                  : 'Un compte permet d’avoir une page artiste, de publier des pochettes, d’aimer et de commenter.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {me.profile ? <Link className="cta-secondary" href={`/communaute-ia/artiste/${me.profile.slug}`}>Ma page artiste</Link> : null}
            <Link className="cta-primary" href={me.authenticated ? '/communaute-ia/profil' : '/communaute-ia/compte'}>
              {me.authenticated ? 'Modifier mon profil ↗' : 'Créer mon compte ↗'}
            </Link>
          </div>
        </div>
      </section>

      <section className="nm-section grid gap-8 lg:grid-cols-[0.9fr_1.1fr]" aria-labelledby="share-ai-song-title">
        <div>
          <p className="nm-eyebrow">Publier une création</p>
          <h2 id="share-ai-song-title" className="font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">Ajoutez votre chanson</h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[color:var(--site-muted)]">
            Partagez un lien Suno, Udio, YouTube, SoundCloud, Spotify ou un fichier audio public. Avec un compte, vous pouvez aussi ajouter votre pochette et relier la chanson à votre page d’artiste.
          </p>
          <div className="mt-6 rounded-[1.5rem] border border-[color:var(--site-border)] bg-[color:var(--site-soft)] p-5">
            <p className="font-semibold text-[color:var(--site-heading)]">Avant de publier</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">
              Publiez seulement une création que vous avez le droit de rendre publique. Évitez d’utiliser le nom, la voix ou le matériel protégé d’une autre personne sans autorisation.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="brand-card rounded-[2rem] p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-[color:var(--site-heading)]">
              Nom d’artiste ou pseudo
              <input required value={artistName} onChange={(event) => setArtistName(event.target.value)} maxLength={80}
                readOnly={Boolean(me.profile)}
                placeholder="Ex. DJ Marco"
                className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3 text-[color:var(--site-heading)] read-only:bg-[color:var(--site-soft)]" />
            </label>
            <label className="text-sm font-medium text-[color:var(--site-heading)]">
              Titre
              <input required value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120}
                placeholder="Titre de la chanson"
                className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3 text-[color:var(--site-heading)]" />
            </label>
            <label className="text-sm font-medium text-[color:var(--site-heading)]">
              Outil IA
              <select value={aiTool} onChange={(event) => setAiTool(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3 text-[color:var(--site-heading)]">
                {AI_TOOLS.map((tool) => <option key={tool} value={tool}>{tool}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-[color:var(--site-heading)]">
              Style / genre
              <input value={genre} onChange={(event) => setGenre(event.target.value)} maxLength={80}
                placeholder="Rock, country, rap..."
                className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3 text-[color:var(--site-heading)]" />
            </label>
          </div>

          {aiTool === 'Autre' ? (
            <label className="mt-4 block text-sm font-medium text-[color:var(--site-heading)]">
              Nom de l’outil
              <input required value={customTool} onChange={(event) => setCustomTool(event.target.value)} maxLength={80}
                className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3" />
            </label>
          ) : null}

          <label className="mt-4 block text-sm font-medium text-[color:var(--site-heading)]">
            Lien d’écoute
            <input required type="url" inputMode="url" value={listenUrl} onChange={(event) => setListenUrl(event.target.value)}
              maxLength={1000} placeholder="https://..."
              className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3 text-[color:var(--site-heading)]" />
          </label>

          {me.authenticated ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-[color:var(--site-heading)]">Pochette de la chanson (optionnelle)</p>
              <div className="mt-2 flex items-center gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-[color:var(--site-soft)]">
                  {coverUrl ? <Image src={coverUrl} alt="Aperçu de la pochette" fill sizes="96px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-3xl" aria-hidden="true">♪</span>}
                </div>
                <label className="cursor-pointer rounded-xl border border-[color:var(--site-border)] bg-white px-4 py-2 text-sm font-semibold">
                  {uploadingCover ? 'Envoi…' : coverUrl ? 'Changer la pochette' : 'Ajouter une pochette'}
                  <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadCover(event)} />
                </label>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[color:var(--site-muted)]">
              <Link className="nm-text-link" href="/communaute-ia/compte">Connectez-vous</Link> pour ajouter une pochette et créer votre page d’artiste.
            </p>
          )}

          <label className="mt-4 block text-sm font-medium text-[color:var(--site-heading)]">
            Quelques mots sur la chanson
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={800}
              placeholder="Comment elle a été créée, ce qu’elle raconte..."
              className="mt-1.5 min-h-28 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3 text-[color:var(--site-heading)]" />
          </label>

          <label className="mt-4 flex items-start gap-3 rounded-xl border border-[color:var(--site-border)] bg-white/70 p-4 text-sm text-[color:var(--site-text)]">
            <input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} className="mt-1" />
            <span>Je confirme que j’ai le droit de partager publiquement cette création et le lien fourni.</span>
          </label>

          <label className="hidden" aria-hidden="true">Site web<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
          {submitError ? <p className="mt-4 text-sm text-red-700">{submitError}</p> : null}
          {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}
          <button type="submit" disabled={submitting || uploadingCover} className="cta-primary mt-5 w-full justify-center disabled:opacity-60">
            {submitting ? 'Publication...' : 'Publier ma chanson ↗'}
          </button>
        </form>
      </section>

      <section className="nm-section" aria-labelledby="community-list-title">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="nm-eyebrow">À découvrir</p>
            <h2 id="community-list-title" className="font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">Les créations de la communauté</h2>
          </div>
          {toolFilters.length > 1 ? (
            <label className="text-sm font-medium text-[color:var(--site-heading)]">
              Filtrer par outil
              <select value={filter} onChange={(event) => setFilter(event.target.value)}
                className="ml-2 rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-2">
                {toolFilters.map((tool) => <option key={tool} value={tool}>{tool}</option>)}
              </select>
            </label>
          ) : null}
        </div>

        {loading ? <p className="mt-8 text-[color:var(--site-muted)]">Chargement des créations...</p> : null}
        {loadError ? <p className="mt-8 text-red-700">{loadError}</p> : null}
        {!loading && !loadError && visibleShares.length === 0 ? (
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-[color:var(--site-border)] bg-white/55 p-8 text-center">
            <p className="font-semibold text-[color:var(--site-heading)]">Aucune chanson publiée pour le moment.</p>
            <p className="mt-2 text-sm text-[color:var(--site-muted)]">La première création aura toute la scène.</p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleShares.map((share) => (
            <article key={share.id} className="brand-card flex h-full flex-col overflow-hidden rounded-[1.75rem]">
              <div className="relative aspect-square bg-[color:var(--site-soft)]">
                {share.coverUrl ? (
                  <Image src={share.coverUrl} alt={`Pochette de ${share.title}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(184,111,61,.2),transparent_35%),linear-gradient(135deg,#f8efe5,#ead8c5)] text-6xl" aria-hidden="true">♪</div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[color:var(--site-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--site-accent-strong)]">{share.aiTool}</span>
                  {share.genre ? <span className="rounded-full border border-[color:var(--site-border)] px-3 py-1 text-xs text-[color:var(--site-muted)]">{share.genre}</span> : null}
                </div>

                <h3 className="mt-4 font-display text-2xl text-[color:var(--site-heading)]">{share.title}</h3>
                {share.artistProfile ? (
                  <Link href={`/communaute-ia/artiste/${share.artistProfile.slug}`} className="mt-2 flex items-center gap-2 font-semibold text-[color:var(--site-accent-strong)]">
                    <span className="relative h-8 w-8 overflow-hidden rounded-full bg-[color:var(--site-soft)]">
                      {share.artistProfile.avatarUrl ? <Image src={share.artistProfile.avatarUrl} alt="" fill sizes="32px" className="object-cover" /> : null}
                    </span>
                    {share.artistProfile.displayName} ↗
                  </Link>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-[color:var(--site-accent-strong)]">{share.artistName}</p>
                )}

                {share.description ? <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[color:var(--site-muted)]">{share.description}</p> : null}

                {isDirectAudioUrl(share.listenUrl) ? (
                  <audio controls preload="none" src={share.listenUrl} className="mt-5 w-full">Votre navigateur ne peut pas lire ce fichier audio.</audio>
                ) : null}

                <a href={share.listenUrl} target="_blank" rel="noopener noreferrer nofollow"
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[color:var(--site-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--site-heading)]">
                  Écouter sur {sourceLabel(share.listenUrl)} ↗
                </a>

                <div className="mt-4 flex items-center gap-3 border-t border-[color:var(--site-border)] pt-4">
                  <button type="button" onClick={() => void toggleLike(share)} disabled={socialBusy === `like:${share.id}`}
                    aria-pressed={share.likedByMe}
                    className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${share.likedByMe ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-[color:var(--site-border)] bg-white'}`}>
                    {share.likedByMe ? '❤️' : '♡'} {share.likesCount}
                  </button>
                  <span className="text-sm text-[color:var(--site-muted)]">💬 {share.commentsCount}</span>
                  <span className="ml-auto text-xs text-[color:var(--site-soft)]">{formatDate(share.createdAt)}</span>
                </div>

                {share.comments.length ? (
                  <div className="mt-4 space-y-3 rounded-xl bg-[color:var(--site-soft)] p-4">
                    {share.comments.map((comment) => (
                      <div key={comment.id}>
                        <p className="text-xs font-semibold text-[color:var(--site-heading)]">{comment.displayName}</p>
                        <p className="mt-1 text-sm leading-5 text-[color:var(--site-muted)]">{comment.message}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                <form onSubmit={(event) => { event.preventDefault(); void addComment(share); }} className="mt-4 flex gap-2">
                  <input value={commentDrafts[share.id] || ''} onChange={(event) => setCommentDrafts((current) => ({ ...current, [share.id]: event.target.value }))}
                    maxLength={500} placeholder={me.authenticated ? 'Écrire un commentaire…' : 'Connectez-vous pour commenter'}
                    className="min-w-0 flex-1 rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-2 text-sm" />
                  <button type="submit" disabled={socialBusy === `comment:${share.id}`} className="rounded-xl bg-[color:var(--site-heading)] px-4 py-2 text-sm font-semibold text-white">Envoyer</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
