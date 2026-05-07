import Link from 'next/link';
import { SongRequestStatus } from '@prisma/client';
import { Music2 } from 'lucide-react';

import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { EmptyState, PageHeader, SectionCard, StatusBadge } from '@/features/client-portal/components/ui';
import { ClientSongRequestInfoEditor } from '@/features/client-portal/components/song-requests/ClientSongRequestInfoEditor';
import { UploadFileForm } from '@/components/files/UploadFileForm';
import { ClientDocumentsList } from '@/features/client-portal/components/ClientDocumentsList';
import { prisma } from '@/lib/prisma';
import { getClientDocumentSection, getDefaultCategoryForUpload } from '@/features/documents/document-categories';

const statusLabels: Record<SongRequestStatus, string> = {
  NEW: 'Nouvelle',
  CONTACTED: 'Contactée',
  QUOTED: 'Devis envoyé',
  IN_PROGRESS: 'En cours',
  IN_PRODUCTION: 'En production',
  DELIVERED: 'Livrée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  DELETED: 'Supprimée',
};

const CLIENT_EDITABLE_STATUSES = new Set<SongRequestStatus>(['NEW', 'CONTACTED', 'IN_PROGRESS', 'IN_PRODUCTION']);

function statusTone(status: SongRequestStatus): 'warning' | 'info' | 'success' | 'danger' {
  if (status === 'NEW' || status === 'CONTACTED') return 'warning';
  if (status === 'IN_PROGRESS' || status === 'IN_PRODUCTION' || status === 'QUOTED') return 'info';
  if (status === 'DELIVERED' || status === 'COMPLETED') return 'success';
  return 'danger';
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

export default async function ClientSongRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClientPortalSession();
  const { id } = await params;

  const request = await prisma.songRequest.findFirst({
    where: {
      id,
      contactId: session.contactId,
    },
    select: {
      id: true,
      title: true,
      occasion: true,
      style: true,
      mood: true,
      description: true,
      lyrics: true,
      specialMessage: true,
      details: true,
      desiredDeadline: true,
      status: true,
      convertedInvoiceId: true,
      archivedAt: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!request) {
    return (
      <section className="space-y-6">
        <PageHeader title="Détail de demande" subtitle="Cette demande n'existe pas ou n'est pas liée à votre dossier." />
        <SectionCard>
          <EmptyState
            icon={<Music2 size={18} />}
            title="Demande introuvable"
            description="Vérifiez votre historique ou revenez à la liste des demandes."
            action={<Link href="/client/song-requests" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">Retour à la liste</Link>}
          />
        </SectionCard>
      </section>
    );
  }

  const songRequest = request;

  const canEdit =
    CLIENT_EDITABLE_STATUSES.has(request.status)
    && !request.convertedInvoiceId
    && !request.archivedAt
    && !request.deletedAt;

  const documents = await prisma.fileDocument.findMany({
    where: {
      contactId: session.contactId,
      OR: [
        { songRequestId: songRequest.id },
        { commercialQuote: { songRequestId: songRequest.id } },
        { invoice: { convertedFromQuote: { songRequestId: songRequest.id } } },
      ],
    },
    include: {
      uploadedByUser: { select: { id: true } },
      commercialQuote: { select: { id: true } },
      invoice: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const relatedQuotes = await prisma.commercialQuote.findMany({
    where: {
      contactId: session.contactId,
      songRequestId: songRequest.id,
    },
    select: {
      id: true,
      quoteNumber: true,
      title: true,
      status: true,
      validUntil: true,
      totalAmount: true,
      currency: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const quoteDocuments = documents.filter((doc) => getClientDocumentSection(doc) === 'quotes');
  const invoiceDocuments = documents.filter((doc) => getClientDocumentSection(doc) === 'invoices');
  const deliveredDocuments = documents.filter((doc) => getClientDocumentSection(doc) === 'song-deliverables');
  const clientSharedDocuments = documents.filter((doc) => getClientDocumentSection(doc) === 'shared');
  const otherDocuments = documents.filter((doc) => getClientDocumentSection(doc) === 'other' || getClientDocumentSection(doc) === 'workshop-deliverables');

  function mapDoc(items: typeof documents) {
    return items.map((document) => ({
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
      songRequestId: document.songRequestId,
      workshopRequestId: document.workshopRequestId,
      commercialQuoteId: document.commercialQuoteId,
      invoiceId: document.invoiceId,
      uploadedByUserId: document.uploadedByUserId,
      songRequest: { id: songRequest.id, title: songRequest.title },
      workshopRequest: null,
    }));
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={request.title || request.occasion}
        subtitle="Consultez et modifiez votre demande."
        actions={<Link href="/client/song-requests" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60">Retour</Link>}
      />

      <SectionCard title="Statut" subtitle="Suivi de traitement">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-slate-300">
            <p>Creee le {formatDateTime(request.createdAt)}</p>
            <p>Modifiee le {formatDateTime(request.updatedAt)}</p>
          </div>
          <StatusBadge label={statusLabels[request.status]} tone={statusTone(request.status)} />
        </div>
      </SectionCard>

      <SectionCard title="Informations de la demande">
        <ClientSongRequestInfoEditor
          initial={{
            id: request.id,
            title: request.title,
            musicStyle: request.style,
            mood: request.mood,
            description: request.description,
            lyrics: request.lyrics,
            clientNotes: request.details,
            clientMessage: request.specialMessage,
            desiredDeadline: request.desiredDeadline ? new Date(String(request.desiredDeadline)).toISOString() : null,
          }}
          canEdit={canEdit}
        />
      </SectionCard>

      <SectionCard title="Soumissions liees" subtitle="Consultez vos soumissions associees a cette demande.">
        {relatedQuotes.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune soumission liee pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {relatedQuotes.map((quote) => (
              <Link
                key={quote.id}
                href={`/client/soumissions/${quote.id}`}
                className="block rounded-xl border border-slate-800 bg-slate-950/45 px-3 py-2 text-sm text-slate-200 hover:border-primary-500/30 hover:text-white"
              >
                {quote.quoteNumber} · {quote.title} · {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: quote.currency }).format(Number(quote.totalAmount))}
              </Link>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Documents de cette chanson" subtitle="Soumission, facture, livrables et fichiers partagés pour cette demande.">
        <div className="space-y-4">
          <UploadFileForm
            endpoint="/api/client-portal/file-documents"
            title="Ajouter un fichier pour cette chanson"
            description="Le fichier sera relié à votre demande de chanson."
            submitLabel="Ajouter un fichier pour cette chanson"
            defaultCategory={getDefaultCategoryForUpload({ context: 'song' })}
            extraFields={{ songRequestId: request.id }}
          />

          <SectionCard title="Soumission liée">
            <ClientDocumentsList items={mapDoc(quoteDocuments)} emptyLabel="Aucune soumission liée" />
          </SectionCard>

          <SectionCard title="Facture liée">
            <ClientDocumentsList items={mapDoc(invoiceDocuments)} emptyLabel="Aucune facture liée" />
          </SectionCard>

          <SectionCard title="Fichiers livrés">
            <ClientDocumentsList items={mapDoc(deliveredDocuments)} emptyLabel="Aucun fichier livré" />
          </SectionCard>

          <SectionCard title="Fichiers partagés par le client">
            <ClientDocumentsList items={mapDoc(clientSharedDocuments)} emptyLabel="Aucun fichier partagé" />
          </SectionCard>

          <SectionCard title="Autres documents liés">
            <ClientDocumentsList items={mapDoc(otherDocuments)} emptyLabel="Aucun autre document" />
          </SectionCard>
        </div>
      </SectionCard>
    </section>
  );
}
