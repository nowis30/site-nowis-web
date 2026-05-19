'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckSquare, Plus, AlertCircle, Clock, FolderOpen, Phone, Mail, Music2, ArrowUpRight, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { extractIncomingMessageTaskMeta } from '@/lib/contact-message-tasks';
import { TaskPayloadRecord, TaskType, coerceTaskPayload, coerceTaskType } from '@/features/crm/tasks/task-normalization';

type TaskPayload = TaskPayloadRecord & {
  fullName?: string;
  phone?: string;
  email?: string;
  subject?: string;
  summary?: string;
  note?: string;
  style?: string;
  mood?: string;
  theme?: string;
  references?: string;
  lyricsSnippet?: string;
  deadline?: string;
  songRequestId?: string;
  actionUrl?: string;
  actionLabel?: string;
  recipientName?: string;
  eventType?: string;
};

type EmailDraft = {
  taskId: string;
  to: string;
  subject: string;
  message: string;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  type: TaskType | string | null;
  payload: unknown;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  linkedType: string | null;
  linkedId: string | null;
  isAutoCreated?: boolean;
  songRequestId?: string | null;
  workshopRequestId?: string | null;
  commercialQuoteId?: string | null;
  invoiceId?: string | null;
  appointmentId?: string | null;
  clientName?: string | null;
  caseRecord: { title: string; referenceCode: string } | null;
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-500/20 text-slate-300',
  MEDIUM: 'bg-yellow-500/20 text-yellow-300',
  HIGH: 'bg-red-500/20 text-red-300',
};
const PRIORITY_LABELS: Record<string, string> = { LOW: 'Faible', MEDIUM: 'Normal', HIGH: 'Urgent' };
const TASK_TYPE_LABELS: Record<TaskType, string> = {
  CALL: 'Appel',
  EMAIL: 'Email',
  SONG: 'Chanson',
  CALLBACK: 'Rappel client',
  CREATE_QUOTE: 'Créer soumission',
  CREATE_INVOICE: 'Créer facture',
  CREATE_SONG: 'Créer chanson',
  UPLOAD_SONG_FILE: 'Déposer fichiers chanson',
  SCHEDULE_WORKSHOP: 'Planifier atelier',
  FOLLOW_UP: 'Suivi',
  DOCUMENT_REVIEW: 'Révision document',
  CUSTOM: 'Personnalisée',
};

function getLinkedResourceHref(task: Task): { href: string; label: string } | null {
  if (task.invoiceId) {
    return { href: `/crm/invoices/${task.invoiceId}`, label: 'Voir la facture' };
  }
  if (task.commercialQuoteId) {
    return { href: `/crm/commercial-quotes/${task.commercialQuoteId}`, label: 'Voir la soumission' };
  }
  if (task.workshopRequestId) {
    return { href: `/crm/workshop-requests/${task.workshopRequestId}`, label: "Voir l'atelier" };
  }
  if (task.songRequestId) {
    return { href: `/crm/song-requests/${task.songRequestId}`, label: 'Voir la chanson' };
  }
  if (task.appointmentId) {
    return { href: `/crm/calendar`, label: 'Voir le calendrier' };
  }
  if (!task.linkedType || !task.linkedId) return null;
  switch (task.linkedType) {
    case 'CONTACT':
      return { href: `/crm/contacts/${task.linkedId}`, label: 'Voir le contact' };
    case 'INVOICE':
      return { href: `/crm/invoices/${task.linkedId}`, label: 'Voir la facture' };
    case 'CASE':
      return { href: `/crm/cases/${task.linkedId}`, label: 'Voir le dossier' };
    case 'SONG_REQUEST':
      return { href: `/crm/song-requests/${task.linkedId}`, label: 'Voir la demande' };
    case 'ORGANIZATION':
      return { href: `/crm/organizations/${task.linkedId}`, label: "Voir l'organisation" };
    case 'WORKSHOP_REQUEST':
      return { href: `/crm/workshop-requests/${task.linkedId}`, label: "Voir l'atelier" };
    case 'APPOINTMENT':
      return { href: `/crm/appointments/${task.linkedId}`, label: 'Voir le rendez-vous' };
    default:
      return null;
  }
}

