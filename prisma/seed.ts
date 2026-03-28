import { PrismaClient, ContactType, CaseType, CaseStatus, UserRole, UnitStatus, LeaseStatus, PaymentStatus, MaintenancePriority, MaintenanceStatus, InquiryStatus, CommunicationDirection, LinkedType, TaskPriority, TaskStatus, AppointmentType, AppointmentStatus, InvoiceStatus, ActivityType, SongRequestStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.songRequest.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.maintenanceUpdate.deleteMany();
  await prisma.maintenanceTicket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.property.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.caseNote.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.caseRecord.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();

  const demoPassword = '4667@Nowis';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@crm.local',
      fullName: 'Admin CRM',
      role: UserRole.ADMIN,
      passwordHash,
    },
  });

  const assistant = await prisma.user.create({
    data: {
      email: 'assistant@crm.local',
      fullName: 'Assistant Gestion',
      role: UserRole.ASSISTANT,
      passwordHash,
    },
  });

  const tenantUser = await prisma.user.create({
    data: {
      email: 'locataire@crm.local',
      fullName: 'Locataire Démo',
      role: UserRole.TENANT,
      passwordHash,
    },
  });

  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        type: ContactType.CLIENT,
        fullName: 'Marie Tremblay',
        email: 'marie.tremblay@email.ca',
        phone: '+1 514 555 1122',
        source: 'Site web',
        tags: ['VIP'],
      },
    }),
    prisma.contact.create({
      data: {
        type: ContactType.PROSPECT,
        fullName: 'Jonathan Gagnon',
        email: 'jonathan.gagnon@email.ca',
        phone: '+1 514 555 9988',
        source: 'Facebook Ads',
        tags: ['Chaud'],
      },
    }),
    prisma.contact.create({
      data: {
        type: ContactType.PROPRIETAIRE,
        fullName: 'Sophie Bouchard',
        email: 'sophie.bouchard@email.ca',
        phone: '+1 438 555 7788',
        source: 'Référence',
        tags: ['Propriétaire'],
      },
    }),
    prisma.contact.create({
      data: {
        type: ContactType.LOCATAIRE_PROSPECT,
        fullName: 'Antoine Roy',
        email: 'antoine.roy@email.ca',
        phone: '+1 581 555 4545',
        source: 'Kijiji',
        tags: ['3½'],
      },
    }),
  ]);

  const [clientContact, prospectContact, ownerContact, tenantProspectContact] = contacts;

  const property = await prisma.property.create({
    data: {
      code: 'MTL-001',
      name: 'Résidence du Parc',
      addressLine1: '1234 Rue du Parc',
      city: 'Montréal',
      province: 'QC',
      postalCode: 'H2X 1Y1',
      totalUnits: 12,
    },
  });

  const unitA = await prisma.unit.create({
    data: {
      propertyId: property.id,
      unitNumber: '201',
      bedrooms: 2,
      bathrooms: 1,
      areaSqft: 820,
      monthlyRent: 1450,
      status: UnitStatus.OCCUPIED,
    },
  });

  const unitB = await prisma.unit.create({
    data: {
      propertyId: property.id,
      unitNumber: '305',
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 610,
      monthlyRent: 1195,
      status: UnitStatus.VACANT,
    },
  });

  const tenantContact = await prisma.contact.create({
    data: {
      type: ContactType.CLIENT,
      fullName: tenantUser.fullName,
      email: tenantUser.email,
      phone: '+1 514 555 3030',
      source: 'Portail locataire',
      tags: ['Locataire actif'],
    },
  });

  await prisma.user.update({
    where: { id: tenantUser.id },
    data: { contactId: tenantContact.id },
  });

  const tenant = await prisma.tenant.create({
    data: {
      contactId: tenantContact.id,
      unitId: unitA.id,
      moveInDate: new Date('2025-07-01'),
      emergencyContact: 'Claire Roy',
      emergencyPhone: '+1 514 555 5656',
    },
  });

  const lease = await prisma.lease.create({
    data: {
      leaseNumber: 'BAIL-2025-0001',
      tenantId: tenant.id,
      unitId: unitA.id,
      startDate: new Date('2025-07-01'),
      endDate: new Date('2026-06-30'),
      rentAmount: 1450,
      securityDeposit: 1450,
      status: LeaseStatus.ACTIVE,
      signedAt: new Date('2025-06-20'),
    },
  });

  await prisma.payment.createMany({
    data: [
      {
        leaseId: lease.id,
        tenantId: tenant.id,
        unitId: unitA.id,
        amount: 1450,
        dueDate: new Date('2026-02-01'),
        paidDate: new Date('2026-02-02'),
        status: PaymentStatus.PAID,
        method: 'Interac',
      },
      {
        leaseId: lease.id,
        tenantId: tenant.id,
        unitId: unitA.id,
        amount: 1450,
        dueDate: new Date('2026-03-01'),
        status: PaymentStatus.PENDING,
        method: 'Interac',
      },
    ],
  });

  const caseRecord = await prisma.caseRecord.create({
    data: {
      title: 'Suivi dossier location Antoine Roy',
      type: CaseType.LOCATION,
      status: CaseStatus.IN_PROGRESS,
      contactId: tenantProspectContact.id,
      ownerUserId: assistant.id,
      referenceCode: 'DOS-2026-0001',
      description: 'Qualification du prospect et planification visite logement 305.',
    },
  });

  await prisma.caseNote.createMany({
    data: [
      {
        caseId: caseRecord.id,
        authorUserId: assistant.id,
        content: 'Prospect intéressé, revenus validés, visite prévue vendredi.',
      },
      {
        caseId: caseRecord.id,
        authorUserId: admin.id,
        content: 'Préparer proposition de bail si visite concluante.',
      },
    ],
  });

  await prisma.inquiry.create({
    data: {
      subject: 'Demande de logement 3½',
      message: 'Bonjour, je souhaite visiter un 3½ à Montréal.',
      source: 'Formulaire site',
      status: InquiryStatus.QUALIFIED,
      contactId: prospectContact.id,
      caseId: caseRecord.id,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Appeler le prospect Antoine Roy',
        description: 'Confirmer la visite du logement 305.',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date('2026-03-24T16:00:00Z'),
        caseId: caseRecord.id,
        assignedToId: assistant.id,
        createdById: admin.id,
        linkedType: LinkedType.CASE,
        linkedId: caseRecord.id,
      },
      {
        title: 'Vérifier le paiement de mars',
        description: 'Relancer le locataire si non reçu au 5 du mois.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        assignedToId: assistant.id,
        createdById: admin.id,
        linkedType: LinkedType.LEASE,
        linkedId: lease.id,
      },
    ],
  });

  await prisma.document.createMany({
    data: [
      {
        fileName: 'piece-identite-antoine.pdf',
        fileUrl: '/crm/documents/piece-identite-antoine.pdf',
        linkedType: LinkedType.CASE,
        linkedId: caseRecord.id,
        uploadedById: assistant.id,
      },
      {
        fileName: 'bail-2025-0001-signe.pdf',
        fileUrl: '/crm/documents/bail-2025-0001-signe.pdf',
        linkedType: LinkedType.LEASE,
        linkedId: lease.id,
        uploadedById: admin.id,
      },
    ],
  });

  const maintenanceTicket = await prisma.maintenanceTicket.create({
    data: {
      propertyId: property.id,
      unitId: unitA.id,
      tenantId: tenant.id,
      title: 'Fuite sous évier cuisine',
      description: 'Écoulement lent et eau au sol.',
      priority: MaintenancePriority.HIGH,
      status: MaintenanceStatus.IN_PROGRESS,
      reportedByUserId: tenantUser.id,
    },
  });

  await prisma.maintenanceUpdate.createMany({
    data: [
      {
        maintenanceTicketId: maintenanceTicket.id,
        authorUserId: assistant.id,
        message: 'Plombier planifié pour demain 9h.',
        status: MaintenanceStatus.IN_PROGRESS,
      },
      {
        maintenanceTicketId: maintenanceTicket.id,
        authorUserId: admin.id,
        message: 'Pièce remplacée, vérifier absence de fuite sous 48h.',
        status: MaintenanceStatus.RESOLVED,
      },
    ],
  });

  await prisma.communication.createMany({
    data: [
      {
        contactId: prospectContact.id,
        userId: assistant.id,
        channel: 'EMAIL',
        subject: 'Confirmation de visite',
        body: 'Votre visite est confirmée vendredi à 17h.',
        direction: CommunicationDirection.OUTBOUND,
        linkedType: LinkedType.CASE,
        linkedId: caseRecord.id,
      },
      {
        tenantId: tenant.id,
        userId: tenantUser.id,
        channel: 'PORTAL',
        body: 'Demande de maintenance soumise via portail.',
        direction: CommunicationDirection.INBOUND,
        linkedType: LinkedType.MAINTENANCE_TICKET,
        linkedId: maintenanceTicket.id,
      },
    ],
  });

  console.log('✅ Seed CRM généré avec succès');
  console.log('Comptes démo: admin@crm.local, assistant@crm.local, locataire@crm.local');
  console.log(`Mot de passe démo: ${demoPassword}`);

  await prisma.unit.update({
    where: { id: unitB.id },
    data: { status: UnitStatus.VACANT },
  });

  await prisma.contact.update({
    where: { id: clientContact.id },
    data: { notes: `Client prioritaire pour les biens de ${property.city}.` },
  });

  await prisma.contact.update({
    where: { id: ownerContact.id },
    data: { notes: 'Propriétaire actif sur 2 immeubles potentiels.' },
  });

  // ── Demandes de chanson (site → CRM) ──────────────────────────────────────
  const songRequestBaseDate = new Date();

  const songRequestOne = await prisma.songRequest.create({
    data: {
      contactId: clientContact.id,
      fullName: clientContact.fullName,
      email: clientContact.email ?? 'marie.tremblay@email.ca',
      phone: clientContact.phone ?? '+1 514 555 1122',
      songType: 'Chanson anniversaire',
      occasion: '40e anniversaire',
      recipientName: 'Éric Tremblay',
      style: 'Pop acoustique',
      mood: 'Émotive',
      details: 'Je veux une chanson personnalisée avec les souvenirs de famille et un refrain marquant.',
      budget: 250,
      desiredDeadline: new Date(songRequestBaseDate.getTime() + 12 * 24 * 60 * 60 * 1000),
      source: 'website',
      status: SongRequestStatus.NEW,
    },
  });

  const songRequestTwo = await prisma.songRequest.create({
    data: {
      contactId: prospectContact.id,
      fullName: prospectContact.fullName,
      email: prospectContact.email ?? 'jonathan.gagnon@email.ca',
      phone: prospectContact.phone ?? '+1 514 555 9988',
      songType: 'Chanson hommage',
      occasion: 'Hommage familial',
      recipientName: 'Louise Gagnon',
      style: 'Ballade piano',
      mood: 'Sincère',
      details: 'Projet délicat pour souligner un souvenir important et transmettre un message de gratitude.',
      budget: 400,
      desiredDeadline: new Date(songRequestBaseDate.getTime() + 20 * 24 * 60 * 60 * 1000),
      source: 'website',
      status: SongRequestStatus.CONTACTED,
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        type: ActivityType.FORM_SUBMISSION,
        title: 'Demande de chanson reçue',
        description: `Soumission via site web. Voir: /crm/song-requests/${songRequestOne.id}`,
        contactId: clientContact.id,
        songRequestId: songRequestOne.id,
        userId: assistant.id,
      },
      {
        type: ActivityType.FORM_SUBMISSION,
        title: 'Demande de chanson reçue',
        description: `Soumission via site web. Voir: /crm/song-requests/${songRequestTwo.id}`,
        contactId: prospectContact.id,
        songRequestId: songRequestTwo.id,
        userId: assistant.id,
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Faire le suivi de la demande de chanson',
        description: `Contacter ${clientContact.fullName} pour cadrer la chanson anniversaire.`,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(songRequestBaseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
        assignedToId: assistant.id,
        createdById: admin.id,
        songRequestId: songRequestOne.id,
        linkedType: LinkedType.SONG_REQUEST,
        linkedId: songRequestOne.id,
      },
      {
        title: 'Préparer la soumission de chanson hommage',
        description: `Préparer proposition budgétaire pour ${prospectContact.fullName}.`,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: new Date(songRequestBaseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        assignedToId: assistant.id,
        createdById: admin.id,
        songRequestId: songRequestTwo.id,
        linkedType: LinkedType.SONG_REQUEST,
        linkedId: songRequestTwo.id,
      },
    ],
  });

  // ── Rendez-vous ────────────────────────────────────────────────────────────
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const in3days = new Date(today);
  in3days.setDate(in3days.getDate() + 3);

  await prisma.appointment.createMany({
    data: [
      {
        title: 'Visite logement 305',
        description: 'Visite du 3½ vacant.',
        startAt: tomorrow,
        endAt: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        type: AppointmentType.VISIT,
        status: AppointmentStatus.CONFIRMED,
        contactId: tenantProspectContact.id,
        propertyId: property.id,
        userId: assistant.id,
      },
      {
        title: 'Appel suivi - Antoine Roy',
        startAt: in3days,
        endAt: new Date(in3days.getTime() + 20 * 60 * 1000),
        type: AppointmentType.CALL,
        status: AppointmentStatus.PENDING,
        contactId: tenantProspectContact.id,
        userId: assistant.id,
      },
      {
        title: 'Inspection maintenance logement 201',
        startAt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        endAt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        type: AppointmentType.INSPECTION,
        status: AppointmentStatus.PENDING,
        propertyId: property.id,
        userId: admin.id,
      },
    ],
  });

  // ── Factures ────────────────────────────────────────────────────────────────
  await prisma.invoice.createMany({
    data: [
      {
        number: 'FAC-2026-0001',
        contactId: clientContact.id,
        issueDate: new Date('2026-02-01'),
        dueDate: new Date('2026-03-01'),
        amount: 2500,
        status: InvoiceStatus.PAID,
        description: 'Consultation immobilière - février 2026',
      },
      {
        number: 'FAC-2026-0002',
        contactId: clientContact.id,
        issueDate: new Date('2026-03-01'),
        dueDate: new Date('2026-03-31'),
        amount: 2500,
        status: InvoiceStatus.SENT,
        description: 'Consultation immobilière - mars 2026',
      },
      {
        number: 'FAC-2026-0003',
        contactId: prospectContact.id,
        issueDate: today,
        dueDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
        amount: 1500,
        status: InvoiceStatus.DRAFT,
        description: 'Proposition bail - 3½ logement 305',
      },
    ],
  });

  // ── Activités ───────────────────────────────────────────────────────────────
  await prisma.activity.createMany({
    data: [
      {
        type: ActivityType.NOTE,
        title: 'Prospect très intéressé',
        description: 'Antoine Roy a posé beaucoup de questions sur les services.',
        contactId: tenantProspectContact.id,
        userId: assistant.id,
      },
      {
        type: ActivityType.EMAIL,
        title: 'Email reçu : Question sur la disponibilité',
        description: 'Contact demande si les logements sont disponibles immédiatement.',
        contactId: prospectContact.id,
        userId: assistant.id,
      },
      {
        type: ActivityType.CALL,
        title: 'Appel avec le client',
        description: 'Confirmation des dates de visite et discussion sur le bail.',
        contactId: clientContact.id,
        userId: admin.id,
      },
      {
        type: ActivityType.FORM,
        title: 'Formulaire soumis : Demande de renseignements',
        description: 'Client a rempli le formulaire de demande de renseignements depuis le site.',
        contactId: prospectContact.id,
        userId: assistant.id,
      },
      {
        type: ActivityType.APPOINTMENT,
        title: 'RDV confirmé pour demain',
        description: 'Visite du logement 305 à 17h.',
        contactId: tenantProspectContact.id,
        userId: assistant.id,
      },
      {
        type: ActivityType.PAYMENT,
        title: 'Paiement reçu',
        description: 'Loyer de mars reçu - confirmé et enregistré.',
        contactId: tenantContact.id,
        userId: assistant.id,
      },
    ],
  });

  console.log('✅ Rendez-vous, factures et activités créés');

}

main()
  .catch((error) => {
    console.error('❌ Erreur seed Prisma', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
