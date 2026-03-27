import Link from 'next/link';
import type { ContactInvoiceItem } from './types';
import { formatDate, formatMoney } from './formatters';

export function ContactInvoices({ invoices }: { invoices: ContactInvoiceItem[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {invoices.length === 0 ? <p className="text-sm text-slate-400">Aucune facture pour ce contact.</p> : invoices.map((invoice) => (
        <article key={invoice.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-white">Facture {invoice.number}</h3>
            <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{invoice.status}</span>
          </div>
          <p className="mt-3 text-sm text-slate-300">{formatMoney(invoice.amount)}</p>
          <p className="mt-2 text-sm text-slate-400">Émise le {formatDate(invoice.issueDate)} · échéance {formatDate(invoice.dueDate)}</p>
          {invoice.description ? <p className="mt-3 text-sm text-slate-400">{invoice.description}</p> : null}
          <div className="mt-4"><Link href={`/crm/invoices/${invoice.id}`} className="text-sm text-primary-300 hover:text-primary-200">Ouvrir la facture</Link></div>
        </article>
      ))}
    </div>
  );
}
