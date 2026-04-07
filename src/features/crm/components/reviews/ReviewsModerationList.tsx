'use client';

import { useState, useTransition } from 'react';

interface Review {
  id: string;
  name: string;
  email: string | null;
  rating: number;
  comment: string;
  context: string | null;
  status: string;
  createdAt: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? 'text-yellow-400' : 'text-slate-600'}>★</span>
      ))}
    </span>
  );
}

export function ReviewsModerationList({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setActionId(id);
    startTransition(async () => {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      }
      setActionId(null);
    });
  }

  async function deleteReview(id: string) {
    if (!confirm('Supprimer cet avis définitivement ?')) return;
    setActionId(id);
    startTransition(async () => {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
      setActionId(null);
    });
  }

  const pending = reviews.filter((r) => r.status === 'pending');
  const approved = reviews.filter((r) => r.status === 'approved');
  const rejected = reviews.filter((r) => r.status === 'rejected');

  function ReviewCard({ review }: { review: Review }) {
    const loading = isPending && actionId === review.id;
    return (
      <div className={`rounded-xl border p-5 transition ${review.status === 'approved' ? 'border-green-700/40 bg-green-950/20' : review.status === 'rejected' ? 'border-red-700/40 bg-red-950/20' : 'border-slate-700 bg-slate-800/40'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <StarDisplay rating={review.rating} />
              <span className="text-sm font-semibold text-white">{review.name}</span>
              {review.email && <span className="text-xs text-slate-400">{review.email}</span>}
              {review.context && <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">{review.context}</span>}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-200">"{review.comment}"</p>
            <p className="mt-1 text-xs text-slate-500">
              {new Date(review.createdAt).toLocaleDateString('fr-CA', { dateStyle: 'medium' })}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {review.status !== 'approved' && (
              <button
                onClick={() => updateStatus(review.id, 'approved')}
                disabled={loading}
                className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50"
              >
                Approuver
              </button>
            )}
            {review.status !== 'rejected' && (
              <button
                onClick={() => updateStatus(review.id, 'rejected')}
                disabled={loading}
                className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
              >
                Rejeter
              </button>
            )}
            <button
              onClick={() => deleteReview(review.id)}
              disabled={loading}
              className="rounded-lg bg-red-900/60 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-800 disabled:opacity-50"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-yellow-400">En attente ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        </section>
      )}

      {approved.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-green-400">Publiés ({approved.length})</h2>
          <div className="space-y-3">
            {approved.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        </section>
      )}

      {rejected.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-slate-500">Rejetés ({rejected.length})</h2>
          <div className="space-y-3">
            {rejected.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        </section>
      )}

      {reviews.length === 0 && (
        <p className="text-slate-400">Aucun avis pour le moment.</p>
      )}
    </div>
  );
}
