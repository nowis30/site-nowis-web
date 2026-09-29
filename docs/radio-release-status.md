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
