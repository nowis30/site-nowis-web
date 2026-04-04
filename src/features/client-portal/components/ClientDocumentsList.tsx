'use client';

import { useRouter } from 'next/navigation';
import { FileList, type FileListItem } from '@/components/files/FileList';

interface ClientDocumentsListProps {
  items: FileListItem[];
  emptyLabel: string;
}

export function ClientDocumentsList({ items, emptyLabel }: ClientDocumentsListProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const response = await fetch(`/api/client-portal/file-documents/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || 'Suppression impossible');
    }
    router.refresh();
  }

  return <FileList items={items} emptyLabel={emptyLabel} canDelete onDelete={handleDelete} downloadPrefix="/api/client-portal/file-documents" />;
}
