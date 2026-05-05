# CRM & Portail Client — Nettoyage legacy et surface IA

**Dernière mise à jour :** 2026-05-05  
**Auteur :** Copilot / smori

---

## Résumé des changements

Ce document décrit le nettoyage du système de soumissions entrantes hérité (`Inquiry`) et la mise en place d'une surface d'API lisible par un assistant IA pour le portail client.

---

## 1. Désactivation de la route publique legacy

### Avant
`POST /api/public/submission-request` créait directement des `Inquiry`, `SongRequest` et `WorkshopRequest` sans authentification. Cela causait :
- Des doublons dans le CRM
- Des entrées sans contact associé
- Une surface d'attaque non authentifiée

### Après
La route retourne `410 Gone` avec un message guidant l'utilisateur vers le portail client :
```json
{
  "error": "Cette ancienne route de soumission est désactivée. Utilisez le portail client.",
  "portalUrl": "/client/dashboard"
}
```

### Fichier modifié
`src/app/api/public/submission-request/route.ts`

---

## 2. Page CRM Soumissions (Inquiry) marquée comme legacy

La page `/crm/submissions` est conservée pour consultation des données historiques, mais est exclue de la navigation CRM.

### Fichier modifié
`src/app/crm/(app)/submissions/page.tsx` — commentaire LEGACY ajouté en entête.

---

## 3. Registre des formulaires portail client

**Fichier :** `src/features/client-portal/forms/form-registry.ts`

Contient la définition complète de tous les formulaires disponibles dans le portail client, sous forme lisible par un assistant IA.

### Formulaires disponibles

| ID | Titre | Route | API |
|----|-------|-------|-----|
| `songRequest` | Demande de chanson personnalisée | `/client/song-requests/nouveau` | `/api/site/song-requests` |
| `workshopRequest` | Demande d'atelier musical | `/client/workshops/nouveau` | `/api/workshop-requests` |

### Structure d'un formulaire

```typescript
{
  id: string,
  title: string,
  description: string,
  route: string,       // URL de la page UI
  api: string,         // URL de soumission finale
  steps: FormStep[]    // Étapes du formulaire
}
```

### Structure d'un champ

```typescript
{
  name: string,         // Clé dans le payload
  label: string,        // Libellé affiché
  type: FieldType,      // text | textarea | email | etc.
  required: boolean,    
  helpText: string,     // Aide contextuelle
  assistantPrompt: string,  // ← Question que le chatbot doit poser
  options?: { value, label }[],
  maxLength?: number,
}
```

---

## 4. Route d'assistance IA — Contexte

**Endpoint :** `GET /api/client/assistant/context`  
**Auth :** Session portail client (`nowis_client_session` cookie)  
**Fichier :** `src/app/api/client/assistant/context/route.ts`

### Réponse type

```json
{
  "contact": {
    "id": "clxxx...",
    "fullName": "Marie Tremblay",
    "email": "marie@exemple.com",
    "phone": "514-555-0000"
  },
  "billing": {
    "complete": false,
    "missingFields": ["billingCity", "billingPostalCode"]
  },
  "forms": [
    {
      "id": "songRequest",
      "title": "Demande de chanson personnalisée",
      "description": "...",
      "route": "/client/song-requests/nouveau",
      "steps": [...]
    }
  ]
}
```

**Note :** Le champ `api` (route interne) est volontairement omis de la réponse.

---

## 5. Route d'assistance IA — Validation de brouillon

**Endpoint :** `POST /api/client/assistant/drafts`  
**Auth :** Session portail client  
**Fichier :** `src/app/api/client/assistant/drafts/route.ts`

### Requête

```json
{
  "type": "songRequest",
  "draft": {
    "fullName": "Marie Tremblay",
    "email": "marie@exemple.com",
    "occasion": "Anniversaire de mariage",
    "description": "40 ans ensemble, une chanson douce..."
  }
}
```

### Réponse type (brouillon incomplet)

```json
{
  "type": "songRequest",
  "draft": {
    "fullName": "Marie Tremblay",
    "email": "marie@exemple.com",
    "occasion": "Anniversaire de mariage",
    "description": "40 ans ensemble, une chanson douce..."
  },
  "ready": false,
  "missingRequired": [
    {
      "name": "description",
      "label": "Votre histoire ou message",
      "assistantPrompt": "Racontez-moi l'histoire ou le message que vous voulez transmettre dans cette chanson."
    }
  ],
  "submitRoute": "/api/site/song-requests",
  "submitNote": "Il manque 1 champ(s) requis avant de pouvoir soumettre."
}
```

### Réponse type (brouillon complet)

```json
{
  "type": "songRequest",
  "draft": { ... },
  "ready": true,
  "missingRequired": [],
  "submitRoute": "/api/site/song-requests",
  "submitNote": "Le brouillon est complet. Vous pouvez soumettre via POST /api/site/song-requests."
}
```

⚠️ **Cette route ne crée aucune donnée en base.** Elle sert uniquement à valider le brouillon.

---

## 6. Flux AI / chatbot recommandé

```
1. GET /api/client/assistant/context
   → Identifier le client, vérifier son profil de facturation, lister les formulaires

2. Poser les questions une par une en utilisant `steps[].fields[].assistantPrompt`

3. POST /api/client/assistant/drafts { type, draft }
   → Valider le brouillon, obtenir la liste des champs manquants

4. Répéter les étapes 2-3 jusqu'à { ready: true }

5. Présenter un résumé au client et demander confirmation

6. POST {submitRoute} avec le draft final
   → Création réelle en base de données
```

---

## 7. Ce que l'agent ne peut pas faire — Actions manuelles requises

| # | Action | Responsable |
|---|--------|-------------|
| 1 | Tester en staging que `POST /api/public/submission-request` retourne bien 410 | Dev/QA |
| 2 | Vérifier qu'aucun bouton sur le site public ne pointe encore vers `/api/public/submission-request` | Dev/Front |
| 3 | Créer l'interface chatbot dans le portail client (page UI avec conversation) | Dev/Front |
| 4 | Brancher un vrai modèle LLM (OpenAI, Claude, etc.) sur les routes `/api/client/assistant/*` | Dev/IA |
| 5 | Écrire les tests E2E pour le flux chatbot | QA |
| 6 | Migrer/clôturer les `Inquiry` historiques dans le CRM | Admin CRM |
| 7 | Supprimer définitivement `src/app/crm/(app)/submissions/` une fois l'historique archivé | Dev |

---

## 8. Variables d'environnement requises

Déjà configurées — aucune nouvelle variable nécessaire pour cette feature.

| Variable | Usage |
|----------|-------|
| `CLIENT_PORTAL_JWT_SECRET` | Auth portail client (cookie `nowis_client_session`) |
| `DATABASE_URL` | Prisma / PostgreSQL |

---

## 9. Modèles Prisma impliqués

| Modèle | Rôle | Statut |
|--------|------|--------|
| `Contact` | Profil du client connecté | ✅ Actif |
| `SongRequest` | Demandes de chanson | ✅ Actif |
| `WorkshopRequest` | Demandes d'atelier | ✅ Actif |
| `Inquiry` | Soumissions legacy | ⚠️ Archive — ne pas créer de nouveaux enregistrements |
| `CommercialQuote` | Soumissions commerciales CRM | ✅ Actif |
| `Invoice` | Factures | ✅ Actif |
