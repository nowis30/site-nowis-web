## Icônes PWA / Android

Fichiers requis pour une PWA installable et la génération TWA/Bubblewrap:

| Fichier | Taille | Rôle |
|---------|--------|------|
| icon-192.png | 192x192 | Icône PWA (Android launcher) |
| icon-512.png | 512x512 | Icône PWA haute résolution (Chrome) |
| icon-512-maskable.png | 512x512 | Icône maskable (fond adaptatif) |
| icon.svg | Vectoriel | Source principale (actuel) |

### Générer les PNG à partir du SVG

Méthode rapide (Node.js + sharp) :
```powershell
npm init -y
npm install sharp
node -e "require('sharp')('icons/icon.svg').resize(192,192).png().toFile('icons/icon-192.png');require('sharp')('icons/icon.svg').resize(512,512).png().toFile('icons/icon-512.png');"
```

Pour la version maskable: dupliquez `icon-512.png` puis ajoutez du padding transparent (idéalement 10-20%) de façon que la forme principale reste centrée:
```powershell
node -e "require('sharp')('icons/icon-512.png').extend({top:50,bottom:50,left:50,right:50,background:{r:0,g:0,b:0,alpha:0}}).resize(512,512).toFile('icons/icon-512-maskable.png')"
```

### Mettre à jour le manifest

Après génération, modifiez `manifest.json` pour ajouter:
```json
"icons": [
  {"src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
  {"src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
  {"src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
  {"src": "/icons/icon.svg", "sizes": "any", "type": "image/svg+xml"}
]
```

### Conseils

- Gardez un fond transparent pour la version maskable.
- Vérifiez le rendu sur https://maskable.app/editor.
- Ne changez pas le nom des fichiers une fois publiés (pour éviter caches incohérents).
