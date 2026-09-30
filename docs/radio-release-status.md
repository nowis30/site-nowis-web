# Radio Nowis — lancement de 139 chansons

Le catalogue contient les 141 identifiants publics du profil `@simonnowismorin`, relevés le 28 septembre 2026. Les différentes versions d’un même titre sont conservées.

## État des fichiers

- 72 enregistrements exacts déjà hébergés : identifiants vérifiés dans les commentaires ID3 des MP3 existants.
- 134 enregistrements exacts présents localement (dont 67 également hébergés). Pour cinq anciens MP3 sans identifiant ID3, les liens de téléchargement Suno observés et les empreintes SHA-256 sont consignés dans les reçus privés locaux.
- 139 enregistrements disponibles au total ; 2 encore à récupérer. Le menu Download est désactivé pour ces deux titres dans Suno.
- 67 nouveaux MP3 déposés dans `audio/nowis-radio-suno`. Les 139 sources disponibles répondent publiquement en HTTP 200 avec un type audio et une taille non nulle ; seuls les deux emplacements manquants échouent.

L’utilisateur a autorisé la publication des 139 chansons disponibles. Le manifeste actif exclut les deux titres indisponibles, conservés dans `data/radio-pending.json`. Le lien de parrainage Suno est publié séparément dans la PR #28.

## Reprise

1. Le CLI Vercel est reconnecté au projet existant `site-nowis-web`. La configuration temporaire a été supprimée après le transfert ; la récupérer de nouveau uniquement si un transfert est nécessaire.
2. Récupérer uniquement la configuration nécessaire dans `.env.radio.local` (ignoré par Git). Ne pas utiliser `.env.local` et ne pas lancer `npm run build` localement : son prébuild peut exécuter des migrations.
3. Terminer les téléchargements par Suno. Certains titres sont déjà déverrouillés : ne pas consommer de quota une seconde fois. L’utilisateur a explicitement autorisé l’enregistrement des MP3 déverrouillés à partir des liens temporaires Suno. Cette méthode a ensuite été approuvée et utilisée. Ne jamais publier les paramètres d’accès temporaires.
4. Recréer l’inventaire avec `python scripts/prepare-radio-audio.py <dossier-downloads> <inventaire.json> <dossier-output> --receipts <reçus.json>`. L’inventaire repose sur les identifiants ID3 ou les reçus de téléchargements autorisés avec empreinte, pas sur les noms des fichiers. Les fichiers privés `radio-matching.json` et `radio-authorized-downloads.json` se trouvent dans le dossier output du workspace parent.
5. Exécuter `node scripts/upload-radio-audio.cjs <inventaire.json>` avec la configuration S3 existante (AWS_MEDIA_* ou S3_*). Le script refuse un catalogue incomplet et ne remplace pas les objets déjà présents.
6. Vérifier les réponses audio, les identifiants ID3 et un échantillon de lecture réelle des sources disponibles, puis les parcours radio → musique → jeux et mobile.
7. Fusionner seulement après les contrôles. Vérifier ensuite le déploiement de production et la lecture sur nowis.store.

Les tests navigateur utilisent un vrai MP3 de test pour contrôler le lecteur. Leur réussite ne prouve pas la présence des fichiers en production.

## MP3 encore à récupérer

- Le langage du corps (Rock Dur 80-90) — `e38df5a6-c34c-4609-aa82-58763ec78227`
- Les mains propres — `5ec7be56-ea78-4a64-967b-7c3aeba6bb1e`

## Validation du lecteur

TypeScript, ESLint, 100 cycles de mélange et 27 tests navigateur réussis sur le commit `76c9138`. Les tests couvrent aussi la navigation vers les jeux et l’absence de doublon de lecteur. La PR #28 est fusionnée et le lien Suno est vérifié sur nowis.store. La PR #29 publie le catalogue actif de 139 sources disponibles.

Les 139 sources ont été contrôlées par HEAD après transfert. Le lancement à 139 a été explicitement approuvé par l’utilisateur. Les deux titres restants seront ajoutés quand leurs MP3 seront disponibles.

## Contrôle du 30 septembre 2026 : catalogue complet et tours de lecture

Après le signalement de trois chansons en boucle, les 139 URL de production ont été téléchargées intégralement par GET, puis décodées jusqu’à leur fin avec FFmpeg (`-xerror`). Résultat : 139 réponses audio valides, aucun échec de téléchargement ou de décodage. Durées de 42,6 à 402 secondes, total de 33 044,304 secondes (environ 9 h 11). Le titre court est la publicité « plancher rousseau rodier ».

Les fichiers comprennent 138 empreintes SHA-256 distinctes : les deux entrées « je leve le son » (`ec5c9b02-233e-42ea-9863-ebb847ce94e7` et `8aa8c82e-6031-4cca-a4e8-80f7c4043f85`) servent exactement le même MP3. Leurs deux identifiants Suno sont conservés; retrouver une éventuelle version distincte reste à faire.

Dans le navigateur de production, un morceau de 194 secondes a joué jusqu’à sa fin et le suivant a démarré automatiquement. Plusieurs autres titres ont démarré et la lecture a continué en allant vers les jeux. Ce contrôle ne constitue pas neuf heures d’écoute de chaque fichier dans le navigateur.

Deux mécanismes ont été identifiés dans le code : l’ancien lecteur contenait un secours de trois titres; le lecteur actuel conservait ses exclusions après une erreur audio pour toute la session. Ainsi, un tour où seuls trois fichiers chargent pouvait limiter tous les tours suivants à ces trois fichiers. L’état du téléphone de l’utilisateur n’a pas été inspecté; la cause exacte de sa session ne doit pas être présentée comme certaine.

La correction réessaie le catalogue entier à chaque nouveau tour, conserve la file et la position lors d’un rechargement ou d’une fermeture du lecteur, et affiche l’avancement du tour. Le manifeste historique utilise maintenant les mêmes 139 entrées que le lecteur; des alias préservent les chemins attendus par l’ancien lecteur. Les anciens caches du site sont retirés sans supprimer les autres caches ni forcer le rechargement d’un formulaire en cours.

Les tests navigateur ajoutés utilisent un court MP3 réel pour obtenir 139 événements `ended` naturels, puis vérifier le passage au tour suivant. Un scénario simule seulement trois fichiers disponibles au premier tour, puis le rétablissement du réseau : les 139 titres doivent être rejouables au tour suivant. La reprise après rechargement et fermeture, le manifeste historique et le retrait ciblé des caches sont aussi couverts.
