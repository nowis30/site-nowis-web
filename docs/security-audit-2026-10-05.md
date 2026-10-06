# Audit ciblé de nowis.store — 5 octobre 2026

## Résultat et périmètre

Les corrections sont préparées dans une branche isolée du dépôt `nowis30/site-nowis-web`, à partir de `main` au commit `ea07949`. Les modifications déjà présentes dans le dossier de travail original sont conservées. Aucun déploiement en production, changement de secret, réinitialisation de compte ou migration de base réelle n’a été effectué.

L’agent possède désormais un quota serveur persistant de **20 commandes par compte authentifié et par jour civil**, remis à zéro à **minuit, heure de Toronto**. Une question constitue une commande, y compris lorsqu’elle produit une réponse de navigation ou que le fournisseur IA échoue. Les raccourcis et les idées d’amélioration ont leurs propres règles.

## Failles trouvées et corrections

| Risque | Constat | Correction appliquée |
|---|---|---|
| Critique — authentification CRM | Le jeton temporaire SMS était accepté comme session CRM; le code SMS était lisible dans le JWT | Scopes de jetons séparés, vérifications de contenu et d’algorithme, code remplacé par un HMAC lié à un nonce et à l’identité, génération cryptographique |
| Critique — dossier client | Une inscription pouvait se rattacher à un Contact existant en déclarant simplement son courriel | Session issue d’une preuve de possession du courriel obligatoire pour le rattachement; formulaire proposant un lien sécurisé sur clic explicite |
| Critique — collision de dossiers | Ateliers, contacts et chansons pouvaient choisir un autre dossier ou déplacer un compte via une correspondance de courriel | Identifiant du dossier signé seul autoritaire, fiche active et courriel courant vérifiés; aucun déplacement de compte par courriel; coordonnées des organisations existantes préservées |
| Connexion Google | Première liaison automatique à un compte à mot de passe par rapprochement de courriel | Session actuelle du même compte/dossier requise pour la première liaison; nouveaux comptes Google et reconnexions déjà liées conservés; message de connexion préalable ou récupération |
| Critique — secrets de secours | Deux anciens helpers acceptaient un secret JWT connu lorsque la configuration de production manquait | Signature et vérification refusées sans secret de production; HS256 et contenu des jetons validés |
| Critique — traitement des images | Next.js 14.2.35 appartient à la plage d’un avis d’exécution de code AVIF | Optimiseur d’images serveur désactivé; endpoint vérifié en HTTP 404. Les images sources continuent à s’afficher |
| Élevé — consommation IA | Endpoint public sans quota, identité ni compteur persistant | Connexion requise, identité signée vérifiée dans le stockage, compteur PostgreSQL et réservation atomique avant tout appel IA |
| Élevé — webhook | Calendly acceptait des événements sans signature quand sa clé n’était pas définie | Refus sans clé, HMAC horodaté avec fenêtre de cinq minutes, corps borné, aucun accès DB avant validation |
| Élevé — tentatives de connexion | Connexion et vérification SMS CRM sans plafond durable | Limites persistantes par compte et par IP vérifiée; erreurs de stockage bloquent la tentative |
| Élevé — logements historiques | Accès aux annonces non approuvées et autoapprobation possible | Accès limité au propriétaire ou administrateur persisté; propriétaires empêchés de s’autoapprouver; modifications publiées repassent en modération |
| Données personnelles | API publique des avis incluant le courriel des auteurs | Courriels exclus de la sélection publique; contenu des avis conservé |
| Liens de connexion | Ancien lien pouvait restaurer une fiche archivée, un ancien courriel ou un compte désactivé; HTML interpolé | Fiche active, compte lié actif et courriel actuel vérifiés; reconnexion par mot de passe refusée pour un dossier archivé; texte et lien du courriel échappés; clients historiques sans compte à mot de passe conservés |
| Spam / validation | Suggestions limitées seulement dans la mémoire du processus; corps JSON non bornés | Cinq suggestions par heure dans PostgreSQL, IP Vercel validée/hachée, origine et taille réelle UTF-8 vérifiées, HTML échappé |
| Outils / secrets | Seed destructif utilisable en production et mot de passe de démonstration affiché | Refus de la production avant suppression, mot de passe de développement explicitement requis, aucun mot de passe journalisé; seed non exécuté |

## Quota et résistance au contournement

Le compteur utilise la table existante `api_rate_limits`, avec une clé unique portée/identité/jour. Un UPSERT SQL paramétré incrémente seulement si le compteur est inférieur à 20; la décision et l’incrément forment une seule opération. L’heure de la base définit le jour de Toronto, y compris les journées de 23 et 25 heures. Aucune nouvelle migration n’est nécessaire, mais la migration existante `20260504153000_add_contact_api_rate_limits` doit être appliquée dans l’environnement cible.

