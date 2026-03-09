# Déploiement Render sur le service existant

Ce projet fonctionne comme **Web Service Render** (Next.js SSR + API routes), pas comme site statique.

## 1. Paramètres Render

- **Environment**: Node
- **Build Command**:

```bash
npm install
npm run build
```

- **Start Command**:

```bash
npm run start
```

## 2. Variables d'environnement minimales

Configurer au minimum:

```bash
JWT_SECRET=remplacer-par-une-cle-secrete-longue
ADMIN_EMAIL=simonmorin@nowis.store
SMTP_TO=simonmorin@nowis.store
```

Pour l'envoi réel des emails:

```bash
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
```

## 3. Stockage persistant Render

Le projet écrit actuellement:

- les annonces/utilisateurs dans un fichier JSON
- les images envoyées par les propriétaires sur le disque

Sur Render, il faut **attacher un Persistent Disk** au service existant.

Exemple de mount path recommandé:

```bash
/var/data
```

Puis ajouter ces variables:

```bash
DB_FILE_PATH=/var/data/db.json
UPLOAD_DIR=/var/data/uploads
UPLOAD_PUBLIC_BASE_URL=/api/uploads
```

## 4. Pourquoi `UPLOAD_PUBLIC_BASE_URL=/api/uploads`

Quand les fichiers sont stockés hors de `public/`, ils ne sont pas servis automatiquement par Next.js.
Le projet inclut maintenant une route ` /api/uploads/[fileName] ` qui lit les images sur le disque persistant et les renvoie proprement.

## 5. Déploiement sur l'existant

1. Ouvrir le service Render déjà en production.
2. Ajouter/mettre à jour les variables d'environnement ci-dessus.
3. Attacher un Persistent Disk si ce n'est pas déjà fait.
4. Lancer un **Manual Deploy** ou laisser l'auto-deploy se déclencher après le push.
5. Tester:
   - connexion/inscription
   - dépôt d'annonce
   - upload d'image
   - page publique logement
   - formulaire contact

## 6. Limitation actuelle

Le stockage JSON + disque fonctionne pour démarrer, mais pour la suite il faudra idéalement migrer vers:

- base de données managée (Postgres / Supabase / Neon)
- stockage objet (S3 / Cloudinary)

La structure actuelle reste compatible avec cette future migration.
