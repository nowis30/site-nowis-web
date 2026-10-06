# Environnement de production NOWIS

Ce document décrit la configuration attendue par le code durci. La présence d'une variable dans Vercel ne valide ni sa valeur, ni ses droits chez le fournisseur, ni l'isolation des environnements. Fournir les secrets dans les paramètres privés du déploiement ; ne jamais les afficher dans un rapport, un terminal partagé ou une variable `NEXT_PUBLIC_*`.

La livraison et les migrations suivent [security-release.md](./security-release.md). Les corrections locales et ce document ne constituent pas un déploiement sur `nowis.store`.

## Base de données et build

| Variable | Utilisation | Exigence |
| --- | --- | --- |
| `DATABASE_URL` | Connexion Prisma/PostgreSQL principale | Obligatoire pour les comptes, les sessions persistantes, les quotas et les données CRM. Utiliser une connexion protégée par TLS et un rôle adapté à l'application. |
| `DIRECT_URL` | Connexion directe ou premier repli du runtime | Facultative selon l'hébergeur ; réserver un accès approprié aux migrations explicites. |
| `POSTGRES_PRISMA_URL`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING` | Replis du runtime après `DATABASE_URL` et `DIRECT_URL`, dans cet ordre | Ne configurer que des connexions au même environnement prévu. Une variable de repli ne doit pas pointer silencieusement vers production depuis une preview. |

Le build exécute `prisma generate` uniquement. Il n'applique aucune migration, réparation, remise à zéro ou seed. La génération locale du client ne vérifie pas le schéma réel du serveur. `npm run prisma:migrate:deploy` reste une opération séparée, après sauvegarde, revue des migrations non appliquées et confirmation de la base cible.

Les bases de développement, preview et production doivent être distinctes. Le code utilise Prisma côté serveur ; aucune intégration Supabase/RLS n'a été trouvée dans ce projet. Les privilèges effectifs PostgreSQL et la configuration TLS doivent être contrôlés indépendamment du code.

## Secrets de signature

| Variable | Choix du serveur |
| --- | --- |
| `JWT_SECRET` | Secret principal requis pour le CRM et les usages qui ne disposent pas d'un secret dédié. |
| `CLIENT_PORTAL_JWT_SECRET` | Secret dédié recommandé pour les comptes clients ; à défaut, `JWT_SECRET`. |
| `PUBLIC_LINKS_JWT_SECRET` | Secret dédié facultatif pour les liens publics facture/devis/facturation ; à défaut, `CLIENT_PORTAL_JWT_SECRET`, puis `JWT_SECRET`. |
| `FILE_UPLOAD_JWT_SECRET` | Secret dédié facultatif pour les intentions d'upload ; mêmes replis que les liens publics. |

En production, chaque secret retenu doit être privé, aléatoire et contenir au moins **32 octets UTF-8**. Les valeurs absentes, trop courtes ou les valeurs publiques de développement connues provoquent un refus. Ne pas copier une valeur d'exemple comme secret réel. Un chiffrement des variables dans Vercel ne prouve pas leur force cryptographique.

Conserver les secrets actuels s'ils respectent ces exigences. Une rotation exige un plan : elle invalide les jetons concernés et peut invalider des liens publics déjà envoyés. Les sessions et liens d'authentification utilisent aussi `AuthGrant` en base et les versions courantes des comptes ; un ancien JWT sans grant enregistré n'est plus accepté. Les liens publics de documents restent des capacités limitées à leur usage et leur durée : ne pas les traiter comme des sessions de compte.

## Connexion CRM et courriels

La connexion CRM en production exige un compte `ADMIN` ou `ASSISTANT` actif enregistré en base, son mot de passe et un code à usage unique. Si les quatre variables SMS sont complètes, le code est envoyé au numéro CRM configuré. Sinon, le code est envoyé avec Resend à **l'adresse du membre CRM enregistrée en base**, jamais à une destination choisie par la requête. Si l'envoi échoue, aucune session CRM n'est ouverte. La connexion par mot de passe seul, en absence de fournisseur OTP, est réservée au développement.

| Variable / configuration | Exigence |
| --- | --- |
| `RESEND_API_KEY` | Requise pour les codes CRM par courriel, les liens clients, la vérification des inscriptions et les réinitialisations de mot de passe. Vérifier les droits de la clé sans afficher sa valeur. |
| Domaine expéditeur Resend | Valider le domaine utilisé par l'application. L'expéditeur par défaut du service est `CRM NOWIS <noreply@nowis.store>` ; sa présence dans le code ne prouve pas qu'il est autorisé chez Resend. |
| Courriel du membre CRM | Vérifier que chaque compte staff actif possède une adresse correcte et accessible. Ce destinataire provient du compte persisté. |
| `CRM_OTP_PHONE`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_PHONE` | Les quatre sont nécessaires pour choisir le canal SMS. En cas de configuration incomplète, le canal de production est le courriel ; aucun accès sans OTP n'est accordé. |
| `CRM_NOTIFICATION_EMAIL` | Destination facultative des notifications CRM ; ne choisit pas le destinataire du code de connexion. |
| `SITE_FEEDBACK_EMAIL` | Destination facultative des suggestions ; repli vers les adresses de notification existantes. |

