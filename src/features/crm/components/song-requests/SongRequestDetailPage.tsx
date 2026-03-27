'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SongRequestFilesPanel } from './SongRequestFilesPanel';

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  user: { fullName: string } | null;
};

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
};

type SongRequestDetail = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  title: string;
  language: string;
  songType: string;
  tempo: 'LENT' | 'MOYEN' | 'RAPIDE';
  occasion: string;
  eventType: string;
  recipientName: string;
  specialMessage: string | null;
  style: string;
  mood: string;
  theme: string;
  description: string;
  inspirations: string | null;
  lyrics: string | null;
  structureVerse: string;
  structureChorus: string;
  structureBridge: string | null;
  fileUrl: string | null;
  details: string;
  budget: string | number | null;
  desiredDeadline: string | null;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'IN_PROGRESS' | 'IN_PRODUCTION' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  convertedAppointmentId: string | null;
  convertedInvoiceId: string | null;
  createdAt: string;
  contact: { id: string; fullName: string; email: string | null; phone: string | null };
  activities: ActivityItem[];
  tasks: TaskItem[];
  files: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    category: string;
    visibility: 'ADMIN_ONLY' | 'CLIENT_VISIBLE';
    createdAt: string;
  }>;
};

const STATUS_LABELS: Record<SongRequestDetail['status'], string> = {
  NEW: 'Nouveau',
  CONTACTED: 'Contacté',
  QUOTED: 'Soumission',
  IN_PROGRESS: 'En cours',
  IN_PRODUCTION: 'En production',
  DELIVERED: 'Livré',
  COMPLETED: 'Complété',
  CANCELLED: 'Annulé',
};

interface SongRequestDetailPageProps {
  item: SongRequestDetail;
  clientPortalUrl: string;
}

