/**
 * Rétroconversion des blocs [CLIENT_PROFILE_META_START]...[CLIENT_PROFILE_META_END]
 * stockés dans la colonne `notes` des contacts vers la colonne JSON dédiée `profileMeta`.
 *
 * Usage : tsx scripts/backfill-contact-profile-meta.ts
 */
import { prisma } from '../src/lib/prisma';
import { readClientProfileMeta, type ClientAddressFields, type ClientRequestType } from '../src/features/client-portal/profile';

const META_BLOCK_PATTERN = /\[(?:CLIENT_PROFILE_META_START|ROFILE_META_START)\]([\s\S]*?)\[CLIENT_PROFILE_META_END\]/g;

function stripMetaBlocks(notes: string): string {
  return notes.replace(META_BLOCK_PATTERN, '').trim();
}

async function main() {
  // Trouver tous les contacts avec un bloc meta dans leurs notes
  const contacts = await prisma.contact.findMany({
    where: {
      notes: { contains: 'CLIENT_PROFILE_META' },
    },
    select: { id: true, notes: true, profileMeta: true },
  });

  console.log(`[backfill:profileMeta] contacts avec meta dans notes : ${contacts.length}`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const contact of contacts) {
    try {
      // Lire le dernier bloc valide dans les notes
      const parsed = readClientProfileMeta(contact.notes);

      if (!parsed) {
        console.warn(`[backfill:profileMeta] SKIP ${contact.id} — aucun bloc valide trouvé`);
        skipped += 1;
        continue;
      }

      // Nettoyer les notes (retirer les blocs meta)
      const cleanedNotes = contact.notes ? stripMetaBlocks(contact.notes) : null;

      // Ne pas écraser un profileMeta déjà présent — mettre à jour uniquement si la colonne est vide
      const existingMeta = contact.profileMeta as Record<string, unknown> | null;
      const newMeta = existingMeta ?? {
        billingAddress: parsed.billingAddress,
        requestPostalAddress: parsed.requestPostalAddress,
        samePostalAsBilling: parsed.samePostalAsBilling,
        requestType: parsed.requestType,
        updatedAt: parsed.updatedAt,
      };

      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          notes: cleanedNotes || null,
          profileMeta: newMeta,
        },
      });

      console.log(
        `[backfill:profileMeta] OK ${contact.id} — requestType=${parsed.requestType}` +
        ` adresse=${parsed.billingAddress.streetNumber} ${parsed.billingAddress.street}, ${parsed.billingAddress.city}`
      );
      migrated += 1;
    } catch (err) {
      console.error(`[backfill:profileMeta] ERREUR ${contact.id}`, err);
      errors += 1;
    }
  }

  console.log('');
  console.log(`[backfill:profileMeta] total traités : ${contacts.length}`);
  console.log(`[backfill:profileMeta] migrés        : ${migrated}`);
  console.log(`[backfill:profileMeta] ignorés        : ${skipped}`);
  console.log(`[backfill:profileMeta] erreurs        : ${errors}`);
}

main()
  .catch((error) => {
    console.error('[backfill:profileMeta] échec', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
