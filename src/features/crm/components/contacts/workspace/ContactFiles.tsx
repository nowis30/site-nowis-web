import type { ContactFileItem } from './types';
import { formatDate } from './formatters';

export function ContactFiles({ files }: { files: ContactFileItem[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {files.length === 0 ? <p className="text-sm text-slate-400">Aucun fichier disponible.</p> : files.map((file) => (
        <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5 hover:border-primary-500/40">
          <p className="text-base font-semibold text-white">{file.originalName}</p>
          <p className="mt-2 text-sm text-slate-400">Ajouté le {formatDate(file.createdAt)}</p>
          <p className="mt-2 text-xs text-slate-500">{file.mimeType} · {file.category}</p>
        </a>
      ))}
    </div>
  );
}
