'use client';

import { useState } from 'react';
import { Activity, Plus, Filter, User, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  contact: { fullName: string } | null;
  user: { fullName: string } | null;
};
type Contact = { id: string; fullName: string };

const TYPE_LABELS: Record<string, string> = {
  NOTE: 'Note', CALL: 'Appel', MESSAGE: 'Message', EMAIL: 'Email',
  APPOINTMENT: 'RDV', INVOICE: 'Facture', PAYMENT: 'Paiement',
  FORM: 'Formulaire', FORM_SUBMISSION: 'Soumission formulaire', FILE: 'Fichier', TASK: 'Tâche',
};
const TYPE_ICONS: Record<string, string> = {
  NOTE: '📝', CALL: '📞', MESSAGE: '💬', EMAIL: '📧',
  APPOINTMENT: '📅', INVOICE: '🧾', PAYMENT: '💳',
  FORM: '📋', FORM_SUBMISSION: '🧷', FILE: '📎', TASK: '✅',
};
const TYPE_COLORS: Record<string, string> = {
  NOTE: 'border-l-slate-500', CALL: 'border-l-green-500', MESSAGE: 'border-l-blue-500',
  EMAIL: 'border-l-purple-500', APPOINTMENT: 'border-l-yellow-500', INVOICE: 'border-l-orange-500',
  PAYMENT: 'border-l-emerald-500', FORM: 'border-l-cyan-500', FORM_SUBMISSION: 'border-l-sky-500', FILE: 'border-l-pink-500',
  TASK: 'border-l-indigo-500',
};

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Il y a ${days}j`;
}

function ActivityTimelineItem({ activity, onDelete }: { activity: ActivityItem; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);

  async function deleteActivity() {
    if (!confirm('Supprimer cette activité ?')) return;
    setDeleting(true);
    await fetch(`/api/crm/activities/${activity.id}`, { method: 'DELETE' });
    setDeleting(false);
    onDelete();
  }

  return (
    <div className={`border-l-2 ${TYPE_COLORS[activity.type] ?? 'border-l-slate-600'} pl-4 py-1 group`}>
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3.5">
        <div className="flex items-start gap-2">
          <span className="text-base shrink-0">{TYPE_ICONS[activity.type] ?? '📌'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {TYPE_LABELS[activity.type] ?? activity.type}
              </span>
              <span className="text-xs text-slate-600">·</span>
              <span className="text-xs text-slate-500">{formatRelative(activity.createdAt)}</span>
            </div>
            <p className="mt-0.5 text-sm font-medium text-white">{activity.title}</p>
            {activity.description && <p className="mt-0.5 text-xs text-slate-400">{activity.description}</p>}
            <div className="flex items-center gap-3 mt-2">
              {activity.contact && (
                <span className="flex items-center gap-1 text-xs text-slate-500"><User size={11} />{activity.contact.fullName}</span>
              )}
              {activity.user && (
                <span className="text-xs text-slate-600">par {activity.user.fullName}</span>
              )}
            </div>
          </div>
          <button type="button" onClick={deleteActivity} disabled={deleting}
            className="opacity-0 group-hover:opacity-100 text-xs text-slate-600 hover:text-red-400 transition-all shrink-0">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function NewActivityForm({ contacts, onCreated }: { contacts: Contact[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: 'NOTE', title: '', description: '', contactId: '' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/crm/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setOpen(false);
    setForm({ type: 'NOTE', title: '', description: '', contactId: '' });
    onCreated();
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors">
      <Plus size={16} /> Ajouter une activité
    </button>
  );

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3 mb-4">
      <h3 className="font-semibold text-white text-sm">Nouvelle activité</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={form.contactId} onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
          <option value="">— Contact (optionnel) —</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
        </select>
        <input required placeholder="Titre *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="col-span-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
        <textarea placeholder="Description (optionnel)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="col-span-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 resize-none" />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Annuler</button>
        <button type="submit" disabled={loading} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50">{loading ? 'Enregistrement...' : 'Ajouter'}</button>
      </div>
    </form>
  );
}

interface ActivitiesPageProps { activities: ActivityItem[]; contacts: Contact[]; }

export function ActivitiesPage({ activities, contacts }: ActivitiesPageProps) {
  const router = useRouter();
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? activities.filter(a => a.type === filter)
    : activities;

  // Group by date
  const groups: Record<string, ActivityItem[]> = {};
  filtered.forEach(a => {
    const key = new Date(a.createdAt).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Activity size={22} /> Historique des activités</h2>
          <p className="text-sm text-slate-400 mt-0.5">{activities.length} activité{activities.length > 1 ? 's' : ''} récente{activities.length > 1 ? 's' : ''}</p>
        </div>
        <NewActivityForm contacts={contacts} onCreated={() => router.refresh()} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-slate-400" />
        <button type="button" onClick={() => setFilter('')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!filter ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
          Tous
        </button>
        {['NOTE', 'CALL', 'EMAIL', 'APPOINTMENT', 'FORM', 'FORM_SUBMISSION'].map(t => (
          <button key={t} type="button" onClick={() => setFilter(f => f === t ? '' : t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === t ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.keys(groups).length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Activity size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucune activité enregistrée</p>
          </div>
        ) : (
          Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 capitalize">{date}</h3>
              <div className="space-y-2">
                {items.map(a => (
                  <ActivityTimelineItem key={a.id} activity={a} onDelete={() => router.refresh()} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
