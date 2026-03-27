'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface InvoicePaymentNoticeFormProps {
  actionUrl: string;
  buttonLabel: string;
}

export function InvoicePaymentNoticeForm({ actionUrl, buttonLabel }: InvoicePaymentNoticeFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
      const formData = new FormData();
      formData.append('message', message);
      const file = fileInputRef.current?.files?.[0];
      if (file) formData.append('file', file);

      const response = await fetch(actionUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Signalement impossible');
      }

      setMessage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccess('Le signalement de paiement a été transmis.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Signaler un paiement</p>
      <div className="mt-3 space-y-3">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder="Message ou précision sur le paiement"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" className="block w-full text-xs text-slate-400" />
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
        <button type="submit" disabled={loading} className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-60">
          {loading ? 'Envoi en cours...' : buttonLabel}
        </button>
      </div>
    </form>
  );
}