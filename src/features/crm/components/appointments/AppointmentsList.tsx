'use client';

import { useState } from 'react';
import { Calendar, Plus, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type Appointment = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  type: string;
  status: string;
  contact: { fullName: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  VISIT: 'Visite', CALL: 'Appel', FOLLOWUP: 'Suivi', MEETING: 'Rencontre',
  INSPECTION: 'Inspection', DEADLINE: 'Échéance', REMINDER: 'Rappel',
};
const TYPE_COLORS: Record<string, string> = {
  VISIT: 'bg-blue-500/20 text-blue-300', CALL: 'bg-green-500/20 text-green-300',
  FOLLOWUP: 'bg-yellow-500/20 text-yellow-300', MEETING: 'bg-purple-500/20 text-purple-300',
  INSPECTION: 'bg-orange-500/20 text-orange-300', DEADLINE: 'bg-red-500/20 text-red-300',
  REMINDER: 'bg-slate-500/20 text-slate-300',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-300', CONFIRMED: 'bg-green-500/20 text-green-300',
  CANCELLED: 'bg-red-500/20 text-red-300', DONE: 'bg-slate-500/20 text-slate-300',
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmé', CANCELLED: 'Annulé', DONE: 'Terminé',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fromLocalInputValue(value: string) {
  return new Date(value).toISOString();
}

function AppointmentCard({ apt, onStatusChange }: { apt: Appointment; onStatusChange: () => void }) {
  const [loading, setLoading] = useState(false);

  async function markDone() {
    setLoading(true);
    await fetch(`/api/crm/appointments/${apt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...apt, startAt: apt.startAt, endAt: apt.endAt, status: 'DONE' }),
    });
    setLoading(false);
    onStatusChange();
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 flex gap-4 items-start">
      <div className="flex flex-col items-center text-center min-w-[52px]">
        <span className="text-lg font-bold text-white">{new Date(apt.startAt).getDate()}</span>
        <span className="text-xs text-slate-400">{new Date(apt.startAt).toLocaleDateString('fr-CA', { month: 'short' })}</span>
        <span className="mt-1 text-xs font-medium text-primary-300">{formatTime(apt.startAt)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <h3 className="font-semibold text-white text-sm">{apt.title}</h3>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[apt.type] ?? 'bg-slate-700 text-slate-300'}`}>
            {TYPE_LABELS[apt.type] ?? apt.type}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[apt.status] ?? 'bg-slate-700 text-slate-300'}`}>
            {STATUS_LABELS[apt.status] ?? apt.status}
          </span>
        </div>
        {apt.contact && (
          <div className="flex items-center gap-1 mt-1">
            <User size={12} className="text-slate-400" />
            <span className="text-xs text-slate-400">{apt.contact.fullName}</span>
          </div>
        )}
        {apt.description && <p className="mt-1 text-xs text-slate-400 line-clamp-2">{apt.description}</p>}
        <div className="flex items-center gap-1 mt-2">
          <Clock size={12} className="text-slate-500" />
          <span className="text-xs text-slate-500">{formatTime(apt.startAt)} → {formatTime(apt.endAt)}</span>
        </div>
      </div>
      {apt.status !== 'DONE' && apt.status !== 'CANCELLED' && (
        <button
          onClick={markDone}
          disabled={loading}
          className="text-xs text-slate-400 hover:text-green-400 transition-colors shrink-0"
        >
          ✓ Terminé
        </button>
      )}
    </div>
  );
}

function NewAppointmentForm({ contacts, onCreated }: { contacts: { id: string; fullName: string }[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', type: 'MEETING', status: 'PENDING', startAt: '', endAt: '',
    description: '', contactId: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }

    if (!form.startAt || !form.endAt) {
      setError('Les dates de debut et de fin sont obligatoires.');
      return;
    }

    const startDate = new Date(form.startAt);
    const endDate = new Date(form.endAt);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      setError('La date de fin doit etre posterieure a la date de debut.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        startAt: fromLocalInputValue(form.startAt),
        endAt: fromLocalInputValue(form.endAt),
      };

      const response = await fetch('/api/crm/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Creation impossible');
      }

      setOpen(false);
      setForm({ title: '', type: 'MEETING', status: 'PENDING', startAt: '', endAt: '', description: '', contactId: '' });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors">
        <Plus size={16} /> Nouveau rendez-vous
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-3">
      <h3 className="font-semibold text-white">Nouveau rendez-vous</h3>
      {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input required placeholder="Titre *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="col-span-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Début *</label>
          <input type="datetime-local" required value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Fin *</label>
          <input type="datetime-local" required value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white" />
        </div>
        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={form.contactId} onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
          <option value="">— Contact (optionnel) —</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
        </select>
        <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="col-span-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 resize-none" />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => {
          setOpen(false);
          setError(null);
        }} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Annuler</button>
        <button type="submit" disabled={loading} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50">
          {loading ? 'Création...' : 'Créer'}
        </button>
      </div>
    </form>
  );
}

interface AppointmentsListProps {
  session: { fullName: string; role: string };
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
}

export function AppointmentsList({ todayAppointments, upcomingAppointments }: AppointmentsListProps) {
  const [refresh, setRefresh] = useState(0);
  const [contacts] = useState<{ id: string; fullName: string }[]>([]);

  const allEmpty = todayAppointments.length === 0 && upcomingAppointments.length === 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Calendar size={22} /> Calendrier</h2>
          <p className="text-sm text-slate-400 mt-0.5">Vos rendez-vous et événements</p>
        </div>
        <NewAppointmentForm contacts={contacts} onCreated={() => setRefresh(r => r + 1)} />
      </div>

      {/* Aujourd'hui */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Aujourd'hui</h3>
        {todayAppointments.length === 0 ? (
          <p className="text-sm text-slate-500 italic px-1">Aucun rendez-vous aujourd'hui</p>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map(apt => (
              <AppointmentCard key={apt.id} apt={apt} onStatusChange={() => setRefresh(r => r + 1)} />
            ))}
          </div>
        )}
      </div>

      {/* À venir */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">À venir</h3>
        {upcomingAppointments.length === 0 ? (
          <p className="text-sm text-slate-500 italic px-1">Aucun rendez-vous à venir</p>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map(apt => (
              <AppointmentCard key={apt.id} apt={apt} onStatusChange={() => setRefresh(r => r + 1)} />
            ))}
          </div>
        )}
      </div>

      {allEmpty && (
        <div className="text-center py-16 text-slate-500">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucun rendez-vous planifié</p>
          <p className="text-xs mt-1">Créez votre premier rendez-vous avec le bouton ci-dessus</p>
        </div>
      )}
    </section>
  );
}
