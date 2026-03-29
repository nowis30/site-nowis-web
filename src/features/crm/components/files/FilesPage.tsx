'use client';

import { useState } from 'react';
import { Paperclip, Download, Trash2, File } from 'lucide-react';
import { useRouter } from 'next/navigation';

type FileItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
  linkedType: string;
  linkedId: string;
  createdAt: string;
  uploadedBy: { fullName: string } | null;
};

const LINKED_TYPE_LABELS: Record<string, string> = {
  CONTACT: 'Contact',
  CASE: 'Dossier',
  INQUIRY: 'Demande',
  APPOINTMENT: 'Rendez-vous',
  INVOICE: 'Facture',
  ACTIVITY: 'Activité',
  SONG_REQUEST: 'Chanson',
  WORKSHOP_REQUEST: 'Demande atelier',
  WORKSHOP_APPOINTMENT: 'Rendez-vous atelier',
};

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function getFileIcon(mime: string | null) {
  if (!mime) return '📄';
  if (mime.startsWith('image/')) return '🖼️';
  if (mime === 'application/pdf') return '📕';
  if (mime.includes('word')) return '📝';
  if (mime.includes('sheet') || mime.includes('excel')) return '📊';
  return '📄';
}

interface FilesPageProps { files: FileItem[]; }

export function FilesPage({ files }: FilesPageProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = files.filter(f => {
    const matchSearch = !search || f.fileName.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || f.linkedType === filterType;
    return matchSearch && matchType;
  });

  const linkedTypes = [...new Set(files.map(f => f.linkedType))];

  async function deleteFile(id: string) {
    if (!confirm('Supprimer ce fichier ?')) return;
    setDeleting(id);
    // For now, delete from DB only (actual file removal depends on storage)
    await fetch(`/api/crm/files/${id}`, { method: 'DELETE' });
    setDeleting(null);
    router.refresh();
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Paperclip size={22} /> Documents & Fichiers</h2>
        <p className="text-sm text-slate-400 mt-0.5">{files.length} fichier{files.length > 1 ? 's' : ''} archivé{files.length > 1 ? 's' : ''}</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="search"
          placeholder="Rechercher un fichier..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400 w-64"
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white">
          <option value="">Tous les types</option>
          {linkedTypes.map(t => <option key={t} value={t}>{LINKED_TYPE_LABELS[t] ?? t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Paperclip size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucun fichier trouvé</p>
          <p className="text-xs mt-1">Les fichiers sont attachés depuis les fiches contacts, dossiers, rendez-vous et demandes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(file => (
            <div key={file.id} className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 flex items-start gap-3">
              <span className="text-2xl shrink-0">{getFileIcon(file.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.fileName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs rounded-full bg-slate-700 px-2 py-0.5 text-slate-300">
                    {LINKED_TYPE_LABELS[file.linkedType] ?? file.linkedType}
                  </span>
                  {file.sizeBytes && <span className="text-xs text-slate-500">{formatSize(file.sizeBytes)}</span>}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(file.createdAt).toLocaleDateString('fr-CA')}
                  {file.uploadedBy ? ` · ${file.uploadedBy.fullName}` : ''}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <a href={file.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="text-slate-400 hover:text-primary-400 transition-colors">
                  <Download size={15} />
                </a>
                <button type="button" onClick={() => deleteFile(file.id)} disabled={deleting === file.id}
                  className="text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
