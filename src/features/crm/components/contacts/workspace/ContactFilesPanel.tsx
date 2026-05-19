'use client';

import { useRouter } from 'next/navigation';
import { FileList, type FileListItem } from '@/components/files/FileList';
import { UploadFileForm } from '@/components/files/UploadFileForm';
import { getDefaultCategoryForUpload } from '@/features/documents/document-categories';

interface ContactFilesPanelProps {
  contactId: string;
  files: FileListItem[];
}

export function ContactFilesPanel({ contactId, files }: ContactFilesPanelProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    await fetch(`/api/crm/file-documents/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <UploadFileForm
        endpoint="/api/crm/file-documents"
        title="Deposer un fichier"
        description="Liez un fichier au contact. Vous pouvez choisir la visibilite client ou admin only."
        allowVisibility
        defaultCategory={getDefaultCategoryForUpload({ context: 'general' })}
        extraFields={{ contactId }}
      />

      <FileList items={files} emptyLabel="Aucun fichier pour ce contact." canDelete onDelete={handleDelete} />
    </div>
  );
}
