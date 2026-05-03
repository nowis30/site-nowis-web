# Zoho Removal Report

Date: 2026-05-03
Scope: site-nowis-web
Objectif: retrait propre de Zoho, maintien CRM interne, transition actions de facturation vers CRM/PayPal.
Etat: Zoho retire du code actif. PayPal phase 2 en cours d integration serveur/API/UI.

## 1) Fichiers Zoho trouvés

### Fichiers source/app encore actifs avant retrait

- src/features/crm/components/shared/ZohoBillingButton.tsx
  - Role: bouton UI ouvrant Zoho Invoice.
  - Etait importe: oui.
  - Utilise par route API: non.
  - Utilise par page admin: oui, dashboard CRM.
  - Utilise par facture/devis: indirectement UI facturation seulement.
  - Recommandation: SUPPRIMER.
  - Statut: SUPPRIME dans cette phase.

- src/app/crm/(app)/dashboard/page.tsx
  - Role: page dashboard admin CRM.
  - Etait importe: ZohoBillingButton oui.
  - Utilise par route API: non.
  - Utilise par page admin: oui.
  - Utilise par facture/devis: actions de pilotage facturation.
  - Recommandation: REMPLACER PAR PAYPAL + CRM.
  - Statut: MODIFIE dans cette phase (Zoho retire, actions CRM/PayPal ajoutees).

### Fichiers configuration/environnement

- .env
  - Variable trouvee: NEXT_PUBLIC_ZOHO_BILLING_URL
  - Recommandation: A RETIRER MANUELLEMENT en plateforme (Vercel/Render) apres validation.
  - Statut: NON MODIFIE automatiquement (conformement a la demande).

### Faux positifs / artefacts a ignorer

- .next et caches de build pouvaient contenir des traces compilees de Zoho.
- Ces traces ne representent pas du code source actif a maintenir.

## 2) Routes API Zoho

Recherche effectuee pour:
- /api/zoho/*
- /api/crm/zoho/*
- /api/invoices/zoho/*
- /api/payments/zoho/*
- /api/webhook/zoho/*
- /api/zoho/callback
- /api/zoho/auth

Resultat:
- AUCUNE route API Zoho detectee dans le code source.

Conclusion:
- Rien a retirer cote API Zoho.
- Aucune route PayPal ne remplace une route Zoho (car il n y en a pas).

## 3) Variables d environnement Zoho

Variables Zoho detectees dans le projet:
- NEXT_PUBLIC_ZOHO_BILLING_URL

Variables Zoho demandees dans le cahier des charges mais non detectees dans ce repo:
- ZOHO_CLIENT_ID
- ZOHO_CLIENT_SECRET
- ZOHO_REFRESH_TOKEN
- ZOHO_ACCESS_TOKEN
- ZOHO_ORGANIZATION_ID
- ZOHO_BOOKS_ORG_ID
- ZOHO_REDIRECT_URI
- ZOHO_WEBHOOK_SECRET
- ZOHO_API_URL

Action recommandee:
- Retirer manuellement NEXT_PUBLIC_ZOHO_BILLING_URL des variables plateforme apres verification deployment.
- Ne pas supprimer automatiquement les variables plateformes dans cette phase.

## 4) Boutons/pages Zoho identifies

Avant retrait:
- Bouton Zoho Invoice sur dashboard CRM (bloc Statistiques).

Apres retrait (fait):
- Bouton Zoho retire.
- Remplace par actions:
  - Creer facture CRM
  - Envoyer facture PayPal
  - Ouvrir lien PayPal (si NEXT_PUBLIC_PAYPAL_BILLING_URL ou PAYPAL_BILLING_URL configure)
  - Verifier paiement PayPal

Confirmation complementaire phase 2:
- Aucun import source actif Zoho attendu apres suppression du composant.
- Aucun champ Prisma Zoho detecte.
- Aucune route API Zoho detectee.

## 5) Prisma / base de donnees

Recherche de champs legacy Zoho:
- zohoInvoiceId
- zohoQuoteId
- zohoCustomerId
- zohoPaymentId
- zohoSyncStatus
- zohoLastSyncAt
- autres references zoho

Resultat:
- Aucun champ Zoho detecte dans prisma/schema.prisma.

Recommandation:
- Aucune migration Prisma requise pour Zoho sur ce repo.
- Si un autre environnement possede des colonnes legacy non versionnees ici, les garder en lecture archive et traiter en phase separee.

## 6) Historique (factures/devis)

Constat:
- Pas de mapping Zoho detecte en schema Prisma ni routes API Zoho.
- Le risque de perte d historique Zoho dans ce repo est faible.

Garde-fou:
- Aucun effacement de donnees historiques facture/devis n a ete applique.
- Le portail client et CRM restent operationnels sur flux interne.

## 7) Ce qui a ete desactive dans cette phase

- Suppression du composant ZohoBillingButton.
- Suppression de son import et de son rendu dans le dashboard CRM.

## 8) Ce qui doit rester temporairement en archive

- Aucun artefact fonctionnel Zoho necessaire a conserver dans le code.
- Seule la reference eventuelle en historique git peut servir d archive technique.
- Si des donnees externes Zoho existent hors repo (backoffice, exports), conservation hors code recommandee.

## 9) Ce qui peut etre supprime apres validation

- Variable d environnement: NEXT_PUBLIC_ZOHO_BILLING_URL (plateformes).
- Toute documentation operationnelle interne mentionnant Zoho (si ajoutee hors repo).

## 10) Remplacement par PayPal

Etat actuel:
- Le CRM interne gere deja les factures et emails de facturation.
- Le dashboard propose maintenant des actions CRM/PayPal a la place de Zoho.

A finaliser pour un flux PayPal complet:
- Configurer NEXT_PUBLIC_ZOHO_BILLING_URL a retirer manuellement sur Vercel/Render.
- Routes PayPal phase 2 ajoutees separement pour creation, envoi, statut et webhook.
- Voir paypal-integration-plan.md pour les details d integration securee.

## 11) Evaluation de risque

- Risque de casse CRM: faible (modification UI limitee au dashboard).
- Risque de casse factures/devis: faible (aucune suppression API facture/devis).
- Risque portail client: faible (routes portail non modifiees).

## 12) Fichiers modifies dans cette phase

- src/app/crm/(app)/dashboard/page.tsx
- src/features/crm/components/shared/ZohoBillingButton.tsx (supprime)
- zoho-removal-report.md (nouveau)

## 13) Actions humaines requises (Vercel/Render)

- Supprimer manuellement la variable:
  - NEXT_PUBLIC_ZOHO_BILLING_URL
- Ajouter/valider manuellement la variable PayPal si souhaitee:
  - NEXT_PUBLIC_PAYPAL_BILLING_URL (frontend)
  - ou PAYPAL_BILLING_URL (serveur)
- Redeployer l application apres mise a jour des variables.
