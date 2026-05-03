# PayPal Integration Plan

Date: 2026-05-03
Scope: site-nowis-web
Etat: phase 2 implemente cote schema, service serveur, routes CRM, webhook, detail facture CRM et portail client.

## 1. Resume fonctionnel

Objectif de cette phase:
- Conserver la facture comme source de verite dans le CRM interne.
- Creer puis envoyer une facture PayPal a partir d une facture CRM existante.
- Synchroniser les statuts PayPal vers le CRM.
- Recevoir les webhooks PayPal verifies serveur.
- Exposer au portail client un lien de paiement PayPal en lecture seule.

## 2. Fichiers crees

- prisma/migrations/20260503153000_add_paypal_invoice_fields/migration.sql
- src/lib/server/paypal.ts
- src/app/api/crm/invoices/[id]/paypal/create/route.ts
- src/app/api/crm/invoices/[id]/paypal/send/route.ts
- src/app/api/crm/invoices/[id]/paypal/status/route.ts
- src/app/api/paypal/webhook/route.ts
- src/features/crm/components/invoices/PayPalInvoicePanel.tsx
- paypal-integration-plan.md

## 3. Fichiers modifies

- prisma/schema.prisma
- .env.example
- src/app/crm/(app)/dashboard/page.tsx
- src/app/crm/(app)/invoices/[id]/page.tsx
- src/app/crm/client/[token]/page.tsx
- src/app/crm/client/[token]/invoices/[id]/page.tsx
- src/features/crm/components/invoices/InvoiceDetailPage.tsx
- zoho-removal-report.md

## 4. Routes creees

### Routes CRM admin
- POST /api/crm/invoices/[id]/paypal/create
  - Cree la facture PayPal depuis la facture CRM.
  - Reserve admin.

- POST /api/crm/invoices/[id]/paypal/send
  - Envoie la facture PayPal.
  - Reserve admin.

- GET /api/crm/invoices/[id]/paypal/status
- POST /api/crm/invoices/[id]/paypal/status
  - Synchronise le statut PayPal vers le CRM.
  - Reserve admin.

### Webhook serveur
- POST /api/paypal/webhook
  - Verifie la signature PayPal.
  - Gère:
    - INVOICING.INVOICE.PAID
    - INVOICING.INVOICE.CANCELLED
    - INVOICING.INVOICE.REFUNDED
    - INVOICING.INVOICE.UPDATED

## 5. Variables d environnement necessaires

Obligatoires:
- PAYPAL_ENV=sandbox
- PAYPAL_CLIENT_ID=
- PAYPAL_CLIENT_SECRET=
- PAYPAL_WEBHOOK_ID=
- PAYPAL_BUSINESS_EMAIL=
- PAYPAL_CURRENCY=CAD

Optionnelles:
- NEXT_PUBLIC_PAYPAL_CLIENT_ID=
- NEXT_PUBLIC_PAYPAL_BILLING_URL=

Regles:
- PAYPAL_CLIENT_SECRET reste strictement serveur.
- Ne jamais le mettre dans NEXT_PUBLIC.
- Ne jamais le logger.

## 6. Ou mettre les variables

### Vercel
- Project Settings
- Environment Variables
- Ajouter les variables ci-dessus pour Preview et Production selon l environnement.

### Render
- Service Settings
- Environment
- Ajouter les memes variables pour le service web.

## 7. Service serveur PayPal

Fichier:
- src/lib/server/paypal.ts

Fonctions principales:
- getPayPalBaseUrl()
- getPayPalAccessToken()
- createPayPalInvoiceFromCrmInvoice(invoiceId)
- sendPayPalInvoice(invoiceId)
- getPayPalInvoiceStatus(invoiceId)
- verifyPayPalWebhookSignature(request)

Notes:
- Le CRM reste la source de verite.
- La creation PayPal part d une facture CRM existante.
- Si la facture vient d un devis converti, les lignes du devis sont reutilisees.
- Sinon, la description CRM sert de poste minimal de facturation.

## 8. Champs Prisma ajoutes a Invoice

