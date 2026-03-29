'use client';

import { useRouter } from 'next/navigation';
import { FileList, type FileListItem } from '@/components/files/FileList';
import { UploadFileForm } from '@/components/files/UploadFileForm';

interface SongRequestFilesPanelProps {
  songRequestId: string;
  contactId: string;
  files: FileListItem[];
  mode: 'admin' | 'client';
}

export function SongRequestFilesPanel({ songRequestId, contactId, files, mode }: SongRequestFilesPanelProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const endpoint = mode === 'admin' ? `/api/crm/file-documents/${id}` : `/api/client-portal/file-documents/${id}`;
    await fetch(endpoint, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <UploadFileForm
        endpoint={mode === 'admin' ? '/api/crm/file-documents' : '/api/client-portal/file-documents'}
        title="Deposer un fichier"
        description={
          mode === 'admin'
            ? 'Ajoutez un document, des paroles ou un fichier audio relie a cette demande.'
            : 'Envoyez vos paroles, texte, poeme, demo audio ou document explicatif.'
        }
        allowVisibility={mode === 'admin'}
        extraFields={{ songRequestId, ...(mode === 'admin' ? { contactId } : {}) }}
      />

      <FileList
        items={files}
        emptyLabel="Aucun fichier lie a cette demande."
        canDelete
        onDelete={handleDelete}
        downloadPrefix={mode === 'admin' ? '/api/crm/file-documents' : '/api/client-portal/file-documents'}
      />
    </div>
  );
}
