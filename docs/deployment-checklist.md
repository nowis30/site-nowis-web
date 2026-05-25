# Checklist de deploiement CRM - Vercel / Render

## Variables a mettre dans Vercel

- `DATABASE_URL`
- `JWT_SECRET`
- `RESEND_API_KEY` si les emails CRM doivent partir
- `CRM_NOTIFICATION_EMAIL` si tu veux forcer la boite de reception des alertes
- `CRM_OTP_PHONE` si l'OTP SMS doit etre actif
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_PHONE` si l'OTP SMS doit etre actif
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_BUSINESS_EMAIL`, `PAYPAL_CURRENCY`, `PAYPAL_ENV` si PayPal est utilise
- `NEXT_PUBLIC_SITE_URL` ou `NEXT_PUBLIC_DOMAIN`
- `NEXT_PUBLIC_PAYPAL_BILLING_URL` ou `PAYPAL_BILLING_URL` si le lien PayPal est affiche dans le CRM
- `CLIENT_PORTAL_JWT_SECRET` seulement si tu veux un secret distinct du CRM
- `PUBLIC_LINKS_JWT_SECRET` seulement si tu veux un secret distinct pour les liens publics

## Variables a verifier dans Render / PostgreSQL

- la base PostgreSQL doit fournir une URL de connexion valide, puis cette URL doit etre copiee dans `DATABASE_URL` sur Vercel
- si Render heberge aussi un service Node ou un worker, mirror `DATABASE_URL` et `JWT_SECRET` sur ce service
- si tu utilises le fallback de secours pour certains scripts, verifier aussi `DIRECT_URL` ou les variables PostgreSQL de secours

## Variables optionnelles

- `DIRECT_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `CRM_NOTIFICATION_EMAIL`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_BUSINESS_EMAIL`
- `PAYPAL_CURRENCY`
- `PAYPAL_ENV`
- `APP_URL`
- `NEXT_PUBLIC_DOMAIN`
- `CLIENT_PORTAL_JWT_SECRET`
- `PUBLIC_LINKS_JWT_SECRET`

## Variables a ne pas activer en production sauf urgence

- `CRM_ALLOW_EMERGENCY_LOGIN`
- `CRM_DEMO_PASSWORD`
- `ADMIN_EMAIL` si tu n'utilises pas explicitement le mode d'urgence
- `ADMIN_DISPLAY_NAME` pour le mode d'urgence

## Checklist finale avant de deployer

1. Verifier que `DATABASE_URL` pointe vers la bonne base Render/PostgreSQL.
2. Verifier que `JWT_SECRET` est defini, stable et suffisamment long.
3. Verifier si l'OTP SMS doit etre actif ou non.
4. Si OTP actif, renseigner `CRM_OTP_PHONE` et les variables Twilio.
5. Si emails CRM actifs, renseigner `RESEND_API_KEY`.
6. Si PayPal est actif, renseigner les variables PayPal et l'URL publique.
7. Laisser `CRM_ALLOW_EMERGENCY_LOGIN` absent ou a `false` en production.
8. Garder `CRM_DEMO_PASSWORD` vide si le mode d'urgence n'est pas souhaite.
9. Redemarrer / redeployer l'application apres mise a jour des variables.
10. Tester une connexion `ADMIN`.
11. Tester un compte `PORTAL_USER`.
12. Tester le module finance et la creation de document si utilise.