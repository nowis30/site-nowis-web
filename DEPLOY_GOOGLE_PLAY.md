# 📱 Déployer NOWIS sur Google Play

Guide complet pour déployer ton application Next.js en tant que PWA Android via Trusted Web Activity.

## Étape 1 : Préparer ton domaine

Tu dois avoir un domaine personnalisé configuré pour pointer vers l'application hébergée.

**Exemple :**
- Domaine principal : `app.nowis.store`
- Hébergement : Vercel (ou Netlify, etc.)

Vérifie que :
- ✅ Le domaine fonctionne en HTTPS
- ✅ La PWA est installable (manifest.json + service worker)
- ✅ Les icônes PWA existent (192x192, 512x512)

## Étape 2 : Configurer les Digital Asset Links

Ajoute un fichier `.well-known/assetlinks.json` à la racine de ton site :

**Fichier : `public/.well-known/assetlinks.json`**

```json
[
  {
    "relation": [
      "delegate_permission/common.handle_all_urls"
    ],
    "target": {
      "namespace": "android_app",
      "package_name": "store.nowis.millionnaire",
      "sha256_cert_fingerprints": [
        "07:CD:F8:6C:75:2D:78:1D:E8:B7:05:02:5E:B6:2B:BA:A1:F7:97:67:6B:CE:F1:6B:E8:09:8D:84:94:70:24:B5"
      ]
    }
  }
]
```

**Important** : Remplace le SHA256 par le fingerprint de ton certificat de signature.

Pour obtenir ton SHA256 :
```bash
# Si tu utilises keytool (JDK)
keytool -list -v -keystore chemin/vers/ton/keystore.jks -alias ton-alias

# Cherche "SHA256 Fingerprint:"
```

Test la configuration :
```
https://app.nowis.store/.well-known/assetlinks.json
```

## Étape 3 : Ajouter ads.txt et app-ads.txt

Pour la monétisation, ajoute tes fichiers ads.txt :

**Fichier : `public/ads.txt`**
```
google.com, pub-7443046636998296, DIRECT, f08c47fec0942fa0
```

**Fichier : `public/app-ads.txt`**
```
google.com, pub-7443046636998296, DIRECT, f08c47fec0942fa0
```

Remplace `pub-7443046636998296` par ton publisher ID Google AdSense.

## Étape 4 : Utiliser Bubblewrap pour générer l'APK/AAB

### Installation

```bash
npm install -g @bubblewrap/cli
```

### Initialiser le projet

```bash
bubblewrap init \
  --manifest https://app.nowis.store/manifest.json \
  --package-id store.nowis.millionnaire \
  --app-name "NOWIS"
```

### Configurer la signature

Génère un keystore (une seule fois) :
```bash
keytool -genkey -v \
  -keystore release.jks \
  -keyalg RSA -keysize 2048 \
  -validity 10950 \
  -alias release
```

Réponds aux questions pour identifier ton app.

### Générer l'APK pour test

```bash
bubblewrap build
```

L'APK est généré dans `build/app-release.apk`.

### Générer l'AAB pour Google Play

```bash
bubblewrap build --bundle
```

L'AAB (Android App Bundle) est généré dans `build/app-release.aab`.

## Étape 5 : Tester sur un appareil Android

### Installer l'APK

```bash
# Déverrouille le débogage USB sur ton téléphone
adb install build/app-release.apk

# Ou via l'interface graphique si tu as Android Studio
```

Teste :
- ✅ L'app ouvre correctement
- ✅ La barre d'URL est cachée (via Digital Asset Links)
- ✅ Offline mode fonctionne
- ✅ Installation PWA fonctionne

## Étape 6 : Soumettre à Google Play

### Créer un compte Google Play

1. Va sur https://play.google.com/console
2. Crée un compte développeur ($25 one-time)
3. Complète ton profil

### Créer une nouvelle application

1. Clique sur "Créer une application"
2. Rentre le nom : `NOWIS`
3. Sélectionne les catégories appropriées
4. Accepte les règles

### Uploader l'AAB

1. Va dans "Production" → "Versions de production"
2. Clique sur "Créer une version"
3. Upload le fichier `build/app-release.aab`
4. Renseigne les notes de version

### Ajouter les détails de l'app

**Informations sur l'app :**
- Titre de l'app : NOWIS
- Description courte : Crée du contenu extraordinaire avec l'IA
- Description complète :
  ```
  NOWIS vous permet de créer:
  - Des T-shirts personnalisés avec l'IA
  - De la musique originale avec Suno
  - Des vidéos professionnelles avec Revide.ai
  
  Tous les outils pour créer du contenu extraordinaire en quelques clics.
  ```

**Catégories :**
- Catégorie : Productivité ou Graphisme/Design

**Graphiques :**
- Icône 512x512 : `public/icons/icon-512x512.png`
- Images d'écran (minimum 2) : Captures de l'app en action
- Bannière 1024x500 : Image d'accueil

**Contenu :**
- Classification du contenu appropriée
- Accord de confidentialité/CGU
- Accord de droits d'auteur

### Configurer le prix

- Sélectionne "Gratuite" ou ajoute un prix
- Configure les régions où l'app est disponible

### Soumettre pour examen

1. Vérifie toutes les sections
2. Clique sur "Soumettre pour examen"
3. Attends l'approbation (généralement 24-48h)

## 🔍 Vérification avant soumission

- ✅ HTTPS fonctionne
- ✅ manifest.json valide
- ✅ Service Worker enregistré
- ✅ Digital Asset Links configurés
- ✅ Icons présentes (192x192, 512x512)
- ✅ ads.txt et app-ads.txt
- ✅ Politique de confidentialité accessible
- ✅ Les liens de navigation fonctionnent
- ✅ Formulaires testés (ou note comme "nécessite connexion")

## 📊 Post-lancement

### Surveiller les téléchargements
- Google Play Console → Statistiques
- Regarde les crashs et feedback utilisateurs

### Mettre à jour
```bash
# Après modifications du code
npm run build
bubblewrap build --bundle
# Uplode le nouveau AAB dans Google Play Console
```

### Ajouter des publicités
- Configure AdMob dans les paramètres de l'app
- Utilise les ads.txt pour la monétisation

## 🐛 Troubleshooting

### "Certificate not found"
- Vérifie que ton keystore existe
- Utilise le bon alias

### "Manifest URL unreachable"
- Vérifie que https://app.nowis.store/manifest.json fonctionne
- Teste depuis un navigateur

### App rejected par Google Play
- Lis les commentaires de l'examinateur
- Rectifie (politique de confidentialité, contenu, etc.)
- Résoumets

### Digital Asset Links non vérifié
- Teste avec le validateur Google
- Vérifie le SHA256 exact
- Attends 24h pour la propagation DNS

## 📚 Ressources utiles

- **Bubblewrap** : https://github.com/GoogleChromeLabs/bubblewrap
- **Google Play Console** : https://play.google.com/console
- **Trusted Web Activity** : https://developer.chrome.com/docs/android/trusted-web-activity
- **App Links** : https://developer.android.com/training/app-links

---

**Ta NOWIS app est prête pour Google Play ! 🎉**
