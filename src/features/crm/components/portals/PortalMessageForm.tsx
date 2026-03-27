'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PortalMessageFormProps {
  actionUrl: string;
  subjectPlaceholder: string;
  buttonLabel: string;
  extraPayload?: Record<string, string>;
}

export function PortalMessageForm({ actionUrl, subjectPlaceholder, buttonLabel, extraPayload }: PortalMessageFormProps) {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(actionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, ...extraPayload }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Envoi impossible');
      }

      setSubject('');
      setMessage('');
      setSuccess('Votre message a été envoyé au dossier.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Envoyer un message</p>
      <div className="mt-4 space-y-3">
        <input
          required
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder={subjectPlaceholder}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        <textarea
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          placeholder="Votre message"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
        <button type="submit" disabled={loading} className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-60">
          {loading ? 'Envoi en cours...' : buttonLabel}
        </button>
      </div>
    </form>
  );
}
