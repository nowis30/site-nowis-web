# Dépendances : durcissement des 5–6 octobre 2026

## Versions et compatibilité

- Next.js `16.3.8`, ligne Active LTS, remplace la ligne 14 hors support.
- React et React DOM `19.3.0`, avec les types React correspondants.
- Nodemailer `10.0.15`, corrige notamment les avis de divulgation de fichiers/SSRF et d’épuisement du parseur d’adresses des versions précédentes.
- Prisma CLI et client restent alignés sur `6.19.3`. Le changement vers Prisma 7 impose une migration distincte du moteur/adaptateur et de la configuration; la version `latest` du CLI consultée était une préversion 8, qui n’a pas été retenue.
- PostCSS `8.5.29`, TypeScript `5.9.3`, tsx `4.23.15`, ESLint `10.12.0` et eslint-config-next `16.3.8`.
- Node.js 22 ou supérieur est requis par le projet; la CI utilise une ligne LTS maintenue.
- Le gestionnaire reproductible est `npm 11.21.0` (`packageManager`), compatible avec Node 22.19 utilisé pour la validation locale. npm 10.9.3 conserve à tort deux dépendances optionnelles WASM sur Windows après `npm ci` puis les déclare `extraneous`; npm 11.21.0 installe correctement les seules plateformes applicables. Les entrées du verrou nécessaires à FreeBSD/WebContainers sont conservées. npm 12 n’est pas imposé au runtime local : il demande une version Node plus récente.

Les scripts d’installation des dépendances ont été relus et leur approbation npm est limitée aux cinq versions verrouillées : `@prisma/client@6.19.3`, `@prisma/engines@6.19.3`, `prisma@6.19.3`, `esbuild@0.28.2`, `unrs-resolver@1.12.2`. Ils vérifient ou préparent les moteurs/binaires et génèrent le client Prisma; ils ne déploient aucune migration. Le champ `allowScripts` ne contient aucune permission globale ou future version automatique. Une mise à jour doit faire relire et renouveler ces approbations. `npm install-scripts ls` confirme qu’aucun script n’est en attente de revue.

Pour reproduire le gestionnaire validé sans installation globale, utiliser `npx --yes npm@11.21.0 ci`. Sur Vercel, vérifier la version réellement choisie dans les logs : le champ `packageManager` exige Corepack ou une commande d’installation explicite pour remplacer la détection automatique. Ce document ne confirme pas un changement de paramètre distant.

La migration officielle des API Next.js 15 a converti les paramètres de route, les paramètres de recherche, `cookies()` et `headers()` en lectures asynchrones. Les pages clientes utilisent `React.use` pour les paramètres promis. Next.js 16 supprime définitivement l’accès synchrone. Le contrôle de types génère désormais les types de routes avant TypeScript.

La commande `next lint` a disparu : `npm run lint` appelle ESLint avec une configuration plate. Les dernières versions officielles de `eslint-plugin-import` (2.32.0), `eslint-plugin-jsx-a11y` (6.10.2) et `eslint-plugin-react` (7.37.5) n’annoncent pas encore ESLint 10. Le projet conserve ESLint 10 maintenu : ESLint 9 est arrivé en fin de support le 6 août 2026.

Les trois packages locaux `vendor/eslint-plugin-*-compat` conservent le runtime, toutes les règles, leurs schémas et leurs configurations d’origine sous licence MIT. Leur entrée `compat.cjs` applique réellement l’adaptateur officiel `@eslint/compat 2.1.1`, qui restaure les méthodes supprimées de l’API des règles; leurs presets plats réutilisent le même plugin adapté. Il s’agit d’une adaptation de code testée, pas d’un changement de plage homologues seul. Les packages déclarent leur compatibilité locale avec ESLint 10 et toutes les chaînes utilisent ces adaptateurs via des remplacements npm explicites. Aucun diagnostic ni aucune règle n’est désactivé pour masquer un avertissement. `scripts/eslint-plugin-compat.test.cjs` vérifie l’intégralité des noms de règles et métadonnées, les sévérités des presets, puis les diagnostics React/accessibilité/import et les presets plats sur le véritable ESLint 10. Le contrôle qualité de l’application reste activé.

Ces adaptateurs devront être retirés lorsque les packages upstream prendront officiellement en charge ESLint 10, après les mêmes tests et le lint complet. Leurs fichiers `SECURITY.md` donnent les versions, empreintes npm, licences et procédure de maintenance.

