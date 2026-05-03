'use client';

import { useEffect, useMemo, useState } from 'react';
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
  ARCHIVED: 'Archivée', DELETED: 'Supprimée',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-300', SENT: 'bg-blue-500/20 text-blue-300',
  PAID: 'bg-green-500/20 text-green-300', OVERDUE: 'bg-red-500/20 text-red-300',
  CANCELLED: 'bg-slate-600/20 text-slate-400 line-through',
  ARCHIVED: 'bg-amber-500/20 text-amber-300',
  DELETED: 'bg-red-900/40 text-red-200 line-through',
};

function formatMoney(v: string | number | null) {
  if (v === null) return '0,00 $';
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(v));
}

function getInvoiceEmptyText(status: string) {
  if (status === 'DELETED') return 'Aucune facture supprimée';
  if (status === 'ARCHIVED') return 'Aucune facture archivée';
  if (status === 'PAID') return 'Aucune facture payée';
  if (status === 'CANCELLED') return 'Aucune facture annulée';
  return 'Aucune facture trouvée';
}

function InvoiceActionsMenu({ inv, loading, onMarkPaid, onLifecycle }: {
  inv: Invoice;
  loading: boolean;
  onMarkPaid: () => void;
  onLifecycle: (action: 'archive' | 'delete' | 'restore') => void;
}) {
  return (
    <details>
      <summary className="cursor-pointer rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200">Actions</summary>
      <div className="mt-2 flex flex-col gap-1">
        <Link href={`/crm/invoices/${inv.id}`} className="rounded-md border border-primary-500/50 px-2 py-1 text-xs text-primary-300 hover:bg-primary-900/30">Voir</Link>
        <Link href={`/crm/invoices/${inv.id}`} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200">Modifier</Link>
        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.status !== 'DELETED' ? (
          <button type="button" onClick={onMarkPaid} disabled={loading} className="rounded-md border border-emerald-500/50 px-2 py-1 text-left text-xs text-emerald-300">Marquer payé</button>
        ) : null}
        {inv.status !== 'ARCHIVED' && inv.status !== 'DELETED' ? (
          <button type="button" onClick={() => onLifecycle('archive')} disabled={loading} className="rounded-md border border-amber-500/50 px-2 py-1 text-left text-xs text-amber-300">Archiver</button>
        ) : null}
        {inv.status !== 'DELETED' ? (
          <button type="button" onClick={() => onLifecycle('delete')} disabled={loading} className="rounded-md border border-red-500/50 px-2 py-1 text-left text-xs text-red-300">Supprimer</button>
        ) : (
          <button type="button" onClick={() => onLifecycle('restore')} disabled={loading} className="rounded-md border border-emerald-500/50 px-2 py-1 text-left text-xs text-emerald-300">Restaurer</button>
        )}
      </div>
    </details>
  );
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

  async function lifecycleAction(action: 'archive' | 'delete' | 'restore') {
    if (action === 'delete') {
      const warning = inv.status === 'SENT' || inv.status === 'PAID'
        ? 'Facture envoyée/payée. Recommandation: annuler avant suppression. Continuer ?'
        : 'Supprimer cette facture ?';
      if (!window.confirm(warning)) return;
    }
    setLoading(true);
    await fetch(`/api/crm/invoices/${inv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
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
        <div className="hidden items-center gap-2 md:flex">
          <Link href={`/crm/invoices/${inv.id}`} className="text-xs text-primary-300 hover:text-primary-200 transition-colors">Voir</Link>
          <Link href={`/crm/invoices/${inv.id}`} className="text-xs text-slate-300 hover:text-white transition-colors">Modifier</Link>
          {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.status !== 'DELETED' && (
            <button type="button" onClick={() => changeStatus('PAID')} disabled={loading} className="text-xs text-slate-400 hover:text-green-400 transition-colors">✓ Payée</button>
          )}
          {inv.status !== 'ARCHIVED' && inv.status !== 'DELETED' ? (
            <button type="button" onClick={() => lifecycleAction('archive')} disabled={loading} className="text-xs text-slate-400 hover:text-amber-300 transition-colors">Archiver</button>
          ) : null}
          {inv.status !== 'DELETED' ? (
            <button type="button" onClick={() => lifecycleAction('delete')} disabled={loading} className="text-xs text-slate-400 hover:text-red-300 transition-colors">Supprimer</button>
          ) : (
            <button type="button" onClick={() => lifecycleAction('restore')} disabled={loading} className="text-xs text-slate-400 hover:text-emerald-300 transition-colors">Restaurer</button>
          )}
          <Link href={`/crm/invoices/${inv.id}?compose=1`} className="text-xs text-slate-400 hover:text-blue-400 transition-colors">↑ Envoyer email</Link>
        </div>
        <div className="md:hidden">
          <InvoiceActionsMenu
            inv={inv}
            loading={loading}
            onMarkPaid={() => void changeStatus('PAID')}
            onLifecycle={(action) => void lifecycleAction(action)}
          />
        </div>
      </td>
    </tr>
  );
}

function InvoiceCard({ inv, onStatusChange }: { inv: Invoice; onStatusChange: () => void }) {
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

  async function lifecycleAction(action: 'archive' | 'delete' | 'restore') {
    if (action === 'delete') {
      const warning = inv.status === 'SENT' || inv.status === 'PAID'
        ? 'Facture envoyée/payée. Recommandation: annuler avant suppression. Continuer ?'
        : 'Supprimer cette facture ?';
      if (!window.confirm(warning)) return;
    }
    setLoading(true);
    await fetch(`/api/crm/invoices/${inv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    onStatusChange();
  }

  return (
    <article className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 md:hidden">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{inv.number}</p>
          <p className="text-xs text-slate-400">{inv.contact.fullName}</p>
          {inv.contact.email ? <p className="text-xs text-slate-500">{inv.contact.email}</p> : null}
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] ?? 'bg-slate-700 text-slate-300'}`}>
          {STATUS_LABELS[inv.status] ?? inv.status}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <p className="text-slate-400">Émise: <span className="text-slate-200">{new Date(inv.issueDate).toLocaleDateString('fr-CA')}</span></p>
        <p className="text-slate-400">Échéance: <span className="text-slate-200">{new Date(inv.dueDate).toLocaleDateString('fr-CA')}</span></p>
        <p className="col-span-2 text-slate-400">Montant: <span className="font-semibold text-white">{formatMoney(inv.amount)}</span></p>
      </div>

      <div className="mt-3">
        <InvoiceActionsMenu
          inv={inv}
          loading={loading}
          onMarkPaid={() => void changeStatus('PAID')}
          onLifecycle={(action) => void lifecycleAction(action)}
        />
      </div>
    </article>
  );
}

function NewInvoiceForm({
  contacts,
  onCreated,
  initialForm,
}: {
  contacts: Contact[];
  onCreated: () => void;
  initialForm?: {
    contactId?: string;
    description?: string;
    amount?: string;
    sourceWorkshopRequestId?: string;
  } | null;
}) {
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 30);
  const [open, setOpen] = useState(Boolean(initialForm?.contactId || initialForm?.description || initialForm?.amount));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    number: '',
    contactId: initialForm?.contactId || '',
    issueDate: '',
    dueDate: defaultDueDate.toISOString().slice(0, 10),
    amount: initialForm?.amount || '',
    description: initialForm?.description || '',
    status: 'DRAFT',
    sourceWorkshopRequestId: initialForm?.sourceWorkshopRequestId || '',
  });

  useEffect(() => {
    if (!initialForm) return;
    setOpen(Boolean(initialForm.contactId || initialForm.description || initialForm.amount));
    setForm((current) => ({
      ...current,
      contactId: initialForm.contactId || current.contactId,
      amount: initialForm.amount || current.amount,
      description: initialForm.description || current.description,
      sourceWorkshopRequestId: initialForm.sourceWorkshopRequestId || current.sourceWorkshopRequestId,
    }));
  }, [initialForm]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contactId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/crm/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          issueDate: form.issueDate ? new Date(form.issueDate).toISOString() : undefined,
          dueDate: new Date(form.dueDate).toISOString(),
          amount: parseFloat(form.amount),
          sourceWorkshopRequestId: form.sourceWorkshopRequestId || undefined,
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error || 'Creation facture impossible');
      }

      setOpen(false);
      setForm({ number: '', contactId: '', issueDate: '', dueDate: defaultDueDate.toISOString().slice(0, 10), amount: '', description: '', status: 'DRAFT', sourceWorkshopRequestId: '' });
      onCreated();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Creation facture impossible');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors">
      <Plus size={16} /> Nouvelle facture
    </button>
  );

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-3 mb-4">
      <h3 className="font-semibold text-white">Nouvelle facture</h3>
      {error ? <p className="rounded-lg border border-red-700/50 bg-red-950/20 px-3 py-2 text-xs text-red-200">{error}</p> : null}
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
  initialForm?: {
    contactId?: string;
    description?: string;
    amount?: string;
    sourceWorkshopRequestId?: string;
  } | null;
}

export function InvoicesPage({ invoices, contacts, stats, initialForm }: InvoicesPageProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const totalPaid = stats.find(s => s.status === 'PAID')?._sum.amount ?? 0;
  const totalUnpaid = stats.filter(s => ['SENT', 'OVERDUE'].includes(s.status)).reduce((a, s) => a + Number(s._sum.amount ?? 0), 0);
  const countOverdue = stats.find(s => s.status === 'OVERDUE')?._count.id ?? 0;

  const filtered = useMemo(
    () => invoices.filter((invoice) => {
      const byStatus = status === 'ALL' ? true : invoice.status === status;
      if (!byStatus) return false;
      if (!search.trim()) return true;
      const lowered = search.toLowerCase();
      return invoice.number.toLowerCase().includes(lowered) || invoice.contact.fullName.toLowerCase().includes(lowered);
    }),
    [invoices, search, status],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const emptyText = status === 'ALL' ? 'Aucune facture trouvée' : getInvoiceEmptyText(status);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status]);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><FileText size={22} /> Factures</h2>
          <p className="text-sm text-slate-400 mt-0.5">Suivi de facturation</p>
        </div>
        <NewInvoiceForm contacts={contacts} onCreated={() => router.refresh()} initialForm={initialForm} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
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
      <div className="grid gap-3 md:grid-cols-3">
        <input
          type="search"
          placeholder="Rechercher une facture..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400 md:col-span-2"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
        >
          <option value="ALL">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-400">Affichage {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} sur {filtered.length}</p>

      <div className="grid gap-3 md:hidden">
        {paginated.length === 0 ? (
          <p className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-6 text-center text-sm text-slate-400">{emptyText}</p>
        ) : (
          paginated.map((inv) => <InvoiceCard key={inv.id} inv={inv} onStatusChange={() => router.refresh()} />)
        )}
      </div>

      {/* Table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-700 md:block">
        <table className="w-full min-w-[700px]">
          <thead className="bg-slate-800/80">
            <tr>
              {['Numéro', 'Contact', 'Émise le', 'Échéance', 'Montant', 'Statut', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">{emptyText}</td></tr>
            ) : (
              paginated.map(inv => <InvoiceRow key={inv.id} inv={inv} onStatusChange={() => router.refresh()} />)
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Page {currentPage}/{totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-slate-700 px-2 py-1 text-slate-200 disabled:opacity-40"
          >
            Précédent
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-slate-700 px-2 py-1 text-slate-200 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </section>
  );
}
