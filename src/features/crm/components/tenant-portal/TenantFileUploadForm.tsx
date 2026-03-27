'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TenantFileUploadFormProps {
  token: string;
}

export function TenantFileUploadForm({ token }: TenantFileUploadFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('file', file);

      const response = await fetch('/api/tenant-portal/files', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Upload impossible');
      }

      setSuccess('Document ajouté au dossier locataire.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">Ajouter un document</p>
      <div className="mt-4 space-y-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
        >
          {uploading ? 'Envoi en cours...' : 'Importer un document'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
          className="hidden"
          onChange={handleChange}
        />
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
        <p className="text-xs text-slate-500">PDF, JPG, PNG, WebP, DOC, DOCX. Taille maximale 10 Mo.</p>
      </div>
    </div>
  );
}

export function TenantPortalDeleteFileButton({ token, fileId }: { token: string; fileId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Supprimer ce document ?')) return;
    setLoading(true);
    try {
      await fetch(`/api/tenant-portal/files/${fileId}?token=${encodeURIComponent(token)}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={handleDelete} disabled={loading} className="text-xs text-red-300 hover:text-red-200 disabled:opacity-60">
      {loading ? 'Suppression...' : 'Supprimer'}
    </button>
  );
}
