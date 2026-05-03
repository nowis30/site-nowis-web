# CRM Sales Flow Diagnostic

Date: 2026-05-03
Scope: site-nowis-web
Objectif: expliquer pourquoi le flux commercial CRM (soumissions/devis + factures + paiement + liens + email) n est pas pleinement utilisable.

## 1) Pourquoi la creation de soumission ne fonctionne pas

Cause racine principale (validation datetime):
- Le formulaire de devis commercial envoie `validUntil` depuis un champ `datetime-local` (format local sans fuseau), mais l API exige `z.string().datetime()`.
- Fichiers:
  - src/features/crm/components/commercial-quotes/CommercialQuoteEditorPage.tsx
  - src/features/crm/server/validators.ts
- Effet:
  - des creations/editions peuvent echouer en 400 si l utilisateur remplit "Valide jusqu au".

Causes secondaires:
- Le module "soumissions" historique (`/crm/submissions`) et le module "soumissions commerciales" (`/crm/commercial-quotes`) coexistent avec des semantiques differentes, ce qui cree une confusion fonctionnelle.
- Le bouton "Envoyer" de soumission commerciale ne fait aujourd hui qu un changement de statut (pas d envoi email avec lien public).

## 2) Pourquoi la creation de facture ne fonctionne pas

Cause racine principale (retour erreur non gere):
- Le formulaire de creation facture ne verifie pas `response.ok` et ferme le formulaire meme en echec API, ce qui donne l impression que "rien ne fonctionne".
- Fichier:
  - src/features/crm/components/invoices/InvoicesPage.tsx (NewInvoiceForm.submit)

Causes possibles de 400 cote API:
- `dueDate`/`issueDate` sont strictement valides via `z.string().datetime()`.
- format invalide ou payload incomplet => 400 "Donnees invalides".
- Fichiers:
  - src/app/api/crm/invoices/route.ts
  - src/features/crm/server/validators.ts

Cause structurelle:
- Le modele facture est encore "montant global + description" (pas de `InvoiceItem`), alors que le besoin metier demande des lignes detaillees, type de facture, tokens publics dedies.

## 3) Routes API appelees actuellement

Soumissions commerciales (devis):
- GET/POST `/api/crm/commercial-quotes`
- GET/PATCH/DELETE `/api/crm/commercial-quotes/[id]`
- POST `/api/crm/commercial-quotes/[id]/send`
- POST `/api/crm/commercial-quotes/[id]/accept`
- POST `/api/crm/commercial-quotes/[id]/decline`
- POST `/api/crm/commercial-quotes/[id]/convert-to-invoice`

Factures:
- GET/POST `/api/crm/invoices`
- GET/PUT/PATCH/DELETE `/api/crm/invoices/[id]`
- POST `/api/crm/invoices/[id]/send`
- POST `/api/crm/invoices/[id]/paypal/create`
- POST `/api/crm/invoices/[id]/paypal/send`
- GET/POST `/api/crm/invoices/[id]/paypal/status`

Soumissions entrantes (inquiries):
- GET `/api/crm/submissions`
- PATCH `/api/crm/submissions/[id]`

## 4) Routes API manquantes (par rapport a l objectif)

Manquantes ou non branchees:
- POST `/api/crm/quotes/[id]/send-email` (ou equivalent pour devis commerciaux)
- routes publiques de devis tokenises:
  - GET `/api/public/quotes/[token]`
  - POST `/api/public/quotes/[token]/accept`
  - POST `/api/public/quotes/[token]/decline`
- route publique facture tokenisee:
  - GET `/api/public/invoices/[token]`
- route publique demande de soumission unifiee:
  - POST `/api/public/submission-request`

## 5) Composants UI branches

