import { requireCrmSession } from '@/features/crm/auth/session';
import { prisma } from '@/lib/prisma';
import { CommercialQuoteEditorPage } from '@/features/crm/components/commercial-quotes/CommercialQuoteEditorPage';
import { getCommercialQuoteEditorOptions, getCommercialQuoteTaxRates } from '@/features/crm/components/commercial-quotes/server-data';

export default async function CrmCommercialQuoteNewPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  await requireCrmSession();

  const contactId = typeof searchParams?.contactId === 'string' ? searchParams.contactId : '';
  const organizationId = typeof searchParams?.organizationId === 'string' ? searchParams.organizationId : '';
  const workshopRequestId = typeof searchParams?.workshopRequestId === 'string' ? searchParams.workshopRequestId : '';
  const songRequestId = typeof searchParams?.songRequestId === 'string' ? searchParams.songRequestId : '';
  const appointmentId = typeof searchParams?.appointmentId === 'string' ? searchParams.appointmentId : '';
  const contextParam = typeof searchParams?.context === 'string' ? searchParams.context.trim() : '';

  const [options, workshop, song] = await Promise.all([
    getCommercialQuoteEditorOptions(),
    workshopRequestId
      ? prisma.workshopRequest.findUnique({
          where: { id: workshopRequestId },
          select: {
            id: true,
            title: true,
            finalPrice: true,
            objectives: true,
            requestedDate: true,
            workshopTheme: true,
            groupType: true,
            residenceName: true,
            coordinatorName: true,
            estimatedParticipants: true,
            contactId: true,
            organizationId: true,
          },
        })
      : Promise.resolve(null),
    songRequestId
      ? prisma.songRequest.findUnique({
          where: { id: songRequestId },
          select: {
            id: true,
            title: true,
            description: true,
            budget: true,
            desiredDeadline: true,
            contactId: true,
            organizationId: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const initialContactId = contactId || workshop?.contactId || song?.contactId || '';
  const initialOrganizationId = organizationId || workshop?.organizationId || song?.organizationId || '';
  const initialTitle = workshop
    ? `Devis atelier · ${workshop.title}`
    : song
      ? `Devis chanson · ${song.title || 'Projet personnalisé'}`
      : 'Nouveau devis';

  const initialDescription = workshop
    ? [
        `Atelier prévu${workshop.requestedDate ? ` le ${new Intl.DateTimeFormat('fr-CA').format(workshop.requestedDate)}` : ''}`,
        workshop.groupType ? `Catégorie: ${workshop.groupType}` : '',
        workshop.workshopTheme ? `Thème: ${workshop.workshopTheme}` : '',
        workshop.residenceName ? `Résidence: ${workshop.residenceName}` : '',
        workshop.coordinatorName ? `Coordination: ${workshop.coordinatorName}` : '',
        workshop.estimatedParticipants ? `Participants: ${workshop.estimatedParticipants}` : '',
        contextParam,
        workshop.objectives || '',
      ].filter(Boolean).join('. ')
    : song
      ? `Projet chanson${song.desiredDeadline ? ` · échéance ${new Intl.DateTimeFormat('fr-CA').format(song.desiredDeadline)}` : ''}. ${song.description || ''}`.trim()
      : '';

  const initialAmount = workshop?.finalPrice ? Number(workshop.finalPrice) : song?.budget ? Number(song.budget) : 0;

  return (
    <CommercialQuoteEditorPage
      mode="create"
      initialForm={{
        title: initialTitle,
        description: initialDescription,
        contactId: initialContactId,
        organizationId: initialOrganizationId,
        workshopRequestId,
        songRequestId,
        appointmentId,
        currency: 'CAD',
        validUntil: '',
        notes: '',
        internalNotes: '',
        status: 'DRAFT',
      }}
      initialLines={[
        {
          title: workshop ? workshop.title : song ? 'Chanson personnalisee' : 'Service',
          description: initialDescription,
          quantity: '1',
          unitPrice: initialAmount ? String(initialAmount) : '0',
          taxable: true,
          sortOrder: 0,
        },
      ]}
      contactOptions={options.contactOptions}
      organizationOptions={options.organizationOptions}
      workshopOptions={options.workshopOptions}
      songOptions={options.songOptions}
      appointmentOptions={options.appointmentOptions}
      taxRates={getCommercialQuoteTaxRates()}
    />
  );
}
