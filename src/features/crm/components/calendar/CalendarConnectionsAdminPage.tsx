'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type ConnectionItem = {
  id: string;
  provider: 'GOOGLE' | 'MICROSOFT' | 'CALENDLY' | 'ICLOUD';
  accountEmail: string | null;
  accountName: string | null;
  status: 'CONNECTED' | 'EXPIRED' | 'ERROR' | 'DISCONNECTED';
  lastSyncedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
  hasRefreshToken: boolean;
};

function formatDate(value: string | null) {
  if (!value) return '\u2014';
  return new Intl.DateTimeFormat('fr-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusTone(status: ConnectionItem['status']) {
  if (status === 'CONNECTED') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (status === 'EXPIRED') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  if (status === 'ERROR') return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
  return 'border-slate-700 bg-slate-800/60 text-slate-300';
}

export function CalendarConnectionsAdminPage({
  initialConnections,
  initialStatus,
  initialProvider,
  initialError,
}: {
  initialConnections: ConnectionItem[];
  initialStatus?: string | null;
  initialProvider?: string | null;
  initialError?: string | null;
}) {
  const router = useRouter();
  const [connections, setConnections] = useState(initialConnections);
  const [message, setMessage] = useState<string | null>(
    initialStatus === 'connected' && initialProvider
      ? `${initialProvider} connecte avec succes.`
      : initialError || null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const googleConnections = connections.filter((item) => item.provider === 'GOOGLE');

  async function syncNow(connectionId?: string) {
    setBusyId(connectionId || 'all');
    setMessage(null);
    try {
      const response = await fetch('/api/crm/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionId ? { connectionId } : {}),
      });
      const data = await response.json().catch(() => null) as {
        error?: string;
        results?: Array<{ imported: number }>;
      } | null;
      if (!response.ok) throw new Error(data?.error || 'Synchronisation impossible');
      const imported = data?.results?.reduce((sum, item) => sum + item.imported, 0) || 0;
      setMessage(`Synchronisation terminee. ${imported} evenement(s) importe(s).`);
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Synchronisation impossible');
    } finally {
      setBusyId(null);
    }
  }

  async function disconnect(id: string) {
    if (!confirm('Deconnecter ce calendrier ?')) return;
    setBusyId(id);
    setMessage(null);
    try {
      const response = await fetch(`/api/crm/calendar/connections/${id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => null) as {
        error?: string;
        item?: ConnectionItem;
      } | null;
      if (!response.ok || !data?.item) throw new Error(data?.error || 'Deconnexion impossible');
      setConnections((current) => current.map((item) => (item.id === id ? data.item! : item)));
      setMessage('Calendrier deconnecte.');
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Deconnexion impossible');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Administration calendrier</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Calendriers connectes</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Connecte ton compte Google Calendar directement au CRM. Les tokens restent chiffres cote
            serveur et seuls les admins peuvent gerer ces connexions.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => void syncNow()}
            disabled={busyId === 'all' || isPending}
            className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm text-slate-200 hover:border-primary-500/40 hover:text-white disabled:opacity-60"
          >
            {busyId === 'all' ? 'Synchronisation...' : 'Synchroniser maintenant'}
          </button>
          <Link
            href="/crm/calendar"
            className="rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500"
          >
            Ouvrir le calendrier CRM
          </Link>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Google Calendar */}
        <article className="rounded-[1.75rem] border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Google Calendar</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Cree des rendez-vous CRM directement dans ton Google Calendar et synchronise les
                evenements a venir.
              </p>
            </div>
            <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
              {googleConnections.length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {googleConnections.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-4 text-sm text-slate-400">
                Aucun compte Google connecte.
              </p>
            ) : (
              googleConnections.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {item.accountName || item.accountEmail || 'Compte sans libelle'}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.accountEmail || 'Courriel non fourni'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusTone(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Derniere sync</dt>
                      <dd className="mt-1 text-slate-200">{formatDate(item.lastSyncedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Expiration token</dt>
                      <dd className="mt-1 text-slate-200">{formatDate(item.expiresAt)}</dd>
                    </div>
                  </dl>
                  {item.lastError ? (
                    <p className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                      {item.lastError}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => void syncNow(item.id)}
                      disabled={busyId === item.id || isPending || item.status === 'DISCONNECTED'}
                      className="rounded-2xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-primary-500/40 hover:text-white disabled:opacity-60"
                    >
                      {busyId === item.id ? 'Synchronisation...' : 'Synchroniser'}
                    </button>
                    <button
                      onClick={() => void disconnect(item.id)}
                      disabled={busyId === item.id || isPending || item.status === 'DISCONNECTED'}
                      className="rounded-2xl border border-rose-800/60 px-3 py-2 text-sm text-rose-200 hover:bg-rose-950/30 disabled:opacity-60"
                    >
                      Deconnecter
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5">
            <a
              href="/api/crm/calendar/google/connect"
              className="inline-flex rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500"
            >
              Connecter un compte Google
            </a>
          </div>
        </article>

        {/* iCloud phase 2 */}
        <article className="rounded-[1.75rem] border border-slate-800 bg-slate-900/70 p-5 opacity-60">
          <div>
            <h3 className="text-lg font-semibold text-white">iCloud Calendar</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Phase 2. La connexion iCloud necessite un mot de passe application Apple specifique,
              pas ton mot de passe habituel. Cette option sera ajoutee ulterieurement.
            </p>
          </div>
          <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-3 text-sm text-slate-400">
            Connexion iCloud non prise en charge pour le moment.
          </div>
        </article>
      </div>

      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 px-5 py-4 text-sm text-slate-400">
        <span className="font-medium text-slate-300">Google Calendar</span> &mdash; Utilise le lien
        d&apos;intégration Google Calendar pour la prise de rendez-vous. Aucune connexion OAuth
        additionnelle n&apos;est requise pour partager ce calendrier public.
      </div>
    </section>
  );
}
