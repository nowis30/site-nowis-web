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
    return (
      <section aria-labelledby="client-documents-missing-title">
        <div className="crm-surface rounded-3xl border border-slate-800 p-6 sm:p-8" role="status">
          <h2 id="client-documents-missing-title" className="text-lg font-semibold text-white">Dossier client indisponible</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Vos documents ne sont pas disponibles pour le moment.</p>
        </div>
      </section>
    );
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
    origin: document.uploadedByUserId
      ? 'admin' as const
      : document.storageKey?.startsWith(`client-files/${contact.id}/`)
        ? 'client' as const
        : 'system' as const,
    songRequest: document.songRequest ? { id: document.songRequest.id, title: document.songRequest.title } : null,
    workshopRequest: document.workshopRequest ? { id: document.workshopRequest.id, title: document.workshopRequest.title } : null,
    songRequestId: document.songRequestId,
    workshopRequestId: document.workshopRequestId,
    commercialQuoteId: document.commercialQuoteId,
    invoiceId: document.invoiceId,
    uploadedByUserId: document.uploadedByUserId,
  }));

  const seenQuotePlaceholders = new Set<string>();
  const seenInvoicePlaceholders = new Set<string>();
  const cleanedDocuments = mappedDocuments.filter((document) => {
    const isQuotePlaceholder = Boolean(document.commercialQuoteId)
      && document.size === 0
      && document.storageKey?.startsWith('quotes/');
    const isInvoicePlaceholder = Boolean(document.invoiceId)
      && document.size === 0
      && document.storageKey?.startsWith('invoices/');

    if (isInvoicePlaceholder && document.invoiceId) {
      if (seenInvoicePlaceholders.has(document.invoiceId)) {
        return false;
      }
      seenInvoicePlaceholders.add(document.invoiceId);
      // Les factures sont consultables depuis /client/invoices, on masque les placeholders dans Documents.
      return false;
    }

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
        subtitle="Consultez, téléchargez et déposez les pièces liées à votre dossier client."
      />

      <SectionCard title="Ajouter un document" subtitle="Déposez un fichier dans votre dossier sécurisé.">
        <UploadFileForm
          endpoint="/api/client-portal/file-documents"
          title="Déposer un document"
          description="Vous pouvez transmettre des textes, paroles, poèmes, notes, audios de démo et documents de projet."
          submitLabel="Choisir un fichier"
          defaultCategory={getDefaultCategoryForUpload({ context: 'general' })}
        />
      </SectionCard>

      <SectionCard
        title="Bibliothèque"
        subtitle={`${cleanedDocuments.length} document${cleanedDocuments.length > 1 ? 's' : ''} disponible${cleanedDocuments.length > 1 ? 's' : ''} dans votre dossier.`}
      >
        {cleanedDocuments.length === 0 ? (
          <EmptyState icon={<FileText size={18} />} title="Aucun document" description="Vos prochains documents apparaîtront ici." />
        ) : (
          <div className="space-y-4">
            <SectionCard title="Soumissions">
              <ClientDocumentsList items={grouped.quotes} emptyLabel="Aucune soumission" />
            </SectionCard>

            <SectionCard title="Factures">
              <ClientDocumentsList items={grouped.invoices} emptyLabel="Aucune facture" />
            </SectionCard>

            <SectionCard title="Documents partagés">
              <ClientDocumentsList items={grouped.shared} emptyLabel="Aucun document partagé" />
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
