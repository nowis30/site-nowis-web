# NOTES HUMAINES - Atelier + Calendly

## Pourquoi ce fichier
Le code est pret pour creer des ateliers CRM et partager un lien client + un lien de planification.
Certaines etapes doivent etre configurees manuellement dans Calendly/infra.

## Configuration minimale Calendly
1. Creer (ou verifier) un evenement Calendly pour les ateliers.
2. Copier l'URL de reservation dans une variable d'environnement:
- `NEXT_PUBLIC_CALENDLY_URL` ou `CALENDLY_BOOKING_URL`
- ou conserver `NEXT_PUBLIC_BOOKING_CALENDAR_URL` / `BOOKING_CALENDAR_URL` si vous utilisez deja ce format.
3. Si webhook active: renseigner `CALENDLY_WEBHOOK_SIGNING_KEY`.

## Webhook
- Route webhook: `/api/webhooks/calendly`
- Evenements traites: `invitee.created`, `invitee.canceled`
- Effet:
  - met a jour le statut atelier
  - tente de creer un rendez-vous atelier lie dans le CRM si les infos sont suffisantes

## Variables a poser en production
- Vercel: variables identiques a Render
- Render: variables identiques a Vercel
- Variables recommandees:
  - `NEXT_PUBLIC_CALENDLY_URL`
  - `CALENDLY_BOOKING_URL`
  - `CALENDLY_WEBHOOK_SIGNING_KEY`

## Verification humaine rapide
1. Creer un atelier dans le CRM.
2. Copier le lien client atelier et l'ouvrir sur mobile.
3. Cliquer `Choisir mon rendez-vous`.
4. Finaliser une reservation test dans Calendly.
5. Verifier le statut atelier dans le CRM (`RDV_PLANIFIE` ou `CONFIRME`).