Branches:
- Devis commerciaux:
  - src/features/crm/components/commercial-quotes/CommercialQuotesListPage.tsx
  - src/features/crm/components/commercial-quotes/CommercialQuoteEditorPage.tsx
  - src/app/crm/(app)/commercial-quotes/*
- Factures CRM:
  - src/features/crm/components/invoices/InvoicesPage.tsx
  - src/features/crm/components/invoices/InvoiceDetailPage.tsx
- PayPal facture:
  - src/features/crm/components/invoices/PayPalInvoicePanel.tsx
- Portail client tokenise existant:
  - src/app/crm/client/[token]/page.tsx
  - src/app/crm/client/[token]/invoices/[id]/page.tsx

## 6) Composants UI non branches / manquants

- Aucun ecran public dedie:
  - `/soumission/nouvelle`
  - `/soumission/[token]`
  - `/facture/[token]`
- Aucun ecran public dedie paiement `song/workshop` tokenise.
- Aucun composant d envoi email specifique pour devis commerciaux avec lien public.

## 7) Modeles Prisma utilises

Utilises:
- `CommercialQuote`, `CommercialQuoteLine`
- `Invoice`
- `Inquiry` (soumissions entrantes)
- `Activity`
- `OutboundEmail`
- `Communication`
- `SongRequest`, `WorkshopRequest`
- `Contact`, `Organization`

## 8) Champs Prisma manquants (ecart vs objectif)

Pour devis commerciaux (`CommercialQuote`):
- pas de `publicToken`
- pas de `publicTokenExpiresAt`
- pas de `type` metier explicite (`song/workshop/general`)

Pour factures (`Invoice`):
- pas de `organizationId`
- pas de `quoteId` explicite (liaison inverse partielle via `convertedFromQuote`)
- pas de `type` metier (`song/workshop/general`)
- pas de `subtotal`, `taxes`, `total` en structure detaillee (seulement `amount`)
- pas de `publicToken`
- pas de `publicTokenExpiresAt`
- pas de table `InvoiceItem`

Pour paiements:
- pas de modele `Payment` dedie pour journaliser les transactions provider/webhook.

## 9) Problemes de permissions

- Les routes devis commerciaux imposent admin (`ensureAdmin`) meme pour actions qui pourraient etre delegables.
- Role `ASSISTANT` n a aucune permission `commercialQuotes` (permissions.ts), donc un assistant CRM ne peut ni creer ni modifier de devis commerciaux.

## 10) Problemes de validation formulaire

- Devis:
  - `validUntil` en `datetime-local` ne matche pas toujours `z.string().datetime()`.
- Facture:
  - la validation API est stricte, mais l UI ne remonte pas l erreur utilisateur (submit silencieux).
- Numeros facture/soumission:
  - en creation facture manuelle, numero obligatoire saisi a la main, sans generation de secours cote UI.

## 11) Problemes PayPal

- Integration backend presente (create/send/status/webhook), mais flux global incomplet:
  - pas de page publique facture tokenisee unique `facture/[token]`
  - pas de modele `Payment` dedie
  - pas de UX unifiee `song/workshop/general` cote public
- En mode non configure, UX partiellement claire mais pas harmonisee partout.

## 12) Problemes email

- Systeme email non unifie:
  - `src/lib/email-service.ts` (Resend) pour CRM factures/contacts/taches
  - `src/lib/email.ts` (SMTP/Nodemailer) en parallele
- Aucun envoi email dedie pour devis commerciaux avec lien public sécurisé.
- Le bouton "send" de devis commerciaux ne declenche pas de vrai courriel.

## 13) Erreurs observees

Console navigateur:
- Non capturee directement dans cette session (pas de session navigateur active reproduisant l action).

Terminal:
- builds/lint/type-check recents OK globalement.
- erreurs logiques detectees par lecture de code:
  - echec possible 400 sur datetime devis/facture
  - echec creation facture masque par UI (pas de controle `response.ok`).

Logs Vercel / Render:
- non disponibles depuis cette session outillage.
- aucune trace d execution distante inspectable ici.

## 14) Plan exact de correction (ordre prioritaire)

Phase A (blocages immediats creation):
1. Corriger l envoi des dates en ISO pour devis (`validUntil`) et assouplir la validation serveur si necessaire.
2. Corriger `NewInvoiceForm.submit` pour gerer `response.ok`, afficher les erreurs et ne pas fermer le formulaire en echec.
3. Ajouter messages utilisateur coherents sur creation soumission/facture (success/error).

Phase B (flux metier soumission -> facture):
4. Ajouter envoi email devis commercial (route + bouton) avec lien sécurisé.
5. Ajouter endpoints publics de lecture/acceptation/refus devis par token.
6. Convertir en facture depuis devis accepte, conserver traçabilite CRM.

Phase C (facture publique + paiement):
7. Ajouter token public facture + page `facture/[token]` en lecture/paiement.
8. Brancher le paiement PayPal public via facture tokenisee sans exposer secrets.
9. Ajouter verif serveur du statut paiement (webhook + sync), interdire confirmation client manuelle.

Phase D (schema minimal requis sans casser l existant):
10. Ajouter champs manquants non destructifs:
   - `CommercialQuote.publicToken`, `publicTokenExpiresAt`, `type`
   - `Invoice.publicToken`, `publicTokenExpiresAt`, `type`, `organizationId`, `quoteId` (si absent)
11. Ajouter modele `Payment` non destructif et liaison `invoiceId`.
12. Ajouter `InvoiceItem` si necessaire, avec migration additive uniquement.

Phase E (email unifie):
13. Reutiliser `email-service` existant comme facade principale (Resend), fallback clair "Email non configure".
14. Ajouter templates pour:
   - lien soumission
   - devis
   - facture
   - paiement recu
   - alerte admin nouvelle demande

Phase F (validation finale):
15. Executer:
   - npm run lint
   - npm run type-check
   - npm run build
   - npx prisma validate
   - npx prisma generate
16. Tester les 20 cas fonctionnels demandes (public + CRM + securite).