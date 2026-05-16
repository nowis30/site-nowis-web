# Plan de migration BD vers nomenclature Google Calendar

## Objectif
Retirer progressivement la nomenclature `calendly*` sans interruption de service.

## Contraintes
- Production active: migration en plusieurs phases.
- Compatibilite descendante requise pendant la transition.
- Route webhook legacy conservee temporairement.

## Phase 1 - Ajout non destructif (safe)
1. Ajouter de nouveaux champs sur `WorkshopRequest`:
- `bookingEventUri` (TEXT, nullable)
- `bookingInviteeUri` (TEXT, nullable)
- `bookingUrl` (TEXT, nullable)

2. Laisser les champs legacy existants:
- `calendlyEventUri`
- `calendlyInviteeUri`
- `calendlyUrl`

3. Mettre a jour l'application pour ecrire dans les 2 jeux de champs (dual-write).

Exemple SQL:

```sql
ALTER TABLE "WorkshopRequest"
  ADD COLUMN "bookingEventUri" TEXT,
  ADD COLUMN "bookingInviteeUri" TEXT,
  ADD COLUMN "bookingUrl" TEXT;
```

## Phase 2 - Backfill
Copier les valeurs legacy vers les nouveaux champs quand ils sont null.

```sql
UPDATE "WorkshopRequest"
SET
  "bookingEventUri" = COALESCE("bookingEventUri", "calendlyEventUri"),
  "bookingInviteeUri" = COALESCE("bookingInviteeUri", "calendlyInviteeUri"),
  "bookingUrl" = COALESCE("bookingUrl", "calendlyUrl");
```

## Phase 3 - Read switch
- Lire prioritairement `booking*`.
- Garder fallback sur `calendly*` pendant une periode de stabilisation.

## Phase 4 - Suppression progressive legacy
1. Retirer le dual-write.
2. Supprimer fallback lecture.
3. Supprimer colonnes legacy en migration finale.

```sql
ALTER TABLE "WorkshopRequest"
  DROP COLUMN "calendlyEventUri",
  DROP COLUMN "calendlyInviteeUri",
  DROP COLUMN "calendlyUrl";
```

## Enum provider (optionnel, phase tardive)
Le provider `CALENDLY` peut etre conserve pour historique. Si renommage necessaire:
- ajouter une nouvelle valeur enum (ex: `BOOKING_LEGACY`)
- migrer les donnees
- basculer le code
- retirer ancienne valeur en derniere phase

## Validation recommandee
- `npm run type-check`
- `npm run lint`
- tests metier rendez-vous
- verification manuelle page booking + CRM calendrier

## Phase 1 implementee
- Migration creee: `prisma/migrations/20260512153000_add_generic_booking_fields/migration.sql`
- Champs ajoutes sur `WorkshopRequest`:
  - `bookingProvider`
  - `bookingEventUri`
  - `bookingInviteeUri`
  - `bookingUrl`
  - `bookingSource`
  - `bookingSyncedAt`
  - `bookingRawPayload`
- Backfill SQL inclus:
  - copie `calendlyEventUri` -> `bookingEventUri`
  - copie `calendlyInviteeUri` -> `bookingInviteeUri`
  - copie `calendlyUrl` -> `bookingUrl`
  - renseigne `bookingProvider='CALENDLY'` si donnees legacy presentes
- Dual-read actif:
  - lecture prioritaire `booking*` avec fallback `calendly*`
- Dual-write actif:
  - webhook legacy Calendly ecrit dans `booking*` et `calendly*`
  - sync Google/Microsoft ecrit dans `booking*` sans ecraser `calendly*`
- Legacy Calendly/webhook conserve (aucune suppression destructive)
