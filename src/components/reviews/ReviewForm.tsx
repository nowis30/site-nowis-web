'use client';

import { useState } from 'react';

const CONTEXTS = [
  'Chanson personnalisée',
  'Mise en chanson',
  'Atelier créatif',
  'Cadeau',
  'Autre',
];

export function ReviewForm({ onSuccess }: { onSuccess?: () => void }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [context, setContext] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Veuillez sélectionner une note.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, rating, comment, context }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Une erreur est survenue.');
        return;
      }

      setSubmitted(true);
      onSuccess?.();
    } catch {
      setError('Impossible d\'envoyer l\'avis. Réessayez plus tard.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="glass-panel-soft rounded-[2rem] border border-[var(--site-border)] p-8 text-center text-[color:var(--site-text)]">
        <div className="text-4xl">⭐</div>
        <h3 className="mt-4 font-display text-2xl text-[color:var(--site-heading)]">Merci pour ton avis !</h3>
        <p className="mt-2 text-[color:var(--site-text)]">
          Ton témoignage sera publié après validation. Je l'apprécie vraiment.
        </p>
      </div>
    );
  }

  const displayRating = hovered > 0 ? hovered : rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel-soft rounded-[2rem] border border-[var(--site-border)] p-8 text-[color:var(--site-text)]"
    >
      <h3 className="font-display text-2xl text-[color:var(--site-heading)]">Laisser un avis</h3>
      <p className="mt-1 text-sm text-[color:var(--site-muted)]">
        Ton commentaire sera visible sur le site après validation, avec ton nom, ton email et ta note.
      </p>

      {/* Étoiles */}
      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-[color:var(--site-text)]">Ta note *</p>
        <div className="flex gap-1" role="group" aria-label="Note de 1 à 5 étoiles">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
              className={`text-3xl transition-colors ${
                star <= displayRating ? 'text-yellow-500' : 'text-[color:var(--site-border)]'
              } hover:text-yellow-300`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="review-name" className="mb-1.5 block text-sm font-medium text-[color:var(--site-text)]">
            Ton nom *
          </label>
          <input
            id="review-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Marie Tremblay"
            className="w-full rounded-xl border border-[color:var(--site-border)] bg-white/85 px-4 py-2.5 text-[color:var(--site-heading)] placeholder-[color:var(--site-muted)] focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="review-email" className="mb-1.5 block text-sm font-medium text-[color:var(--site-text)]">
            Email *
          </label>
          <input
            id="review-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="marie@exemple.com"
            className="w-full rounded-xl border border-[color:var(--site-border)] bg-white/85 px-4 py-2.5 text-[color:var(--site-heading)] placeholder-[color:var(--site-muted)] focus:border-primary-400 focus:outline-none"
          />
        </div>
      </div>

      <p className="mt-3 text-xs leading-6 text-[color:var(--site-soft)]">
        En envoyant ton avis, tu acceptes que ton nom, ton email et ta note soient affichés après validation.
      </p>

      <div className="mt-4">
        <label htmlFor="review-context" className="mb-1.5 block text-sm font-medium text-[color:var(--site-text)]">
          Type de projet <span className="text-[color:var(--site-muted)]">(facultatif)</span>
        </label>
        <select
          id="review-context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="w-full rounded-xl border border-[color:var(--site-border)] bg-white/85 px-4 py-2.5 text-[color:var(--site-heading)] focus:border-primary-400 focus:outline-none"
        >
          <option value="">-- Choisir --</option>
          {CONTEXTS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium text-[color:var(--site-text)]">
          Ton commentaire *
        </label>
        <textarea
          id="review-comment"
          required
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partage ton expérience..."
          className="w-full rounded-xl border border-[color:var(--site-border)] bg-white/85 px-4 py-2.5 text-[color:var(--site-heading)] placeholder-[color:var(--site-muted)] focus:border-primary-400 focus:outline-none"
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 rounded-full bg-primary-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-primary-400 disabled:opacity-50"
      >
        {submitting ? 'Envoi...' : 'Envoyer mon avis'}
      </button>
    </form>
  );
}
