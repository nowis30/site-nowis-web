'use client';

import { useState } from 'react';
import { FileText, Plus, TrendingUp, Euro } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Invoice = {
  id: string;
  number: string;
  contactId: string;
  issueDate: string;
  dueDate: string;
  amount: string | number;
  status: string;
  description: string | null;
  contact: { fullName: string; email: string | null };
};

type StatRow = { status: string; _count: { id: number }; _sum: { amount: string | null } };
type Contact = { id: string; fullName: string };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', SENT: 'Envoyée', PAID: 'Payée', OVERDUE: 'En retard', CANCELLED: 'Annulée',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-300', SENT: 'bg-blue-500/20 text-blue-300',
  PAID: 'bg-green-500/20 text-green-300', OVERDUE: 'bg-red-500/20 text-red-300',
  CANCELLED: 'bg-slate-600/20 text-slate-400 line-through',
};

function formatMoney(v: string | number | null) {
  if (v === null) return '0,00 $';
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(v));
}

function InvoiceRow({ inv, onStatusChange }: { inv: Invoice; onStatusChange: () => void }) {
  const [loading, setLoading] = useState(false);

  async function changeStatus(status: string) {
    setLoading(true);
    await fetch(`/api/crm/invoices/${inv.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: inv.number, contactId: inv.contactId,
        dueDate: inv.dueDate, amount: inv.amount, status, description: inv.description,
      }),
    });
    setLoading(false);
    onStatusChange();
  }

  return (
    <tr className="border-t border-slate-700/50 hover:bg-slate-800/30 transition-colors">
      <td className="px-4 py-3 text-sm font-mono text-primary-300">{inv.number}</td>
      <td className="px-4 py-3 text-sm text-white">{inv.contact.fullName}</td>
      <td className="px-4 py-3 text-sm text-slate-400">{new Date(inv.issueDate).toLocaleDateString('fr-CA')}</td>
      <td className="px-4 py-3 text-sm text-slate-400">{new Date(inv.dueDate).toLocaleDateString('fr-CA')}</td>
      <td className="px-4 py-3 text-sm font-semibold text-white">{formatMoney(inv.amount)}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] ?? 'bg-slate-700 text-slate-300'}`}>
          {STATUS_LABELS[inv.status] ?? inv.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href={`/crm/invoices/${inv.id}`} className="text-xs text-primary-300 hover:text-primary-200 transition-colors">Voir</Link>
          {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
            <button type="button" onClick={() => changeStatus('PAID')} disabled={loading} className="text-xs text-slate-400 hover:text-green-400 transition-colors">✓ Payée</button>
          )}
          <Link href={`/crm/invoices/${inv.id}?compose=1`} className="text-xs text-slate-400 hover:text-blue-400 transition-colors">↑ Envoyer email</Link>
        </div>
      </td>
    </tr>
  );
}

function NewInvoiceForm({ contacts, onCreated }: { contacts: Contact[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ number: '', contactId: '', issueDate: '', dueDate: '', amount: '', description: '', status: 'DRAFT' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contactId) return;
    setLoading(true);
    await fetch('/api/crm/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        issueDate: form.issueDate ? new Date(form.issueDate).toISOString() : undefined,
        dueDate: new Date(form.dueDate).toISOString(),
        amount: parseFloat(form.amount),
      }),
    });
    setLoading(false);
    setOpen(false);
    setForm({ number: '', contactId: '', issueDate: '', dueDate: '', amount: '', description: '', status: 'DRAFT' });
    onCreated();
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors">
      <Plus size={16} /> Nouvelle facture
    </button>
  );

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-3 mb-4">
      <h3 className="font-semibold text-white">Nouvelle facture</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input required placeholder="N° facture (ex: FAC-2026-001)" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
        <select required value={form.contactId} onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
          <option value="">— Contact * —</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
        </select>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Date d'émission</label>
          <input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Échéance *</label>
          <input type="date" required value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white" />
        </div>
        <input required type="number" step="0.01" min="0" placeholder="Montant ($) *" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <textarea placeholder="Description / prestations" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="sm:col-span-2 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 resize-none" />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Annuler</button>
        <button type="submit" disabled={loading} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50">{loading ? 'Création...' : 'Créer'}</button>
      </div>
    </form>
  );
}

interface InvoicesPageProps {
  invoices: Invoice[];
  contacts: Contact[];
  stats: StatRow[];
}

export function InvoicesPage({ invoices, contacts, stats }: InvoicesPageProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const totalPaid = stats.find(s => s.status === 'PAID')?._sum.amount ?? 0;
  const totalUnpaid = stats.filter(s => ['SENT', 'OVERDUE'].includes(s.status)).reduce((a, s) => a + Number(s._sum.amount ?? 0), 0);
  const countOverdue = stats.find(s => s.status === 'OVERDUE')?._count.id ?? 0;

  const filtered = search
    ? invoices.filter(i => i.number.includes(search) || i.contact.fullName.toLowerCase().includes(search.toLowerCase()))
    : invoices;

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><FileText size={22} /> Factures</h2>
          <p className="text-sm text-slate-400 mt-0.5">Suivi de facturation</p>
        </div>
        <NewInvoiceForm contacts={contacts} onCreated={() => router.refresh()} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 mb-1">Encaissé</p>
          <p className="text-xl font-bold text-green-400">{formatMoney(totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 mb-1">À recevoir</p>
          <p className="text-xl font-bold text-yellow-400">{formatMoney(totalUnpaid)}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400 mb-1">En retard</p>
          <p className="text-xl font-bold text-red-400">{countOverdue}</p>
        </div>
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Rechercher une facture..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full min-w-[700px]">
          <thead className="bg-slate-800/80">
            <tr>
              {['Numéro', 'Contact', 'Émise le', 'Échéance', 'Montant', 'Statut', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">Aucune facture trouvée</td></tr>
            ) : (
              filtered.map(inv => <InvoiceRow key={inv.id} inv={inv} onStatusChange={() => router.refresh()} />)
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
