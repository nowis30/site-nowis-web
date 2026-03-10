# Synchronisation automatique des chansons

Ce projet peut synchroniser les chansons publiées sur YouTube et Spotify pour alimenter automatiquement la section musique du site.

## Variables d’environnement

Copie `.env.example` vers `.env.local` puis ajoute :

- `YOUTUBE_API_KEY` : clé API YouTube Data v3
- `YOUTUBE_CHANNEL_ID` : identifiant de ta chaîne YouTube
- `SPOTIFY_CLIENT_ID` : identifiant Spotify Developer
- `SPOTIFY_CLIENT_SECRET` : secret Spotify Developer
- `SPOTIFY_ARTIST_ID` : optionnel mais recommandé si la recherche du nom artiste est ambiguë

## Fichiers utilisés

- `data/songs.json` : catalogue synchronisé utilisé par le site
- `data/song-mapping.json` : corrections manuelles de correspondances YouTube ↔ Spotify
- `scripts/sync-youtube.js` : récupération des vidéos de la chaîne
- `scripts/sync-spotify.js` : récupération des morceaux Spotify
- `scripts/sync-songs.js` : fusion finale et écriture du catalogue

## Commandes

- `npm run sync:youtube` : vérifie la récupération YouTube
- `npm run sync:spotify` : vérifie la récupération Spotify
- `npm run sync:songs` : synchronise et met à jour `data/songs.json`

## Correction manuelle des correspondances

Dans `data/song-mapping.json` :

```json
{
  "youtubeToSpotify": {
    "VIDEO_ID_YOUTUBE": "SPOTIFY_TRACK_ID",
    "AUTRE_VIDEO_ID": null
  },
  "ignoredYouTubeVideoIds": [],
  "ignoredSpotifyTrackIds": []
}
```

- mets un `spotifyTrackId` pour forcer une correspondance
- mets `null` pour empêcher toute association Spotify sur une vidéo précise
- ajoute un identifiant dans `ignoredYouTubeVideoIds` pour exclure une vidéo non musicale
- ajoute un identifiant dans `ignoredSpotifyTrackIds` pour exclure un morceau Spotify

## Automatisation quotidienne

Si ton hébergement permet les tâches planifiées, programme `npm run sync:songs` une fois par jour.

Exemples :
- Render Cron Job
- GitHub Actions planifié
- tâche cron sur serveur Node

## Important

- les secrets restent côté serveur uniquement
- la synchronisation ne crée pas de lien Spotify quand la correspondance n’est pas certaine
- la route chanson utilise le catalogue généré sans inventer de contenu
