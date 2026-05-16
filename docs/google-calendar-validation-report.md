# Validation migration Google Calendar

Date: 2026-05-12

## Verifications executees
1. TypeScript
- Commande: `npm run type-check`
- Resultat: OK

2. ESLint
- Commande: `npm run lint`
- Resultat: OK

3. Tests metier rendez-vous
- Commande: `npm run test:appointment-business-rules`
- Resultat: OK (6/6)

4. Tests migration booking
- Commande: `npm run test:booking-migration-rules`
- Resultat: OK (4/4)

5. Garde-fou anti reintroduction Calendly
- Commande: `npm run test:guard-no-calendly-links`
- Resultat: OK (1/1)

6. Build production
- Commande: `npm run build`
- Resultat: NON EXECUTE localement (conditionnel)
- Cause: variable `DATABASE_URL` absente dans l'environnement local (`DATABASE_URL_PRESENT=false`)

## References Calendly restantes

### 1) Necessaires legacy webhook / historique
- Webhook legacy et diagnostics:
  - `src/app/api/webhooks/calendly/route.ts`
  - `src/app/api/crm/calendar/calendly-diagnostics/route.ts`
  - `src/app/api/crm/calendar/calendly-test-payload/route.ts`
- Schema et migrations legacy:
  - `prisma/schema.prisma` (`calendlyEventUri`, `calendlyInviteeUri`, `calendlyUrl`, provider `CALENDLY`)
  - `prisma/migrations/20260429120000_extend_workshop_requests_for_ateliers/migration.sql`
  - `prisma/migrations/20260512153000_add_generic_booking_fields/migration.sql`
- Dual-read/dual-write sur workshop requests:
  - `src/app/api/crm/workshop-requests/route.ts`
  - `src/app/api/crm/workshop-requests/[id]/route.ts`
  - `src/features/workshops/schemas.ts`

### 2) Conservees comme fallback de compatibilite (a renommer plus tard)
- Variables env legacy en fallback:
  - `src/lib/booking-link.ts`
  - `src/features/crm/components/appointments/AppointmentsList.tsx`
  - `src/features/crm/components/calendar/CalendarCreateAppointmentPage.tsx`
  - `src/features/crm/components/calendar/CrmCalendarPage.tsx`
  - `.env.example`

### 3) Supprimees/remplacees dans cette passe
- Libelles UI/CRM remplaces par terminologie generique:
  - `src/app/crm/(app)/calendar/page.tsx` (`Calendrier connecté`)
  - `src/features/crm/components/calendar/CrmCalendarPage.tsx` (`Google Calendar`, `Microsoft Calendar`, `Calendrier connecté`)
  - `src/app/atelier/[token]/page.tsx` (titre embed de reservation)
  - `src/app/api/webhooks/calendly/route.ts` (titres/description visibles orientés `Réservation`)
- Fallback hardcode supprime:
  - `src/lib/booking-link.ts` n'impose plus de `DEFAULT_BOOKING_URL` en dur
  - Erreur controlee si aucune variable booking n'est definie

## Controle fonctionnel desktop/mobile (checklist)
A executer apres definition des variables env.

1. Desktop booking public
- Ouvrir `/booking`
- Verifier iframe Google Calendar visible
- Verifier CTA "Choisir mon rendez-vous" ouvre la bonne URL

2. Desktop atelier token
- Ouvrir `/atelier/[token]`
- Verifier iframe + bouton de reservation
- Verifier liens tel/mail

3. CRM calendrier
- Ouvrir `/crm/calendar`
- Verifier bouton "Reserver via Google Calendar"
- Verifier labels "Calendrier connecté" pour les evenements legacy

4. Mobile (simulateur navigateur)
- Verifier affichage iframe sans debordement
- Verifier boutons touch target > 44px
- Verifier navigation vers reservation externe

## Statut
- Migration front et messages API: OK
- Migration Prisma phase 1: OK (champs + backfill + dual-read/dual-write)
- Compatibilite legacy webhook: conservee
- Build complet: en attente de `DATABASE_URL`
