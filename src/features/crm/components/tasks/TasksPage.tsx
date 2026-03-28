'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckSquare, Plus, AlertCircle, Clock, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { extractIncomingMessageTaskMeta, getIncomingMessageTaskHref } from '@/lib/contact-message-tasks';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  linkedType: string | null;
  linkedId: string | null;
  caseRecord: { title: string; referenceCode: string } | null;
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-500/20 text-slate-300',
  MEDIUM: 'bg-yellow-500/20 text-yellow-300',
  HIGH: 'bg-red-500/20 text-red-300',
};
const PRIORITY_LABELS: Record<string, string> = { LOW: 'Faible', MEDIUM: 'Normal', HIGH: 'Urgent' };

function isOverdue(task: Task) {
  if (!task.dueDate || task.status === 'DONE') return false;
  return new Date(task.dueDate) < new Date();
}

function TaskCard({ task, onUpdate }: { task: Task; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);
  const { description } = extractIncomingMessageTaskMeta(task.description);
  const messageHref = getIncomingMessageTaskHref(task);

  async function changeStatus(status: Task['status']) {
    setLoading(true);
    await fetch(`/api/crm/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: task.title, description: task.description, status,
        priority: task.priority, dueDate: task.dueDate, caseId: task.caseRecord?.title ? undefined : undefined,
      }),
    });
    setLoading(false);
    onUpdate();
  }

  return (
    <div className={`rounded-xl border p-3.5 space-y-2 ${isOverdue(task) ? 'border-red-700/50 bg-red-950/20' : 'border-slate-700 bg-slate-800/50'}`}>
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => changeStatus(task.status === 'DONE' ? 'TODO' : 'DONE')}
          disabled={loading}
          className={`mt-0.5 shrink-0 w-4 h-4 rounded border transition-colors ${task.status === 'DONE' ? 'bg-green-500 border-green-500' : 'border-slate-500 hover:border-primary-400'}`}
        >
          {task.status === 'DONE' && <span className="text-white text-[10px] flex items-center justify-center h-full">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-slate-500' : 'text-white'}`}>{task.title}</p>
          {description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{description}</p>}
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>
      <div className="flex items-center gap-3 pl-6">
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
        {messageHref && (
          <Link href={messageHref} className="text-xs text-primary-300 hover:text-primary-200">
            Ouvrir le message
          </Link>
        )}
        {task.status !== 'DONE' && (
          <div className="ml-auto flex gap-2">
            {task.status === 'TODO' && (
              <button type="button" onClick={() => changeStatus('IN_PROGRESS')} disabled={loading} className="text-xs text-slate-400 hover:text-yellow-400 transition-colors">▶ En cours</button>
            )}
            {task.status === 'IN_PROGRESS' && (
              <button type="button" onClick={() => changeStatus('DONE')} disabled={loading} className="text-xs text-slate-400 hover:text-green-400 transition-colors">✓ Terminer</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NewTaskForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/crm/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, status: 'TODO', dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined }),
    });
    setLoading(false);
    setOpen(false);
    setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
    onCreated();
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors">
      <Plus size={16} /> Nouvelle tâche
    </button>
  );

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3 mb-4">
      <h3 className="font-semibold text-white text-sm">Nouvelle tâche</h3>
      <input required placeholder="Titre *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400" />
      <div className="grid grid-cols-2 gap-3">
        <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white">
          <option value="LOW">Faible</option><option value="MEDIUM">Normal</option><option value="HIGH">Urgent</option>
        </select>
        <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} placeholder="Date limite" className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white" />
      </div>
      <textarea placeholder="Description (optionnel)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 resize-none" />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Annuler</button>
        <button type="submit" disabled={loading} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50">{loading ? 'Création...' : 'Créer'}</button>
      </div>
    </form>
  );
}

interface TasksPageProps { todo: Task[]; inProgress: Task[]; done: Task[]; }

export function TasksPage({ todo, inProgress, done }: TasksPageProps) {
  const router = useRouter();

  const columns = [
    { label: 'À faire', tasks: todo, color: 'text-slate-300', accent: 'border-l-slate-500' },
    { label: 'En cours', tasks: inProgress, color: 'text-yellow-300', accent: 'border-l-yellow-500' },
    { label: 'Terminées', tasks: done, color: 'text-green-300', accent: 'border-l-green-500' },
  ];

  const overdueCount = [...todo, ...inProgress].filter(isOverdue).length;

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><CheckSquare size={22} /> Tâches</h2>
          {overdueCount > 0 && (
            <p className="text-sm text-red-400 mt-0.5 flex items-center gap-1"><AlertCircle size={13} /> {overdueCount} tâche{overdueCount > 1 ? 's' : ''} en retard</p>
          )}
        </div>
        <NewTaskForm onCreated={() => router.refresh()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {columns.map(col => (
          <div key={col.label} className={`border-l-2 ${col.accent} pl-4`}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
              <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">{col.tasks.length}</span>
            </div>
            <div className="space-y-2">
              {col.tasks.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Aucune tâche</p>
              ) : (
                col.tasks.map(task => <TaskCard key={task.id} task={task} onUpdate={() => router.refresh()} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
