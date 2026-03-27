'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const documentTypeOptions = [
  { value: 'BAIL', label: 'Bail' },
  { value: 'CONTRAT', label: 'Contrat' },
  { value: 'DEMANDE', label: 'Demande' },
  { value: 'AUTRE', label: 'Autre' },
] as const;

export function ClientDocumentsUploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<(typeof documentTypeOptions)[number]['value']>('BAIL');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await fetch('/api/client-portal/files', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Envoi impossible');
      }

      setSuccess('Document envoye et ajoute a votre dossier client.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Envoyer un dossier</p>
      <h3 className="mt-2 text-lg font-semibold text-white">Transmettre un fichier au CRM</h3>
      <p className="mt-2 text-sm text-slate-300">
        Vous pouvez envoyer un bail, un contrat, une demande ou tout autre document pour votre dossier client.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          <span>Type de document</span>
          <select
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value as (typeof documentTypeOptions)[number]['value'])}
            className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
          >
            {documentTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 disabled:opacity-60"
          >
            {uploading ? 'Envoi en cours...' : 'Choisir un fichier'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-300">{success}</p> : null}

      <p className="mt-3 text-xs leading-5 text-slate-500">Formats acceptes: PDF, DOC, DOCX, JPG, PNG, WebP (max 10 Mo).</p>
    </div>
  );
}