Les remplacements transitifs sont explicites dans `package.json` :

- `@prisma/config` utilise `deepmerge-ts 8.0.2`, dont la gestion des références circulaires et de la profondeur corrige l’épuisement de pile. La configuration Prisma du projet fusionne des objets ordinaires et n’utilise pas de `Map`; le changement de comportement de fusion des `Map` en version 8 ne s’applique pas ici. La lecture de configuration, la validation du schéma et la génération locale du client doivent rester vérifiées.
- Toutes les copies de PostCSS utilisent la même version corrigée; `postcss-selector-parser` est fixé sur `7.1.6` pour supprimer son risque d’épuisement CPU.
- Toutes les chaînes `braces` utilisent le fork local corrigé décrit ci-dessous; toutes les chaînes des trois plugins ESLint utilisent les adaptateurs locaux.

Le verrou npm est conservé dans le dépôt pour reproduire ces résolutions. Aucun `npm audit fix --force` ni rétrogradation automatique proposée par l’audit n’a été utilisé. Les images restent livrées directement avec `images.unoptimized`; l’endpoint d’optimisation d’images demeure désactivé. Les réécritures d’audio/radio et les redirections publiques sont conservées.

Les racines Turbopack et du traçage de fichiers sont fixées au projet. Une directive `turbopackIgnore` concerne uniquement la comparaison de chaînes `path.resolve(getUploadsDirectory())`, qui entraînait auparavant la copie inutile du dépôt entier dans le serveur autonome. Aucune lecture de fichier n’est ignorée. Le comportement des répertoires d’envoi par défaut, normalisés et personnalisés, ainsi que `DB_FILE_PATH`, est testé. Après compilation, l’inspection des noms de fichiers du serveur autonome ne trouve aucun `.env*` ni `.git`; la base JSON locale de repli reste incluse puisque le code la lit réellement.

## Validation locale

| Contrôle | Résultat |
| --- | --- |
| `npm audit --omit=dev` | Aucune vulnérabilité signalée. |
| `npm audit` complet | Aucune vulnérabilité signalée, toutes les dépendances incluses. |
| `npm 11.21.0 ci` dans un dossier isolé vide | Réussi, scripts approuvés exécutés, aucun avertissement. |
| `npm 11.21.0 ls --all` après cette installation | Réussi, aucune dépendance invalide ou extraneous. |
| Validation du schéma et génération Prisma | Réussies, sans migration ni connexion à une base réelle. |
| `npm run type-check` | Réussi. |
| `npm run lint` | Les avertissements des sources ont été corrigés; la passe globale finale figure dans le rapport de livraison. Les règles configurées restent actives. |
| `npm run build` | Réussi; 239 pages statiques générées, aucun avertissement de `require` dynamique ou de compilation. |
| Fork `braces` et adaptateurs ESLint | Huit tests réussis, dont 121 cas upstream et 26 fixtures de compatibilité `braces`. |
| Astronomie navigateur/serveur | 25 tests réussis, dont des fixtures NASA/JPL et USNO indépendantes. |
| Tests radio/album | Les trois suites de mélange, restauration et ordre des 32 titres passent. |
| Tests client tarot | 44 tests passent, dont consentement, connexion obligatoire à l’IA, compteur partagé et remise à zéro. |
| Navigateur local | Accueil, radio, album, tarot et connexion rendus sans erreur de page. Lecture audio réelle et continuité radio pendant la navigation vérifiées. Vue mobile de 390 pixels sans débordement horizontal. |

Les vérifications du navigateur utilisent une base volontairement indisponible; les fonctions publiques de lecture et les refus sans session sont vérifiés, sans inscrire de compte ni envoyer de courriel ou de demande IA réelle. Les tests serveur et PostgreSQL isolés du rapport principal complètent ces vérifications. Ces résultats concernent le code local, sans publication automatique sur `nowis.store`.

## Correction locale de `braces`

L’avis [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) couvre `braces <=3.0.3`; le registre et l’avis ne proposent aucune version upstream corrigée à la date de ce contrôle. Les sept alertes remontaient par Tailwind/chokidar/micromatch/fast-glob et le plugin Next. Migrer Tailwind seul ne supprimerait pas toutes ces chaînes.

