'use client';

import { useRef, useState } from 'react';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
}

export function DashboardUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    const results: UploadedFile[] = [];

    for (const file of files) {
      const form = new FormData();
      form.append('file', file);

      const response = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Erreur upload');
        break;
      }

      results.push({ name: file.name, url: String(data.url), size: file.size });
    }

    setUploaded((previous) => [...previous, ...results]);
    setUploading(false);

    // reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {uploading ? 'Envoi en cours...' : 'Importer un document'}
        </button>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
        multiple
        className="hidden"
        onChange={handleChange}
      />

      {uploaded.length > 0 ? (
        <ul className="space-y-1">
          {uploaded.map((file) => (
            <li key={file.url} className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2 text-xs text-slate-300">
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary-300">
                {file.name}
              </a>
              <span className="ml-3 shrink-0 text-slate-500">{formatBytes(file.size)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">Aucun fichier importé pour cette session.</p>
      )}
    </div>
  );
}
