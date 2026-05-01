import Link from 'next/link';
import { FileText } from 'lucide-react';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { EmptyState, PageHeader, SectionCard, StatusBadge } from '@/features/client-portal/components/ui';
import { prisma } from '@/lib/prisma';

function formatDate(value: Date | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(value);
}

function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(value));
}

function invoiceStatusLabel(status: string): { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' } {
  const map: Record<string, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
    DRAFT:    { label: 'Brouillon',  tone: 'neutral'  },
    SENT:     { label: 'Envoyée',    tone: 'info'     },
    PAID:     { label: 'Payée',      tone: 'success'  },
    OVERDUE:  { label: 'En retard',  tone: 'danger'   },
    CANCELLED:{ label: 'Annulée',    tone: 'neutral'  },
    ARCHIVED: { label: 'Archivée',   tone: 'neutral'  },
  };
  return map[status] ?? { label: status, tone: 'neutral' };
}

export default async function ClientInvoicesPage() {
  const session = await requireClientPortalSession();

  const invoices = await prisma.invoice.findMany({
    where: {
      contactId: session.contactId,
      status: { notIn: ['DELETED', 'ARCHIVED'] },
    },
    orderBy: { issueDate: 'desc' },
    take: 100,
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Mes factures"
        subtitle="Consultez et téléchargez vos factures depuis votre portail sécurisé."
      />

      <SectionCard title="Historique des factures" subtitle="Cliquez sur une facture pour la consulter en détail.">
        {invoices.length === 0 ? (
          <EmptyState
            icon={<FileText size={18} />}
            title="Aucune facture"
            description="Vos factures apparaîtront ici dès qu'elles auront été créées par notre équipe."
          />
        ) : (
          <div className="divide-y divide-slate-800">
            {invoices.map((invoice) => {
              const { label, tone } = invoiceStatusLabel(invoice.status);
              return (
                <Link
                  key={invoice.id}
                  href={`/client/invoices/${invoice.id}`}
                  className="flex flex-col gap-2 px-1 py-4 transition hover:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {invoice.number}
                    </p>
                    {invoice.description ? (
                      <p className="mt-0.5 truncate text-xs text-slate-400">{invoice.description}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-500">
                      Émise le {formatDate(invoice.issueDate)} · Échéance {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-white">
                      {formatMoney(invoice.amount.toString())}
                    </span>
                    <StatusBadge label={label} tone={tone} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </SectionCard>
    </section>
  );
}
