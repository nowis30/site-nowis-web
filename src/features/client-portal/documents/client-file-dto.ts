import { resolveDocumentCategory } from '@/features/documents/document-categories';
import { canClientAccessStoredDocumentKey } from '@/lib/file-upload-intent';

export function isClientVisibleStoredFile(document: { visibility: string; category: string | null; storageKey: string }, contactId: string) {
  return document.visibility === 'CLIENT_VISIBLE'
    && resolveDocumentCategory({ category: document.category }).category !== 'admin-internal'
    && canClientAccessStoredDocumentKey(document.storageKey, contactId);
}

export function toClientFileDto<T extends { id: string; size: number; storageKey: string; url: string; uploadedByUserId: string | null }>(document: T) {
  return { ...document,
    storageKey: document.size === 0 && /^(quotes|invoices)\//.test(document.storageKey) ? document.storageKey.split('/')[0] + '/' : undefined,
    url: `/api/client-portal/file-documents/${document.id}/download`,
    uploadedByUserId: document.uploadedByUserId ? 'admin' : null,
  };
}
