# Audit ciblé du runtime — 5 octobre 2026

## Dépendances

Le verrou de dépendances contient Next.js `14.2.35` et React `18.3.1`. Next.js 14 ne fait plus partie des versions prises en charge selon la [politique officielle](https://nextjs.org/support-policy).

L'avis critique [GHSA-2xp9-vwfh-vxw4](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) couvre les versions de Next.js antérieures à `15.5.24` et décrit une exécution de code lors de l'optimisation d'images AVIF. `images.unoptimized: true` désactive ici le traitement d'images sur le serveur Next.js. Les images restent affichées par le navigateur; leurs fichiers sources peuvent être plus volumineux. Cette mesure vise ce chemin précis et ne constitue pas une mise à niveau globale du framework.

L'avis élevé [GHSA-h25m-26qc-wcjf / CVE-2026-23864](https://github.com/vercel/next.js/security/advisories/GHSA-h25m-26qc-wcjf) couvre aussi Next.js 14 et décrit un déni de service de Server Functions. Une migration vers une version prise en charge et corrigée de Next.js 15 ou 16 reste nécessaire; elle demande une vérification des routes, composants serveur, authentifications et versions React. Elle n'est pas incluse dans les corrections ciblées.

L'avis critique [GHSA-p293-qw3h-jr36](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36) couvre les serveurs utilisant un système de fichiers Windows. Le déploiement Vercel utilise un runtime Linux; une exposition réseau d'un serveur Next.js de cette version sur Windows reste à éviter jusqu'à sa mise à niveau. L'avis ne fournit pas de contournement pour les serveurs Windows concernés.

La vérification `npm audit --omit=dev --json` a abouti après activation du magasin de certificats système Windows avec `NODE_OPTIONS=--use-system-ca`; la vérification TLS est restée activée. Les mises à jour compatibles du verrou ont réduit le total initial de 14 paquets signalés à **6 paquets: 1 critique et 5 élevés**. Prisma et son client sont alignés en `6.19.3`. Ces totaux comprennent les paquets parents signalés par leurs dépendances; ils ne représentent pas six attaques démontrées sur le site. Les mises à niveau majeures forcées ont été exclues de ce correctif ciblé.

| Paquet direct | Version examinée | Signalement / contexte | Suite nécessaire |
|---|---|---|---|
| `next` | `14.2.35` | Critique: traitement AVIF, serveur Windows; plusieurs dénis de service et problèmes de cache/rewrites | Traitement d'images désactivé ici; migration de version majeure nécessaire pour le reste |
| `nodemailer` | `8.0.1` | Élevé: fonctions de contenu brut et parsing d'adresses; les fonctions de contenu brut non fiables ne sont pas utilisées par les routes examinées | Mise à niveau vers une version corrigée et validation SMTP; npm propose `10.0.15` |
| `prisma` | `6.19.3` après correction | Élevé: `@prisma/config` → `deepmerge-ts`; signalements de configuration et outils, sans appel direct par une entrée HTTP constaté | Client et outil alignés; alerte transitive restante à traiter sans appliquer automatiquement le downgrade suggéré par npm |
| `resend` | `6.32.0` après correction | Anciennes alertes modérées de dépendances `svix` / `uuid` retirées | Mise à jour compatible appliquée |

Les six paquets encore signalés dans l’arbre de production sont `next`, `nodemailer`, `postcss`, `prisma`, `@prisma/config` et `deepmerge-ts`. Les entrées publiques du site ne sont pas transmises à du CSS envoyé à PostCSS ni à la configuration Prisma dans les chemins examinés. Cette observation limite l’exposition constatée et ne dispense pas de mettre à jour les paquets. Les corrections compatibles ont notamment retiré les alertes de `resend`, `svix`, `uuid`, `effect` et des autres dépendances transitoires précédemment signalées.

## Secrets et base

Les métadonnées Vercel du projet `site-nowis-web` confirment la présence de `DATABASE_URL`, `JWT_SECRET`, `CLIENT_PORTAL_JWT_SECRET`, `CALENDLY_WEBHOOK_SIGNING_KEY` et `CALENDAR_TOKEN_ENCRYPTION_KEY` en production et en preview. Les secrets sont de type `encrypted` ou `sensitive`. Les variables `CRM_ALLOW_EMERGENCY_LOGIN` et `CRM_DEMO_PASSWORD` ne figurent pas dans l’environnement du projet. Aucune valeur de secret n’est reproduite dans ce document; leur présence ne vérifie pas leur force cryptographique ni leur validité chez le fournisseur.

Le code utilise Prisma et PostgreSQL côté serveur. Aucune intégration Supabase ni politique RLS n'a été trouvée dans le projet. Les rôles PostgreSQL, politiques effectives de la base et politiques d'accès S3 n'ont pas été interrogés; leur conformité n'est donc pas confirmée. Les requêtes SQL utilisées par les routes sont constantes ou paramétrées.

Le fichier historique `data/db.json` est suivi par Git et contient un compte de l'ancien domaine logements avec un hash bcrypt. Il n'est pas servi comme asset public. Le hash reste exposé aux lecteurs du dépôt et de son historique; une suppression contrôlée de la base d'exemple, un transfert des utilisateurs vers un stockage privé persistant et une réinitialisation du mot de passe de ce compte restent à prévoir. Aucun compte réel ni mot de passe n'a été modifié par cet audit.

Le seed Prisma refuse la production, exige `CRM_SEED_PASSWORD` avant toute suppression de données et ne journalise plus le mot de passe. Il n'a pas été exécuté pendant l'audit.