export function SongRequestDetailPage({ item, clientPortalUrl }: SongRequestDetailPageProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: 'mark_contacted' | 'convert_appointment' | 'mark_quoted' | 'mark_in_production' | 'mark_delivered') {
    setLoadingAction(action);
    setError(null);

    try {
      const response = await fetch(`/api/crm/song-requests/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? 'Action impossible');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingAction(null);
    }
  }

  const budgetLabel = item.budget === null ? '—' : new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(item.budget));

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Demande chanson</p>
          <h2 className="text-2xl font-semibold text-white">{item.fullName}</h2>
          <p className="text-sm text-slate-400">Soumise le {new Date(item.createdAt).toLocaleDateString('fr-CA')}</p>
        </div>

        <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300">
          {STATUS_LABELS[item.status]}
        </span>
      </div>

      {error ? <div className="rounded-xl border border-red-700/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Informations de la demande</h3>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div><dt className="text-slate-500">Titre</dt><dd className="text-white">{item.title}</dd></div>
            <div><dt className="text-slate-500">Nom</dt><dd className="text-white">{item.fullName}</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd className="text-white">{item.email}</dd></div>
            <div><dt className="text-slate-500">Téléphone</dt><dd className="text-white">{item.phone}</dd></div>
            <div><dt className="text-slate-500">Langue</dt><dd className="text-white">{item.language}</dd></div>
            <div><dt className="text-slate-500">Type de chanson</dt><dd className="text-white">{item.songType}</dd></div>
            <div><dt className="text-slate-500">Tempo</dt><dd className="text-white">{item.tempo}</dd></div>
            <div><dt className="text-slate-500">Occasion</dt><dd className="text-white">{item.eventType || item.occasion}</dd></div>
            <div><dt className="text-slate-500">Personne concernée</dt><dd className="text-white">{item.recipientName}</dd></div>
            <div><dt className="text-slate-500">Style</dt><dd className="text-white">{item.style}</dd></div>
            <div><dt className="text-slate-500">Ambiance</dt><dd className="text-white">{item.mood}</dd></div>
            <div><dt className="text-slate-500">Thème</dt><dd className="text-white">{item.theme}</dd></div>
            <div><dt className="text-slate-500">Budget</dt><dd className="text-white">{budgetLabel}</dd></div>
            <div>
              <dt className="text-slate-500">Délai souhaité</dt>
              <dd className="text-white">{item.desiredDeadline ? new Date(item.desiredDeadline).toLocaleDateString('fr-CA') : '—'}</dd>
            </div>
          </dl>

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.description}</p>
          </div>

          {item.specialMessage ? (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Message spécial</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.specialMessage}</p>
            </div>
          ) : null}

          {item.inspirations ? (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Inspirations</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.inspirations}</p>
            </div>
          ) : null}

          {item.lyrics ? (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Paroles fournies</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.lyrics}</p>
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Couplet</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.structureVerse}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Refrain</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.structureChorus}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Pont</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{item.structureBridge || '—'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Actions</h3>
            <div className="mt-4 space-y-2">
              <Link href={`/crm/contacts/${item.contact.id}`} className="block rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-primary-500/40 hover:text-primary-300">
                Ouvrir le contact
              </Link>

              <a href={clientPortalUrl} target="_blank" rel="noreferrer" className="block rounded-lg border border-emerald-700/50 px-3 py-2 text-sm text-emerald-200 hover:border-emerald-500/60 hover:text-emerald-100">
                Ouvrir le portail client
              </a>

              <button
                type="button"
                onClick={() => runAction('mark_contacted')}
                disabled={loadingAction !== null}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:border-indigo-500/40 hover:text-indigo-300 disabled:opacity-60"
              >
                {loadingAction === 'mark_contacted' ? 'Mise à jour...' : 'Marquer comme contacté'}
              </button>

              <button
                type="button"
                onClick={() => runAction('convert_appointment')}
                disabled={loadingAction !== null}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:border-amber-500/40 hover:text-amber-300 disabled:opacity-60"
              >
                {loadingAction === 'convert_appointment' ? 'Conversion...' : 'Convertir en rendez-vous'}
              </button>

              <button
                type="button"
                onClick={() => runAction('mark_quoted')}
                disabled={loadingAction !== null}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:border-purple-500/40 hover:text-purple-300 disabled:opacity-60"
              >
                {loadingAction === 'mark_quoted' ? 'Conversion...' : 'Convertir en soumission'}
              </button>

              <button
                type="button"
                onClick={() => runAction('mark_in_production')}
                disabled={loadingAction !== null}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:border-fuchsia-500/40 hover:text-fuchsia-300 disabled:opacity-60"
              >
                {loadingAction === 'mark_in_production' ? 'Mise à jour...' : 'Marquer en production'}
              </button>

              <button
                type="button"
                onClick={() => runAction('mark_delivered')}
                disabled={loadingAction !== null}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:border-cyan-500/40 hover:text-cyan-300 disabled:opacity-60"
              >
                {loadingAction === 'mark_delivered' ? 'Mise à jour...' : 'Marquer comme livré'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-300">
            <p><span className="text-slate-500">Contact:</span> {item.contact.fullName}</p>
            <p><span className="text-slate-500">Email:</span> {item.contact.email ?? '—'}</p>
            <p><span className="text-slate-500">Téléphone:</span> {item.contact.phone ?? '—'}</p>
            <p><span className="text-slate-500">Source:</span> {item.source}</p>
            {item.fileUrl ? (
              <p className="mt-3 break-all">
                <span className="text-slate-500">Fichier:</span>{' '}
                <a href={item.fileUrl} target="_blank" rel="noreferrer" className="text-primary-300 hover:text-primary-200">
                  Ouvrir le fichier joint
                </a>
              </p>
            ) : null}
            <p className="mt-3 break-all"><span className="text-slate-500">Lien client:</span> {clientPortalUrl}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Activités liées</h3>
          <div className="mt-4 space-y-3">
            {item.activities.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune activité liée.</p>
            ) : (
              item.activities.map((activity) => (
                <div key={activity.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-sm font-medium text-white">{activity.title}</p>
                  {activity.description ? <p className="mt-1 whitespace-pre-wrap text-xs text-slate-300">{activity.description}</p> : null}
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(activity.createdAt).toLocaleString('fr-CA')} {activity.user ? `· ${activity.user.fullName}` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Tâches liées</h3>
          <div className="mt-4 space-y-3">
            {item.tasks.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune tâche liée.</p>
            ) : (
              item.tasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-sm font-medium text-white">{task.title}</p>
                  {task.description ? <p className="mt-1 text-xs text-slate-300">{task.description}</p> : null}
                  <p className="mt-1 text-xs text-slate-500">
                    {task.status} · {task.priority}
                    {task.dueDate ? ` · Échéance ${new Date(task.dueDate).toLocaleDateString('fr-CA')}` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Fichiers de la demande</h3>
        <div className="mt-4">
          <SongRequestFilesPanel
            mode="admin"
            songRequestId={item.id}
            contactId={item.contact.id}
            files={item.files}
          />
        </div>
      </div>
    </section>
  );
}
