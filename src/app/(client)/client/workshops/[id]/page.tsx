import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { PageHeader, SectionCard } from '@/features/client-portal/components/ui';
import { prisma } from '@/lib/prisma';
import { ClientWorkshopRequestEditor } from '@/features/client-portal/components/workshops/ClientWorkshopRequestEditor';
import { UploadFileForm } from '@/components/files/UploadFileForm';
import { ClientDocumentsList } from '@/features/client-portal/components/ClientDocumentsList';
import { getClientDocumentSection, getDefaultCategoryForUpload } from '@/features/documents/document-categories';

const CLIENT_EDITABLE_STATUSES = new Set(['BROUILLON', 'NEW', 'CONTACTED', 'EN_ATTENTE_RDV', 'RDV_PLANIFIE', 'SCHEDULED']);

export default async function ClientWorkshopDetailPage({ params }: { params: { id: string } }) {
  const session = await requireClientPortalSession();

  const item = await prisma.workshopRequest.findFirst({
    where: {
      id: params.id,
      OR: [
        { contactId: session.contactId },
        { clientId: session.contactId },
      ],
    },
    select: {
      id: true,
      title: true,
      objectives: true,
      notes: true,
      participantEstimate: true,
      estimatedParticipants: true,
      location: true,
      requestedDate: true,
      requestedTime: true,
      durationMinutes: true,
      meetingType: true,
      contactPerson: true,
      contactPhone: true,
      contactEmail: true,
      status: true,
    },
  });

  if (!item) notFound();

  const workshop = item;

  const workshopDocuments = await prisma.fileDocument.findMany({
    where: {
      contactId: session.contactId,
      OR: [
        { workshopRequestId: workshop.id },
        { commercialQuote: { workshopRequestId: workshop.id } },
        { invoice: { convertedFromQuote: { workshopRequestId: workshop.id } } },
      ],
    },
    include: {
      uploadedByUser: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const quoteDocuments = workshopDocuments.filter((doc) => getClientDocumentSection(doc) === 'quotes');
  const invoiceDocuments = workshopDocuments.filter((doc) => getClientDocumentSection(doc) === 'invoices');
  const clientSharedDocuments = workshopDocuments.filter((doc) => getClientDocumentSection(doc) === 'shared');
  const generatedWorkshopDeliverables = workshopDocuments.filter((doc) => getClientDocumentSection(doc) === 'workshop-deliverables');
  const otherDocuments = workshopDocuments.filter((doc) => getClientDocumentSection(doc) === 'other' || getClientDocumentSection(doc) === 'song-deliverables');

  function mapDoc(items: typeof workshopDocuments) {
    return items.map((document) => ({
      id: document.id,
      filename: document.filename,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
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
      songRequest: null,
      workshopRequest: { id: workshop.id, title: workshop.title },
    }));
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title={workshop.title}
        subtitle="Voir et modifier votre demande d'atelier selon son statut."
        actions={<Link href="/client/workshops" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white">Retour</Link>}
      />

      <ClientWorkshopRequestEditor
        initialItem={{
          ...workshop,
          requestedDate: workshop.requestedDate ? workshop.requestedDate.toISOString() : null,
        }}
        canEditInitially={CLIENT_EDITABLE_STATUSES.has(workshop.status)}
      />

      <SectionCard title="Documents de cet atelier" subtitle="Soumission, facture, fichiers préparatoires et livrables de l'atelier.">
        <div className="space-y-4">
          <UploadFileForm
            endpoint="/api/client-portal/file-documents"
            title="Ajouter un fichier pour cet atelier"
            description="Le fichier sera relié à votre demande d'atelier."
            submitLabel="Ajouter un fichier pour cet atelier"
            defaultCategory={getDefaultCategoryForUpload({ context: 'workshop' })}
            extraFields={{ workshopRequestId: workshop.id }}
          />

          <SectionCard title="Soumission liée">
            <ClientDocumentsList items={mapDoc(quoteDocuments)} emptyLabel="Aucune soumission liée" />
          </SectionCard>

          <SectionCard title="Facture liée">
            <ClientDocumentsList items={mapDoc(invoiceDocuments)} emptyLabel="Aucune facture liée" />
          </SectionCard>

          <SectionCard title="Fichiers partagés par le client">
            <ClientDocumentsList items={mapDoc(clientSharedDocuments)} emptyLabel="Aucun fichier partagé" />
          </SectionCard>

          <SectionCard title="Livrables atelier">
            <ClientDocumentsList items={mapDoc(generatedWorkshopDeliverables)} emptyLabel="Aucun livrable atelier" />
          </SectionCard>

          <SectionCard title="Autres documents liés">
            <ClientDocumentsList items={mapDoc(otherDocuments)} emptyLabel="Aucun autre document" />
          </SectionCard>
        </div>
      </SectionCard>
    </section>
  );
}
