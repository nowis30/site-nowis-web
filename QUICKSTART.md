# 🚀 DÉMARRAGE RAPIDE - NOWIS

**Ton application est prête! Voici comment démarrer en 3 étapes.**

## Step 1️⃣ : Installation (2 minutes)

```bash
# Ouvre terminal/PowerShell dans le dossier du projet
cd "c:\Users\smori\application nouvelle\site-nowis"

# Installe les dépendances
npm install

# Note: Cela peut prendre 3-5 minutes la première fois
```

## Step 2️⃣ : Lancer en développement (1 minute)

```bash
# Démarre le serveur
npm run dev

# Tu devrais voir:
# > ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

## Step 3️⃣ : Ouvrir dans le navigateur (30 secondes)

```
http://localhost:3000
```

✅ **C'est prêt!** Tu vois la page d'accueil NOWIS.

---

## 📱 Tester les pages

| Page | URL | Quoi |
|------|-----|------|
| Accueil | http://localhost:3000 | Hero + services |
| Portfolio | http://localhost:3000/portfolio | Tes projets |
| Services | http://localhost:3000/services | Services + tarifs |
| Réservation | http://localhost:3000/booking | Formulaire |
| À propos | http://localhost:3000/about | Ton histoire |

---

## ✏️ Personnaliser maintenant

### Option 1: Commencer simple
1. Ouvre `TODO_ACTIONS.md`
2. Fais la section "Branding & Contenus"
3. Recharge le navigateur (F5)

### Option 2: Suivre le guide complet
1. Ouvre `SETUP_INSTRUCTIONS.md`
2. Suis les étapes de A à Z

---

## 🛠️ Commandes utiles

```bash
# Arrêter le serveur
# Appuie sur Ctrl+C dans le terminal

# Redémarrer
npm run dev

# Lancer la version production (après build)
npm run build
npm start

# Vérifier les erreurs TypeScript
npm run type-check
```

---

## 🐛 Si ça ne marche pas

### "npm: not found" / "npm not recognized"
→ Node.js n'est pas installé
→ Télécharge depuis https://nodejs.org (LTS)

### "Port 3000 already in use"
→ Un autre programme utilise le port
→ Tue le processus ou change le port:
```bash
npm run dev -- -p 3001
```

### Erreurs lors de npm install
```bash
# Nettoie et réessaye
npm cache clean --force
rm -r node_modules
npm install
```

---

## 📞 Prochaines étapes

**Félicitations! Ton app fonctionne! 🎉**

Maintenant :
1. **Personnalise le contenu** → `TODO_ACTIONS.md`
2. **Ajoute tes images** → `public/images/`
3. **Configure l'email** → Voir SETUP_INSTRUCTIONS.md
4. **Déploie** → README.md

---

## 💡 Tips

- Les changements de code se rechargent automatiquement (hot reload)
- Ouvre les DevTools (F12) pour voir les erreurs
- Service Worker est automatiquement enregistré
- Offline mode marche - teste avec DevTools → Network → Offline

---

**Bon développement! 🚀**

Questions? Lis `README.md` pour les liens et ressources.
