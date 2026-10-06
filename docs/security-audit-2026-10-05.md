# Audit et durcissement de nowis.store — 5 octobre 2026

## État de livraison

Les corrections et les tests concernent une branche locale isolée de `nowis30/site-nowis-web`, basée sur `main` au commit `ea07949`. Les changements déjà présents dans le dossier original ont été conservés. Aucun déploiement, push public, migration de production, paiement, modification de secret ou envoi réel de courriel/SMS n’a été effectué.

Ce travail combine revue de code, tests de régression, exploitation simulée des défauts confirmés, vérifications SQL et lecture non intrusive de la configuration Vercel et du site public. Il ne constitue pas une certification ni une garantie contre toutes les attaques connues ou futures. Les axes de contrôle correspondent notamment à [OWASP ASVS](https://owasp.org/projects/asvs), sans revendiquer une validation exhaustive de ce référentiel.

## Principaux défauts corrigés

Les niveaux ci-dessous expriment le risque applicatif observé, et non un score CVSS calculé. Les essais reproduisent les défauts dans un environnement isolé, sans exploiter les comptes ou documents de vrais utilisateurs.

| Priorité | Défaut confirmé | Correction et preuve |
| --- | --- | --- |
| Critique | Un challenge OTP était accepté comme session CRM; le code était contenu dans le JWT | Scopes séparés, HS256 imposé, code aléatoire cryptographique remplacé dans le jeton par un vérificateur HMAC. Challenge enregistré, borné, à usage unique; 20 validations simultanées donnent un seul gagnant. |
| Critique | Secrets JWT de secours publics acceptés en production | Refus des secrets absents, connus publiquement ou inférieurs à 32 octets. Aucun secours d’authentification lorsque la base ou la configuration échoue. Même contrôle pour les liens publics et le chiffrement des jetons calendrier. |
| Critique | Rattachement à un dossier existant par simple déclaration de courriel; adoption possible d’un compte préenregistré par un tiers | Preuve de possession du courriel requise. Inscription en attente avec mot de passe initial inutilisable; activation par le propriétaire. Adoption Google/magic sécurisée, anciennes credentials et liaisons retirées, changement de version d’identité. |
| Critique | Accès croisé aux dossiers ou déplacement de compte par rapprochement de courriel | Le Contact signé et relu dans la base fait autorité. Fiches archivées/inactives et courriels périmés refusés; les relations des organisations restent préservées. |
| Critique | Finalisation S3 acceptant une clé arbitraire : rattachement, lecture ou suppression du fichier d’un autre dossier | Intentions d’upload signées et persistantes à usage unique, liées à l’acteur et au fichier. Préfixe serveur par propriétaire; vérification taille/MIME/ETag; copie conditionnelle vers une nouvelle clé finale jamais présignée en écriture. Rejeux et courses refusés. |
| Élevée | Sessions non révoquées immédiatement après logout, reset, changement de rôle/email, désactivation ou archivage | `AuthGrant` persistant avec empreinte de l’identité courante, relecture DB à chaque autorisation, versions d’identité et triggers SQL. Logout révoque le grant; reset et changement sensible invalident les anciennes sessions. Anciens JWT refusés. |
| Élevée | Ancienne authentification JSON utilisant un hash versionné publiquement | Parcours legacy fermés en production; aucune identité administrateur issue de cette base locale. Le fichier historique reste conservé pour les usages existants; migration privée et contrôle de l’ancien compte à prévoir. |
| Élevée | Appels IA publics ou limites basées sur une IP/processus contournables | Connexion obligatoire et compteur SQL commun au chat et aux deux fonctions IA du tarot. Réservation atomique avant appel; tests simultanés et de persistance décrits ci-dessous. |
| Élevée | Stack Next.js 14 hors support, appartenant notamment à une plage d’avis critique de traitement AVIF | Migration vers Next.js 16.3.8 / React 19.3.0, Nodemailer 10.0.15 et correctifs transitifs. Optimiseur d’images maintenu désactivé. Audit du verrou de production sans alerte connue. |
| Élevée | Fichiers administratifs, notes internes, payloads de réservation, coûts ou identités staff exposés dans des réponses client/publiques | DTO explicites, filtrage `CLIENT_VISIBLE`, retrait URL/clé S3 brute des propriétés client; proxy de téléchargement authentifié. Devis/factures publics minimisés, réponses privées sans cache ni référent. |
| Élevée | Webhook Calendly accepté sans clé | Clé obligatoire, HMAC vérifié avant DB, horodatage avec fenêtre de cinq minutes, taille réellement lue bornée. |
| Élevée | `UNPAID` et `PARTIALLY_PAID` PayPal reconnus comme payés par test de sous-chaîne; réponse ancienne pouvant écraser un état récent | Statuts exacts, montant/devise vérifiés avec la facture persistée et les paiements retournés, remboursement distingué. Mise à jour conditionnelle sur version/date empêche une réponse périmée d’écraser une édition ou un remboursement. |
| Élevée | Connexion/OTP et préparations d’upload sans plafond durable | Compteurs persistants par compte et IP de confiance pour l’authentification, OTP borné à cinq tentatives, uploads plafonnés. Échec de stockage bloque l’opération. |
| Moyenne | Redirection `next` normalisable vers un domaine externe par des contrôles ou antislash encodés | Validation après décodage borné, rejet contrôles/antislash/autorité externe, origine locale fixe; requêtes et fragments internes conservés. |
| Moyenne | Déclarations utilisateur interpolées dans des courriels HTML, logs pouvant exposer les erreurs brutes | Échappement HTML des textes/liens; diagnostics publics et journalisés minimisés, aucun message brut Prisma/fournisseur dans les métadonnées communes. |
| Moyenne | Accès aux annonces historiques non approuvées et autoapprobation possible | Propriétaire ou administrateur persisté requis; propriétaire ne peut s’autoapprouver, modifications publiques repassent en modération. |
| Moyenne | Courriels d’auteurs dans l’API des avis; santé DB trop descriptive | Sélections publiques minimales; état de santé générique, sans noms d’erreurs ou présence de variables, sans cache. |
| Moyenne | Build pouvant migrer une base réelle ou résoudre automatiquement une migration échouée | Prébuild limité à la génération du client Prisma local, sans shell ni migration. Les migrations deviennent une étape explicite de livraison. Test vérifie l’absence d’opération DB dans le build. |
| Moyenne | Seed destructif et password de démonstration utilisables en production | Seed interdit en production avant toute suppression; mot de passe de développement explicitement requis et jamais affiché. Seed non exécuté pendant l’audit. |

Le CRM exige désormais un second facteur en production. Si la configuration SMS est complète, le code utilise le canal SMS existant; sinon, il est envoyé à l’adresse staff persistée via Resend. Un échec d’envoi refuse la connexion; aucun mode mot de passe seul ne s’ouvre en production. La réception réelle n’a pas été testée pour ne pas envoyer de message sans action de livraison. Le code par courriel améliore la protection mais dépend de la sécurité de la boîte mail; TOTP ou une clé de sécurité résistante au phishing restent préférables pour les administrateurs.

## Plafond de 20 commandes

Les trois routes `POST /api/site-assistant/chat`, `POST /api/tarot/oracle` et `POST /api/tarot/conclusion` partagent **20 commandes par compte authentifié et par jour civil**, avec remise à zéro à **minuit, heure de Toronto (`America/Toronto`)**. Une demande acceptée compte comme une commande. Les raccourcis, les suggestions et les lectures symboliques locales du tarot ne consomment pas ce quota.

Le navigateur ne choisit ni identité, ni compteur, ni date. Le serveur relit le compte actif et le dossier. Un même Contact conserve le compteur entre ses identités portail/CRM. Changer de VPN/IP, effacer cookies/stockage, modifier le JavaScript, falsifier un identifiant ou appeler l’API directement ne remet pas ce compteur à zéro. La règle porte sur les comptes: plusieurs comptes distincts peuvent avoir plusieurs quotas; elle ne prétend pas reconnaître une personne physique.

La table existante `api_rate_limits` porte une clé unique scope/identité/jour. Un UPSERT SQL paramétré incrémente seulement si le compteur est inférieur à 20. Décision et incrément sont atomiques. L’horloge de la base définit les limites du jour, y compris les journées de 23 et 25 heures. Lecture et consommation échouent de manière fermée si la base est indisponible.

Après épuisement: HTTP `429`, message clair, zéro restant, date de reprise et `Retry-After`; aucun nouvel appel fournisseur. L’interface affiche la règle, le compteur et la connexion requise; son blocage ne remplace pas le contrôle serveur. Une réservation reste comptée si le fournisseur échoue ensuite. Les demandes invalides sont rejetées avant réservation; le tarot ne réserve pas si aucun fournisseur n’est configuré. Le guide de navigation de repli du chat suit le même quota.

## Étendue des contrôles

| Axe | Vérifié dans le code / les tests | Limite de preuve |
| --- | --- | --- |
| Authentification / autorisation | Helpers, gardes CRM/client, propriété des dossiers/documents, rôles courants, impersonation ADMIN, session/OTP/magic/reset/OAuth, CSRF/origines | La matrice métier ASSISTANT existante n’a pas été redéfinie; elle permet de nombreuses opérations CRM. Tous les parcours avec fournisseurs réels restent à confirmer en preview. |
| Secrets / environnement | Pas de nouveau secret réel dans les correctifs; métadonnées Vercel sans déchiffrement; refus des valeurs de secours faibles; traçage du build autonome | Présence ne prouve ni force ni validité. Aucune valeur n’a été imprimée; historique Git exhaustif, anciennes clés chez les fournisseurs et rotation effective non audités. |
| Base / SQL | Prisma côté serveur, SQL constants/paramétrés, migrations et triggers testés, compteur atomique | Rôle effectif DB, TLS côté hébergeur, réseau, sauvegardes/PITR et droits réels non accessibles. Aucune intégration Supabase trouvée: RLS Supabase non applicable. |
| API / Server Actions | Routes sensibles, validation et corps bornés des chemins corrigés, scopes, origines, anti-abus, erreurs génériques | Aucun `use server` applicatif trouvé. Revue ciblée, pas fuzzing exhaustif de chaque combinaison métier ni scan intrusif public. |
| Injections / XSS / SSRF | Rendu du chat en texte React, échappement HTML, SQL paramétré, URLs de redirection locales; destinations OAuth/PayPal/calendrier fixes ou configurées serveur | Pas d’injection SQL dynamique ni SSRF utilisateur confirmé dans les chemins examinés. La CSP comporte encore `unsafe-inline`; une CSP à nonce stricte nécessite une adaptation contrôlée du produit. |
| Fichiers / S3 | Intentions, propriété, intégrité de finalisation, lecture/suppression serveur, filtrage des fichiers privés | IAM, bucket policy, CORS, KMS et objets historiques non vérifiés. Taille/MIME ne remplacent pas un antivirus ou une quarantaine de contenu. |
| Rate limiting | Quota IA, auth, suggestions, uploads et certaines interactions radio/communauté persistants | Une limite par IP reste anti-abus, pas une identité. Aucun test de charge ou de DDoS réel; budgets/coûts globaux et WAF à confirmer. |
| Dépendances / livraison | Verrou, versions maintenues, audit runtime, build, types, lint, CI isolée sans secrets production | Aucune base de CVE ne recense toutes les failles; sept alertes élevées de développement restent, documentées précisément. |

L’assistant de navigation ne dispose pas d’outils serveur permettant de modifier le CRM: une instruction donnée au modèle ne devient pas une autorisation de lire ou changer un dossier.

## Vérifications publiques en lecture seule

Le déploiement de production Vercel constaté est `READY`, sous Node 24.x. La page publique et la connexion répondent. Les contrôles limités `/.env`, `/.git/config` et `/data/db.json` répondent 404, sans fichier sensible visible. Le contrôle santé DB répond; cela ne remplace pas un audit des privilèges.

HTTPS/HSTS, `nosniff`, protection de cadrage, politique de référent et CSP sont présents. Aucun en-tête `x-powered-by` constaté. La CSP autorise du JavaScript/style inline, ce qui reste une défense limitée contre XSS.

L’API Vercel de configuration personnalisée de pare-feu retourne 404 (« Seawall Config not found »): aucune règle personnalisée active n’a été confirmée. Cela ne signifie pas absence de protection DDoS automatique, que [Vercel documente](https://vercel.com/docs/vercel-firewall). Aucun changement WAF n’a été effectué.

Les métadonnées confirment les noms de configuration DB, JWT, portail, S3, Resend, calendrier/Calendly et PayPal, sans lire leurs valeurs. Aucun paramètre Twilio/numéro OTP n’y est configuré; le repli email évite donc un verrouillage des administrateurs. Plusieurs entrées visent production et preview: leur séparation réelle doit être confirmée avant toute preview avec accès DB. Ne jamais pointer les essais isolés vers la base réelle.

Ces constatations décrivent le site public avant publication des corrections locales. Elles ne prouvent pas que ces corrections sont déjà actives.

## Validation du code corrigé

- **230 tests serveur/sécurité et métier** réussis (`npm test`), sans échec ni test sauté.
- **47 tests audio/tarot client** réussis (`npm run test:public-media`), plus les assertions du parcours public.
- **Deux scénarios avec le véritable client Prisma** et une base PostgreSQL TCP jetable : révocation et claim OTP concurrent; 50 demandes donnant 20 succès, 30 rejets et 20 appels IA simulés.
- Histoire complète des **39 migrations** chargée dans la base isolée; triggers SQL réels, persistance du quota, minuit Toronto et changements d’heure vérifiés. Les autres fournisseurs sont simulés.
- TypeScript complet et lint réussis : **0 erreur**, **36 avertissements** visibles.
- Compilation `npm run build` avec base isolée et `NODE_ENV=production` réussie : **239 pages statiques**, deux avertissements préexistants du bundle astronomique.
- Audit npm de production : **0 alerte connue**. Audit complet : **7 alertes élevées de développement**, une même vulnérabilité braces sans correctif publié, exception dans `dependency-security.md`.
- Navigateur local : radio réellement lue et conservée pendant navigation, album 1/32, mobile 390 px sans débordement, tarot local gratuit et IA désactivée sans compte, connexion/confirmation email accessibles. En-têtes privés et statut sans session vérifiés.
- Inspection du serveur autonome final : aucun `.env*` ni `.git`; `git diff --check` réussi. Aucun service réel facturable ni base de production utilisés.

Les services email/SMS/Google/S3/PayPal et IA sont simulés dans les tests de sécurité. Les essais SQL utilisent une base PostgreSQL embarquée isolée; un essai supplémentaire utilise le véritable client Prisma via son protocole PostgreSQL TCP local. Il vérifie les grants, la révocation et les accès réels au stockage, sans URL de production. Cette preuve n’est pas un test de capacité d’un cluster PostgreSQL distant.

La CI ajoutée exige une base PostgreSQL 16 jetable sous un nom/utilisateur local réservé, applique les migrations à cette seule base et exécute sécurité, régressions, intégration Prisma, audit runtime, types, lint et build. Les actions GitHub sont fixées par SHA, permissions lecture seules, sans persistance de credentials ni secret réel. Le workflow n’a pas été exécuté sur GitHub car aucun push public n’a été effectué.

## Risques et étapes restantes

1. **Livrer les corrections:** revue, sauvegarde DB, migration explicite, preview isolée et vérification des connexions/permissions, puis approbation de publication. Toutes les sessions anciennes et les anciens liens de reset seront invalidés; comptes portail doivent confirmer leur courriel. Voir `security-release.md`.
2. **Confidentialité S3 réelle:** contrôler séparément les préfixes privés et les permissions IAM. Le bucket contient aussi audio/jeux publics; ne pas le rendre globalement privé sans migration. Les anciens `Document.fileUrl` / `Invoice.fileUrl` du portail historique sont encore des liens directs et demandent une migration proxy ciblée. Les enregistrements anciens sans preuve de provenance doivent être revus pour détecter un éventuel rattachement forgé antérieur.
3. **Comptes et secrets:** vérifier force des clés sans les afficher, validité du domaine mail/transport, sécurité des boîtes staff et MFA fournisseur; migration/reset privé du compte JSON historique. Séparer previews et production, accès DB à privilèges minimaux, sauvegardes restaurables.
4. **Liens partagés:** les liens documentaires signés devis/facture/facturation restent des capacités 14/30 jours, distinctes des sessions révocables. Certains liens atelier stockés en DB restent persistants selon le contrat existant. Raccourcir ou révoquer ces liens exige une évolution produit et une migration contrôlée.
5. **Détection / disponibilité:** journal durable et alertes sur anomalies/auth/coûts, règles WAF graduelles en observation puis challenge/blocage, budgets fournisseur. PayPal vérifie la signature et l’état distant; un journal de déduplication durable des IDs d’événement reste à ajouter pour éviter des activités répétées.
6. **Fichiers et entretien:** antivirus/quarantaine à envisager selon le contenu reçu; lifecycle sur staging et purge des grants expirés selon procédure contrôlée. Ne pas appliquer une suppression générale aux préfixes publics ou aux objets historiques.
7. **Outillage:** sept alertes élevées liées à une seule vulnérabilité de `braces`, limitée au développement et sans correctif publié à la vérification. Ne pas présenter l’audit complet comme sans alerte. Vérifier les mises à jour quand un correctif est publié.

## Références techniques vérifiées

- [Support Next.js](https://nextjs.org/support-policy), [migration Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16), [avis de sécurité du projet](https://github.com/vercel/next.js/security/advisories), notamment [AVIF](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4).
- [Avis Nodemailer](https://github.com/nodemailer/nodemailer/security/advisories), [exception braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Résultats et limites du verrou: `dependency-security.md`.
- [En-têtes Vercel](https://vercel.com/docs/headers/request-headers), [pare-feu Vercel](https://vercel.com/docs/vercel-firewall), [règles WAF](https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets).
- [Signature Calendly](https://developer.calendly.com/api-docs/overview/webhooks/webhook-signatures), [définition facture PayPal](https://developer.paypal.com/api/invoicing/v2/definitions/invoice/).
- [Blocage d’accès public S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html), [écritures conditionnelles](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes-enforce.html).
- [PGlite socket officiel](https://pglite.dev/docs/pglite-socket), [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node).

## Fichiers modifiés

306 fichiers ajoutés, modifiés ou retirés par rapport à ea07949. Une part importante adapte les paramètres, cookies et en-têtes aux API asynchrones Next.js 16; elle est nécessaire à la correction du runtime.

- .env.example
- .eslintrc.json
- .github/workflows/security.yml
- .gitignore
- README.md
- docs/dependency-security.md
- docs/file-storage-security.md
- docs/production-env.md
- docs/security-audit-2026-10-05.md
- docs/security-release.md
- docs/security-runtime.md
- docs/site-assistant.md
- eslint.config.mjs
- next-env.d.ts
- next.config.js
- package-lock.json
- package.json
- prisma/migrations/20261006010000_persistent_auth_grants/migration.sql
- prisma/schema.prisma
- prisma/seed.ts
- public/tarot-reader/index.html
- public/tarot-reader/oracle-summary.js
- public/tarot-reader/oracle.js
- scripts/account-verification-ui.test.cjs
- scripts/ai-command-quota-security.test.ts
- scripts/auth-routes-security.test.ts
- scripts/auth-session-security.test.ts
- scripts/auth-test-database.ts
- scripts/build-database-isolation.test.cjs
- scripts/calendly-webhook-security.test.ts
- scripts/client-dossier-isolation.test.ts
- scripts/client-registration-security.test.ts
- scripts/contact-route-security.test.ts
- scripts/crm-mfa-transport-security.test.ts
- scripts/crm-mfa-ui.test.cjs
- scripts/file-upload-security.test.ts
- scripts/google-link-security.test.ts
- scripts/health-response-security.test.ts
- scripts/legacy-client-portal-security.test.ts
- scripts/legacy-upload-security.test.ts
- scripts/listing-access-security.test.ts
- scripts/login-redirect-security.test.ts
- scripts/oracle-conclusion.test.ts
- scripts/oracle-summary-client.test.cjs
- scripts/paypal-integration.test.ts
- scripts/persistent-auth-security.test.ts
- scripts/prisma-safe-prebuild.js
- scripts/public-document-security.test.ts
- scripts/public-link-key-security.test.ts
- scripts/rental-links-ui.test.ts
- scripts/security-migrations.test.ts
- scripts/security-postgres-integration.ts
- scripts/site-assistant-security.test.ts
- scripts/site-feedback-security.test.ts
- scripts/storage-paths.test.ts
- scripts/tarot-oracle-client.test.cjs
- scripts/tarot-oracle.test.ts
- src/app/(client)/client/auth/verify/route.ts
- src/app/(client)/client/documents/[documentId]/lecteur/page.tsx
- src/app/(client)/client/documents/page.tsx
- src/app/(client)/client/facturation/page.tsx
- src/app/(client)/client/invoices/[id]/page.tsx
- src/app/(client)/client/song-requests/[id]/page.tsx
- src/app/(client)/client/soumissions/[id]/page.tsx
- src/app/(client)/client/workshops/[id]/page.tsx
- src/app/(client)/client/workshops/nouveau/page.tsx
- src/app/api/ai-music/shares/[id]/comments/route.ts
- src/app/api/ai-music/shares/[id]/like/route.ts
- src/app/api/auth/login/route.ts
- src/app/api/auth/logout/route.ts
- src/app/api/auth/me/route.ts
- src/app/api/auth/register/route.ts
- src/app/api/client-auth/forgot-password/route.ts
- src/app/api/client-auth/google/callback/route.ts
- src/app/api/client-auth/login/route.ts
- src/app/api/client-auth/logout/route.ts
- src/app/api/client-auth/register/route.ts
- src/app/api/client-auth/request-link/route.ts
- src/app/api/client-auth/reset-password/route.ts
- src/app/api/client-portal/file-documents/[id]/download/route.ts
- src/app/api/client-portal/file-documents/[id]/route.ts
- src/app/api/client-portal/file-documents/presign/route.ts
- src/app/api/client-portal/file-documents/route.ts
- src/app/api/client-portal/files/[id]/route.ts
- src/app/api/client-portal/files/route.ts
- src/app/api/client-portal/invoices/[id]/payment/route.ts
- src/app/api/client-portal/invoices/[id]/pdf/route.ts
- src/app/api/client-portal/organizations/route.ts
- src/app/api/client-portal/profile/route.ts
- src/app/api/client-portal/tasks/route.ts
- src/app/api/client/assistant/context/route.ts
- src/app/api/client/assistant/drafts/route.ts
- src/app/api/client/commercial-quotes/[id]/respond/route.ts
- src/app/api/client/facturation/route.ts
- src/app/api/client/facturation/status/route.ts
- src/app/api/client/profile/route.ts
- src/app/api/client/song-requests/[id]/documents/route.ts
- src/app/api/client/song-requests/[id]/route.ts
- src/app/api/client/song-requests/route.ts
- src/app/api/client/workshop-requests/[id]/documents/route.ts
- src/app/api/client/workshop-requests/[id]/route.ts
- src/app/api/client/workshop-requests/route.ts
- src/app/api/contact/route.ts
- src/app/api/crm/activities/[id]/route.ts
- src/app/api/crm/activities/route.ts
- src/app/api/crm/appointments/[id]/route.ts
- src/app/api/crm/appointments/route.ts
- src/app/api/crm/appointments/search/route.ts
- src/app/api/crm/auth/forgot-password/route.ts
- src/app/api/crm/auth/login/route.ts
- src/app/api/crm/auth/logout/route.ts
- src/app/api/crm/auth/me/route.ts
- src/app/api/crm/auth/reset-password/route.ts
- src/app/api/crm/auth/verify-sms/route.ts
- src/app/api/crm/billing-profile/route.ts
- src/app/api/crm/calendar/calendly-diagnostics/route.ts
- src/app/api/crm/calendar/calendly-test-payload/route.ts
- src/app/api/crm/calendar/connections/[id]/route.ts
- src/app/api/crm/calendar/connections/route.ts
- src/app/api/crm/calendar/events/route.ts
- src/app/api/crm/calendar/remove-event/route.ts
- src/app/api/crm/calendar/sync/route.ts
- src/app/api/crm/cases/[id]/route.ts
- src/app/api/crm/cases/route.ts
- src/app/api/crm/cleanup/route.ts
- src/app/api/crm/commercial-quotes/[id]/accept/route.ts
- src/app/api/crm/commercial-quotes/[id]/convert-to-invoice/route.ts
- src/app/api/crm/commercial-quotes/[id]/decline/route.ts
- src/app/api/crm/commercial-quotes/[id]/route.ts
- src/app/api/crm/commercial-quotes/[id]/send-email/route.ts
- src/app/api/crm/commercial-quotes/[id]/send/route.ts
- src/app/api/crm/commercial-quotes/route.ts
- src/app/api/crm/contacts/[id]/actions/route.ts
- src/app/api/crm/contacts/[id]/email/route.ts
- src/app/api/crm/contacts/[id]/route.ts
- src/app/api/crm/contacts/route.ts
- src/app/api/crm/dashboard/route.ts
- src/app/api/crm/diagnostics/paypal/route.ts
- src/app/api/crm/file-documents/[id]/download/route.ts
- src/app/api/crm/file-documents/[id]/route.ts
- src/app/api/crm/file-documents/presign/route.ts
- src/app/api/crm/file-documents/route.ts
- src/app/api/crm/files/[id]/route.ts
- src/app/api/crm/files/route.ts
- src/app/api/crm/finance/entries/[id]/route.ts
- src/app/api/crm/finance/entries/route.ts
- src/app/api/crm/finance/inventory/route.ts
- src/app/api/crm/finance/reports/export/route.ts
- src/app/api/crm/impersonation/start/route.ts
- src/app/api/crm/impersonation/stop/route.ts
- src/app/api/crm/invoices/[id]/archive/route.ts
- src/app/api/crm/invoices/[id]/delete-permanent/route.ts
- src/app/api/crm/invoices/[id]/diagnostics/route.ts
- src/app/api/crm/invoices/[id]/mark-test/route.ts
- src/app/api/crm/invoices/[id]/outlook/route.ts
- src/app/api/crm/invoices/[id]/payments/route.ts
- src/app/api/crm/invoices/[id]/paypal/create/route.ts
- src/app/api/crm/invoices/[id]/paypal/reset-test/route.ts
- src/app/api/crm/invoices/[id]/paypal/send/route.ts
- src/app/api/crm/invoices/[id]/paypal/status/route.ts
- src/app/api/crm/invoices/[id]/preview-pdf/route.ts
- src/app/api/crm/invoices/[id]/restore/route.ts
- src/app/api/crm/invoices/[id]/route.ts
- src/app/api/crm/invoices/[id]/send/route.ts
- src/app/api/crm/invoices/route.ts
- src/app/api/crm/notifications/[id]/route.ts
- src/app/api/crm/options/route.ts
- src/app/api/crm/organizations/[id]/route.ts
- src/app/api/crm/organizations/route.ts
- src/app/api/crm/outlook/callback/route.ts
- src/app/api/crm/outlook/connect/route.ts
- src/app/api/crm/public-comments/[id]/route.ts
- src/app/api/crm/public-comments/route.ts
- src/app/api/crm/search/route.ts
- src/app/api/crm/song-requests/[id]/archive/route.ts
- src/app/api/crm/song-requests/[id]/delete-permanent/route.ts
- src/app/api/crm/song-requests/[id]/mark-test/route.ts
- src/app/api/crm/song-requests/[id]/restore/route.ts
- src/app/api/crm/song-requests/[id]/route.ts
- src/app/api/crm/song-requests/route.ts
- src/app/api/crm/submissions/[id]/archive/route.ts
- src/app/api/crm/submissions/[id]/delete-permanent/route.ts
- src/app/api/crm/submissions/[id]/mark-test/route.ts
- src/app/api/crm/submissions/[id]/restore/route.ts
- src/app/api/crm/submissions/[id]/route.ts
- src/app/api/crm/submissions/route.ts
- src/app/api/crm/tasks/[id]/email/route.ts
- src/app/api/crm/tasks/[id]/route.ts
- src/app/api/crm/tasks/route.ts
- src/app/api/crm/workshop-availability/[id]/route.ts
- src/app/api/crm/workshop-availability/route.ts
- src/app/api/crm/workshop-requests/[id]/appointments/route.ts
- src/app/api/crm/workshop-requests/[id]/archive/route.ts
- src/app/api/crm/workshop-requests/[id]/delete-permanent/route.ts
- src/app/api/crm/workshop-requests/[id]/mark-test/route.ts
- src/app/api/crm/workshop-requests/[id]/permanent/route.ts
- src/app/api/crm/workshop-requests/[id]/restore/route.ts
- src/app/api/crm/workshop-requests/[id]/route.ts
- src/app/api/crm/workshop-requests/route.ts
- src/app/api/health/db/route.ts
- src/app/api/logements/mine/route.ts
- src/app/api/logements/route.ts
- src/app/api/logements/slug/[slug]/route.ts
- src/app/api/public/billing/[token]/route.ts
- src/app/api/public/invoices/[token]/route.ts
- src/app/api/public/quotes/[token]/respond/route.ts
- src/app/api/public/quotes/[token]/route.ts
- src/app/api/radio/account/route.ts
- src/app/api/reviews/[id]/route.ts
- src/app/api/reviews/route.ts
- src/app/api/site-assistant/chat/route.ts
- src/app/api/site-assistant/feedback/route.ts
- src/app/api/site/contact/route.ts
- src/app/api/site/song-requests/route.ts
- src/app/api/site/song-requests/upload/route.ts
- src/app/api/tarot/conclusion/route.ts
- src/app/api/tarot/oracle/route.ts
- src/app/api/upload/route.ts
- src/app/api/uploads/[fileName]/route.ts
- src/app/api/webhooks/calendly/route.ts
- src/app/api/workshop-requests/route.ts
- src/app/artistes/[slug]/page.tsx
- src/app/atelier/[token]/page.tsx
- src/app/ateliers/demande/page.tsx
- src/app/audio/nowis-radio/playlist.json/route.ts
- src/app/chanson/[slug]/page.tsx
- src/app/commander-une-chanson/page.tsx
- src/app/communaute-ia/artiste/[slug]/page.tsx
- src/app/connexion/page.tsx
- src/app/contact/page.tsx
- src/app/crm/(app)/admin/calendar-connections/page.tsx
- src/app/crm/(app)/admin/calendar/page.tsx
- src/app/crm/(app)/appointments/[id]/page.tsx
- src/app/crm/(app)/calendrier/nouveau/page.tsx
- src/app/crm/(app)/cases/[id]/page.tsx
- src/app/crm/(app)/commercial-quotes/[id]/page.tsx
- src/app/crm/(app)/commercial-quotes/new/page.tsx
- src/app/crm/(app)/contacts/[id]/page.tsx
- src/app/crm/(app)/invoices/[id]/page.tsx
- src/app/crm/(app)/invoices/new/page.tsx
- src/app/crm/(app)/invoices/page.tsx
- src/app/crm/(app)/notifications/page.tsx
- src/app/crm/(app)/organizations/[id]/page.tsx
- src/app/crm/(app)/song-requests/[id]/page.tsx
- src/app/crm/(app)/workshop-requests/[id]/page.tsx
- src/app/crm/client/[token]/invoices/[id]/page.tsx
- src/app/crm/client/[token]/page.tsx
- src/app/crm/login/page.tsx
- src/app/facturation/[token]/page.tsx
- src/app/facture/[token]/page.tsx
- src/app/favicon.ico/route.ts
- src/app/inscription/page.tsx
- src/app/jeux/[slug]/page.tsx
- src/app/logements/[slug]/page.tsx
- src/app/musique/[slug]/page.tsx
- src/app/payer/atelier/[token]/page.tsx
- src/app/payer/chanson/[token]/page.tsx
- src/app/soumission/[token]/page.tsx
- src/components/assistant/SiteAssistant.tsx
- src/components/community/AiCommunityAccount.tsx
- src/components/radio/RadioAccount.tsx
- src/features/client-portal/auth/google-link-security.ts
- src/features/client-portal/auth/google.ts
- src/features/client-portal/auth/registration-security.ts
- src/features/client-portal/auth/session.ts
- src/features/client-portal/auth/validators.ts
- src/features/client-portal/components/ExistingContactVerification.tsx
- src/features/client-portal/components/public/ClientRegisterCard.tsx
- src/features/client-portal/documents/client-file-dto.ts
- src/features/client-portal/workshops/client-workshop-dto.ts
- src/features/crm/auth/api-guard.ts
- src/features/crm/auth/session.ts
- src/lib/actions/song-request.ts
- src/lib/ai-command-quota.ts
- src/lib/api-diagnostics.ts
- src/lib/auth-grants.ts
- src/lib/auth-request-security.ts
- src/lib/auth-signing-secret.ts
- src/lib/auth.ts
- src/lib/bounded-upload-body.ts
- src/lib/calendar/oauth-routes.ts
- src/lib/calendar/token-crypto.ts
- src/lib/calendly-webhook-security.ts
- src/lib/client-portal.ts
- src/lib/complete-password-reset.ts
- src/lib/contact-rate-limit.ts
- src/lib/email-service.ts
- src/lib/file-storage.ts
- src/lib/file-upload-intent.ts
- src/lib/listing-access.ts
- src/lib/password-reset.ts
- src/lib/public-links.ts
- src/lib/radio-api.ts
- src/lib/rentals-url.ts
- src/lib/safe-next.ts
- src/lib/server/paypal-webhook.ts
- src/lib/server/paypal.ts
- src/lib/site-assistant-handler.ts
- src/lib/site-assistant-identity.ts
- src/lib/site-assistant-quota.ts
- src/lib/sms.ts
- src/lib/storage.ts
- src/lib/trusted-client-ip.ts
- src/lib/uploaded-file.ts
- src/lib/verified-account.ts
- tsconfig.json
