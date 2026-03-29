# Purge securisee du domaine immobilier

Ce depot est en phase de retrait progressif du domaine immobilier. La strategie retenue est volontairement non destructive dans cette phase.

## Objectif

- retirer les dependances runtime cote application
- archiver les donnees legacy avant toute suppression irreversible
- tracer explicitement les tables, enums et colonnes encore legacy dans Prisma

## Commandes

```bash
npm run db:archive:housing
npm run db:deprecate:housing:safe
```

## Ce que fait l'archive

Le script [scripts/archive-housing-domain.ts](scripts/archive-housing-domain.ts) exporte en JSON:

- tables legacy: Property, Unit, Tenant, Lease, Payment, MaintenanceTicket, MaintenanceUpdate
- references legacy conservees dans les modeles actifs: contacts, users, cases, documents, tasks, communications, appointments, activities
- un manifest avec horodatage et comptages

Les exports sont ecrits dans `archive/housing-domain/<timestamp>/` et ignores par git.

## Ce que fait la migration Prisma

La migration [prisma/migrations/20260330123000_mark_housing_domain_legacy/migration.sql](prisma/migrations/20260330123000_mark_housing_domain_legacy/migration.sql) n'efface rien.

Elle ajoute uniquement des commentaires PostgreSQL pour marquer:

- les tables purement legacy
- les types enum encore contamines par l'ancien domaine
- les colonnes de transition encore presentes dans des modeles conserves

## Ordre recommande

1. Executer `npm run db:archive:housing`.
2. Verifier le manifest et le volume des fichiers exportes.
3. Executer `npm run prisma:migrate:deploy` si vous voulez poser les commentaires de deprecation en base.
4. Continuer la suppression des references runtime restantes.
5. Faire une seconde archive juste avant la future migration destructive.

## Phase ulterieure

La suppression irreversible devra intervenir dans une migration distincte, apres validation metier, et seulement lorsque:

- aucun flux applicatif n'utilise plus `Property`, `Unit`, `Tenant`, `Lease`, `Payment`, `MaintenanceTicket`, `MaintenanceUpdate`
- les enums mixtes auront ete nettoyes ou remplaces
- une archive finale aura ete conservee hors du depot