Le navigateur ne choisit ni l’identité, ni le compteur, ni la date. Le serveur vérifie la session et l’existence du compte actif; les comptes CRM et portail liés à la même fiche utilisent le même compteur. Les anciens comptes du domaine logements conservent leur identité propre. Effacer des cookies, changer de VPN ou appeler l’API directement ne réinitialise pas un compteur de compte. Sans connexion, l’API refuse avec `401 AUTH_REQUIRED`; aucun quota anonyme ne s’ouvre.

Après épuisement: `429 ASSISTANT_DAILY_LIMIT`, nombre restant zéro et `Retry-After`; aucun appel fournisseur. L’interface affiche le quota, minuit Toronto, un message clair et un lien de connexion. Si la base est indisponible: `503`, sans appel IA. Des comptes distincts ont des quotas distincts: cette règle porte sur les comptes, pas sur une personne physique identifiable indépendamment de ses comptes.

## Contrôles réalisés

- Authentification et autorisation: revue des helpers de session, gardes des API CRM, filtres de propriété des documents client et routes historiques. Aucun Server Action (`use server`) trouvé dans le code applicatif examiné.
- Secrets: aucun secret réel ajouté aux corrections; métadonnées Vercel examinées sans déchiffrement, clés nécessaires présentes et flags de connexion d’urgence absents. Modèle `.env.example` restauré avec valeurs privées vides.
- Base / SQL: Prisma PostgreSQL côté serveur, requêtes HTTP constantes ou paramétrées. Aucune intégration Supabase trouvée; audit RLS Supabase non applicable au code constaté. Rôles et droits effectifs de la base et politiques S3 non vérifiés.
- Injections / XSS: réponses de chat rendues en texte React, validation des rôles et messages, limites des corps réellement lus, origine autorisée, échappement des suggestions et courriels de connexion. Les déclarations du modèle IA ne constituent pas une autorisation serveur; il ne dispose pas d’outils de mutation dans cette route.
- Dépendances: mises à jour compatibles, Prisma/client alignés en 6.19.3, alertes de production réduites de 14 à 6 paquets (1 critique, 5 élevés). Ces nombres ne sont pas des attaques démontrées. Détails et sources dans `docs/security-runtime.md`.

## Tests et preuves

- **39 nouveaux tests de sécurité réussis** (`npm run test:security-audit`). Base PostgreSQL embarquée PGlite pour le véritable SQL du quota; services externes simulés pour les tests d’authentification, de webhook et de courriel.
- **50 demandes simultanées**, sur deux instances du gestionnaire partageant le stockage: exactement 20 réponses acceptées et 30 rejets, avec seulement 20 appels au fournisseur simulé.
- Persistance vérifiée après fermeture/réouverture de la base; comptes indépendants; remise à zéro à minuit Toronto et passages heure d’été/hiver; SQL résistant à un identifiant ressemblant à une injection; stockage indisponible bloquant; données ou identités fournies par le client refusées.
- **89 tests existants réussis**, cinq assertions anciennes d’interface logements échouent dans `rental-links-ui.test.ts`: elles attendent les anciens libellés et blocs d’accueil. Les trois fichiers d’interface concernés (`Header`, `HomeScreen`, `Footer`) sont identiques à `origin/main`; ces échecs ne sont pas attribués aux corrections. Le modèle d’environnement manquant, qui empêchait auparavant de charger ce test, est restauré. La suite globale reste donc rouge; les tests de sécurité ont été exécutés séparément et sont désormais placés au début de `npm test`.
- Contrôle TypeScript complet, lint ciblé, compilation Next.js de production et `git diff --check` réussis. La compilation directe a évité le script prébuild qui applique des migrations à une base réelle.
- Vérification dans le navigateur du build local: règle 20/jour visible, connexion proposée, saisie désactivée sans session, raccourcis disponibles. API locale de statut `401` avec `Cache-Control: no-store`; optimiseur d’images `404`. Capture fournie avec le rapport.
- Aucune commande facturable réelle, aucun courriel/SMS réel et aucun test intrusif sur le site public. La concurrence a été exercée sur le moteur PostgreSQL embarqué, pas sur le déploiement de production ni sur un cluster multi-connexions distant.

## Risques restant à traiter

Next.js 14 n’est plus pris en charge. La désactivation de l’optimiseur traite un chemin critique précis; d’autres avis nécessitent une migration majeure vers une version corrigée et prise en charge, puis vérification complète. Nodemailer et les alertes d’outillage Prisma restent à évaluer. Le site n’est pas déclaré exempt de vulnérabilités.