- paypalInvoiceId String?
- paypalInvoiceUrl String?
- paypalStatus String?
- paypalSentAt DateTime?
- paypalPaidAt DateTime?
- paypalLastWebhookAt DateTime?
- paymentProvider String?
- paymentStatus String?
- paymentAmount Decimal?
- paymentCurrency String? @default("CAD")

Indexes ajoutes:
- paypalInvoiceId
- paymentStatus

## 9. Comportement CRM detail facture

La fiche facture CRM affiche maintenant:
- statut CRM
- statut PayPal
- paymentStatus
- date d envoi PayPal
- date de paiement PayPal
- montant
- devise
- client
- courriel client

Actions disponibles cote CRM:
- Creer facture PayPal
- Envoyer facture PayPal
- Ouvrir facture PayPal
- Verifier statut PayPal

Si PayPal n est pas configure:
- Message affiche:
  - PayPal n est pas encore configure. Ajoute les variables PayPal dans Vercel ou Render.

## 10. Portail client

Le portail client peut maintenant:
- voir la facture
- voir le statut CRM
- voir le statut PayPal/paymentStatus
- ouvrir le lien de paiement PayPal s il existe
- voir la date de paiement si enregistree

Le client ne peut pas:
- modifier la facture
- confirmer lui-meme un paiement valide
- voir la facture d un autre client

## 11. Devis vers facture

Flux retenu:
- Devis CRM
- Devis envoye
- Devis accepte
- Conversion en facture CRM
- Creation facture PayPal depuis la facture CRM

Decision:
- Pas d envoi direct d un devis vers PayPal.
- La facture interne doit exister avant PayPal.

## 12. Comment tester en sandbox

1. Configurer PAYPAL_ENV=sandbox
2. Ajouter PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET sandbox
3. Ajouter PAYPAL_BUSINESS_EMAIL du compte sandbox invoicer
4. Creer une facture CRM
5. Ouvrir la fiche facture CRM
6. Cliquer sur Creer facture PayPal
7. Cliquer sur Envoyer facture PayPal
8. Ouvrir la facture PayPal
9. Utiliser Verifier statut PayPal
10. Simuler/recevoir un webhook sandbox
11. Verifier la mise a jour locale du statut CRM/paymentStatus

## 13. Configuration webhook PayPal

Endpoint a declarer chez PayPal:
- https://votre-domaine/api/paypal/webhook

Evenements minimum:
- INVOICING.INVOICE.PAID
- INVOICING.INVOICE.CANCELLED
- INVOICING.INVOICE.REFUNDED
- INVOICING.INVOICE.UPDATED

A recuperer ensuite:
- PAYPAL_WEBHOOK_ID

Important:
- Le webhook verifie la signature via l API PayPal.
- Aucun paiement n est considere valide sans verification serveur.

## 14. Passage en production

1. Remplacer PAYPAL_ENV=sandbox par live
2. Mettre les identifiants live
3. Mettre le PAYPAL_WEBHOOK_ID live
4. Verifier le PAYPAL_BUSINESS_EMAIL live
5. Redepoyer
6. Refaire un test complet sur une facture reelle controlee

## 15. Limites restantes

- Le modele Invoice ne possede pas encore de lignes facture natives dediees; la description sert de fallback si la facture ne vient pas d un devis converti.
- Le dashboard affiche encore un lien PayPal manuel optionnel si NEXT_PUBLIC_PAYPAL_BILLING_URL est present, utile comme fallback temporaire.
- Aucun webhook de capture commande classique PayPal n est ajoute ici: cette phase cible la facturation PayPal Invoicing.

## 16. Ce qu il ne faut pas supprimer pendant le grand menage

- Les champs PayPal sur Invoice
- Les nouvelles routes /api/crm/invoices/[id]/paypal/*
- Le webhook /api/paypal/webhook
- Le service src/lib/server/paypal.ts
- Les flux CRM existants de devis vers facture
- Les pages facture du portail client
- Les activites CRM liees a la facturation et au paiement
