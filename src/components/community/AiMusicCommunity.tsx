'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type AiMusicShare = {
  id: string;
  artistName: string;
  title: string;
  aiTool: string;
  genre: string | null;
  listenUrl: string;
  description: string | null;
  createdAt: string;
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
    return /\.(mp3|m4a|wav|ogg)(?:$|\?)/i.test(new URL(url).pathname + new URL(url).search);
  } catch {
    return false;
  }
}

export function AiMusicCommunity() {
  const [shares, setShares] = useState<AiMusicShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [artistName, setArtistName] = useState('');
  const [title, setTitle] = useState('');
  const [aiTool, setAiTool] = useState('Suno');
  const [customTool, setCustomTool] = useState('');
  const [genre, setGenre] = useState('');
  const [listenUrl, setListenUrl] = useState('');
  const [description, setDescription] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState('Tous');

  useEffect(() => {
    let active = true;

    async function loadShares() {
      try {
        const response = await fetch('/api/ai-music/shares', { cache: 'no-store' });
        const data = await response.json().catch(() => null) as { shares?: AiMusicShare[]; message?: string } | null;
        if (!response.ok) throw new Error(data?.message || 'Impossible de charger les créations.');
        if (active) setShares(data?.shares || []);
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Impossible de charger les créations.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadShares();
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
      setDescription('');
      setRightsConfirmed(false);
      setWebsite('');
      setSuccess('Votre chanson est maintenant publiée dans la communauté.');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Publication impossible.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="nm-section grid gap-8 lg:grid-cols-[0.9fr_1.1fr]" aria-labelledby="share-ai-song-title">
        <div>
          <p className="nm-eyebrow">Publier une création</p>
          <h2 id="share-ai-song-title" className="font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">
            Ajoutez votre chanson
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[color:var(--site-muted)]">
            Pas besoin d’un compte pour commencer. Ajoutez simplement le lien public de votre chanson.
            Les liens Suno, Udio, YouTube, SoundCloud, Spotify ou les fichiers audio publics en HTTPS peuvent être partagés.
          </p>

          <div className="mt-6 rounded-[1.5rem] border border-[color:var(--site-border)] bg-[color:var(--site-soft)] p-5">
            <p className="font-semibold text-[color:var(--site-heading)]">Avant de publier</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">
              Publiez seulement une création que vous avez le droit de rendre publique. Évitez d’utiliser le nom,
              la voix ou le matériel protégé d’une autre personne sans autorisation.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="brand-card rounded-[2rem] p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-[color:var(--site-heading)]">
              Nom d’artiste ou pseudo
              <input
                required
                value={artistName}
                onChange={(event) => setArtistName(event.target.value)}
                maxLength={80}
                placeholder="Ex. DJ Marco"
                className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3 text-[color:var(--site-heading)]"
              />
            </label>

            <label className="text-sm font-medium text-[color:var(--site-heading)]">
              Titre
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                placeholder="Titre de la chanson"
                className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3 text-[color:var(--site-heading)]"
              />
            </label>

            <label className="text-sm font-medium text-[color:var(--site-heading)]">
              Outil IA
              <select
                value={aiTool}
                onChange={(event) => setAiTool(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3 text-[color:var(--site-heading)]"
              >
                {AI_TOOLS.map((tool) => <option key={tool} value={tool}>{tool}</option>)}
              </select>
            </label>

            <label className="text-sm font-medium text-[color:var(--site-heading)]">
              Style / genre
              <input
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                maxLength={80}
                placeholder="Rock, country, rap..."
                className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3 text-[color:var(--site-heading)]"
              />
            </label>
          </div>

          {aiTool === 'Autre' ? (
            <label className="mt-4 block text-sm font-medium text-[color:var(--site-heading)]">
              Nom de l’outil
              <input
                required
                value={customTool}
                onChange={(event) => setCustomTool(event.target.value)}
                maxLength={80}
                placeholder="Nom de l’outil IA"
                className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3 text-[color:var(--site-heading)]"
              />
            </label>
          ) : null}

          <label className="mt-4 block text-sm font-medium text-[color:var(--site-heading)]">
            Lien d’écoute
            <input
              required
              type="url"
              inputMode="url"
              value={listenUrl}
              onChange={(event) => setListenUrl(event.target.value)}
              maxLength={1000}
              placeholder="https://..."
              className="mt-1.5 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3 text-[color:var(--site-heading)]"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-[color:var(--site-heading)]">
            Quelques mots sur la chanson
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={800}
              placeholder="Comment elle a été créée, ce qu’elle raconte, ce que vous avez voulu essayer..."
              className="mt-1.5 min-h-28 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-3 text-[color:var(--site-heading)]"
            />
          </label>

          <label className="mt-4 flex items-start gap-3 rounded-xl border border-[color:var(--site-border)] bg-white/70 p-4 text-sm text-[color:var(--site-text)]">
            <input
              type="checkbox"
              checked={rightsConfirmed}
              onChange={(event) => setRightsConfirmed(event.target.checked)}
              className="mt-1"
            />
            <span>Je confirme que j’ai le droit de partager publiquement cette création et le lien fourni.</span>
          </label>

          <label className="hidden" aria-hidden="true">
            Site web
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
          </label>

          {submitError ? <p className="mt-4 text-sm text-red-700">{submitError}</p> : null}
          {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="cta-primary mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Publication...' : 'Publier ma chanson ↗'}
          </button>
        </form>
      </section>

      <section className="nm-section" aria-labelledby="community-list-title">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="nm-eyebrow">À découvrir</p>
            <h2 id="community-list-title" className="font-display text-3xl text-[color:var(--site-heading)] md:text-4xl">
              Les créations de la communauté
            </h2>
          </div>

          {toolFilters.length > 1 ? (
            <label className="text-sm font-medium text-[color:var(--site-heading)]">
              Filtrer par outil
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="ml-2 rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-2"
              >
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

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleShares.map((share) => (
            <article key={share.id} className="brand-card flex h-full flex-col rounded-[1.75rem] p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[color:var(--site-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--site-accent-strong)]">
                  {share.aiTool}
                </span>
                {share.genre ? (
                  <span className="rounded-full border border-[color:var(--site-border)] px-3 py-1 text-xs text-[color:var(--site-muted)]">
                    {share.genre}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-5 font-display text-2xl text-[color:var(--site-heading)]">{share.title}</h3>
              <p className="mt-1 text-sm font-semibold text-[color:var(--site-accent-strong)]">{share.artistName}</p>

              {share.description ? (
                <p className="mt-4 flex-1 whitespace-pre-line text-sm leading-6 text-[color:var(--site-muted)]">{share.description}</p>
              ) : <div className="flex-1" />}

              {isDirectAudioUrl(share.listenUrl) ? (
                <audio controls preload="none" src={share.listenUrl} className="mt-5 w-full">
                  Votre navigateur ne peut pas lire ce fichier audio.
                </audio>
              ) : null}

              <div className="mt-5 border-t border-[color:var(--site-border)] pt-4">
                <a
                  href={share.listenUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[color:var(--site-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--site-heading)] hover:border-[color:var(--site-accent)]/50"
                >
                  Écouter sur {sourceLabel(share.listenUrl)} ↗
                </a>
                <p className="mt-3 text-xs text-[color:var(--site-soft)]">Publié le {formatDate(share.createdAt)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