Les variables SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO`) concernent des envois existants du formulaire de contact. Elles ne remplacent pas Resend pour le code de connexion CRM et la vérification des comptes clients.

Les anciennes variables de secours `CRM_ALLOW_EMERGENCY_LOGIN` et `CRM_DEMO_PASSWORD` ne rétablissent aucun accès d'urgence en production. Un incident de base ou de fournisseur se résout par la restauration du service et la procédure de livraison, jamais par un compte créé à partir de ces variables ou de la base JSON historique.

## URL et connexion Google

| Variable | Utilisation |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL canonique publique, par exemple `https://nowis.store` en production. Ce nom public doit contenir uniquement une URL publique. |
| `NEXT_PUBLIC_DOMAIN` | Repli d'URL publique si utilisé. Maintenir une valeur cohérente avec l'environnement cible. |
| `AUTH_URL`, `NEXTAUTH_URL` | Replis prioritaires de base pour la callback Google du portail lorsqu'ils sont définis. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Requis pour la connexion Google. Configurer séparément les URI de callback autorisées chez Google pour production et environnement de test. |
| `NEXT_PUBLIC_RENTALS_URL` | Destination du service de logements externe ; conserver la séparation actuelle de ce domaine métier. |

La callback Google du portail utilise `/api/client-auth/google/callback`. La table OAuth doit être migrée : son absence ne permet pas une liaison automatique dégradée. Une première liaison à un compte déjà existant exige la preuve de session correspondante selon les règles du serveur ; ne fusionner aucun dossier sur la seule base d'un courriel déclaré. Les comptes portail historiques doivent prouver leur courriel avant de reprendre une connexion par mot de passe. Consulter les impacts détaillés dans la procédure de livraison.

## Stockage S3 et fichiers historiques

| Variable | Utilisation |
| --- | --- |
| `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` | Requises par le service de stockage. `S3_PUBLIC_BASE_URL` construit des URL ; elle ne rend pas un objet privé ou public. |
| `S3_REGION` | Région du fournisseur ; le runtime utilise `auto` à défaut. Configurer la région appropriée au service utilisé. |
| `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE` | Facultatives pour un service compatible S3. Maintenir des destinations contrôlées côté serveur. |
| `FILE_UPLOAD_JWT_SECRET` | Secret d'intention d'upload facultatif, décrit ci-dessus. La table `AuthGrant` reste requise même avec un secret valide. |
| `UPLOAD_DIR`, `UPLOAD_PUBLIC_BASE_URL`, `DB_FILE_PATH` | Configuration des anciens fichiers locaux et de la base JSON. Ne jamais héberger des documents privés dans un répertoire public ni utiliser le JSON historique comme authentification de production. |

La configuration IAM, les ACL, la politique du bucket, CORS et un éventuel CDN n'ont pas été vérifiés par les tests simulés. Le bucket mêle documents et contenus audio/jeux publics : vérifier les droits par préfixe, sans privatiser le bucket entier aveuglément. Les URL directes historiques et les propriétaires des anciens documents exigent une migration contrôlée. Les préconditions et limites sont détaillées dans [file-storage-security.md](./file-storage-security.md).

