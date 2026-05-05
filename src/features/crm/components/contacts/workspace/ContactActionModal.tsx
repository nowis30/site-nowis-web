'use client';

import { useState } from 'react';
import type { ContactWorkspaceContact } from './types';
import type { ContactActionType } from './ContactHeader';

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Basse' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Haute' },
];

const APPOINTMENT_TYPE_OPTIONS = [
  { value: 'VISIT', label: 'Visite' },
  { value: 'CALL', label: 'Appel' },
  { value: 'FOLLOWUP', label: 'Suivi' },
  { value: 'MEETING', label: 'Rencontre' },
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'DEADLINE', label: 'Échéance' },
  { value: 'REMINDER', label: 'Rappel' },
];

const ORGANIZATION_TYPE_OPTIONS = [
  { value: 'SCHOOL', label: 'École' },
  { value: 'COMMUNITY_ORG', label: 'Organisme' },
  { value: 'DAYCARE', label: 'Garderie' },
  { value: 'CAMP', label: 'Camp' },
  { value: 'OTHER', label: 'Autre' },
];

const ORGANIZATION_STATUS_OPTIONS = [
  { value: 'LEAD', label: 'Prospection' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export function ContactActionModal({
  action,
  contact,
  onClose,
  onSaved,
}: {
  action: ContactActionType;
  contact: ContactWorkspaceContact;
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
    appointmentStart: '',
    appointmentEnd: '',
    appointmentType: 'MEETING',
    organizationName: contact.companyName || '',
    organizationType: 'OTHER',
    organizationStatus: 'LEAD',
    organizationEmail: contact.email || '',
    organizationPhone: contact.phone || '',
    organizationCity: '',
    organizationAddress: '',
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
          appointmentStart: form.appointmentStart ? new Date(form.appointmentStart).toISOString() : undefined,
          appointmentEnd: form.appointmentEnd ? new Date(form.appointmentEnd).toISOString() : undefined,
          appointmentType: form.appointmentType,
          organizationName: form.organizationName,
          organizationType: form.organizationType,
          organizationStatus: form.organizationStatus,
          organizationEmail: form.organizationEmail,
          organizationPhone: form.organizationPhone,
          organizationCity: form.organizationCity,
          organizationAddress: form.organizationAddress,
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
            <h3 className="mt-2 text-2xl font-semibold text-white">{action === 'note' ? 'Ajouter une note' : action === 'task' ? 'Ajouter une tâche' : action === 'appointment' ? 'Ajouter un rendez-vous' : action === 'organization' ? 'Créer une organisation' : 'Créer une demande chanson'}</h3>
                      <h3 className="mt-2 text-2xl font-semibold text-white">{action === 'note' ? 'Ajouter une note' : action === 'task' ? 'Ajouter une tâche' : action === 'appointment' ? 'Ajouter un rendez-vous' : action === 'organization' ? 'Créer une organisation' : 'Créer une demande chanson'}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white">Fermer</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
           {action !== 'song-request' ? (
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
                  {PRIORITY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
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
                  {APPOINTMENT_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
            </>
          ) : null}

          {action === 'organization' ? (
            <>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Nom de l'organisation</span>
                <input value={form.organizationName} onChange={(event) => setForm((current) => ({ ...current, organizationName: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Type</span>
                <select value={form.organizationType} onChange={(event) => setForm((current) => ({ ...current, organizationType: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white">
                  {ORGANIZATION_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Statut</span>
                <select value={form.organizationStatus} onChange={(event) => setForm((current) => ({ ...current, organizationStatus: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white">
                  {ORGANIZATION_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Ville</span>
                <input value={form.organizationCity} onChange={(event) => setForm((current) => ({ ...current, organizationCity: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Email</span>
                <input value={form.organizationEmail} onChange={(event) => setForm((current) => ({ ...current, organizationEmail: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label>
                <span className="mb-2 block text-sm text-slate-300">Téléphone</span>
                <input value={form.organizationPhone} onChange={(event) => setForm((current) => ({ ...current, organizationPhone: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm text-slate-300">Adresse</span>
                <input value={form.organizationAddress} onChange={(event) => setForm((current) => ({ ...current, organizationAddress: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" />
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
