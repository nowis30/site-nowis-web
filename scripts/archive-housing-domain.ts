import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HOUSING_LINKED_TYPES = ['LEGACY_PROPERTY', 'LEGACY_UNIT', 'LEGACY_TENANT', 'LEGACY_LEASE', 'LEGACY_PAYMENT', 'LEGACY_MAINTENANCE_TICKET'] as const;
const LEGACY_CONTACT_TYPES = ['ORGANIZATION', 'PARTICIPANT'] as const;
const LEGACY_CASE_TYPES = ['LEGACY_HOUSING', 'LEGACY_MAINTENANCE'] as const;

function serializeForJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, currentValue) => {
      if (typeof currentValue === 'bigint') {
        return currentValue.toString();
      }

      if (Prisma.Decimal.isDecimal(currentValue)) {
        return currentValue.toString();
      }

      return currentValue;
    }),
  ) as T;
}

function buildArchiveDir() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return process.env.HOUSING_ARCHIVE_DIR?.trim()
    ? path.resolve(process.env.HOUSING_ARCHIVE_DIR.trim())
    : path.join(process.cwd(), 'archive', 'housing-domain', timestamp);
}

function writeJsonFile(outputDir: string, fileName: string, payload: unknown) {
  writeFileSync(path.join(outputDir, fileName), `${JSON.stringify(serializeForJson(payload), null, 2)}\n`, 'utf8');
}

async function main() {
  const outputDir = buildArchiveDir();
  mkdirSync(outputDir, { recursive: true });

  const [
    properties,
    units,
    tenants,
    leases,
    payments,
    maintenanceTickets,
    maintenanceUpdates,
    contactsLegacyTypes,
    usersLegacyRoles,
    casesLegacyTypes,
    documentsLinkedHousing,
    tasksLinkedHousing,
    communicationsLinkedHousing,
    appointmentsLinkedProperties,
    activitiesLinkedProperties,
  ] = await Promise.all([
    prisma.legacyProperty.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.legacyUnit.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.legacyTenant.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.legacyLease.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.legacyPayment.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.legacyMaintenanceTicket.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.legacyMaintenanceUpdate.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.contact.findMany({
      where: { type: { in: [...LEGACY_CONTACT_TYPES] } },
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.user.findMany({
      where: { role: 'PORTAL_USER' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.caseRecord.findMany({
      where: { type: { in: [...LEGACY_CASE_TYPES] } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.document.findMany({
      where: { linkedType: { in: [...HOUSING_LINKED_TYPES] } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.task.findMany({
      where: { linkedType: { in: [...HOUSING_LINKED_TYPES] } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.communication.findMany({
      where: {
        OR: [
          { legacyTenantId: { not: null } },
          { linkedType: { in: [...HOUSING_LINKED_TYPES] } },
        ],
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.appointment.findMany({
      where: { legacyPropertyId: { not: null } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.activity.findMany({
      where: { legacyPropertyId: { not: null } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
  ]);

  const manifest = {
    generatedAt: new Date().toISOString(),
    outputDir,
    strategy: 'archive-first-safe-deprecation',
    irreversibleDropPerformed: false,
    datasets: {
      properties: properties.length,
      units: units.length,
      tenants: tenants.length,
      leases: leases.length,
      payments: payments.length,
      maintenanceTickets: maintenanceTickets.length,
      maintenanceUpdates: maintenanceUpdates.length,
      contactsLegacyTypes: contactsLegacyTypes.length,
      usersLegacyRoles: usersLegacyRoles.length,
      casesLegacyTypes: casesLegacyTypes.length,
      documentsLinkedHousing: documentsLinkedHousing.length,
      tasksLinkedHousing: tasksLinkedHousing.length,
      communicationsLinkedHousing: communicationsLinkedHousing.length,
      appointmentsLinkedProperties: appointmentsLinkedProperties.length,
      activitiesLinkedProperties: activitiesLinkedProperties.length,
    },
    legacyEnums: {
      linkedTypes: HOUSING_LINKED_TYPES,
      contactTypes: LEGACY_CONTACT_TYPES,
      caseTypes: LEGACY_CASE_TYPES,
      userRoles: ['PORTAL_USER'],
    },
    nextSteps: [
      'Verifier le contenu archive avant tout drop Prisma ulterieur.',
      'Conserver ce dossier hors git ou dans un stockage securise si necessaire.',
      'Supprimer les references runtime restantes avant de retirer les modeles du schema Prisma.',
    ],
  };

  writeJsonFile(outputDir, 'manifest.json', manifest);
  writeJsonFile(outputDir, 'properties.json', properties);
  writeJsonFile(outputDir, 'units.json', units);
  writeJsonFile(outputDir, 'tenants.json', tenants);
  writeJsonFile(outputDir, 'leases.json', leases);
  writeJsonFile(outputDir, 'payments.json', payments);
  writeJsonFile(outputDir, 'maintenance-tickets.json', maintenanceTickets);
  writeJsonFile(outputDir, 'maintenance-updates.json', maintenanceUpdates);
  writeJsonFile(outputDir, 'contacts-legacy-types.json', contactsLegacyTypes);
  writeJsonFile(outputDir, 'users-legacy-roles.json', usersLegacyRoles);
  writeJsonFile(outputDir, 'cases-legacy-types.json', casesLegacyTypes);
  writeJsonFile(outputDir, 'documents-linked-housing.json', documentsLinkedHousing);
  writeJsonFile(outputDir, 'tasks-linked-housing.json', tasksLinkedHousing);
  writeJsonFile(outputDir, 'communications-linked-housing.json', communicationsLinkedHousing);
  writeJsonFile(outputDir, 'appointments-linked-properties.json', appointmentsLinkedProperties);
  writeJsonFile(outputDir, 'activities-linked-properties.json', activitiesLinkedProperties);

  console.log(`Archive logement legacy générée dans ${outputDir}`);
  console.log(JSON.stringify(manifest.datasets, null, 2));
}

main()
  .catch((error) => {
    console.error('Echec archive housing domain', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });