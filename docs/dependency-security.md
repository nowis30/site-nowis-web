# Dépendances : durcissement du 5 octobre 2026

## Versions et compatibilité

- Next.js `16.3.8`, ligne Active LTS, remplace la ligne 14 hors support.
- React et React DOM `19.3.0`, avec les types React correspondants.
- Nodemailer `10.0.15`, corrige notamment les avis de divulgation de fichiers/SSRF et d’épuisement du parseur d’adresses des versions précédentes.
- Prisma CLI et client restent alignés sur `6.19.3`. Le changement vers Prisma 7 impose une migration distincte du moteur/adaptateur et de la configuration; la version `latest` du CLI consultée était une préversion 8, qui n’a pas été retenue.
- PostCSS `8.5.29`, TypeScript `5.9.3`, tsx `4.23.15`, ESLint `10.12.0` et eslint-config-next `16.3.8`.
- Node.js 22 ou supérieur est requis par le projet; la CI utilise une ligne LTS maintenue.

La migration officielle des API Next.js 15 a converti les paramètres de route, les paramètres de recherche, `cookies()` et `headers()` en lectures asynchrones. Les pages clientes utilisent `React.use` pour les paramètres promis. Next.js 16 supprime définitivement l’accès synchrone. Le contrôle de types génère désormais les types de routes avant TypeScript.

La commande `next lint` a disparu : `npm run lint` appelle ESLint avec une configuration plate. `@eslint/compat` enveloppe les règles React/import/accessibilité anciennes dont les plages de dépendances n’annoncent pas encore ESLint 10. Cet adaptateur officiel restaure les méthodes supprimées de l’API des règles. `npm ci --dry-run` réussit avec le verrou, mais npm signale ces plages homologues anciennes comme avertissements; `npm ls --all` marque donc ESLint comme hors plage pour ces trois plugins. Cette compatibilité est vérifiée par l’exécution du lint et doit être retirée lorsque les plugins prennent officiellement en charge ESLint 10. Les nouveaux diagnostics du compilateur React restent visibles comme avertissements; le projet n’active pas ce compilateur. Les règles classiques des Hooks et les vérifications de types restent actives.

Deux remplacements transitifs sont explicites dans `package.json` :

- `@prisma/config` utilise `deepmerge-ts 8.0.2`, dont la gestion des références circulaires et de la profondeur corrige l’épuisement de pile. La configuration Prisma du projet fusionne des objets ordinaires et n’utilise pas de `Map`; le changement de comportement de fusion des `Map` en version 8 ne s’applique pas ici. La lecture de configuration, la validation du schéma et la génération locale du client doivent rester vérifiées.
- Toutes les copies de PostCSS utilisent la même version corrigée; `postcss-selector-parser` est fixé sur `7.1.6` pour supprimer son risque d’épuisement CPU.

Le verrou npm est conservé dans le dépôt pour reproduire ces résolutions. Aucun `npm audit fix --force` ni rétrogradation automatique proposée par l’audit n’a été utilisé. Les images restent livrées directement avec `images.unoptimized`; l’endpoint d’optimisation d’images demeure désactivé. Les réécritures d’audio/radio et les redirections publiques sont conservées.

Les racines Turbopack et du traçage de fichiers sont fixées au projet. Une directive `turbopackIgnore` concerne uniquement la comparaison de chaînes `path.resolve(getUploadsDirectory())`, qui entraînait auparavant la copie inutile du dépôt entier dans le serveur autonome. Aucune lecture de fichier n’est ignorée. Le comportement des répertoires d’envoi par défaut, normalisés et personnalisés, ainsi que `DB_FILE_PATH`, est testé. Après compilation, l’inspection des noms de fichiers du serveur autonome ne trouve aucun `.env*` ni `.git`; la base JSON locale de repli reste incluse puisque le code la lit réellement.

## Validation locale

| Contrôle | Résultat |
| --- | --- |
| `npm audit --omit=dev` | Aucune vulnérabilité signalée. |
| `npm audit` complet | Sept entrées élevées de développement, détaillées ci-dessous. |
| Validation du schéma et génération Prisma | Réussies, sans migration ni connexion à une base réelle. |
| `npm run type-check` | Réussi. |
| `npm run lint` | Aucune erreur; 36 avertissements de règles/compiler existants restent visibles. |
| `npm run build` | Réussi; 239 pages statiques générées. Deux avertissements de `require` dynamique du bundle d’astronomie déjà présent restent visibles. |
| Tests radio/album | Les trois suites de mélange, restauration et ordre des 32 titres passent. |
| Tests client tarot | 44 tests passent, dont consentement, connexion obligatoire à l’IA, compteur partagé et remise à zéro. |
| Navigateur local | Accueil, radio, album, tarot et connexion rendus sans erreur de page. Lecture audio réelle et continuité radio pendant la navigation vérifiées. Vue mobile de 390 pixels sans débordement horizontal. |

Les vérifications du navigateur utilisent une base volontairement indisponible; les fonctions publiques de lecture et les refus sans session sont vérifiés, sans inscrire de compte ni envoyer de courriel ou de demande IA réelle. Les tests serveur et PostgreSQL isolés du rapport principal complètent ces vérifications. Ces résultats concernent le code local, sans publication automatique sur `nowis.store`.

## Résultat et exception limitée à l’outillage

L’audit `npm audit --omit=dev` effectué sur le verrou après mise à jour ne signale **aucune vulnérabilité**. L’audit complet conserve **sept entrées de gravité élevée**, toutes issues de **la même vulnérabilité non corrigée de `braces <=3.0.3`**, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Au moment de la vérification, ni npm ni l’avis officiel ne publient de version corrigée de `braces`.

Les entrées concernent `braces`, `micromatch`, `fast-glob`, `chokidar`, `tailwindcss`, `@next/eslint-plugin-next` et `eslint-config-next`. Elles se situent uniquement dans les dépendances de développement :

| Chemin | Entrée traitée | Exposition du site |
| --- | --- | --- |
| Tailwind 3 → fast-glob/micromatch/braces, ou chokidar/braces | Motifs de fichiers du dépôt au build et à la surveillance locale | Aucun motif fourni par un visiteur n’est traité par cet outillage. |
| eslint-config-next → plugin Next → fast-glob/micromatch/braces | Fichiers du dépôt pendant l’analyse de code | ESLint n’est pas appelé par une route du site. |

La vulnérabilité provoque un épuisement de pile avec des motifs d’accolades profondément imbriqués. L’exception est limitée à des chemins et motifs de dépôt contrôlés lors du build/lint; elle ne concerne pas une dépendance vulnérable du runtime déployé. Les contributeurs et scripts de build ne doivent pas transmettre de motifs non fiables à cet outillage. Migrer seulement Tailwind 4 laisserait le second chemin vulnérable et modifierait les styles du produit; cette migration n’a donc pas été faite pour masquer un compteur d’audit.

Cette exception doit être réévaluée dès qu’un correctif officiel ou des versions de Tailwind/plugin Next sans cette chaîne sont disponibles. Un futur audit ne doit pas être filtré silencieusement : toute nouvelle alerte critique/élevée dans les dépendances de production doit bloquer la livraison et être corrigée ou analysée séparément.

## Sources officielles consultées

- [Politique de support Next.js](https://nextjs.org/support-policy)
- [Migration Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Configuration Turbopack](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack), [traçage du serveur autonome](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) et [directives Turbopack](https://nextjs.org/docs/app/api-reference/turbopack)
- [Avis de sécurité Next.js](https://github.com/vercel/next.js/security/advisories), notamment [RCE Windows](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36), [RCE AVIF](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4), [RCE next/og](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j) et [SSRF d’optimisation d’images](https://github.com/vercel/next.js/security/advisories/GHSA-cjq9-62q9-8jv4)
- [Avis Nodemailer](https://github.com/nodemailer/nodemailer/security/advisories)
- [Versions deepmerge-ts et changements de version 8](https://github.com/RebeccaStevens/deepmerge-ts/releases)
- [Migration Prisma 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)
- [Support ESLint](https://eslint.org/version-support/) et [utilitaire officiel de compatibilité](https://eslint.org/blog/2024/05/eslint-compatibility-utilities/)

Les versions cibles et leurs dépendances homologues ont également été vérifiées directement auprès du registre officiel npm. Les résultats d’audit décrivent ce verrou et la base d’avis consultée à cette date, pas une garantie contre des vulnérabilités encore inconnues.
