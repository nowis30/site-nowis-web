# Radio Nowis — publication en attente

Le catalogue contient les 141 identifiants publics du profil `@simonnowismorin`, relevés le 28 septembre 2026. Les différentes versions d’un même titre sont conservées.

## État des fichiers

- 72 enregistrements exacts déjà hébergés : identifiants vérifiés dans les commentaires ID3 des MP3 existants.
- 100 enregistrements exacts présents dans les téléchargements locaux (dont 67 également hébergés).
- 105 enregistrements disponibles au total ; 36 encore à récupérer.
- Aucun nouveau MP3 envoyé au stockage. Les URL `/audio/nowis-radio-suno/<id>.mp3` sont réservées au futur dépôt des fichiers.

Ne pas fusionner la PR radio avant la disponibilité et la vérification des 141 sources. Le lien de parrainage Suno est publié séparément dans la PR #28.

## Reprise

1. Rétablir la session du CLI Vercel sur le projet existant `site-nowis-web`.
2. Récupérer uniquement la configuration nécessaire dans `.env.radio.local` (ignoré par Git). Ne pas utiliser `.env.local` et ne pas lancer `npm run build` localement : son prébuild peut exécuter des migrations.
3. Terminer les téléchargements par Suno. Certains titres sont déjà déverrouillés : ne pas consommer de quota une seconde fois. L’enregistrement direct par liens temporaires a été refusé par la vérification automatique ; attendre l’autorisation explicite demandée avant de réessayer cette méthode.
4. Recréer l’inventaire avec `python scripts/prepare-radio-audio.py <dossier-mp3> <inventaire.json>`. L’inventaire repose sur les identifiants ID3, pas sur les noms des fichiers.
5. Exécuter `node scripts/upload-radio-audio.cjs <inventaire.json>` avec la configuration AWS_MEDIA existante. Le script refuse un catalogue incomplet et ne remplace pas les objets déjà présents.
6. Vérifier les réponses audio, les identifiants ID3 et la lecture réelle des 141 sources, puis les parcours radio → musique → jeux et mobile.
7. Fusionner seulement après les contrôles. Vérifier ensuite le déploiement de production et la lecture sur nowis.store.

Les tests navigateur utilisent un vrai MP3 de test pour contrôler le lecteur. Leur réussite ne prouve pas la présence des 141 fichiers en production.

## MP3 encore à récupérer

- Le langage du corps (Rock Dur 80-90) — `e38df5a6-c34c-4609-aa82-58763ec78227`
- Qu’une maman, un seul papa (Country Relax Slow Version) — `98857eb2-d549-4269-8108-03665db41041`
- J'ai l'goût d'jouer avec vous (Remastered) — `59f4483f-8947-4af7-b0f7-70d1c91f9e9b`
- Bonjour Sébas, Bonjour Julie — `2f73607e-0010-4e09-a430-9d83f807ad75`
- J'ai le goût de danser — `2dc149a5-de53-44e8-b4e9-91c2da8a779d`
- Je t'aime sans vouloir (Remix) — `9a06a20d-9d5c-462e-9a57-8d4e562afb84`
- Huit ans à deux — `2f1ba495-b9d1-456b-a06c-7c33f6c54533`
- Caya — `fb30a4ef-0af1-4078-80f1-aaeb6531d7e8`
- Qu’une maman, un seul papa (Country Relax Slow Version) — `646598d2-79ba-441c-b8de-8cd5312ba31f`
- Museau Ventux — `e42f71bc-6099-4bfe-98cb-31a5b3a0aa47`
- Je me ferai pas avoir — `8b6d7e88-30c7-4547-bfae-98c510e7c2db`
- zizi — `e9949835-2e2c-4539-8519-652ed32834f8`
- Serge et Nicole — `b0e5fbe1-3466-45f4-a15c-fbc03a3350ff`
- bonne fête des meres — `c169d3b5-0e15-443d-97fc-4aede6edf788`
- Bonne fête Stéphanie — `38b0344d-cb5a-4e02-bf04-af69621b7dba`
- Mayo Baskèt Dousan — `f2c3ccb7-bf77-4e12-bef9-d01e7898389d`
- jean-paul — `0904a856-b4ab-40d5-b305-3cae65fb5a70`
- merci pour vos yeux émerveiller — `154bef61-5bff-46ed-9f1b-97b54af78d3e`
- L’parking a 2 heures — `1f7249dd-8943-4cd3-bf37-93e5b449dd33`
- Soleil après-soir (Remix) — `52ef2f0e-03dc-43bd-bde2-945b665a6c5b`
- simon et melo 2 — `a5b7f17a-c828-447f-ace9-2ab33b39d0c1`
- Les mains propres — `5ec7be56-ea78-4a64-967b-7c3aeba6bb1e`
- j ai besoin de mes chum — `bde26a0b-7b53-41b8-b104-639f9b9cac35`
- plancher rousseau rodier — `b0aee8cc-3f5f-41d7-8774-77194ba60faa`
- Je spawn encore dans mon petit coin de p — `9a2cc55a-005c-41f4-a88e-bba41dc0954e`
- Isa — `89d87e42-5d05-4f32-b606-491cd0b82574`
- lutin (Cover) — `aaa82d4d-1689-4ad9-80a1-f52bc5763c1b`
- moi et ma soeur — `1adb3310-8c69-4310-b9e4-c321bdc8f3b8`
- Verre cassé — `ba7b9484-fffb-4c04-a0d3-d2e1e8aed37f`
- 1 2 3 bébé est la — `465bd12c-063a-4d57-b397-a4955e0c594e`
- je leve le son — `ec5c9b02-233e-42ea-9863-ebb847ce94e7`
- je leve le son — `8aa8c82e-6031-4cca-a4e8-80f7c4043f85`
- j ai le gout de brailler — `674ed709-9f4d-43a2-a247-d96e3f991c48`
- je suis tomber amoureux nowis — `cee50495-cd63-4fd4-8a4b-055584dab636`
- je prend mon temps (Cover) — `52be288b-30fe-4b64-84fe-9e326f722659`
- roblox — `cd77f48b-0978-4737-bb85-f3b1323d521d`
