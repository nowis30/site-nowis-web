'use client';

import { useMemo, useState, useTransition } from 'react';

type PublicComment = {
  id: string;
  displayName: string;
  email: string | null;
  message: string;
  rating: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  sourcePage: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_META: Record<PublicComment['status'], { label: string; className: string }> = {
  PENDING: { label: 'En attente', className: 'border-amber-600/40 bg-amber-950/20 text-amber-200' },
  APPROVED: { label: 'Approuvé', className: 'border-emerald-600/40 bg-emerald-950/20 text-emerald-200' },
  REJECTED: { label: 'Refusé', className: 'border-rose-700/40 bg-rose-950/20 text-rose-200' },
  ARCHIVED: { label: 'Archivé', className: 'border-slate-700 bg-slate-900/40 text-slate-300' },
};

export function PublicCommentsModerationList({ initialComments }: { initialComments: PublicComment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const grouped = useMemo(() => ({
    pending: comments.filter((c) => c.status === 'PENDING'),
    approved: comments.filter((c) => c.status === 'APPROVED'),
    rejected: comments.filter((c) => c.status === 'REJECTED'),
    archived: comments.filter((c) => c.status === 'ARCHIVED'),
  }), [comments]);

  function updateStatus(id: string, status: PublicComment['status']) {
    setBusyId(id);
    startTransition(async () => {
      const response = await fetch(`/api/crm/public-comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setComments((current) => current.map((comment) => (
          comment.id === id ? { ...comment, status } : comment
        )));
      }
      setBusyId(null);
    });
  }

  function deleteComment(id: string) {
    if (!confirm('Supprimer définitivement ce commentaire ?')) return;
    setBusyId(id);
    startTransition(async () => {
      const response = await fetch(`/api/crm/public-comments/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      if (response.ok) {
        setComments((current) => current.filter((comment) => comment.id !== id));
      }
      setBusyId(null);
    });
  }

  function renderCard(comment: PublicComment) {
    const loading = isPending && busyId === comment.id;
    const meta = STATUS_META[comment.status];
    return (
      <article key={comment.id} className={`rounded-2xl border p-4 ${meta.className}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-current/40 px-2 py-0.5 text-xs font-semibold">{meta.label}</span>
          <span className="text-sm font-semibold">{comment.displayName}</span>
          {comment.rating ? <span className="text-xs">{'★'.repeat(comment.rating)}{'☆'.repeat(5 - comment.rating)}</span> : null}
        </div>
        <p className="mt-2 text-sm leading-6">{comment.message}</p>
        <div className="mt-2 text-xs opacity-80">
          <p>Source: {comment.sourcePage}</p>
          <p>Date: {new Date(comment.createdAt).toLocaleDateString('fr-CA', { dateStyle: 'medium' })}</p>
          <p>Courriel: {comment.email || '—'}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {comment.status !== 'APPROVED' ? (
            <button onClick={() => updateStatus(comment.id, 'APPROVED')} disabled={loading} className="rounded-lg border border-emerald-500/40 px-2.5 py-1 text-xs hover:bg-emerald-900/30 disabled:opacity-50">Approuver</button>
          ) : null}
          {comment.status !== 'REJECTED' ? (
            <button onClick={() => updateStatus(comment.id, 'REJECTED')} disabled={loading} className="rounded-lg border border-rose-500/40 px-2.5 py-1 text-xs hover:bg-rose-900/30 disabled:opacity-50">Refuser</button>
          ) : null}
          {comment.status !== 'ARCHIVED' ? (
            <button onClick={() => updateStatus(comment.id, 'ARCHIVED')} disabled={loading} className="rounded-lg border border-slate-500/40 px-2.5 py-1 text-xs hover:bg-slate-800 disabled:opacity-50">Archiver</button>
          ) : null}
          <button onClick={() => deleteComment(comment.id)} disabled={loading} className="rounded-lg border border-red-500/50 px-2.5 py-1 text-xs hover:bg-red-900/30 disabled:opacity-50">Supprimer</button>
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-base font-semibold text-amber-300">En attente ({grouped.pending.length})</h2>
        <div className="space-y-3">{grouped.pending.map(renderCard)}</div>
      </section>
      <section>
        <h2 className="mb-3 text-base font-semibold text-emerald-300">Approuvés ({grouped.approved.length})</h2>
        <div className="space-y-3">{grouped.approved.map(renderCard)}</div>
      </section>
      <section>
        <h2 className="mb-3 text-base font-semibold text-rose-300">Refusés ({grouped.rejected.length})</h2>
        <div className="space-y-3">{grouped.rejected.map(renderCard)}</div>
      </section>
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-300">Archivés ({grouped.archived.length})</h2>
        <div className="space-y-3">{grouped.archived.map(renderCard)}</div>
      </section>
      {comments.length === 0 ? <p className="text-sm text-slate-400">Aucun commentaire.</p> : null}
    </div>
  );
}
