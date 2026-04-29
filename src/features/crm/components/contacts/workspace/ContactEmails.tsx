import { useState } from 'react';
import type { ContactWorkspaceContact } from './types';
import { formatDateTime } from './formatters';

export function ContactEmails({ contact }: { contact: ContactWorkspaceContact }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const portalAndEmailCommunications = contact.communications.filter((item) => item.channel.includes('mail') || item.channel === 'portal' || item.channel.startsWith('portal-'));

  async function handleSendEmail(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!contact.email) {
      setError('Ce contact n\'a pas d\'adresse email.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/crm/contacts/${contact.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Impossible d\'envoyer l\'email');
      }

      setSubject('');
      setMessage('');
      setSuccess('Email envoyé avec succès.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSendEmail} className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
        <h3 className="text-base font-semibold text-white">Envoyer un email</h3>
        <p className="mt-1 text-sm text-slate-400">Destinataire: {contact.email || 'Aucun email sur ce contact'}</p>

        <div className="mt-4 space-y-3">
          <input
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Sujet"
            required
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-400"
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Votre message"
            required
            rows={5}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-400"
          />
        </div>

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-emerald-300">{success}</p> : null}

        <button
          type="submit"
          disabled={loading || !contact.email}
          className="mt-4 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-60"
        >
          {loading ? 'Envoi...' : 'Envoyer l\'email'}
        </button>
      </form>

      {contact.outboundEmails.length === 0 && portalAndEmailCommunications.length === 0 ? <p className="text-sm text-slate-400">Aucun email ni message suivi.</p> : null}
      {contact.outboundEmails.map((item) => (
        <article key={item.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-white">{item.subject}</h3>
            <span className="text-xs text-slate-500">{formatDateTime(item.sentAt)}</span>
          </div>
          <p className="mt-2 text-sm text-slate-300">À: {item.recipientEmail}</p>
          <p className="mt-3 text-sm text-slate-400">{item.messagePreview}</p>
          <p className="mt-3 text-xs text-slate-500">{item.openedAt ? `Ouvert le ${formatDateTime(item.openedAt)}` : 'Pas encore ouvert'}</p>
        </article>
      ))}
      {portalAndEmailCommunications.map((item) => (
        <article key={item.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-white">{item.subject || 'Communication'}</h3>
            <span className="text-xs text-slate-500">{formatDateTime(item.sentAt)}</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{item.direction} · {item.channel}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-400">{item.body}</p>
        </article>
      ))}
    </div>
  );
}
