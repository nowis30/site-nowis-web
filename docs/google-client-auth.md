# Auth Google client - nowis.store

## Objectif
Activer une connexion/inscription client gratuite en un clic avec Google, sans remplacer l'auth portail existante email+mot de passe.

## Variables d'environnement
Ajouter dans Vercel (Production) et local (.env.local):

- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- CLIENT_PORTAL_JWT_SECRET (ou JWT_SECRET)
- NEXT_PUBLIC_SITE_URL=https://nowis.store
- AUTH_URL=https://nowis.store (optionnel)
- NEXTAUTH_URL=https://nowis.store (optionnel)
- AUTH_SECRET / NEXTAUTH_SECRET (optionnels ici, utiles si NextAuth est introduit plus tard)

## Redirect URI Google
Configurer dans Google Cloud Console:

- Production (recommandé): https://nowis.store/api/client-auth/google/callback
- Local (recommandé): http://localhost:3000/api/client-auth/google/callback

Compatibilité (alias accepté):

- Production: https://nowis.store/api/auth/callback/google
- Local: http://localhost:3000/api/auth/callback/google

## Portée OAuth utilisée
Portées minimales uniquement:

- openid
- email
- profile

Aucun accès Gmail, Drive ou Calendar.

## Comportement fonctionnel
- Le bouton Continuer avec Google démarre OAuth.
- Si un utilisateur portail existe avec le même email: connexion au compte existant.
- Si aucun utilisateur portail n'existe: création automatique d'un compte client gratuit.
- Aucun rôle admin n'est attribué automatiquement.
- Les routes client restent protégées par la session JWT portail existante.

## Migration Prisma
Après pull des changements:

```bash
npm run prisma:migrate:deploy
npm run prisma:generate
```

## Tests rapides
- Connexion Google locale: OK
- Connexion Google production: OK
- Nouveau client via Google: compte + contact créés
- Client existant même email: compte réutilisé
- Redirection post-login: /client/dashboard (ou next valide)
- Déconnexion: session client supprimée
- Mobile: bouton large et lisible
- Accès CRM admin: refusé pour rôle client
