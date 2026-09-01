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

const actionClassName = 'inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 motion-reduce:transition-none sm:w-auto';

export function FileList({ items, emptyLabel, canDelete = false, onDelete, downloadPrefix = '/api/crm/file-documents', readerBasePath }: FileListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!onDelete) return;
    const ok = window.confirm('Supprimer ce fichier ?');
    if (!ok) return;

    setDeletingId(id);
    setDeleteError(null);
    try {
      await onDelete(id);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Suppression impossible.');
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-slate-400" role="status">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-3">
      {deleteError ? (
        <p className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
          {deleteError}
        </p>
      ) : null}

      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-4 shadow-sm shadow-black/10">
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
                ? 'Écouter'
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
            const canDeleteItem = canDelete
              && origin === 'client'
              && (item.storageKey?.startsWith('client-files/') ?? false);

            return (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-white">{item.originalName}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {getDocumentCategoryLabel(resolvedCategory.category)} · {item.mimeType} · {formatBytes(item.size)} · {formatDate(item.createdAt)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{getDocumentCategoryDescription(resolvedCategory.category)}</p>
                  {(item.songRequest || item.workshopRequest) ? (
                    <p className="mt-1 text-xs text-slate-400">
                      {item.songRequest ? `Chanson : ${item.songRequest.title || item.songRequest.id}` : null}
                      {item.songRequest && item.workshopRequest ? ' · ' : null}
                      {item.workshopRequest ? `Atelier : ${item.workshopRequest.title || item.workshopRequest.id}` : null}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    {item.visibility === 'CLIENT_VISIBLE' ? 'Visible client' : 'Administrateur seulement'}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    Origine : {getDocumentOriginLabel(origin)}
                  </p>
                  {resolvedCategory.source === 'fallback' ? (
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-amber-300">
                      Catégorie déduite
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
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  {hasQuoteLink ? (
                    <a
                      href={`/client/soumissions/${item.commercialQuoteId}`}
                      className={`${actionClassName} border-primary-500/40 text-primary-100 hover:bg-primary-500/15`}
                    >
                      <span className="inline-flex items-center gap-1.5"><Eye size={14} aria-hidden="true" />Voir la soumission</span>
                    </a>
                  ) : null}
                  {isInvoicePlaceholder && item.invoiceId ? (
                    <a
                      href={`${invoiceViewBasePath}/${item.invoiceId}`}
                      className={`${actionClassName} border-primary-500/40 text-primary-100 hover:bg-primary-500/15`}
                    >
                      <span className="inline-flex items-center gap-1.5"><Eye size={14} aria-hidden="true" />Voir la facture</span>
                    </a>
                  ) : null}
                  {canDownload ? (
                    <a
                      href={readerHref}
                      className={`${actionClassName} border-slate-700 text-slate-200 hover:border-primary-500/40 hover:text-white`}
                    >
                      <span className="inline-flex items-center gap-1.5"><Eye size={14} aria-hidden="true" />{viewLabel}</span>
                    </a>
                  ) : null}
                  {canDownload ? (
                    <a
                      href={`${downloadPrefix}/${item.id}/download`}
                      download={item.originalName}
                      aria-label={`Télécharger ${item.originalName}`}
                      className={`${actionClassName} border-slate-700 text-slate-200 hover:border-primary-500/40 hover:text-white`}
                    >
                      <span className="inline-flex items-center gap-1.5"><Download size={14} aria-hidden="true" />Télécharger</span>
                    </a>
                  ) : null}
                  {canDeleteItem ? (
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      aria-busy={deletingId === item.id}
                      aria-label={`Supprimer ${item.originalName}`}
                      onClick={() => handleDelete(item.id)}
                      className={`${actionClassName} border-red-700/40 text-red-300 hover:border-red-500/60 hover:text-red-200 disabled:cursor-wait disabled:opacity-60`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Trash2 size={14} aria-hidden="true" />
                        {deletingId === item.id ? 'Suppression…' : 'Supprimer'}
                      </span>
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
