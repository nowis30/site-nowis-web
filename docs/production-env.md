# Variables d'environnement de production - CRM Nowis

Ce document liste les variables utiles pour mettre le CRM en production sans changer le code. Les valeurs ci-dessous sont des exemples fictifs.

## Base de donnees

| Variable | Statut | Ou la mettre | Role | Si absente | Exemple |
|---|---|---|---|---|---|
| `DATABASE_URL` | Obligatoire | Vercel, et aussi tout service Render qui exécute l'app ou des scripts | Connexion Prisma principale | Le CRM ne démarre pas ou ne peut pas lire/écrire la base | `postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require` |
| `DIRECT_URL` | Optionnelle mais recommandée | Vercel / Render | Connexion directe PostgreSQL pour certains flux Prisma | Les migrations ou opérations directes peuvent échouer selon l'hébergement | `postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require` |
| `POSTGRES_PRISMA_URL` | Optionnelle | Vercel / Render | Fallback de connexion DB pour Prisma | Pas de secours si `DATABASE_URL` est absente | `postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require` |
| `POSTGRES_URL` | Optionnelle | Vercel / Render | Fallback de connexion DB | Idem | `postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require` |
| `POSTGRES_URL_NON_POOLING` | Optionnelle | Vercel / Render | Fallback de connexion DB non poolée | Idem | `postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require` |

## Securite CRM

| Variable | Statut | Ou la mettre | Role | Si absente | Exemple |
|---|---|---|---|---|---|
| `JWT_SECRET` | Obligatoire | Vercel, et Render si le code y tourne | Signature des sessions CRM | Le CRM refuse de démarrer en production | `replace-with-long-random-secret` |
| `CLIENT_PORTAL_JWT_SECRET` | Optionnelle | Vercel / Render | Secret dédié au portail client | Le code retombe sur `JWT_SECRET` | `replace-with-long-random-secret` |
| `PUBLIC_LINKS_JWT_SECRET` | Optionnelle | Vercel / Render | Secret pour les liens publics signés | Le code retombe sur `CLIENT_PORTAL_JWT_SECRET` puis `JWT_SECRET` | `replace-with-long-random-secret` |

## Emails

| Variable | Statut | Ou la mettre | Role | Si absente | Exemple |
|---|---|---|---|---|---|
| `RESEND_API_KEY` | Obligatoire seulement si tu veux envoyer des emails via Resend | Vercel / Render | Envoi des emails CRM | Les emails CRM retournent un mode non configuré | `re_xxxxxxxxxxxxxxxxxxxxx` |
| `CRM_NOTIFICATION_EMAIL` | Optionnelle | Vercel / Render | Adresse de réception des alertes CRM | Les notifications retombent sur `COMPANY_EMAIL`, `BOOKING_EMAIL` ou une valeur par défaut | `crm@example.com` |
| `SMTP_HOST` | Optionnelle pour le formulaire de contact site | Vercel / Render | Envoi SMTP du contact public | Le contact public peut ne pas envoyer d'email | `smtp.example.com` |
| `SMTP_PORT` | Optionnelle | Vercel / Render | Port SMTP | Idem | `587` |
| `SMTP_USER` | Optionnelle | Vercel / Render | Compte SMTP | Idem | `user@example.com` |
| `SMTP_PASS` | Optionnelle | Vercel / Render | Mot de passe SMTP | Idem | `replace-with-smtp-password` |
| `SMTP_FROM` | Optionnelle | Vercel / Render | Expéditeur SMTP | Le code peut retomber sur `SMTP_USER` | `Nowis <noreply@example.com>` |
| `SMTP_TO` | Optionnelle | Vercel / Render | Destinataire par défaut du contact public | Le code retombe sur `ADMIN_EMAIL` ou un email légal | `crm@example.com` |

## OTP SMS / Twilio

| Variable | Statut | Ou la mettre | Role | Si absente | Exemple |
|---|---|---|---|---|---|
| `CRM_OTP_PHONE` | Obligatoire pour activer l'OTP SMS | Vercel / Render | Numéro cible de l'OTP CRM | Sans numéro, le login retombe en mode sans SMS | `+15145550000` |
| `TWILIO_ACCOUNT_SID` | Obligatoire pour OTP SMS | Vercel / Render | Compte Twilio | L'OTP ne peut pas être envoyé | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Obligatoire pour OTP SMS | Vercel / Render | Auth Twilio | L'OTP ne peut pas être envoyé | `replace-with-twilio-token` |
| `TWILIO_FROM_PHONE` | Obligatoire pour OTP SMS | Vercel / Render | Numéro expéditeur Twilio | L'OTP ne peut pas être envoyé | `+15145550123` |

## PayPal