## Calendrier, Calendly et PayPal

| Variable | Exigence |
| --- | --- |
| `CALENDAR_TOKEN_ENCRYPTION_KEY` | Secret privé d'au moins 32 octets requis en production pour chiffrer/déchiffrer les jetons calendrier. Pas de repli public. Conserver la clé qui chiffre les données existantes ; une rotation sans migration empêche leur déchiffrement. |
| Variables OAuth Google/Microsoft et URI calendrier | Dépendent du connecteur activé ; vérifier les callback et permissions accordées. Les jetons persistés sont chiffrés côté serveur. |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | Requise pour accepter les webhooks Calendly en production. Un secret absent ne transforme pas le webhook en endpoint public accepté. |
| `CALENDLY_AUTO_CREATE_CONTACTS` | Choix métier facultatif, à activer explicitement si la création de contacts par événement validé est voulue. |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Requis pour l'API PayPal. Ne jamais exposer le secret client au navigateur. |
| `PAYPAL_WEBHOOK_ID` | Requis pour valider le webhook utilisé. Doit correspondre au webhook et à l'environnement PayPal visés. |
| `PAYPAL_ENV` | `live` pour production PayPal ; à défaut, le code utilise `sandbox`. Vérifier explicitement le choix avant tout paiement. |
| `PAYPAL_CURRENCY` | `CAD` par défaut ; maintenir la cohérence avec les factures existantes. Le serveur vérifie montant et devise avant de marquer une facture payée. |
| `PAYPAL_BUSINESS_EMAIL` | Adresse marchande facultative ; repli vers la fiche de facturation selon le flux existant. |

Les tests de sécurité remplacent les fournisseurs par des simulations. Ils ne prouvent ni la validité des clés, ni la livraison effective des courriels/SMS, ni un paiement réel. Un essai fournisseur doit être préparé dans un environnement de test avec des identités dédiées et sans facturation de production.

## IA et quota

`AI_GATEWAY_API_KEY`, puis le jeton Vercel `VERCEL_OIDC_TOKEN`, puis `OPENAI_API_KEY` sélectionnent le fournisseur disponible pour l'assistant ; le repli de navigation déterministe demeure disponible selon le flux existant. `SITE_ASSISTANT_MODEL` et `OPENAI_MODEL` permettent de choisir les modèles. Les clés restent exclusivement côté serveur.

Le chat et les deux routes IA du tarot partagent **20 commandes par compte et par jour civil**, remis à zéro à minuit dans `America/Toronto`. La commande est réservée en base avant tout appel ; un échec fournisseur reste compté. La base indisponible bloque l'appel. Ces règles ne sont pas des variables modifiables par le navigateur ; voir [site-assistant.md](./site-assistant.md).

## État connu et points à confirmer avant livraison

La revue de métadonnées Vercel a confirmé la présence de `JWT_SECRET`, du secret portail, des connexions DB, des variables S3 et de Resend sous stockage chiffré, et des secrets calendrier/Calendly/PayPal sous stockage sensible. Elle n'a révélé aucune valeur. Les variables Twilio et `CRM_OTP_PHONE` étaient absentes : la livraison doit donc valider le canal OTP par courriel. Les secrets dédiés `PUBLIC_LINKS_JWT_SECRET` et `FILE_UPLOAD_JWT_SECRET` étaient absents, ce qui est compatible avec leurs replis privés prévus.

Des variables sont ciblées sur plusieurs environnements. Cela ne prouve pas que les bases et comptes fournisseurs sont séparés : contrôler ce point avant toute preview exécutant le nouveau schéma. La force des clés, le domaine Resend, les destinataires staff, les permissions PostgreSQL/S3 et les callback fournisseurs restent à confirmer sur la configuration effective.

`CRM_SEED_PASSWORD` est exclusivement un secret de seed de développement : au moins 12 caractères, au plus 72 octets, jamais affiché. Le seed supprime des données et refuse `NODE_ENV=production`. Aucun seed ne fait partie de cette livraison.
