/**
 * Renseigne ou met a jour le profil emetteur de facturation avec les informations de Nowis.
 * Usage: npx tsx scripts/seed-billing-profile.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const data = {
    displayName: 'Creation Nowis',
    companyName: 'Creation Nowis',
    legalLabel: 'Simon Morin',
    tradeName: 'Nowis',
    email: 'simonmorin@nowis.store',
    phone: '819 388-3407',
    website: 'https://nowis.store',
    addressLine1: '4667 Traversy',
    addressLine2: null,
    city: 'Drummondville',
    state: 'Quebec',
    postalCode: 'J2A 2G2',
    country: 'Canada',
    taxId: null,
    paymentTerms: null,
    footerNote: null,
    taxesEnabled: false,
    taxRateGst: 0,
    taxRateQst: 0,
    currency: 'CAD',
    isActive: true,
  };

  const existing = await prisma.billingProfile.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });

  if (existing) {
    await prisma.billingProfile.update({
      where: { id: existing.id },
      data,
    });
    console.log('Profil emetteur mis a jour (id:', existing.id, ')');
  } else {
    const created = await prisma.billingProfile.create({ data });
    console.log('Profil emetteur cree (id:', created.id, ')');
  }

  console.log('Fait.');
}

main()
  .catch((error) => {
    console.error('Erreur:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
