import { PrismaClient, ContactType, CaseType, CaseStatus, UserRole, InquiryStatus, CommunicationDirection, LinkedType, TaskPriority, TaskStatus, AppointmentType, AppointmentStatus, InvoiceStatus, ActivityType, SongRequestStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.songRequest.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.invoice.deleteMany();
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

  const portalUser = await prisma.user.create({
    data: {
      email: 'client@crm.local',
      fullName: 'Client Demo',
      role: UserRole.PORTAL_USER,
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
        source: 'website',
        tags: ['VIP'],
      },
    }),
    prisma.contact.create({
      data: {
        type: ContactType.PROSPECT,
        fullName: 'Jonathan Gagnon',
        email: 'jonathan.gagnon@email.ca',
        phone: '+1 514 555 9988',
        source: 'facebook-ads',
        tags: ['hot'],
      },
    }),
    prisma.contact.create({
      data: {
        type: ContactType.ORGANIZATION,
        fullName: 'Sophie Bouchard',
        email: 'sophie.bouchard@email.ca',
        phone: '+1 438 555 7788',
        source: 'referral',
        tags: ['partner'],
      },
    }),
    prisma.contact.create({
      data: {
        type: ContactType.PARTICIPANT,
        fullName: 'Antoine Roy',
        email: 'antoine.roy@email.ca',
        phone: '+1 581 555 4545',
        source: 'web-form',
        tags: ['participant'],
      },
    }),
  ]);

  const [clientContact, prospectContact, organizationContact, participantContact] = contacts;

  await prisma.user.update({
    where: { id: portalUser.id },
    data: { contactId: clientContact.id },
  });

  const caseRecord = await prisma.caseRecord.create({
    data: {
      title: 'Suivi onboarding client',
      type: CaseType.CLIENT,
      status: CaseStatus.IN_PROGRESS,
      contactId: clientContact.id,
      ownerUserId: assistant.id,
      referenceCode: 'DOS-2026-0001',
      description: 'Qualification et suivi des besoins client.',
    },
  });

  await prisma.caseNote.createMany({
    data: [
      {
        caseId: caseRecord.id,
        authorUserId: assistant.id,
        content: 'Premier contact realise, besoins clarifies.',
      },
      {
        caseId: caseRecord.id,
        authorUserId: admin.id,
        content: 'Priorite haute pour proposition commerciale.',
      },
    ],
  });

  await prisma.inquiry.create({
    data: {
      subject: 'Demande de renseignements',
      message: 'Bonjour, je souhaite en savoir plus sur vos services.',
      source: 'website',
      status: InquiryStatus.QUALIFIED,
      contactId: prospectContact.id,
      caseId: caseRecord.id,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Appeler le client',
        description: 'Confirmer les details du besoin.',
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
        title: 'Envoyer recap email',
        description: 'Envoyer un resume des prochaines etapes.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        assignedToId: assistant.id,
        createdById: admin.id,
        linkedType: LinkedType.CONTACT,
        linkedId: clientContact.id,
      },
    ],
  });

  await prisma.document.createMany({
    data: [
      {
        fileName: 'brief-client.pdf',
        fileUrl: '/crm/documents/brief-client.pdf',
        linkedType: LinkedType.CASE,
        linkedId: caseRecord.id,
        uploadedById: assistant.id,
      },
      {
        fileName: 'proposition-initiale.pdf',
        fileUrl: '/crm/documents/proposition-initiale.pdf',
        linkedType: LinkedType.CONTACT,
        linkedId: clientContact.id,
        uploadedById: admin.id,
      },
    ],
  });

  await prisma.communication.createMany({
    data: [
      {
        contactId: prospectContact.id,
        userId: assistant.id,
        channel: 'EMAIL',
        subject: 'Confirmation de rendez-vous',
        body: 'Votre rendez-vous est confirme.',
        direction: CommunicationDirection.OUTBOUND,
        linkedType: LinkedType.CASE,
        linkedId: caseRecord.id,
      },
      {
        contactId: participantContact.id,
        userId: portalUser.id,
        channel: 'PORTAL',
        body: 'Message recu via portail client.',
        direction: CommunicationDirection.INBOUND,
        linkedType: LinkedType.CONTACT,
        linkedId: participantContact.id,
      },
    ],
  });

  const songRequestBaseDate = new Date();

  const songRequestOne = await prisma.songRequest.create({
    data: {
      contactId: clientContact.id,
      fullName: clientContact.fullName,
      email: clientContact.email ?? 'marie.tremblay@email.ca',
      phone: clientContact.phone ?? '+1 514 555 1122',
      songType: 'Birthday song',
      occasion: '40th birthday',
      recipientName: 'Eric Tremblay',
      style: 'Acoustic pop',
      mood: 'Emotive',
      details: 'Custom song request from website.',
      budget: 250,
      desiredDeadline: new Date(songRequestBaseDate.getTime() + 12 * 24 * 60 * 60 * 1000),
      source: 'website',
      status: SongRequestStatus.NEW,
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        type: ActivityType.FORM_SUBMISSION,
        title: 'New song request',
        description: `Submission from website: /crm/song-requests/${songRequestOne.id}`,
        contactId: clientContact.id,
        songRequestId: songRequestOne.id,
        userId: assistant.id,
      },
      {
        type: ActivityType.NOTE,
        title: 'Organization follow-up',
        description: 'Initial outreach to organization contact.',
        contactId: organizationContact.id,
        userId: admin.id,
      },
    ],
  });

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.appointment.createMany({
    data: [
      {
        title: 'Client call',
        description: 'Discovery call.',
        startAt: tomorrow,
        endAt: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        type: AppointmentType.CALL,
        status: AppointmentStatus.CONFIRMED,
        contactId: clientContact.id,
        userId: assistant.id,
      },
      {
        title: 'Internal review',
        startAt: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        endAt: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        type: AppointmentType.MEETING,
        status: AppointmentStatus.PENDING,
        contactId: participantContact.id,
        userId: admin.id,
      },
    ],
  });

  await prisma.invoice.createMany({
    data: [
      {
        number: 'FAC-2026-0001',
        contactId: clientContact.id,
        issueDate: new Date('2026-02-01'),
        dueDate: new Date('2026-03-01'),
        amount: 2500,
        status: InvoiceStatus.PAID,
        description: 'Monthly service package - February 2026',
      },
      {
        number: 'FAC-2026-0002',
        contactId: clientContact.id,
        issueDate: new Date('2026-03-01'),
        dueDate: new Date('2026-03-31'),
        amount: 2500,
        status: InvoiceStatus.SENT,
        description: 'Monthly service package - March 2026',
      },
    ],
  });

  console.log('Seed generated successfully');
  console.log('Demo accounts: admin@crm.local, assistant@crm.local, client@crm.local');
  console.log(`Demo password: ${demoPassword}`);
}

main()
  .catch((error) => {
    console.error('Prisma seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
