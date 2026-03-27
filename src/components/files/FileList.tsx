'use client';

import { useState } from 'react';
import { Download, Eye, Trash2 } from 'lucide-react';

export type FileListItem = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  category: string;
  visibility: 'ADMIN_ONLY' | 'CLIENT_VISIBLE';
  createdAt: string;
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  return `${(size / 1024 / 1024).toFixed(1)} Mo`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

interface FileListProps {
  items: FileListItem[];
  emptyLabel: string;
  canDelete?: boolean;
  onDelete?: (id: string) => Promise<void>;
}

export function FileList({ items, emptyLabel, canDelete = false, onDelete }: FileListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!onDelete) return;
    const ok = window.confirm('Supprimer ce fichier ?');
    if (!ok) return;

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{item.originalName}</p>
              <p className="mt-1 text-xs text-slate-400">
                {item.category} · {item.mimeType} · {formatBytes(item.size)} · {formatDate(item.createdAt)}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                {item.visibility === 'CLIENT_VISIBLE' ? 'Visible client' : 'Admin only'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a href={item.url} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white">
                <span className="inline-flex items-center gap-1.5"><Eye size={13} />Voir</span>
              </a>
              <a href={item.url} download className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white">
                <span className="inline-flex items-center gap-1.5"><Download size={13} />Telecharger</span>
              </a>
              {canDelete ? (
                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => handleDelete(item.id)}
                  className="rounded-xl border border-red-700/40 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:border-red-500/60 hover:text-red-200 disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-1.5"><Trash2 size={13} />Supprimer</span>
                </button>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
