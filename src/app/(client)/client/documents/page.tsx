import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { EmptyState, ListToolbar, PageHeader, SectionCard } from '@/features/client-portal/components/ui';
import { FileText } from 'lucide-react';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { UploadFileForm } from '@/components/files/UploadFileForm';
import { ClientDocumentsList } from '@/features/client-portal/components/ClientDocumentsList';

type DocumentsTab = 'all' | 'contact' | 'song_requests' | 'quotes' | 'invoices';

function parseTab(input?: string): DocumentsTab {
  return input === 'contact' || input === 'song_requests' || input === 'quotes' || input === 'invoices' ? input : 'all';
}

export default async function ClientDocumentsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireClientPortalSession();
  const resolvedSearchParams = (await searchParams) || {};
  const tab = parseTab(typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : undefined);

  const contact = await prisma.contact.findUnique({ where: { id: session.contactId }, select: { id: true } });

  if (!contact) {
    return <div className="crm-surface p-8 text-sm text-slate-300">Aucun dossier client disponible.</div>;
  }

  let documents = [] as Awaited<ReturnType<typeof prisma.fileDocument.findMany>>;

  try {
    documents = await prisma.fileDocument.findMany({
      where: {
        contactId: contact.id,
        visibility: 'CLIENT_VISIBLE',
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

  const filteredDocuments = documents.filter((document) => {
    if (tab === 'contact') return !document.songRequestId && !document.invoiceId && !document.commercialQuoteId;
    if (tab === 'song_requests') return !!document.songRequestId;
    if (tab === 'quotes') return !!document.commercialQuoteId;
    if (tab === 'invoices') return !!document.invoiceId;
    return true;
  });

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
          defaultCategory="document"
        />
      </SectionCard>

      <SectionCard title="Bibliothèque" subtitle="Historique des documents disponibles avec téléchargement rapide.">
        <ListToolbar
          filters={[
            { label: 'Tous', href: '/client/documents?tab=all', active: tab === 'all' },
            { label: 'Contact', href: '/client/documents?tab=contact', active: tab === 'contact' },
            { label: 'Demandes chanson', href: '/client/documents?tab=song_requests', active: tab === 'song_requests' },
            { label: 'Devis', href: '/client/documents?tab=quotes', active: tab === 'quotes' },
            { label: 'Factures', href: '/client/documents?tab=invoices', active: tab === 'invoices' },
          ]}
          actions={[{ label: 'Tout voir', href: '/client/documents?tab=all' }]}
        />

        {filteredDocuments.length === 0 ? (
          <EmptyState icon={<FileText size={18} />} title="Aucun document" description="Aucun document ne correspond à ce filtre pour le moment." />
        ) : (
          <ClientDocumentsList
            items={filteredDocuments.map((document) => ({
              id: document.id,
              filename: document.filename,
              originalName: document.originalName,
              mimeType: document.mimeType,
              size: document.size,
              url: document.url,
              category: document.category,
              visibility: document.visibility,
              createdAt: document.createdAt.toISOString(),
            }))}
            emptyLabel="Aucun document"
          />
        )}
      </SectionCard>
    </section>
  );
}
