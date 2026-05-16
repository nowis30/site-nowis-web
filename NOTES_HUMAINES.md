# NOTES HUMAINES - Atelier + Google Calendar

## Pourquoi ce fichier
Le code est pret pour creer des ateliers CRM et partager un lien client + un lien de planification.
Certaines etapes doivent etre configurees manuellement dans Google Calendar/infra.

## Configuration minimale Google Calendar
1. Creer (ou verifier) un calendrier/public embed Google Calendar pour les ateliers.
2. Copier l'URL de reservation dans une variable d'environnement:
- `NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL` ou `GOOGLE_CALENDAR_EMBED_URL`
- ou conserver `NEXT_PUBLIC_BOOKING_CALENDAR_URL` / `BOOKING_CALENDAR_URL` si vous utilisez deja ce format.

## Legacy webhook Calendly (optionnel)
- Route webhook: `/api/webhooks/calendly`
- Variables: `CALENDLY_WEBHOOK_SIGNING_KEY`, `CALENDLY_AUTO_CREATE_CONTACTS`

## Variables a poser en production
- Vercel: variables identiques a Render
- Render: variables identiques a Vercel
- Variables recommandees:
  - `NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL`
  - `GOOGLE_CALENDAR_EMBED_URL`
  - `NEXT_PUBLIC_BOOKING_CALENDAR_URL`

## Verification humaine rapide
1. Creer un atelier dans le CRM.
2. Copier le lien client atelier et l'ouvrir sur mobile.
3. Cliquer `Choisir mon rendez-vous`.
4. Finaliser une reservation test dans Google Calendar.
5. Verifier le statut atelier dans le CRM (`RDV_PLANIFIE` ou `CONFIRME`).
