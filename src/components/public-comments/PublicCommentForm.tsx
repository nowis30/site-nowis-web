'use client';

import { useState } from 'react';

type PublicCommentFormProps = {
  sourcePage?: string;
};

export function PublicCommentForm({ sourcePage = '/' }: PublicCommentFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | ''>('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!consent) {
      setError('Veuillez accepter la publication après approbation.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/public/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          email,
          message,
          rating: rating === '' ? null : rating,
          consent,
          sourcePage,
          website,
        }),
      });

      const data = await response.json().catch(() => null) as { error?: string; message?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error || 'Envoi impossible.');
      }

      setSuccess(data?.message || 'Merci, votre commentaire sera affiché après approbation.');
      setDisplayName('');
      setEmail('');
      setMessage('');
      setRating('');
      setConsent(false);
      setWebsite('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[color:var(--site-border)] bg-white/80 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-[color:var(--site-heading)]">Laisser un commentaire</h3>
      <p className="mt-1 text-sm text-[color:var(--site-muted)]">
        Votre message sera relu avant publication.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-[color:var(--site-heading)]">
          Nom affiché
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-2 text-sm text-[color:var(--site-heading)]"
            placeholder="Votre prénom"
            maxLength={80}
          />
        </label>

        <label className="text-sm text-[color:var(--site-heading)]">
          Courriel (optionnel)
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-2 text-sm text-[color:var(--site-heading)]"
            placeholder="vous@exemple.com"
            maxLength={190}
          />
        </label>
      </div>

      <label className="mt-3 block text-sm text-[color:var(--site-heading)]">
        Note (optionnelle)
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value ? Number(e.target.value) : '')}
          className="mt-1 w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-2 text-sm text-[color:var(--site-heading)]"
        >
          <option value="">Aucune note</option>
          <option value="5">5 / 5</option>
          <option value="4">4 / 5</option>
          <option value="3">3 / 5</option>
          <option value="2">2 / 5</option>
          <option value="1">1 / 5</option>
        </select>
      </label>

      <label className="mt-3 block text-sm text-[color:var(--site-heading)]">
        Commentaire
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 min-h-[110px] w-full rounded-xl border border-[color:var(--site-border)] bg-white px-3 py-2 text-sm text-[color:var(--site-heading)]"
          placeholder="Partagez votre expérience"
          maxLength={1200}
        />
      </label>

      <label className="mt-3 flex items-start gap-2 text-sm text-[color:var(--site-heading)]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        J’accepte que mon commentaire soit affiché publiquement après approbation.
      </label>

      <label className="hidden" aria-hidden="true">
        Site web
        <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </label>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-700">{success}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[color:var(--site-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
      >
        {submitting ? 'Envoi...' : 'Envoyer mon commentaire'}
      </button>
    </form>
  );
}
