'use client';

import { useState } from 'react';

type AvailabilityItem = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  capacity: number | null;
};

const DAY_LABELS: Record<number, string> = { 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi', 7: 'Dimanche' };

export function WorkshopAvailabilityManager({ initialItems }: { initialItems: AvailabilityItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState({ weekday: 2, startTime: '09:00', endTime: '11:00', isActive: true, capacity: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/crm/workshop-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, capacity: form.capacity ? Number(form.capacity) : undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Création impossible');
      setItems((current) => [...current, data.item].sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)));
      setForm({ weekday: 2, startTime: '09:00', endTime: '11:00', isActive: true, capacity: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  async function toggle(item: AvailabilityItem) {
    const response = await fetch(`/api/crm/workshop-availability/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, isActive: !item.isActive }),
    });
    const data = await response.json();
    if (!response.ok) return;
    setItems((current) => current.map((entry) => entry.id === item.id ? data.item : entry));
  }

  async function remove(id: string) {
    const response = await fetch(`/api/crm/workshop-availability/${id}`, { method: 'DELETE' });
    if (!response.ok) return;
    setItems((current) => current.filter((entry) => entry.id !== id));
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Paramètres ateliers</h2>
        <p className="mt-2 text-sm text-slate-400">Définissez les plages ouvertes pour les ateliers. Les créneaux du mardi et du jeudi sont proposés par défaut, mais vous pouvez les ajuster.</p>
      </div>

      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:grid-cols-5">
        <label>
          <span className="mb-2 block text-xs uppercase tracking-wide text-slate-400">Jour</span>
          <select value={form.weekday} onChange={(event) => setForm((current) => ({ ...current, weekday: Number(event.target.value) }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
            <option value={2}>Mardi</option>
            <option value={4}>Jeudi</option>
          </select>
        </label>
        <label>
          <span className="mb-2 block text-xs uppercase tracking-wide text-slate-400">Début</span>
          <input type="time" value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
        </label>
        <label>
          <span className="mb-2 block text-xs uppercase tracking-wide text-slate-400">Fin</span>
          <input type="time" value={form.endTime} onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
        </label>
        <label>
          <span className="mb-2 block text-xs uppercase tracking-wide text-slate-400">Capacité</span>
          <input value={form.capacity} onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100" placeholder="Optionnel" />
        </label>
        <div className="flex items-end">
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60">{loading ? 'Ajout...' : 'Ajouter le créneau'}</button>
        </div>
        {error ? <p className="md:col-span-5 text-sm text-red-300">{error}</p> : null}
      </form>

      <div className="grid gap-3">
        {items.length === 0 ? <p className="text-sm text-slate-400">Aucune plage atelier configurée.</p> : items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{DAY_LABELS[item.weekday] || `Jour ${item.weekday}`} · {item.startTime} à {item.endTime}</p>
                <p className="mt-1 text-xs text-slate-400">{item.capacity ? `Capacité ${item.capacity}` : 'Capacité non limitée'} · {item.isActive ? 'Actif' : 'Désactivé'}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => toggle(item)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800">{item.isActive ? 'Désactiver' : 'Activer'}</button>
                <button type="button" onClick={() => remove(item.id)} className="rounded-lg border border-red-700/60 px-3 py-2 text-xs text-red-200 hover:bg-red-950/40">Supprimer</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
