'use client';

import { useState } from 'react';
import { buildDefaultInvoiceNumber, buildDefaultLeaseNumber } from './formatters';
import type { ContactPropertyOption, ContactWorkspaceContact } from './types';
import type { ContactActionType } from './ContactHeader';

export function ContactActionModal({
  action,
  contact,
  propertyOptions,
  onClose,
  onSaved,
}: {
  action: ContactActionType;
  contact: ContactWorkspaceContact;
  propertyOptions: ContactPropertyOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: action === 'note' ? 'Note interne' : '',
    description: '',
    songTitle: '',
    songType: 'Chanson amour',
    eventType: '',
    recipientName: contact.fullName,
    style: 'Pop',
    mood: 'Émotive',
    language: 'Français',
    theme: '',
    songBudget: '',
    dueDate: '',
    priority: 'MEDIUM',
    number: buildDefaultInvoiceNumber(contact.id),
    amount: '',
    dueDateInvoice: '',
    appointmentStart: '',
    appointmentEnd: '',
    appointmentType: 'MEETING',
    propertyId: contact.tenantProfile?.unit?.property?.id || '',
    leaseNumber: buildDefaultLeaseNumber(contact.id),
    leaseStart: '',
    leaseEnd: '',
    rentAmount: contact.tenantProfile?.leases[0]?.rentAmount ? String(contact.tenantProfile.leases[0].rentAmount) : '',
    securityDeposit: '',
    frequency: 'MONTHLY',
    leaseStatus: 'ACTIVE',
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/contacts/${contact.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          title: form.title,
          description: form.description,
          songTitle: form.songTitle,
          songType: form.songType,
          eventType: form.eventType,
          recipientName: form.recipientName,
          style: form.style,
          mood: form.mood,
          language: form.language,
          theme: form.theme,
          songBudget: form.songBudget,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
          priority: form.priority,
          number: form.number,
          amount: form.amount,
          dueDateInvoice: form.dueDateInvoice ? new Date(form.dueDateInvoice).toISOString() : undefined,
          appointmentStart: form.appointmentStart ? new Date(form.appointmentStart).toISOString() : undefined,
          appointmentEnd: form.appointmentEnd ? new Date(form.appointmentEnd).toISOString() : undefined,
          appointmentType: form.appointmentType,
          propertyId: form.propertyId,
          leaseNumber: form.leaseNumber,
          leaseStart: form.leaseStart ? new Date(form.leaseStart).toISOString() : undefined,
          leaseEnd: form.leaseEnd ? new Date(form.leaseEnd).toISOString() : undefined,
          rentAmount: form.rentAmount,
          securityDeposit: form.securityDeposit,
          frequency: form.frequency,
          leaseStatus: form.leaseStatus,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Enregistrement impossible');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-2xl rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Action rapide</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{action === 'note' ? 'Ajouter une note' : action === 'task' ? 'Ajouter une tâche' : action === 'invoice' ? 'Ajouter une facture' : action === 'appointment' ? 'Ajouter un rendez-vous' : action === 'song-request' ? 'Créer une demande chanson' : 'Ajouter un bail'}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white">Fermer</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {action !== 'lease' && action !== 'invoice' && action !== 'song-request' ? (
            <label className={action === 'note' ? 'md:col-span-2' : ''}>
              <span className="mb-2 block text-sm text-slate-300">Titre</span>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
            </label>
          ) : null}

          {action === 'song-request' ? (
            <>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Titre de la chanson</span>
                <input value={form.songTitle} onChange={(event) => setForm((current) => ({ ...current, songTitle: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Type</span>
                <input value={form.songType} onChange={(event) => setForm((current) => ({ ...current, songType: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Occasion</span>
                <input value={form.eventType} onChange={(event) => setForm((current) => ({ ...current, eventType: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Destinataire</span>
                <input value={form.recipientName} onChange={(event) => setForm((current) => ({ ...current, recipientName: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Style</span>
                <input value={form.style} onChange={(event) => setForm((current) => ({ ...current, style: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Ambiance</span>
                <input value={form.mood} onChange={(event) => setForm((current) => ({ ...current, mood: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Langue</span>
                <input value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Thème</span>
                <input value={form.theme} onChange={(event) => setForm((current) => ({ ...current, theme: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Budget</span>
                <input type="number" min="0" step="0.01" value={form.songBudget} onChange={(event) => setForm((current) => ({ ...current, songBudget: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
            </>
          ) : null}

          {action === 'task' ? (
            <>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Échéance</span>
                <input type="datetime-local" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Priorité</span>
                <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white">
                  {['LOW', 'MEDIUM', 'HIGH'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </>
          ) : null}

          {action === 'invoice' ? (
            <>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Numéro</span>
                <input value={form.number} onChange={(event) => setForm((current) => ({ ...current, number: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Montant</span>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm text-slate-300">Échéance</span>
                <input type="datetime-local" value={form.dueDateInvoice} onChange={(event) => setForm((current) => ({ ...current, dueDateInvoice: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
            </>
          ) : null}

          {action === 'appointment' ? (
            <>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Début</span>
                <input type="datetime-local" value={form.appointmentStart} onChange={(event) => setForm((current) => ({ ...current, appointmentStart: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Fin</span>
                <input type="datetime-local" value={form.appointmentEnd} onChange={(event) => setForm((current) => ({ ...current, appointmentEnd: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Type</span>
                <select value={form.appointmentType} onChange={(event) => setForm((current) => ({ ...current, appointmentType: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white">
                  {['VISIT', 'CALL', 'FOLLOWUP', 'MEETING', 'INSPECTION', 'DEADLINE', 'REMINDER'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Bien lié</span>
                <select value={form.propertyId} onChange={(event) => setForm((current) => ({ ...current, propertyId: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white">
                  <option value="">Aucun</option>
                  {propertyOptions.map((property) => <option key={property.id} value={property.id}>{property.label}</option>)}
                </select>
              </label>
            </>
          ) : null}

          {action === 'lease' ? (
            <>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Numéro de bail</span>
                <input value={form.leaseNumber} onChange={(event) => setForm((current) => ({ ...current, leaseNumber: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Loyer</span>
                <input type="number" min="0" step="0.01" value={form.rentAmount} onChange={(event) => setForm((current) => ({ ...current, rentAmount: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Début</span>
                <input type="datetime-local" value={form.leaseStart} onChange={(event) => setForm((current) => ({ ...current, leaseStart: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Fin</span>
                <input type="datetime-local" value={form.leaseEnd} onChange={(event) => setForm((current) => ({ ...current, leaseEnd: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Dépôt de sécurité</span>
                <input type="number" min="0" step="0.01" value={form.securityDeposit} onChange={(event) => setForm((current) => ({ ...current, securityDeposit: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Fréquence</span>
                <input value={form.frequency} onChange={(event) => setForm((current) => ({ ...current, frequency: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
            </>
          ) : null}

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm text-slate-300">Description</span>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800">Annuler</button>
          <button type="submit" disabled={loading} className="rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60">
            {loading ? 'Enregistrement...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}
