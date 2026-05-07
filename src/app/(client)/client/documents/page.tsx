import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { EmptyState, PageHeader, SectionCard } from '@/features/client-portal/components/ui';
import { FileText } from 'lucide-react';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { UploadFileForm } from '@/components/files/UploadFileForm';
import { ClientDocumentsList } from '@/features/client-portal/components/ClientDocumentsList';
import { getClientDocumentSection, getDefaultCategoryForUpload } from '@/features/documents/document-categories';
export default async function ClientDocumentsPage() {
  const session = await requireClientPortalSession();

  const contact = await prisma.contact.findUnique({ where: { id: session.contactId }, select: { id: true } });

  if (!contact) {
    return <div className="crm-surface p-8 text-sm text-slate-300">Aucun dossier client disponible.</div>;
  }

  type DocumentItem = Prisma.FileDocumentGetPayload<{
    include: {
      songRequest: { select: { id: true; title: true } };
      workshopRequest: { select: { id: true; title: true } };
      uploadedByUser: { select: { id: true } };
    };
  }>;

  let documents: DocumentItem[] = [];

  try {
    documents = await prisma.fileDocument.findMany({
      where: {
        visibility: 'CLIENT_VISIBLE',
        OR: [
          { contactId: contact.id },
          { songRequest: { contactId: contact.id } },
          { workshopRequest: { OR: [{ contactId: contact.id }, { clientId: contact.id }] } },
          { invoice: { contactId: contact.id } },
          { commercialQuote: { contactId: contact.id } },
        ],
      },
      include: {
        songRequest: { select: { id: true, title: true } },
        workshopRequest: { select: { id: true, title: true } },
        uploadedByUser: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      documents = [];
    } else {
      throw error;
    }
  }

  const mappedDocuments = documents.map((document) => ({
    id: document.id,
    filename: document.filename,
    originalName: document.originalName,
    mimeType: document.mimeType,
    size: document.size,
    storageKey: document.storageKey,
    url: document.url,
    category: document.category,
    visibility: document.visibility,
    createdAt: document.createdAt.toISOString(),
    origin: document.uploadedByUserId ? 'admin' as const : 'client' as const,
    songRequest: document.songRequest ? { id: document.songRequest.id, title: document.songRequest.title } : null,
    workshopRequest: document.workshopRequest ? { id: document.workshopRequest.id, title: document.workshopRequest.title } : null,
    songRequestId: document.songRequestId,
    workshopRequestId: document.workshopRequestId,
    commercialQuoteId: document.commercialQuoteId,
    invoiceId: document.invoiceId,
    uploadedByUserId: document.uploadedByUserId,
  }));

  const seenQuotePlaceholders = new Set<string>();
  const cleanedDocuments = mappedDocuments.filter((document) => {
    const isQuotePlaceholder = Boolean(document.commercialQuoteId)
      && document.size === 0
      && document.storageKey?.startsWith('quotes/');

    if (!isQuotePlaceholder || !document.commercialQuoteId) {
      return true;
    }

    if (seenQuotePlaceholders.has(document.commercialQuoteId)) {
      return false;
    }

    seenQuotePlaceholders.add(document.commercialQuoteId);
    return true;
  });

  const grouped = {
    quotes: cleanedDocuments.filter((document) => getClientDocumentSection(document) === 'quotes'),
    invoices: cleanedDocuments.filter((document) => getClientDocumentSection(document) === 'invoices'),
    shared: cleanedDocuments.filter((document) => getClientDocumentSection(document) === 'shared'),
    songDeliverables: cleanedDocuments.filter((document) => getClientDocumentSection(document) === 'song-deliverables'),
    workshopDeliverables: cleanedDocuments.filter((document) => getClientDocumentSection(document) === 'workshop-deliverables'),
    other: cleanedDocuments.filter((document) => getClientDocumentSection(document) === 'other'),
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle="Consultez et téléchargez les pièces liées à votre dossier client."
      />

      <SectionCard title="Actions" subtitle="Ajout d'un document dans votre dossier CRM.">
        <UploadFileForm
          endpoint="/api/client-portal/file-documents"
          title="Deposer un document"
          description="Vous pouvez transmettre des textes, paroles, poemes, notes, audios de demo et documents de projet."
          defaultCategory={getDefaultCategoryForUpload({ context: 'general' })}
        />
      </SectionCard>

      <SectionCard title="Bibliothèque" subtitle="Historique des documents disponibles avec téléchargement rapide.">
        {cleanedDocuments.length === 0 ? (
          <EmptyState icon={<FileText size={18} />} title="Aucun document" description="Aucun document ne correspond à ce filtre pour le moment." />
        ) : (
          <div className="space-y-4">
            <SectionCard title="Soumissions">
              <ClientDocumentsList items={grouped.quotes} emptyLabel="Aucune soumission" />
            </SectionCard>

            <SectionCard title="Factures">
              <ClientDocumentsList items={grouped.invoices} emptyLabel="Aucune facture" />
            </SectionCard>

            <SectionCard title="Documents partages">
              <ClientDocumentsList items={grouped.shared} emptyLabel="Aucun document partage" />
            </SectionCard>

            <SectionCard title="Livrables chanson">
              <ClientDocumentsList items={grouped.songDeliverables} emptyLabel="Aucun livrable chanson" />
            </SectionCard>

            <SectionCard title="Livrables atelier">
              <ClientDocumentsList items={grouped.workshopDeliverables} emptyLabel="Aucun livrable atelier" />
            </SectionCard>

            <SectionCard title="Autres documents">
              <ClientDocumentsList items={grouped.other} emptyLabel="Aucun autre document" />
            </SectionCard>
          </div>
        )}
      </SectionCard>
    </section>
  );
}