| Variable | Statut | Ou la mettre | Role | Si absente | Exemple |
|---|---|---|---|---|---|
| `PAYPAL_CLIENT_ID` | Obligatoire si PayPal est utilisé | Vercel / Render | Auth API PayPal | Les fonctions PayPal ne fonctionnent pas | `replace-with-paypal-client-id` |
| `PAYPAL_CLIENT_SECRET` | Obligatoire si PayPal est utilisé | Vercel / Render | Auth API PayPal | Les fonctions PayPal ne fonctionnent pas | `replace-with-paypal-client-secret` |
| `PAYPAL_WEBHOOK_ID` | Recommandée si les webhooks sont utilisés | Vercel / Render | Validation des webhooks | Les diagnostics PayPal sont incomplets | `replace-with-paypal-webhook-id` |
| `PAYPAL_BUSINESS_EMAIL` | Optionnelle mais utile | Vercel / Render | Email marchand utilisé par le CRM | Le code retombe sur la fiche de facturation | `billing@example.com` |
| `PAYPAL_CURRENCY` | Optionnelle | Vercel / Render | Devise PayPal | Le code retombe sur `CAD` | `CAD` |
| `PAYPAL_ENV` | Optionnelle | Vercel / Render | Bascule sandbox/live | Le code retombe sur `sandbox` | `sandbox` ou `live` |
| `NEXT_PUBLIC_SITE_URL` | Recommandée pour les liens PayPal | Vercel | Base URL publique du site | Les webhooks et liens peuvent pointer vers un fallback | `https://example.com` |
| `NEXT_PUBLIC_DOMAIN` | Optionnelle | Vercel | Fallback d'URL publique | Idem | `https://example.com` |
| `NEXT_PUBLIC_PAYPAL_BILLING_URL` | Optionnelle | Vercel | Lien de facturation public affiché dans le CRM | Le bouton PayPal peut rester vide | `https://www.paypal.com/your-billing-link` |
| `PAYPAL_BILLING_URL` | Optionnelle | Render / Vercel | Fallback du lien de facturation | Idem | `https://www.paypal.com/your-billing-link` |

## URL publiques

| Variable | Statut | Ou la mettre | Role | Si absente | Exemple |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Recommandée | Vercel | URL canonique du site | Certains liens CRM retombent sur des valeurs par défaut | `https://example.com` |
| `NEXT_PUBLIC_DOMAIN` | Optionnelle | Vercel | Fallback d'URL canonique | Idem | `https://example.com` |
| `APP_URL` | Optionnelle | Render / Vercel | Fallback de construction de liens | Certains emails/liens peuvent utiliser une valeur par défaut | `https://example.com` |

## Variables de depannage a eviter en production

| Variable | Statut | Ou la mettre | Role | Danger | Exemple |
|---|---|---|---|---|---|
| `CRM_ALLOW_EMERGENCY_LOGIN` | A laisser `false` ou absent | Vercel / Render | Autorise le fallback d'urgence CRM | Active un bypass si la base est indisponible | `false` |
| `CRM_DEMO_PASSWORD` | A laisser vide | Vercel / Render | Mot de passe du fallback d'urgence | Permet la connexion d'urgence si le flag est activé | vide |
| `ADMIN_EMAIL` | A définir seulement si le fallback est voulu | Vercel / Render | Email admin de secours | Cible la connexion d'urgence | `admin@example.com` |
| `ADMIN_DISPLAY_NAME` | Optionnelle | Vercel / Render | Nom affiché dans la session de secours | Faible risque, mais lié au mode d'urgence | `Admin Nowis` |

## Variables de contexte trouvees dans le projet mais hors perimetre CRM strict

Ces variables existent dans le code, mais elles ne sont pas obligatoires pour faire fonctionner le CRM principal:
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI`, `CALENDLY_WEBHOOK_SIGNING_KEY`, `CALENDLY_AUTO_CREATE_CONTACTS`, `SITE_INTEGRATION_SECRET`, `NOWIS_ADMIN_PAYLOAD_URL`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID`, `NEXT_PUBLIC_GOOGLE_ADS_WORKSHOP_CONVERSION_LABEL`, `NEXT_PUBLIC_GOOGLE_ADS_PHONE_CONVERSION_LABEL`, `NEXT_PUBLIC_API_URL`, `S3_REGION`, `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `UPLOAD_DIR`, `UPLOAD_PUBLIC_BASE_URL`, `DB_FILE_PATH`, `MAX_FILE_UPLOAD_BYTES`, `NEXT_PUBLIC_MAX_FILE_UPLOAD_BYTES`, `CRM_GOOGLE_CALENDAR_ICS_URL`, `CRM_MICROSOFT_CALENDAR_ICS_URL`, `CRM_TAX_GST_RATE`, `CRM_TAX_QST_RATE`.

## Variables minimales pour le CRM

- `DATABASE_URL`
- `JWT_SECRET`
- au moins un utilisateur CRM actif dans la base avec le role `ADMIN` ou `ASSISTANT`

## Variables minimales pour les emails CRM

- `RESEND_API_KEY`
- `CRM_NOTIFICATION_EMAIL` si tu veux forcer la destination des alertes
- un domaine expediteur valide si ton compte Resend l'exige

## Variables minimales pour l'OTP SMS

- `CRM_OTP_PHONE`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_PHONE`

## Variables minimales pour PayPal

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `NEXT_PUBLIC_SITE_URL` ou `NEXT_PUBLIC_DOMAIN`
- `PAYPAL_WEBHOOK_ID` si tu relies les webhooks