function parseTaskPayload(payload: unknown): TaskPayload | null {
  const normalized = coerceTaskPayload(payload);
  if (!normalized) return null;
  return normalized as TaskPayload;
}

function isOverdue(task: Task) {
  if (!task.dueDate || task.status === 'DONE' || task.status === 'CANCELLED') return false;
  return new Date(task.dueDate) < new Date();
}

function TaskCard({ task, onUpdate, onComposeEmail }: { task: Task; onUpdate: () => void; onComposeEmail: (draft: EmailDraft) => void }) {
  const [loading, setLoading] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const normalizedType = coerceTaskType(task.type);
  const { description } = extractIncomingMessageTaskMeta(task.description);
  const payload = parseTaskPayload(task.payload);
  const songRequestId = payload?.songRequestId || (task.linkedType === 'SONG_REQUEST' ? task.linkedId ?? undefined : undefined);
  const linkedResource = (() => {
    const res = getLinkedResourceHref(task);
    if (!res) return null;
    // Ne pas dupliquer si le lien SONG est déjà affiché pour la même ressource
    if (normalizedType === 'SONG' && task.linkedType === 'SONG_REQUEST' && songRequestId === task.linkedId) return null;
    return res;
  })();

  async function changeStatus(status: Task['status']) {
    setLoading(true);
    await fetch(`/api/crm/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    onUpdate();
  }

  async function cancelTask() {
    const ok = window.confirm('Archiver cette tâche ? Elle disparaîtra de la vue active.');
    if (!ok) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/crm/tasks/${task.id}`, { method: 'DELETE' });
      if (!response.ok) {
        let message = 'Impossible d\'annuler la tâche.';
        try {
          const body = await response.json();
          if (body?.error && typeof body.error === 'string') {
            message = body.error;
          }
        } catch {
          // Ignore JSON parse errors and keep the default message.
        }
        window.alert(message);
        return;
      }
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  async function editTask() {
    const nextTitle = window.prompt('Modifier le titre de la tâche', task.title);
    if (!nextTitle || nextTitle.trim().length === 0) return;
    const nextDescription = window.prompt('Modifier la description (optionnel)', task.description || '') ?? '';

    setLoading(true);
    await fetch(`/api/crm/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: nextTitle.trim(),
        description: nextDescription.trim() || null,
      }),
    });
    setLoading(false);
    onUpdate();
  }

  return (
    <div className={`rounded-2xl border p-3.5 md:p-4 space-y-3 ${isOverdue(task) ? 'border-red-700/50 bg-red-950/20' : 'border-slate-700 bg-slate-800/50'}`}>
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => changeStatus(task.status === 'DONE' ? 'TODO' : 'DONE')}
          disabled={loading || task.status === 'CANCELLED'}
          className={`mt-0.5 shrink-0 h-5 w-5 rounded border transition-colors ${task.status === 'DONE' ? 'bg-green-500 border-green-500' : 'border-slate-500 hover:border-primary-400'}`}
        >
          {task.status === 'DONE' && <span className="text-white text-[10px] flex items-center justify-center h-full">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
              {TASK_TYPE_LABELS[normalizedType]}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[task.priority]}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
          </div>
          <p className={`text-sm font-medium ${task.status === 'DONE' || task.status === 'CANCELLED' ? 'line-through text-slate-500' : 'text-white'}`}>{task.title}</p>
          {task.clientName ? <p className="text-xs text-slate-400">Client: {task.clientName}</p> : null}
          {(payload?.summary || description) && <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{payload?.summary || description}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pl-7">
        {task.dueDate && (
          <span className={`flex items-center gap-1 text-xs ${isOverdue(task) ? 'text-red-400' : 'text-slate-400'}`}>
            {isOverdue(task) && <AlertCircle size={11} />}
            <Clock size={11} />
            {new Date(task.dueDate).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
          </span>
        )}
        {task.caseRecord && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <FolderOpen size={11} />
            {task.caseRecord.referenceCode}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pl-7">
        {normalizedType === 'CALL' && payload?.phone ? (
          <a href={`tel:${payload.phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20">
            <Phone size={12} />
            Appeler
          </a>
        ) : null}
        {normalizedType === 'EMAIL' && payload?.email ? (
          <button
            type="button"
            onClick={() => onComposeEmail({
              taskId: task.id,
              to: payload.email || '',
              subject: payload.subject || task.title,
              message: payload.note || description || '',
            })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/20"
          >
            <Mail size={12} />
            Envoyer un email
          </button>
        ) : null}
        {normalizedType === 'SONG' && songRequestId ? (
          <Link href={`/crm/song-requests/${songRequestId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/10 px-2.5 py-1.5 text-xs font-medium text-fuchsia-300 hover:bg-fuchsia-500/20">
            <Music2 size={12} />
            Ouvrir la demande
          </Link>
        ) : null}
        {payload?.actionUrl ? (
          <a href={payload.actionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-primary-500/40 bg-primary-500/10 px-2.5 py-1.5 text-xs font-medium text-primary-300 hover:bg-primary-500/20">
            <ArrowUpRight size={12} />
            {payload.actionLabel || 'Ouvrir action'}
          </a>
        ) : null}
        {linkedResource && (
          <Link href={linkedResource.href} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-500/40 bg-slate-800/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700/60">
            <ArrowUpRight size={12} />
            {linkedResource.label}
          </Link>
        )}
      </div>

      <div className="pl-7">
        <button
          type="button"
          onClick={() => setOpenDetails((prev) => !prev)}
          className="inline-flex min-h-9 items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white"
        >
          {openDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {openDetails ? 'Masquer les détails' : 'Voir les détails'}
        </button>
      </div>

      {openDetails ? (
        <div className="grid gap-2 pl-7 text-xs text-slate-300 sm:grid-cols-2">
          {normalizedType === 'CALL' ? (
            <>
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5"><span className="text-slate-500">Nom</span><p className="mt-0.5 text-slate-100">{payload?.fullName || 'Non renseigné'}</p></div>
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5"><span className="text-slate-500">Téléphone</span><p className="mt-0.5 text-slate-100">{payload?.phone || 'Non renseigné'}</p></div>
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5"><span className="text-slate-500">Email</span><p className="mt-0.5 text-slate-100">{payload?.email || 'Non renseigné'}</p></div>
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5 sm:col-span-2"><span className="text-slate-500">Résumé</span><p className="mt-0.5 text-slate-100">{payload?.summary || description || 'Aucun résumé'}</p></div>
            </>
          ) : null}
          {normalizedType === 'EMAIL' ? (
            <>
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5"><span className="text-slate-500">Email</span><p className="mt-0.5 text-slate-100">{payload?.email || 'Non renseigné'}</p></div>
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5"><span className="text-slate-500">Sujet</span><p className="mt-0.5 text-slate-100">{payload?.subject || 'Sans sujet'}</p></div>
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5 sm:col-span-2"><span className="text-slate-500">Note</span><p className="mt-0.5 text-slate-100">{payload?.note || description || 'Aucune note'}</p></div>
            </>
          ) : null}
          {normalizedType === 'SONG' ? (
            <>
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5"><span className="text-slate-500">Style</span><p className="mt-0.5 text-slate-100">{payload?.style || 'Non défini'}</p></div>
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5"><span className="text-slate-500">Émotion</span><p className="mt-0.5 text-slate-100">{payload?.mood || 'Non définie'}</p></div>
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5"><span className="text-slate-500">Thème</span><p className="mt-0.5 text-slate-100">{payload?.theme || 'Non défini'}</p></div>
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5"><span className="text-slate-500">Délai</span><p className="mt-0.5 text-slate-100">{payload?.deadline || (task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-CA') : 'Non défini')}</p></div>
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5 sm:col-span-2"><span className="text-slate-500">Références</span><p className="mt-0.5 text-slate-100">{payload?.references || 'Aucune'}</p></div>
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5 sm:col-span-2"><span className="text-slate-500">Texte à inclure</span><p className="mt-0.5 text-slate-100">{payload?.lyricsSnippet || 'Aucun texte fourni'}</p></div>
              <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5 sm:col-span-2"><span className="text-slate-500">Notes</span><p className="mt-0.5 text-slate-100">{payload?.note || description || 'Aucune note'}</p></div>
            </>
          ) : null}
          {normalizedType === 'FOLLOW_UP' ? (
            <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2.5 sm:col-span-2"><span className="text-slate-500">Détails</span><p className="mt-0.5 text-slate-100">{description || payload?.note || 'Aucun détail'}</p></div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 pl-7">
        <button
          type="button"
          onClick={editTask}
          disabled={loading || task.status === 'CANCELLED'}
          className="rounded-lg border border-slate-500/40 bg-slate-700/30 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700/50 disabled:opacity-60"
        >
          Modifier
        </button>
        <button
          type="button"
          onClick={cancelTask}
          disabled={loading || task.status === 'CANCELLED'}
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-1.5"><Trash2 size={12} /> Archiver</span>
        </button>
        {task.status !== 'DONE' && task.status !== 'CANCELLED' && (
          <>
          {task.status === 'TODO' && (
            <button type="button" onClick={() => changeStatus('IN_PROGRESS')} disabled={loading} className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-300 hover:bg-yellow-500/20 disabled:opacity-60">
              Passer en cours
            </button>
          )}
          {task.status === 'IN_PROGRESS' && (
            <button type="button" onClick={() => changeStatus('DONE')} disabled={loading} className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-300 hover:bg-green-500/20 disabled:opacity-60">
              Marquer terminée
            </button>
          )}
          </>
        )}
      </div>
    </div>
  );
}

function NewTaskForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'FOLLOW_UP' as TaskType,
    priority: 'MEDIUM',
    dueDate: '',
    phone: '',
    fullName: '',
    subject: '',
    summary: '',
    note: '',
    style: '',
    mood: '',
    theme: '',
    references: '',
    lyricsSnippet: '',
    deadline: '',
    recipientName: '',
    eventType: '',
    email: '',
    songRequestId: '',
    actionUrl: '',
    actionLabel: '',
  });

  function buildPayload() {
    const payload: TaskPayload = {};
    if (form.type === 'CALL' && form.phone.trim()) payload.phone = form.phone.trim();
    if (form.type === 'CALL' && form.fullName.trim()) payload.fullName = form.fullName.trim();
    if (form.type === 'CALL' && form.summary.trim()) payload.summary = form.summary.trim();
    if (form.type === 'EMAIL' && form.email.trim()) payload.email = form.email.trim();
    if (form.type === 'EMAIL' && form.subject.trim()) payload.subject = form.subject.trim();
    if (form.type === 'EMAIL' && form.note.trim()) payload.note = form.note.trim();
    if (form.type === 'SONG' && form.songRequestId.trim()) payload.songRequestId = form.songRequestId.trim();
    if (form.type === 'SONG' && form.style.trim()) payload.style = form.style.trim();
    if (form.type === 'SONG' && form.mood.trim()) payload.mood = form.mood.trim();
    if (form.type === 'SONG' && form.theme.trim()) payload.theme = form.theme.trim();
    if (form.type === 'SONG' && form.references.trim()) payload.references = form.references.trim();
    if (form.type === 'SONG' && form.lyricsSnippet.trim()) payload.lyricsSnippet = form.lyricsSnippet.trim();
    if (form.type === 'SONG' && form.deadline.trim()) payload.deadline = form.deadline.trim();
    if (form.type === 'SONG' && form.note.trim()) payload.note = form.note.trim();
    if (form.type === 'SONG' && form.recipientName.trim()) payload.recipientName = form.recipientName.trim();
    if (form.type === 'SONG' && form.eventType.trim()) payload.eventType = form.eventType.trim();
    if (form.actionUrl.trim()) payload.actionUrl = form.actionUrl.trim();
    if (form.actionLabel.trim()) payload.actionLabel = form.actionLabel.trim();
    return Object.keys(payload).length > 0 ? payload : undefined;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/crm/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        type: form.type,
        payload: buildPayload(),
        priority: form.priority,
        status: 'TODO',
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      }),
    });
    setLoading(false);
    setOpen(false);
    setForm({ title: '', description: '', type: 'FOLLOW_UP', priority: 'MEDIUM', dueDate: '', phone: '', fullName: '', subject: '', summary: '', note: '', style: '', mood: '', theme: '', references: '', lyricsSnippet: '', deadline: '', recipientName: '', eventType: '', email: '', songRequestId: '', actionUrl: '', actionLabel: '' });
    onCreated();
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors">
      <Plus size={16} /> Nouvelle tâche
    </button>
  );

  return (
    <form onSubmit={submit} className="mb-4 space-y-3 rounded-xl border border-slate-700 bg-slate-800 p-4">
      <h3 className="font-semibold text-white text-sm">Nouvelle tâche</h3>
      <input required placeholder="Titre *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TaskType }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
          <option value="FOLLOW_UP">Suivi</option>
          <option value="CALL">Appel</option>
          <option value="EMAIL">Email</option>
          <option value="SONG">Chanson</option>
          <option value="CALLBACK">Rappel client</option>
          <option value="CREATE_QUOTE">Créer soumission</option>
          <option value="CREATE_INVOICE">Créer facture</option>
          <option value="CREATE_SONG">Créer chanson</option>
          <option value="UPLOAD_SONG_FILE">Déposer fichiers chanson</option>
          <option value="SCHEDULE_WORKSHOP">Planifier atelier</option>
          <option value="DOCUMENT_REVIEW">Révision document</option>
          <option value="CUSTOM">Personnalisée</option>
        </select>
        <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
          <option value="LOW">Faible</option><option value="MEDIUM">Normal</option><option value="HIGH">Urgent</option>
        </select>
        <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} placeholder="Date limite" className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {form.type === 'CALL' && (
          <>
            <input placeholder="Nom (optionnel)" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
            <input required placeholder="Téléphone à appeler" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
            <input type="email" placeholder="Email (optionnel)" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
            <input placeholder="Résumé (optionnel)" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
          </>
        )}
        {form.type === 'EMAIL' && (
          <>
            <input required type="email" placeholder="Email destinataire" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
            <input placeholder="Sujet (optionnel)" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
            <input placeholder="Note (optionnel)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 sm:col-span-2" />
          </>
        )}
        {form.type === 'SONG' && (
          <>
            <input placeholder="ID demande chanson (optionnel)" value={form.songRequestId} onChange={e => setForm(f => ({ ...f, songRequestId: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
            <input placeholder="Style" value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
            <input placeholder="Émotion" value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
            <input placeholder="Thème" value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
            <input placeholder="Références" value={form.references} onChange={e => setForm(f => ({ ...f, references: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 sm:col-span-2" />
            <input placeholder="Texte à inclure" value={form.lyricsSnippet} onChange={e => setForm(f => ({ ...f, lyricsSnippet: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 sm:col-span-2" />
            <input placeholder="Délai" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
            <input placeholder="Destinataire" value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
            <input placeholder="Occasion" value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
            <input placeholder="Notes song" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 sm:col-span-2" />
          </>
        )}
        <input type="url" placeholder="Lien d'action rapide (optionnel)" value={form.actionUrl} onChange={e => setForm(f => ({ ...f, actionUrl: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
        <input placeholder="Label du lien (optionnel)" value={form.actionLabel} onChange={e => setForm(f => ({ ...f, actionLabel: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
      </div>
      <textarea placeholder="Description (optionnel)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 resize-none" />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Annuler</button>
        <button type="submit" disabled={loading} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50">{loading ? 'Création...' : 'Créer'}</button>
      </div>
    </form>
  );
}

interface TasksPageProps { todo: Task[]; inProgress: Task[]; done: Task[]; cancelled: Task[]; }

export function TasksPage({ todo, inProgress, done, cancelled }: TasksPageProps) {
  const router = useRouter();
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TaskType>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [clientFilter, setClientFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  async function sendTaskEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!emailDraft) return;

    setSendingEmail(true);
    setEmailError(null);
    try {
      const response = await fetch(`/api/crm/tasks/${emailDraft.taskId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: emailDraft.subject, message: emailDraft.message }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Envoi impossible');
      }

      setEmailDraft(null);
      router.refresh();
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSendingEmail(false);
    }
  }

  function matchesFilters(task: Task) {
    const normalizedType = coerceTaskType(task.type);
    const normalizedClientName = (task.clientName || '').toLowerCase();
    const needle = clientFilter.trim().toLowerCase();

    if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && normalizedType !== typeFilter) return false;
    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
    if (needle.length > 0 && !normalizedClientName.includes(needle)) return false;
    return true;
  }

  const columns = [
    { label: 'À faire', tasks: todo.filter(matchesFilters), color: 'text-slate-300', accent: 'border-l-slate-500' },
    { label: 'En cours', tasks: inProgress.filter(matchesFilters), color: 'text-yellow-300', accent: 'border-l-yellow-500' },
    ...(showArchived
      ? [
          { label: 'Terminées', tasks: done.filter(matchesFilters), color: 'text-green-300', accent: 'border-l-green-500' },
          { label: 'Annulées', tasks: cancelled.filter(matchesFilters), color: 'text-rose-300', accent: 'border-l-rose-500' },
        ]
      : []),
  ];

  const overdueCount = [...todo, ...inProgress].filter(matchesFilters).filter(isOverdue).length;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><CheckSquare size={22} /> Tâches</h2>
          {overdueCount > 0 && (
            <p className="text-sm text-red-400 mt-0.5 flex items-center gap-1"><AlertCircle size={13} /> {overdueCount} tâche{overdueCount > 1 ? 's' : ''} en retard</p>
          )}
        </div>
        <NewTaskForm onCreated={() => router.refresh()} />
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3 sm:grid-cols-5">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
          <option value="ALL">Tous statuts</option>
          <option value="TODO">À faire</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="DONE">Terminées</option>
          <option value="CANCELLED">Annulées</option>
        </select>

        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
          <option value="ALL">Tous types</option>
          {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
          <option value="ALL">Toutes priorités</option>
          <option value="LOW">Faible</option>
          <option value="MEDIUM">Normal</option>
          <option value="HIGH">Urgent</option>
        </select>

        <input
          value={clientFilter}
          onChange={(event) => setClientFilter(event.target.value)}
          placeholder="Filtrer par client"
          className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400"
        />

        <button
          type="button"
          onClick={() => setShowArchived((prev) => !prev)}
          className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-600"
        >
          {showArchived ? 'Masquer les archives' : 'Voir les archives'}
        </button>
      </div>

      {!showArchived ? (
        <p className="text-xs text-slate-400">Les tâches terminées/annulées sont archivées et masquées. Activez « Voir les archives » pour les afficher.</p>
      ) : null}

      <div className={`grid grid-cols-1 gap-5 ${showArchived ? 'lg:grid-cols-4' : 'lg:grid-cols-2'}`}>
        {columns.map(col => (
          <div key={col.label} className={`rounded-2xl border border-slate-800 bg-slate-900/40 p-3.5 sm:p-4 ${col.accent} border-l-2`}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
              <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">{col.tasks.length}</span>
            </div>
            <div className="space-y-2">
              {col.tasks.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Aucune tâche</p>
              ) : (
                col.tasks.map(task => <TaskCard key={task.id} task={task} onUpdate={() => router.refresh()} onComposeEmail={setEmailDraft} />)
              )}
            </div>
          </div>
        ))}
      </div>

      {emailDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <form onSubmit={sendTaskEmail} className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Envoyer un email depuis la tâche</h3>
                <p className="mt-1 text-sm text-slate-400">Destinataire: {emailDraft.to}</p>
              </div>
              <button type="button" onClick={() => setEmailDraft(null)} className="text-sm text-slate-400 hover:text-white">Fermer</button>
            </div>

            <div className="mt-4 space-y-3">
              <input
                value={emailDraft.subject}
                onChange={(event) => setEmailDraft((current) => current ? { ...current, subject: event.target.value } : current)}
                required
                placeholder="Sujet"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              />
              <textarea
                value={emailDraft.message}
                onChange={(event) => setEmailDraft((current) => current ? { ...current, message: event.target.value } : current)}
                required
                rows={6}
                placeholder="Message"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white"
              />
            </div>

            {emailError ? <p className="mt-3 text-sm text-red-300">{emailError}</p> : null}

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setEmailDraft(null)} className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-200">Annuler</button>
              <button type="submit" disabled={sendingEmail} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60">
                {sendingEmail ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
