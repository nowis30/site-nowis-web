import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CommercialQuoteStatus } from '@prisma/client';

import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { PageHeader, SectionCard, StatusBadge } from '@/features/client-portal/components/ui';
import { ClientQuoteResponseActions } from '@/features/client-portal/components/quotes/ClientQuoteResponseActions';
import { prisma } from '@/lib/prisma';

const statusLabels: Record<CommercialQuoteStatus, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyee',
  ACCEPTED: 'Acceptee',
  DECLINED: 'Refusee',
  EXPIRED: 'Expiree',
  CONVERTED: 'Convertie',
  ARCHIVED: 'Archivee',
};

function statusTone(status: CommercialQuoteStatus): 'warning' | 'info' | 'success' | 'danger' | 'neutral' {
  if (status === 'DRAFT' || status === 'SENT') return 'warning';
  if (status === 'ACCEPTED' || status === 'CONVERTED') return 'success';
  if (status === 'DECLINED' || status === 'EXPIRED') return 'danger';
  return 'neutral';
}

function formatDate(value: Date | null) {
  if (!value) return 'Non definie';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(value);
}

function formatCurrency(value: unknown, currency = 'CAD') {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency }).format(Number(value || 0));
}

export default async function ClientSoumissionDetailPage({ params }: { params: { id: string } }) {
  const session = await requireClientPortalSession();

  const item = await prisma.commercialQuote.findFirst({
    where: {
      id: params.id,
      contactId: session.contactId,
    },
    include: {
      lines: { orderBy: { sortOrder: 'asc' } },
      songRequest: { select: { id: true, title: true } },
      workshopRequest: { select: { id: true, title: true } },
      convertedToInvoice: { select: { id: true, number: true, status: true } },
    },
  });

  if (!item) notFound();

  return (
    <section className="space-y-6">
      <PageHeader
        title={item.title}
        subtitle={`Soumission ${item.quoteNumber}`}
        actions={<Link href="/client/soumissions" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white">Retour</Link>}
      />

      <SectionCard title="Statut">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <StatusBadge label={statusLabels[item.status]} tone={statusTone(item.status)} />
          <p className="text-xs text-slate-400">Validite: {formatDate(item.validUntil)}</p>
        </div>
        <div className="mt-4">
          <ClientQuoteResponseActions quoteId={item.id} initialStatus={item.status} />
        </div>
      </SectionCard>

      <SectionCard title="Lignes de soumission">
        <div className="space-y-3">
          {item.lines.map((line) => (
            <article key={line.id} className="rounded-xl border border-slate-800 bg-slate-950/45 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{line.title}</p>
                  {line.description ? <p className="mt-1 text-xs text-slate-400">{line.description}</p> : null}
                </div>
                <p className="text-sm font-semibold text-slate-100">{formatCurrency(line.subtotal, item.currency)}</p>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Quantite: {Number(line.quantity)} · Prix unitaire: {formatCurrency(line.unitPrice, item.currency)}
              </p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Totaux">
        <div className="space-y-2 text-sm text-slate-200">
          <p>Sous-total: {formatCurrency(item.subtotal, item.currency)}</p>
          <p>Taxes: {formatCurrency(item.taxAmount, item.currency)}</p>
          <p className="text-base font-semibold text-white">Total: {formatCurrency(item.totalAmount, item.currency)}</p>
        </div>
      </SectionCard>

      <SectionCard title="Liens lies">
        <div className="flex flex-wrap gap-2">
          {item.songRequest ? (
            <Link href={`/client/song-requests/${item.songRequest.id}`} className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-primary-500/40 hover:text-white">
              Voir la demande chanson
            </Link>
          ) : null}
          {item.workshopRequest ? (
            <Link href={`/client/workshops/${item.workshopRequest.id}`} className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-primary-500/40 hover:text-white">
              Voir la demande atelier
            </Link>
          ) : null}
          {item.convertedToInvoice ? (
            <Link href="/client/documents" className="rounded-xl border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/10">
              Facture liee: {item.convertedToInvoice.number}
            </Link>
          ) : null}
        </div>
      </SectionCard>
    </section>
  );
}
