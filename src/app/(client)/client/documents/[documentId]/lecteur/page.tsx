import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { createPresignedDownloadUrl } from '@/lib/file-storage';
import { requireClientPortalSession } from '@/features/client-portal/auth/session';
import { canClientAccessFileDocument } from '@/features/client-portal/documents/security';
import { resolveClientMediaKind } from '@/features/client-portal/documents/media';
import { EmptyState, PageHeader, SectionCard } from '@/features/client-portal/components/ui';

interface ReaderPageProps {
  params: Promise<{ documentId: string }>;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

export default async function ClientDocumentReaderPage({ params }: ReaderPageProps) {
  const session = await requireClientPortalSession();
  const { documentId } = await params;

  const document = await prisma.fileDocument.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      createdAt: true,
      storageKey: true,
      visibility: true,
      category: true,
      contactId: true,
      songRequest: { select: { contactId: true } },
      workshopRequest: { select: { contactId: true, clientId: true } },
      invoice: { select: { contactId: true } },
      commercialQuote: { select: { contactId: true } },
    },
  });

  if (!document || !canClientAccessFileDocument({
    sessionContactId: session.contactId,
    visibility: document.visibility,
    category: document.category,
    contactId: document.contactId,
    songRequestContactId: document.songRequest?.contactId,
    workshopRequestContactId: document.workshopRequest?.contactId,
    workshopRequestClientId: document.workshopRequest?.clientId,
    invoiceContactId: document.invoice?.contactId,
    commercialQuoteContactId: document.commercialQuote?.contactId,
  })) {
    return (
      <section className="space-y-6">
        <PageHeader title="Lecteur média" subtitle="Document introuvable ou inaccessible." />
        <SectionCard>
          <EmptyState
            title="Document introuvable"
            description="Le document n'existe pas ou ne vous appartient pas."
            action={<Link href="/client/documents" className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-primary-500/40 hover:text-white">Retour à mes documents</Link>}
          />
        </SectionCard>
      </section>
    );
  }

  const mediaKind = resolveClientMediaKind({ mimeType: document.mimeType, originalName: document.originalName });

  let playbackUrl: string | null = null;
  try {
    playbackUrl = await createPresignedDownloadUrl(document.storageKey, {
      disposition: 'inline',
      fileName: document.originalName,
      expiresInSeconds: 300,
      responseContentType: document.mimeType || undefined,
    });
  } catch {
    playbackUrl = null;
  }

  const downloadUrl = `/api/client-portal/file-documents/${document.id}/download`;

  return (
    <section className="space-y-6">
      <PageHeader
        title={document.originalName}
        subtitle={`Type: ${document.mimeType || 'inconnu'} · Ajouté le ${formatDateTime(document.createdAt)}`}
        actions={<Link href="/client/documents" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-primary-500/40 hover:text-white">Retour à mes documents</Link>}
      />

      <SectionCard title="Lecteur">
        {!playbackUrl ? (
          <p className="text-sm text-rose-300">Impossible de générer le lien de lecture. Rechargez la page pour réessayer.</p>
        ) : null}

        {playbackUrl && mediaKind === 'video' ? (
          <video controls preload="metadata" playsInline className="w-full rounded-2xl border border-slate-800 bg-black" src={playbackUrl}>
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        ) : null}

        {playbackUrl && mediaKind === 'audio' ? (
          <audio controls preload="metadata" className="w-full" src={playbackUrl}>
            Votre navigateur ne supporte pas la lecture audio.
          </audio>
        ) : null}

        {mediaKind === 'unsupported' ? (
          <p className="text-sm text-amber-300">
            Ce type de fichier n'est pas pris en charge par le lecteur intégré. Utilisez le bouton Télécharger.
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <a href={downloadUrl} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-primary-500/40 hover:text-white">
            Télécharger
          </a>
          <Link href="/client/documents" className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-primary-500/40 hover:text-white">
            Retour à mes documents
          </Link>
        </div>
      </SectionCard>
    </section>
  );
}