'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  FILE_CATEGORY_OPTIONS,
  formatBytes,
  getClientMaxUploadSizeBytes,
} from '@/lib/file-documents';

interface UploadFileFormProps {
  endpoint: string;
  title: string;
  description?: string;
  submitLabel?: string;
  extraFields?: Record<string, string | undefined>;
  allowVisibility?: boolean;
  defaultCategory?: string;
}

export function UploadFileForm({
  endpoint,
  title,
  description,
  submitLabel = 'Deposer un fichier',
  extraFields,
  allowVisibility = false,
  defaultCategory = 'document',
}: UploadFileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState(defaultCategory);
  const [visibility, setVisibility] = useState<'admin_only' | 'client_visible'>('client_visible');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const clientMaxSize = getClientMaxUploadSizeBytes();

  async function handleFile(file: File) {
    if (file.size > clientMaxSize) {
      setError(`Fichier trop volumineux. Taille max: ${formatBytes(clientMaxSize)}.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const presignResponse = await fetch(`${endpoint}/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
        }),
      });

      const presignData = await presignResponse.json().catch(() => null);
      if (!presignResponse.ok) {
        throw new Error(presignData?.error || 'Preparation upload impossible');
      }

      const directUploadResponse = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!directUploadResponse.ok) {
        if (directUploadResponse.status === 413) {
          throw new Error(`Fichier trop volumineux. Taille max: ${formatBytes(clientMaxSize)}.`);
        }
        throw new Error('Upload direct vers le stockage impossible');
      }

      const payload: Record<string, unknown> = {
        category,
        file: presignData.file,
      };

      if (allowVisibility) {
        payload.visibility = visibility;
      }

      Object.entries(extraFields || {}).forEach(([key, value]) => {
        if (value) payload[key] = value;
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error(`Fichier trop volumineux. Taille max: ${formatBytes(clientMaxSize)}.`);
        }
        throw new Error(data?.error || 'Upload impossible');
      }

      setSuccess('Fichier depose avec succes.');
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
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</h3>
      {description ? <p className="mt-2 text-sm text-slate-300">{description}</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          <span>Categorie</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
          >
            {FILE_CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        {allowVisibility ? (
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            <span>Visibilite</span>
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as 'admin_only' | 'client_visible')}
              className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
            >
              <option value="client_visible">client_visible</option>
              <option value="admin_only">admin_only</option>
            </select>
          </label>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-primary-400 disabled:opacity-60"
        >
          {uploading ? 'Upload en cours...' : submitLabel}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_UPLOAD_EXTENSIONS.join(',')}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <span className="text-xs text-slate-500">{ALLOWED_UPLOAD_EXTENSIONS.join(', ')} (max {formatBytes(clientMaxSize)})</span>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-300">{success}</p> : null}
    </div>
  );
}