Le fork MIT `vendor/braces`, publié uniquement dans ce dépôt sous l’identité explicite `@nowis/braces-safe 3.0.3-nowis.1`, part du runtime officiel 3.0.3. Le correctif borne la profondeur des accolades et parenthèses avant leur analyse, valide les AST préconstruits sans récursion non bornée, rejette les cycles, et borne les nœuds, les produits d’expansion, les plages et le texte produit. Ces plafonds sont fixes : `rangeLimit:false`, `maxLength:NaN` ou un AST fourni directement ne les désactivent pas. Le parcours des tableaux imbriqués est itératif et contrôlé. Un refus produit `RangeError` avec le code `BRACES_COMPLEXITY_LIMIT`.

Les plafonds sont : profondeur 64, 20 000 nœuds, 10 000 résultats et 1 Mio de texte produit; le plafond original de longueur du motif reste en place. Les tests contrôlent les entrées profondément imbriquées, équilibrées ou incomplètes, les API directes `parse`, `compile`, `expand`, `stringify`, les AST et tableaux cycliques, les produits et les plages excessives. Le motif d’épuisement de pile original est rejeté aussi lorsqu’il arrive par les vrais appelants installés (micromatch, Tailwind et configuration Next). Les motifs ordinaires, échappements et plages sont vérifiés par 26 fixtures et 121 cas du dépôt upstream.

Le manifeste garde une dépendance directe `file:vendor/braces` et l’override `$braces`, afin que toutes les résolutions utilisent le même fork; les tests vérifient cette résolution après une installation propre. Aucun chemin vulnérable upstream ne subsiste dans le verrou. L’audit npm complet retourne zéro vulnérabilité, sans filtrage. **L’audit npm ne certifie pas le code d’un fork local** : la correction repose sur les changements réels et leurs tests adverses, conservés dans le dépôt. L’identité locale et les tests ne remplacent pas la maintenance de sécurité.

Le fichier `vendor/braces/SECURITY.md` documente la source, l’empreinte officielle, les modifications et la procédure de remplacement. Dès qu’un correctif upstream existe, comparer son comportement, relancer les tests adverses/compatibilité, faire l’installation propre, le lint et le build, puis supprimer le fork si les protections sont équivalentes. Toute nouvelle alerte doit être examinée; aucune exception silencieuse n’est conservée.

## Entrée serveur du moteur d’astronomie

L’ancien wrapper serveur chargeait le bundle Browserify `astronomy.browser.min.js`, ce qui rendait deux `require` dynamiques visibles à l’analyse de Next.js. Le navigateur conserve son entrée officielle destinée au navigateur. Le wrapper serveur charge désormais `vendor/astronomy.node.js`, copie sans modification de l’entrée CommonJS officielle `astronomy-engine 2.1.19`. L’origine, l’empreinte npm et la licence MIT sont conservées dans `astronomy-LICENSE.txt`. Le calcul reste le même; les 25 tests de géométrie, fuseaux/DST, positions astronomiques et interface passent. Aucun avertissement n’est filtré dans la configuration du bundler.

## Sources officielles consultées

- [Politique de support Next.js](https://nextjs.org/support-policy)
- [Migration Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Configuration Turbopack](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack), [traçage du serveur autonome](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) et [directives Turbopack](https://nextjs.org/docs/app/api-reference/turbopack)
- [Avis de sécurité Next.js](https://github.com/vercel/next.js/security/advisories), notamment [RCE Windows](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36), [RCE AVIF](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4), [RCE next/og](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j) et [SSRF d’optimisation d’images](https://github.com/vercel/next.js/security/advisories/GHSA-cjq9-62q9-8jv4)
- [Avis Nodemailer](https://github.com/nodemailer/nodemailer/security/advisories)
- [Versions deepmerge-ts et changements de version 8](https://github.com/RebeccaStevens/deepmerge-ts/releases)
- [Migration Prisma 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)
- [Support ESLint](https://eslint.org/version-support/) et [utilitaire officiel de compatibilité](https://eslint.org/blog/2024/05/eslint-compatibility-utilities/)
- [Runtime original braces 3.0.3](https://github.com/micromatch/braces/tree/3.0.3) et [remplacements npm](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/)
- [Politique npm des scripts d’installation](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts/)
- [Choix du gestionnaire sur Vercel](https://vercel.com/docs/package-managers)
- [Moteur d’astronomie officiel](https://github.com/cosinekitty/astronomy)

Les versions cibles et leurs dépendances homologues ont également été vérifiées directement auprès du registre officiel npm. Les résultats d’audit décrivent ce verrou et la base d’avis consultée à cette date, pas une garantie contre des vulnérabilités encore inconnues.
