# L’amour de Nowis — page de sortie et affiche

## Contenu

- Page canonique : `https://nowis.store/album`.
- Pochette officielle existante : `public/images/albums/lamour-de-nowis.jpg`.
- 32 titres et achats individuels : ordre officiel de `src/data/music-store.json`.
- Spotify : `https://open.spotify.com/album/4DCAgBOuSE3OVuGg3dceLj`.
- Apple Music/iTunes Canada : album `6817287623`.
- YouTube Music : playlist officielle `OLAK5uy_lteI3qV7-W8aRYwBkBPAcHFTtTAljrUwg`.
- Amazon Music Canada : album `B0HLDJY7KF`.
- Deezer : album `1109103312` ; UPC `700573613880`.
- Tidal : album `565203711`.
- Boomplay : album `EQUHPj3hHkftBc8ZFmzIlqcJ`.
- Anghami : album `1101198489` retrouvé dans la recherche officielle,
  disponibilité limitée selon le pays et écoute bloquée au Canada lors du contrôle.
- Sortie : 29 septembre 2026. Créateur : Simon Morin, alias Nowis Morin.
- Les icônes DistroKid ne sont pas des liens d’écoute. Les plateformes sans lien
  confirmé restent dans la liste de distribution annoncée.
- Les profils artistes sont affichés séparément des liens vers cet album.
  Qobuz : profil `29684176`, nouvel album pas encore confirmé.

## Écoute

`src/data/album-tracks.json` décrit 32 MP3 provenant des WAV de l’album fournis
par l’artiste. Le lecteur partagé conserve l’ordre, permet un départ au titre
choisi, reprend la position enregistrée sans lecture automatique et recommence
au premier titre après le dernier. Les 139 enregistrements de la radio gardent
leur rotation aléatoire ; les MP3 de l’album n’y sont pas ajoutés.

Les MP3 sont ignorés par Git et servis par la réécriture `/audio/*` vers le
stockage existant `nowis-crm-files`. Le préfixe album est
`audio/album-lamour-de-nowis/`. Les identifiants de fichier viennent d’Apple.

## Préparation et publication

Les fichiers de préparation se trouvent dans le dossier de travail parent :
`output/album-promo/prepare_album_audio.py`, `audio-inventory.json`, et
`create_poster.py`. L’inventaire local contient les correspondances WAV, les
durées et les SHA256 ; les fichiers audio sont encodés en MP3 192 kbit/s sans
changer leur ordre ni normaliser leur niveau.

Avant la publication, contrôler l’inventaire sans appel réseau :

```powershell
node scripts/upload-album-audio.cjs ../output/album-promo/audio-inventory.json
```

Après validation de la mise en ligne par l’artiste, utiliser la configuration
de stockage déjà existante, sans afficher ses secrets. Puis transférer les
32 objets avec `--apply`. Le script vérifie les hashes, n’écrit que dans le
préfixe album et refuse le remplacement d’un objet différent.

Le transfert doit précéder la mise en ligne de la page. Une prévisualisation
distante avant transfert peut afficher le contenu mais ne dispose pas encore
des nouveaux MP3. Après déploiement, attendre Vercel `READY`, vérifier les
32 URL audio publiques et tester la vraie lecture dans le navigateur.

## Vérifications

- TypeScript et compilation Next.js.
- `scripts/album-playback.test.ts` : 32 titres, saut, boucle, favoris, sessions,
  et maintien du catalogue aléatoire à 139 titres.
- `scripts/radio-session.test.ts` et `scripts/radio-shuffle.test.ts`.
- Navigateur : téléphone et ordinateur, lecture réelle, pause/reprise après
  rechargement et fermeture du lecteur, navigation vers la radio, dernier
  titre vers premier titre.
- Affiches lettre et 11×17 : pochette entière, marges d’impression, textes
  lisibles, décodage du seul QR de l’album dans les PNG rendus.

## Impression

Les fichiers finaux sont dans `../output/pdf/`. L’unique QR cible `/album`.
Distribuer l’affiche une fois la page `/album` publiée et
vérifiée ; le QR reste stable pour les prochains ajouts de liens de boutiques.
