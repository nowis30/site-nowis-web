import Link from 'next/link';
import { CommercialQuoteStatus } from '@prisma/client';

import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { EmptyState, PageHeader, SectionCard, StatusBadge } from '@/features/client-portal/components/ui';
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

export default async function ClientSoumissionsPage() {
  const session = await requireClientPortalSession();

  const items = await prisma.commercialQuote.findMany({
    where: { contactId: session.contactId },
    include: {
      lines: { select: { id: true } },
      songRequest: { select: { id: true, title: true } },
      workshopRequest: { select: { id: true, title: true } },
      convertedToInvoice: { select: { id: true, number: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Mes soumissions"
        subtitle="Consultez vos devis, puis acceptez ou refusez en un clic."
      />

      <SectionCard title="Soumissions commerciales" subtitle="Affichage simple, lisible sur mobile.">
        {items.length === 0 ? (
          <EmptyState
            title="Aucune soumission"
            description="Les soumissions liees a vos demandes apparaitront ici."
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/client/soumissions/${item.id}`}
                className="block rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-primary-500/30 hover:bg-slate-900/50"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-white">{item.quoteNumber} · {item.title}</p>
                  <StatusBadge label={statusLabels[item.status]} tone={statusTone(item.status)} />
                </div>
                <p className="mt-2 text-sm text-slate-300">Total: {formatCurrency(item.totalAmount, item.currency)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Validite: {formatDate(item.validUntil)} · {item.lines.length} ligne(s)
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                  {item.songRequest ? <span>Chanson: {item.songRequest.title || item.songRequest.id}</span> : null}
                  {item.workshopRequest ? <span>Atelier: {item.workshopRequest.title || item.workshopRequest.id}</span> : null}
                  {item.convertedToInvoice ? <span>Facture: {item.convertedToInvoice.number}</span> : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </section>
  );
}
