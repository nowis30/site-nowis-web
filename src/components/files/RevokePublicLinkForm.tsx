'use client';
import { useState } from 'react';

export function RevokePublicLinkForm() {
  const [link, setLink] = useState(''), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  return <section className="rounded-xl border bg-white p-5 space-y-3">
    <h2 className="text-lg font-semibold">Révoquer un lien de document</h2>
    <p>Si un lien de facture, de soumission ou de facturation a été partagé par erreur, vous pouvez en retirer l’accès.</p>
    <form className="space-y-3" onSubmit={async event => {
      event.preventDefault(); if (busy || !confirmed) return; setBusy(true); setMessage('');
      try {
        const response = await fetch('/api/crm/security/public-links/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ link, confirm: true }) });
        const result = await response.json(); setMessage(response.ok ? result.message : result.error || 'Révocation impossible.');
        if (response.ok) { setLink(''); setConfirmed(false); }
      } catch { setMessage('Révocation indisponible. Réessayez plus tard.'); }
      finally { setBusy(false); }
    }}>
      <label className="block">Lien à révoquer<input type="text" value={link} onChange={event => setLink(event.target.value)} required maxLength={6000} autoComplete="off" className="mt-1 w-full rounded border p-2" /></label>
      <label className="flex gap-2"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />Je confirme retirer l’accès accordé par ce lien.</label>
      <button disabled={busy || !confirmed || !link.trim()} className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Révocation…' : 'Révoquer ce lien'}</button>
      {message && <p role="status">{message}</p>}
    </form>
  </section>;
}
