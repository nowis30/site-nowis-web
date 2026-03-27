'use client';

import { useEffect, useMemo, useState } from 'react';

type MessageItem = {
  id: string;
  senderType: 'ADMIN' | 'CLIENT';
  content: string;
  createdAt: string;
  isRead: boolean;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function ContactMessages({
  contactId,
  initialMessages,
  onUnreadCountChange,
}: {
  contactId: string;
  initialMessages: MessageItem[];
  onUnreadCountChange?: (count: number) => void;
}) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadClientMessages = useMemo(
    () => messages.filter((item) => item.senderType === 'CLIENT' && !item.isRead).length,
    [messages],
  );

  useEffect(() => {
    onUnreadCountChange?.(unreadClientMessages);
  }, [onUnreadCountChange, unreadClientMessages]);

  useEffect(() => {
    let active = true;

    async function markAsRead() {
      try {
        const response = await fetch(`/api/crm/contacts/${contactId}/messages?markAsRead=1`);
        const data = await response.json();
        if (!response.ok || !active) return;
        setMessages(data.items || []);
      } catch {
      }
    }

    markAsRead();

    return () => {
      active = false;
    };
  }, [contactId]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/crm/contacts/${contactId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
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
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Conversation client</h3>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{messages.length} message(s)</span>
        </div>

        <div className="mt-5 max-h-[28rem] space-y-3 overflow-y-auto pr-2">
          {messages.length === 0 ? <p className="text-sm text-slate-400">Aucun message pour ce contact.</p> : messages.map((item) => (
            <article key={item.id} className={`rounded-2xl border p-4 ${item.senderType === 'ADMIN' ? 'ml-10 border-primary-500/40 bg-primary-500/10' : 'mr-10 border-slate-700 bg-slate-900/70'}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.senderType === 'ADMIN' ? 'Nowis' : 'Client'}</p>
                <p className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{item.content}</p>
              {item.senderType === 'CLIENT' && !item.isRead ? <p className="mt-2 text-xs text-amber-300">Non lu par l’équipe CRM</p> : null}
              {item.senderType === 'ADMIN' && !item.isRead ? <p className="mt-2 text-xs text-slate-400">Non lu côté client</p> : null}
            </article>
          ))}
        </div>
      </div>

      <form onSubmit={sendMessage} className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
        <label>
          <span className="mb-2 block text-sm text-slate-300">Nouveau message</span>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white" placeholder="Écrire un message au client..." />
        </label>

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={saving} className="rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60">
            {saving ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </form>
    </div>
  );
}
