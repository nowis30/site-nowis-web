'use client';
import { useState } from 'react';

export function SecurityDiagnostics() {
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  return <section className="rounded-xl border bg-white p-5 space-y-3">
    <h2 className="text-lg font-semibold">Vérification des protections</h2>
    <p>Vérifier la connexion à la base de données, la configuration des signatures et les réglages du stockage et des courriels.</p>
    <button disabled={busy} className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" onClick={async () => {
      if (busy) return; setBusy(true); setReport(null);
      try {
        const response = await fetch('/api/crm/security/diagnostics', { method: 'POST' });
        const result = await response.json();
        if (!response.ok) { setReport(result.error || 'Diagnostic indisponible.'); return; }
        setReport(JSON.stringify(result, null, 2));
      } catch { setReport('Diagnostic indisponible. Réessayez plus tard.'); }
      finally { setBusy(false); }
    }}>{busy ? 'Vérification…' : 'Vérifier les protections'}</button>
    {report !== null ? <pre role="status" className="overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs">{report}</pre> : null}
  </section>;
}
