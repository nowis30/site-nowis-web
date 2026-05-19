'use client';

import { useRouter } from 'next/navigation';
import { FileList, type FileListItem } from '@/components/files/FileList';
import { CLIENT_PORTAL_FILE_DOCUMENTS_PREFIX } from '@/features/client-portal/documents/paths';

interface ClientDocumentsListProps {
  items: FileListItem[];
  emptyLabel: string;
}

export function ClientDocumentsList({ items, emptyLabel }: ClientDocumentsListProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const response = await fetch(`${CLIENT_PORTAL_FILE_DOCUMENTS_PREFIX}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || 'Suppression impossible');
    }
    router.refresh();
  }

  return (
    <FileList
      items={items}
      emptyLabel={emptyLabel}
      canDelete
      onDelete={handleDelete}
      downloadPrefix={CLIENT_PORTAL_FILE_DOCUMENTS_PREFIX}
      readerBasePath="/client/documents"
    />
  );
}
