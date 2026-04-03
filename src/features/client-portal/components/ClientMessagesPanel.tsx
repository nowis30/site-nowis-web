'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessagesSquare } from 'lucide-react';
import { EmptyState, PageHeader, QuickActions, SectionCard, StatusBadge } from '@/features/client-portal/components/ui';

type ClientMessageItem = {
  id: string;
  senderType: 'ADMIN' | 'CLIENT';
  content: string;
  createdAt: string;
  isRead: boolean;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function ClientMessagesPanel({ initialItems }: { initialItems: ClientMessageItem[] }) {
  const [messages, setMessages] = useState<ClientMessageItem[]>(initialItems);
  const [content, setContent] = useState('');
  const [view, setView] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadNowisMessages = useMemo(
    () => messages.filter((item) => item.senderType === 'ADMIN' && !item.isRead).length,
    [messages],
  );

  const visibleMessages = useMemo(
    () => (view === 'unread' ? messages.filter((item) => item.senderType === 'ADMIN' && !item.isRead) : messages),
    [messages, view],
  );

  useEffect(() => {
    let active = true;

    async function syncMessages() {
      try {
        const response = await fetch('/api/client-portal/messages?markAsRead=1');
        const data = await response.json();
        if (!response.ok || !active) return;
        setMessages(data.items || []);
      } catch {
      }
    }

    syncMessages();

    return () => {
      active = false;
    };
  }, []);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/client-portal/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Envoi impossible');
      }

      setMessages((current) => [...current, data.item]);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Messages"
        subtitle="Canal direct avec l'équipe Nowis. Les messages non lus sont marqués comme lus à l'ouverture."
        actions={unreadNowisMessages > 0 ? <StatusBadge label={`${unreadNowisMessages} non lus`} tone="warning" /> : undefined}
      />

      <SectionCard title="Actions rapides">
        <QuickActions
          items={[
            { label: 'Nouveau message', description: 'Ouvrir la zone de réponse', href: '#reply' },
            { label: 'Répondre', description: 'Envoyer une réponse à Nowis', href: '#reply' },
            { label: 'Voir non lus', description: 'Filtrer les messages non lus', href: '/client/messages' },
            { label: 'Retour tableau de bord', description: 'Vue synthèse du dossier', href: '/client/dashboard' },
          ]}
        />
      </SectionCard>

      <SectionCard title="Conversation" subtitle="Historique trié du plus ancien au plus récent.">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setView('all')}
            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 ${view === 'all' ? 'border-primary-500/50 bg-primary-500/10 text-primary-200' : 'border-slate-700 text-slate-300 hover:border-primary-500/40 hover:text-white'}`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setView('unread')}
            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 ${view === 'unread' ? 'border-primary-500/50 bg-primary-500/10 text-primary-200' : 'border-slate-700 text-slate-300 hover:border-primary-500/40 hover:text-white'}`}
          >
            Non lus
          </button>
        </div>

        <div className="max-h-[30rem] space-y-3 overflow-y-auto pr-2">
          {visibleMessages.length === 0 ? (
            <EmptyState icon={<MessagesSquare size={18} />} title="Aucun message" description={view === 'unread' ? 'Aucun message non lu actuellement.' : 'Aucun message pour le moment.'} />
          ) : visibleMessages.map((item) => (
            <article key={item.id} className={`max-w-[96%] rounded-2xl border p-4 sm:max-w-[85%] ${item.senderType === 'CLIENT' ? 'ml-auto border-primary-500/40 bg-primary-500/10' : 'mr-auto border-slate-700 bg-slate-900/70'}`}>
              <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.senderType === 'CLIENT' ? 'Vous' : 'Nowis'}</p>
                <p className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{item.content}</p>
              {item.senderType === 'ADMIN' && !item.isRead ? <div className="mt-2"><StatusBadge label="Non lu" tone="warning" /></div> : null}
            </article>
          ))}
        </div>
      </SectionCard>

      <form id="reply" onSubmit={sendMessage} className="crm-surface rounded-3xl border border-slate-800/90 p-5 shadow-[0_8px_24px_rgba(2,6,23,0.2)] sm:p-7">
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-200">Votre réponse</span>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white transition placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60" placeholder="Écrire à l’équipe Nowis..." />
        </label>

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={loading} className="rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 disabled:opacity-60">
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </form>
    </section>
  );
}
