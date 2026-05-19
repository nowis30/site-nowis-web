'use client';

import { useState } from 'react';
import { Download, Eye, Trash2 } from 'lucide-react';
import {
  getDocumentCategoryDescription,
  getDocumentCategoryLabel,
  getDocumentOriginLabel,
  resolveDocumentCategory,
  resolveDocumentOrigin,
} from '@/features/documents/document-categories';
import { resolveClientMediaKind } from '@/features/client-portal/documents/media';

export type FileListItem = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey?: string;
  url: string;
  category: string;
  visibility: 'ADMIN_ONLY' | 'CLIENT_VISIBLE';
  createdAt: string;
  origin?: 'client' | 'admin' | 'system';
  songRequest?: { id: string; title: string | null } | null;
  workshopRequest?: { id: string; title: string | null } | null;
  songRequestId?: string | null;
  workshopRequestId?: string | null;
  commercialQuoteId?: string | null;
  invoiceId?: string | null;
  uploadedByUserId?: string | null;
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
  downloadPrefix?: string;
  readerBasePath?: string;
}

export function FileList({ items, emptyLabel, canDelete = false, onDelete, downloadPrefix = '/api/crm/file-documents', readerBasePath }: FileListProps) {
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
          {(() => {
            const hasQuoteLink = Boolean(item.commercialQuoteId);
            const hasInvoiceLink = Boolean(item.invoiceId);
            const isQuotePlaceholder = hasQuoteLink && item.size === 0 && (item.storageKey?.startsWith('quotes/') ?? false);
            const isInvoicePlaceholder = hasInvoiceLink && item.size === 0 && (item.storageKey?.startsWith('invoices/') ?? false);
            const canDownload = !isQuotePlaceholder && !isInvoicePlaceholder;
            const isCrmContext = downloadPrefix.startsWith('/api/crm/');
            const invoiceViewBasePath = isCrmContext ? '/crm/invoices' : '/client/invoices';
            const mediaKind = resolveClientMediaKind({ mimeType: item.mimeType, originalName: item.originalName });
            const readerHref = readerBasePath ? `${readerBasePath}/${item.id}/lecteur` : `${downloadPrefix}/${item.id}/download`;
            const resolvedCategory = resolveDocumentCategory({
              category: item.category,
              mimeType: item.mimeType,
              songRequestId: item.songRequest?.id ?? item.songRequestId ?? null,
              workshopRequestId: item.workshopRequest?.id ?? item.workshopRequestId ?? null,
              commercialQuoteId: item.commercialQuoteId ?? null,
              invoiceId: item.invoiceId ?? null,
              uploadedByUserId: item.uploadedByUserId ?? (item.origin === 'admin' ? 'admin' : null),
              visibility: item.visibility,
            });
            const viewLabel = readerBasePath
              ? mediaKind === 'audio'
                ? 'Ecouter'
                : mediaKind === 'video'
                  ? 'Lire'
                  : 'Ouvrir'
              : resolvedCategory.category === 'invoice'
                ? 'Ouvrir la facture'
                : 'Voir';

            const origin = resolveDocumentOrigin({
              songRequestId: item.songRequest?.id ?? item.songRequestId ?? null,
              workshopRequestId: item.workshopRequest?.id ?? item.workshopRequestId ?? null,
              commercialQuoteId: item.commercialQuoteId ?? null,
              invoiceId: item.invoiceId ?? null,
              uploadedByUserId: item.uploadedByUserId ?? (item.origin === 'admin' ? 'admin' : null),
              visibility: item.visibility,
            });

            return (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-white">{item.originalName}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {getDocumentCategoryLabel(resolvedCategory.category)} · {item.mimeType} · {formatBytes(item.size)} · {formatDate(item.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{getDocumentCategoryDescription(resolvedCategory.category)}</p>
                  {(item.songRequest || item.workshopRequest) ? (
                    <p className="mt-1 text-xs text-slate-400">
                      {item.songRequest ? `Chanson: ${item.songRequest.title || item.songRequest.id}` : null}
                      {item.songRequest && item.workshopRequest ? ' · ' : null}
                      {item.workshopRequest ? `Atelier: ${item.workshopRequest.title || item.workshopRequest.id}` : null}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    {item.visibility === 'CLIENT_VISIBLE' ? 'Visible client' : 'Admin only'}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    Origine: {getDocumentOriginLabel(origin)}
                  </p>
                  {resolvedCategory.source === 'fallback' ? (
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-amber-300">
                      Categorie deduite (fallback)
                    </p>
                  ) : null}
                  {item.mimeType?.startsWith('audio/') ? (
                    <audio
                      controls
                      className="mt-3 w-full max-w-md"
                      preload="none"
                      src={`${downloadPrefix}/${item.id}/download`}
                    >
                      Votre navigateur ne supporte pas la lecture audio.
                    </audio>
                  ) : null}
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  {hasQuoteLink ? (
                    <a href={`/client/soumissions/${item.commercialQuoteId}`} className="inline-flex w-full items-center justify-center rounded-xl border border-primary-500/40 px-3 py-2 text-xs font-medium text-primary-100 transition hover:bg-primary-500/15 sm:w-auto sm:py-1.5">
                      <span className="inline-flex items-center gap-1.5"><Eye size={13} />Voir la soumission</span>
                    </a>
                  ) : null}
                  {isInvoicePlaceholder && item.invoiceId ? (
                    <a href={`${invoiceViewBasePath}/${item.invoiceId}`} className="inline-flex w-full items-center justify-center rounded-xl border border-primary-500/40 px-3 py-2 text-xs font-medium text-primary-100 transition hover:bg-primary-500/15 sm:w-auto sm:py-1.5">
                      <span className="inline-flex items-center gap-1.5"><Eye size={13} />Voir la facture</span>
                    </a>
                  ) : null}
                  {canDownload ? (
                    <a href={readerHref} className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white sm:w-auto sm:py-1.5">
                      <span className="inline-flex items-center gap-1.5"><Eye size={13} />{viewLabel}</span>
                    </a>
                  ) : null}
                  {canDownload ? (
                    <a href={`${downloadPrefix}/${item.id}/download`} download={item.originalName} className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white sm:w-auto sm:py-1.5">
                      <span className="inline-flex items-center gap-1.5"><Download size={13} />Telecharger</span>
                    </a>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex w-full items-center justify-center rounded-xl border border-red-700/40 px-3 py-2 text-xs font-medium text-red-300 transition hover:border-red-500/60 hover:text-red-200 disabled:opacity-60 sm:w-auto sm:py-1.5"
                    >
                      <span className="inline-flex items-center gap-1.5"><Trash2 size={13} />Supprimer</span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })()}
        </article>
      ))}
    </div>
  );
}
