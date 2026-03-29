# NOWIS - Application Web PWA & Android

**Crée du contenu extraordinaire : T-shirts IA, musique (Suno), vidéos (Revide.ai)**

Application modern Next.js 14 + TypeScript pour créer et vendre du contenu généré par IA.

## 🚀 Démarrage rapide (5 minutes)

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer en développement
npm run dev

# 3. Ouvrir http://localhost:3000
```

## 📚 Documentation

Voir les fichiers de documentation :

| Fichier | Description |
|---------|------------|
| **TODO_ACTIONS.md** | ✅ **COMMENCE ICI** - Checklist de ce que tu dois faire |
| **SETUP_INSTRUCTIONS.md** | 📖 Guide complet de configuration et personnalisation |
| **DEPLOY_GOOGLE_PLAY.md** | 📱 Guide pour déployer sur Google Play |

## 🎯 Ce qui est inclus

### ✨ Fonctionnalités
- ✅ **Responsive mobile-first** - Fonctionne parfaitement sur tous les appareils
- ✅ **PWA complète** - Installation possible, mode offline, manifest
- ✅ **Service Worker** - Cache intelligent, synchronisation background
- ✅ **Tailwind CSS** - Design moderne et rapide
- ✅ **TypeScript** - Code type-safe
- ✅ **Next.js 14** - Performances optimales

### 📱 Pages incluses
1. **Accueil** - Hero section avec CTA
2. **Portfolio** - Galerie de projets
3. **Services** - Tous tes services avec tarifs
4. **Réservation** - Formulaire de consultation
5. **À propos** - Ton histoire et équipe

### 🧩 Composants réutilisables
- **Button** - 3 variantes (primaire, secondaire, outline)
- **Card** - Conteneurs flexibles
- **SectionTitle** - Titres cohérents
- **Header** - Navigation mobile/desktop
- **Footer** - Réseaux sociaux
- **ProjectCard** - Cartes portfolio
- **ServiceCard** - Cartes services

## 📁 Structure du projet

```
NOWIS/
├── src/
│   ├── app/                    # Pages Next.js
│   ├── components/             # Composants réutilisables
│   │   ├── ui/                 # Composants de base
│   │   ├── layout/             # Header, Footer
│   │   ├── portfolio/          # Composants portfolio
│   │   └── services/           # Composants services
│   └── screens/                # Pages complètes
├── public/                     # Assets statiques
│   ├── icons/                  # Icônes PWA
│   ├── images/                 # Tes images (à ajouter)
│   ├── audio/                  # Fichiers Suno (à ajouter)
│   ├── videos/                 # Fichiers Revide.ai (à ajouter)
│   └── manifest.json           # Configuration PWA
├── SETUP_INSTRUCTIONS.md       # Guide détaillé
├── DEPLOY_GOOGLE_PLAY.md       # Guide Google Play
└── TODO_ACTIONS.md             # Checklist personnalisation
```

## 🎨 Personnalisation en 5 étapes

### 1️⃣ **Textes et contenus**
Ouvre `TODO_ACTIONS.md` et suis les liens vers chaque fichier à modifier.

### 2️⃣ **Images**
Ajoute tes images dans `public/images/` :
- `hero.png` - Image d'accueil
- `project-*.png` - Tes projets
- `about-story.png` - Image à propos

### 3️⃣ **Icônes PWA**
Remplace les fichiers dans `public/icons/` :
- `icon-192x192.png`
- `icon-512x512.png`
- `icon-512x512-maskable.png`

### 4️⃣ **Fichiers audio/vidéo**
Place dans les dossiers correspondants :
- `public/audio/` - Musiques Suno
- `public/videos/` - Vidéos Revide.ai

### 5️⃣ **Configurer l'email**
Intègre un service d'email (Resend, SendGrid) pour les réservations.

## 🔧 Commands utiles

```bash
# Développement
npm run dev                # Serveur local sur port 3000
npm run lint              # Vérifier le code
npm run type-check        # Vérifier les types TypeScript
npm run quality:quick     # Vérification rapide (types + build)

# Production
npm run build             # Build optimisé
npm start                 # Serveur production
npm run prisma:migrate:deploy  # Appliquer migrations en prod
npm run tasks:backfill-types   # Backfill robuste des tâches legacy
npm run crm:release:tasks      # Pipeline complet migration + backfill + quality

# Déploiement
vercel                    # Déployer sur Vercel (recommandé)
```

## 📱 Déploiement

### 🌐 Web (Recommandé)
1. Déploie sur **Vercel** (super simple, free)
2. Configure ton domaine personnalisé

### 🤖 Google Play
1. Lis `DEPLOY_GOOGLE_PLAY.md` pour les instructions complètes
2. Utilise Bubblewrap pour générer l'APK/AAB
3. Soumets dans Google Play Console

### 🔗 Other hosting
- Netlify
- Cloudflare Pages
- Ton serveur custom

## 🎯 Prochaines étapes

1. **D'abord** : Lis `TODO_ACTIONS.md` - c'est ta checklist
2. **Puis** : Suis `SETUP_INSTRUCTIONS.md` pour les détails
3. **Enfin** : Lis `DEPLOY_GOOGLE_PLAY.md` pour la publication

## 🆘 FAQ rapide

**Q: Par où je commence ?**
R: Ouvre `TODO_ACTIONS.md` et fais les cases à cocher.

**Q: Comment ajouter mes images ?**
R: Met-les dans `public/images/` et modifie les chemins dans les fichiers mentionnés.

**Q: Ça va fonctionner offline ?**
R: Oui! Le service worker gère le cache automatiquement.

**Q: Je peux le mettre sur Google Play ?**
R: Oui! Lis `DEPLOY_GOOGLE_PLAY.md` pour les instructions.

**Q: C'est payant ?**
R: Non pour le web (Vercel free). $25 pour Google Play Developer compte.

**Q: Puis-je changer les couleurs ?**
R: Oui! Modifie `tailwind.config.ts`.

## 🆘 Besoin d'aide ?

- **Docs Next.js** : https://nextjs.org/docs
- **Docs Tailwind** : https://tailwindcss.com
- **Docs PWA** : https://web.dev/progressive-web-apps/
- **Google Play** : https://play.google.com/console

## 📊 Conseils avant lancement

- ✅ Teste sur mobile avec DevTools
- ✅ Teste le formulaire de réservation
- ✅ Teste l'installation PWA
- ✅ Teste le mode offline
- ✅ Configure HTTPS (obligatoire pour PWA)
- ✅ Vérifie les meta tags SEO

## 🎉 Ready to go!

**Ton application est prête. À toi de la personnaliser et de la lancer!**

Commence par `TODO_ACTIONS.md` 👉

---

**Créée avec ❤️ pour NOWIS - Création de contenu IA**
