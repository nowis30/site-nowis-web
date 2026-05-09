import Link from 'next/link';
import {
  getDocumentCategoryLabel,
  getDocumentOriginLabel,
  resolveDocumentCategory,
  resolveDocumentOrigin,
} from '@/features/documents/document-categories';

type LinkedDocItem = {
  id: string;
  originalName: string;
  mimeType: string;
  category: string;
  createdAtIso: string;
  downloadUrl: string;
  size?: number;
  storageKey?: string;
  songRequestId?: string | null;
  workshopRequestId?: string | null;
  commercialQuoteId?: string | null;
  invoiceId?: string | null;
  uploadedByUserId?: string | null;
  visibility?: 'ADMIN_ONLY' | 'CLIENT_VISIBLE';
};

type QuickLink = {
  href: string;
  label: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function LinkedDocumentsPanel({
  title = 'Documents liés',
  subtitle,
  items,
  quickLinks = [],
}: {
  title?: string;
  subtitle?: string;
  items: LinkedDocItem[];
  quickLinks?: QuickLink[];
}) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-primary-500/40 hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">Aucun document lié.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            (() => {
              const isInvoicePlaceholder =
                Boolean(item.invoiceId) &&
                (item.size ?? -1) === 0 &&
                (item.storageKey?.startsWith('invoices/') ?? false);
              const isQuotePlaceholder =
                Boolean(item.commercialQuoteId) &&
                (item.size ?? -1) === 0 &&
                (item.storageKey?.startsWith('quotes/') ?? false);
              const canDownload = !isInvoicePlaceholder && !isQuotePlaceholder;

              const resolvedCategory = resolveDocumentCategory({
                category: item.category,
                mimeType: item.mimeType,
                songRequestId: item.songRequestId ?? null,
                workshopRequestId: item.workshopRequestId ?? null,
                commercialQuoteId: item.commercialQuoteId ?? null,
                invoiceId: item.invoiceId ?? null,
                uploadedByUserId: item.uploadedByUserId ?? null,
                visibility: item.visibility ?? null,
              });

              const origin = resolveDocumentOrigin({
                songRequestId: item.songRequestId ?? null,
                workshopRequestId: item.workshopRequestId ?? null,
                commercialQuoteId: item.commercialQuoteId ?? null,
                invoiceId: item.invoiceId ?? null,
                uploadedByUserId: item.uploadedByUserId ?? null,
                visibility: item.visibility ?? null,
              });

              return (
                <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
                  <p className="break-words text-sm font-medium text-white">{item.originalName}</p>
                  <p className="mt-1 text-xs text-slate-400">{getDocumentCategoryLabel(resolvedCategory.category)} · {item.mimeType} · {formatDate(item.createdAtIso)}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">Origine: {getDocumentOriginLabel(origin)}</p>
                  {resolvedCategory.source === 'fallback' ? (
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-amber-300">Categorie deduite (fallback)</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.invoiceId ? (
                      <Link href={`/crm/invoices/${item.invoiceId}`} className="inline-flex rounded-lg border border-primary-500/40 px-2.5 py-1 text-xs text-primary-100 hover:border-primary-500/70 hover:text-white">
                        Voir la facture
                      </Link>
                    ) : null}
                    {item.commercialQuoteId ? (
                      <Link href={`/crm/commercial-quotes/${item.commercialQuoteId}`} className="inline-flex rounded-lg border border-primary-500/40 px-2.5 py-1 text-xs text-primary-100 hover:border-primary-500/70 hover:text-white">
                        Voir la soumission
                      </Link>
                    ) : null}
                    {canDownload ? (
                      <a href={item.downloadUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-primary-500/40 hover:text-white">
                        Ouvrir / telecharger
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })()
          ))}
        </div>
      )}
    </section>
  );
}