Les gardes CRM générales se fondent encore sur des sessions longues: une modification de rôle ou une désactivation ne révoque pas toutes ces sessions immédiatement (le nouvel agent vérifie, lui, l’état persisté). Le challenge SMS valide reste réutilisable pendant son expiration si sa valeur et le code ont été volés. Quelques anciennes API utilisent encore des limites en mémoire ou n’ont pas de limite durable. Le fichier historique `data/db.json` contient un hash bcrypt suivi dans Git; suppression contrôlée de cet exemple, migration du stockage historique et réinitialisation du mot de passe concerné restent nécessaires. Aucune modification de compte réel n’a été exécutée.

**Priorité authentification restante:** les nouveaux comptes classiques/radio ne prouvent pas encore systématiquement la possession du courriel avant activation. Un tiers peut préenregistrer une adresse; si son propriétaire utilise ensuite un lien courriel vers le dossier ainsi créé, les anciens identifiants et sessions peuvent demeurer valables. La garde Google empêche la liaison directe sans session, mais ne remplace pas une validation du courriel et une révocation persistante de toutes les anciennes sessions. Ce correctif complet demande de faire évoluer ensemble inscription, récupération et sessions, avec migration et vérification des comptes existants. Il n’est pas appliqué silencieusement ici. Les anciennes sessions portail déjà émises peuvent également rester valables jusqu’à expiration après une désactivation; les nouvelles connexions par lien sont désormais bloquées.

Si la table historique `client_oauth_accounts` n’est pas encore disponible, la connexion Google ne peut pas prouver une liaison antérieure par le sujet Google. Un compte déjà existant doit alors se connecter d’abord ou récupérer son accès; le secours consistant à faire confiance au seul courriel n’est plus accepté. La migration OAuth existante et le parcours de connexion doivent être vérifiés avant publication.

La publication exige validation de la proposition, contrôle des tests d’interface anciens, puis vérification de l’environnement déployé. La présence des secrets Calendly/SMS ne prouve pas leur validité chez les fournisseurs. Les challenges SMS émis avant la correction devront être recommencés; les sessions CRM ordinaires précédentes correctement formées restent acceptées.

## Fichiers modifiés

- `.env.example`
- `.gitignore`
- `docs/production-env.md`
- `docs/security-audit-2026-10-05.md`
- `docs/security-runtime.md`
- `docs/site-assistant.md`
- `next.config.js`
- `package-lock.json`
- `package.json`
- `prisma/seed.ts`
- `scripts/auth-routes-security.test.ts`
- `scripts/auth-session-security.test.ts`
- `scripts/calendly-webhook-security.test.ts`
- `scripts/client-dossier-isolation.test.ts`
- `scripts/client-registration-security.test.ts`
- `scripts/google-link-security.test.ts`
- `scripts/legacy-client-portal-security.test.ts`
- `scripts/listing-access-security.test.ts`
- `scripts/site-assistant-security.test.ts`
- `scripts/site-feedback-security.test.ts`
- `src/app/(client)/client/auth/verify/route.ts`
- `src/app/api/client-auth/google/callback/route.ts`
- `src/app/api/client-auth/login/route.ts`
- `src/app/api/client-auth/register/route.ts`
- `src/app/api/client-auth/request-link/route.ts`
- `src/app/api/contact/route.ts`
- `src/app/api/crm/auth/login/route.ts`
- `src/app/api/crm/auth/verify-sms/route.ts`
- `src/app/api/logements/route.ts`
- `src/app/api/logements/slug/[slug]/route.ts`
- `src/app/api/reviews/route.ts`
- `src/app/api/site-assistant/chat/route.ts`
- `src/app/api/site-assistant/feedback/route.ts`
- `src/app/api/site/contact/route.ts`
- `src/app/api/site/song-requests/route.ts`
- `src/app/api/webhooks/calendly/route.ts`
- `src/app/api/workshop-requests/route.ts`
- `src/app/connexion/page.tsx`
- `src/app/inscription/page.tsx`
- `src/components/assistant/SiteAssistant.tsx`
- `src/features/client-portal/auth/google-link-security.ts`
- `src/features/client-portal/auth/registration-security.ts`
- `src/features/client-portal/components/ExistingContactVerification.tsx`
- `src/features/client-portal/components/public/ClientRegisterCard.tsx`
- `src/features/crm/auth/session.ts`
- `src/lib/actions/song-request.ts`
- `src/lib/auth.ts`
- `src/lib/calendly-webhook-security.ts`
- `src/lib/client-portal.ts`
- `src/lib/contact-rate-limit.ts`
- `src/lib/listing-access.ts`
- `src/lib/site-assistant-handler.ts`
- `src/lib/site-assistant-identity.ts`
- `src/lib/site-assistant-quota.ts`
- `src/lib/sms.ts`
- `src/lib/trusted-client-ip.ts`
