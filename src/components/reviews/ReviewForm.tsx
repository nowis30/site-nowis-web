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
      <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.84),rgba(14,23,42,0.76))] p-8 text-center text-white backdrop-blur-sm">
        <div className="text-4xl">⭐</div>
        <h3 className="mt-4 font-display text-2xl text-white">Merci pour ton avis !</h3>
        <p className="mt-2 text-slate-300">
          Ton témoignage sera publié après validation. Je l'apprécie vraiment.
        </p>
      </div>
    );
  }

  const displayRating = hovered > 0 ? hovered : rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.84),rgba(14,23,42,0.76))] p-8 text-white backdrop-blur-sm"
    >
      <h3 className="font-display text-2xl text-white">Laisser un avis</h3>
      <p className="mt-1 text-sm text-slate-400">
        Ton témoignage sera visible sur le site après validation.
      </p>

      {/* Étoiles */}
      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-slate-300">Ta note *</p>
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
                star <= displayRating ? 'text-yellow-400' : 'text-white/20'
              } hover:text-yellow-300`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="review-name" className="mb-1.5 block text-sm font-medium text-slate-300">
            Ton prénom *
          </label>
          <input
            id="review-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Marie"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="review-email" className="mb-1.5 block text-sm font-medium text-slate-300">
            Email <span className="text-slate-500">(facultatif)</span>
          </label>
          <input
            id="review-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="marie@exemple.com"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="review-context" className="mb-1.5 block text-sm font-medium text-slate-300">
          Type de projet <span className="text-slate-500">(facultatif)</span>
        </label>
        <select
          id="review-context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#0e172a] px-4 py-2.5 text-white focus:border-primary-400 focus:outline-none"
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
        <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium text-slate-300">
          Ton commentaire *
        </label>
        <textarea
          id="review-comment"
          required
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partage ton expérience..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary-400 focus:outline-none"
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
