# Assistant de site NOWIS

L’assistant public est monté par `AppLayout` sur les pages publiques. Il n’est pas superposé aux routes CRM/client ni au monde des mini-jeux autonome.

## IA

La route `POST /api/site-assistant/chat` utilise, dans cet ordre :

1. Vercel AI Gateway avec `AI_GATEWAY_API_KEY`;
2. Vercel AI Gateway avec `VERCEL_OIDC_TOKEN` sur les déploiements Vercel;
3. OpenAI directement avec `OPENAI_API_KEY`;
4. un guide de navigation déterministe si aucun fournisseur IA n’est disponible.

Le modèle du Gateway peut être remplacé avec `SITE_ASSISTANT_MODEL`. Le modèle OpenAI direct peut être remplacé avec `OPENAI_MODEL`.

## Limite de 20 commandes par jour

Chaque question soumise à `POST /api/site-assistant/chat` compte comme une commande. La limite est de **20 commandes par jour civil**, avec remise à zéro à **minuit dans le fuseau `America/Toronto`** (y compris les changements d’heure). La navigation par les raccourcis et le formulaire « Mon idée » ne consomment pas ce quota de questions.

Le serveur réserve une commande dans un compteur persistant avant tout appel au fournisseur IA. Plusieurs requêtes simultanées partagent le même compteur : seules les vingt premières réservations du jour peuvent réussir. Une commande réservée reste comptée même si le fournisseur échoue ensuite, afin qu’un échec ne permette pas de multiplier les appels facturables. Le repli de navigation déterministe suit la même limite. Si le stockage du compteur est indisponible, le serveur refuse la demande et n’appelle pas le fournisseur.

Le site possède déjà des comptes : poser une question exige donc une session existante vérifiée par le serveur. L’identité vient exclusivement de cette session; aucun identifiant ni compteur fourni par le navigateur ne décide du quota. Sans session, `GET` et `POST` renvoient HTTP `401` avec `code: "AUTH_REQUIRED"`. L’interface propose « Se connecter pour poser une question », via `/connexion?next=…` avec un retour local validé vers la page courante. Les pages publiques, les raccourcis et le formulaire d’idées restent disponibles sans connexion.

Effacer le stockage du navigateur, changer d’adresse IP ou de VPN, modifier le JavaScript ou appeler directement l’API ne supprime pas le compteur serveur associé au compte. Se déconnecter n’ouvre pas un quota anonyme. La règle limite les commandes **par compte**, et non par personne physique : des comptes distincts ont des quotas distincts. Il n’y a aucun mécanisme de quota anonyme par IP, car une IP peut être partagée ou changée et ne permet pas d’établir l’identité d’un utilisateur.

`GET /api/site-assistant/chat` retourne le compteur de l’identité courante sans consommer de commande. Les réponses utilisent `quota: { limit, remaining, resetAt, timeZone }`; `resetAt` est un instant ISO, et `timeZone` vaut `America/Toronto`. Le navigateur consulte ce statut à l’ouverture, au retour dans l’onglet, au changement de session et à l’heure de remise à zéro. Les cookies de session sont transmis automatiquement sur le même domaine. La règle et le nombre restant apparaissent dans l’interface.

Quand les vingt commandes sont épuisées, l’API renvoie HTTP `429` avec `code: "ASSISTANT_DAILY_LIMIT"` et le quota; aucun appel IA n’est effectué. Le champ et l’envoi sont désactivés, avec un message indiquant la reprise à minuit, heure de Toronto. Les raccourcis restent disponibles. La désactivation dans l’interface est un confort : le blocage obligatoire reste côté serveur. Les erreurs de l’API apparaissent clairement, sans être présentées comme une réponse réussie ni renvoyées comme historique IA.

Les requêtes de conversation sont limitées à huit messages récents, avec au plus 1 200 caractères par message et 16 384 octets UTF-8 pour le corps JSON. L’interface conserve la dernière question et réduit l’historique transmis si nécessaire. Le rendu des réponses reste du texte React, sans interprétation HTML.

## Idées d’amélioration

La route `POST /api/site-assistant/feedback` vérifie l’origine, borne le corps à 16 384 octets, valide les entrées, échappe le HTML et applique un compteur PostgreSQL persistant de cinq suggestions par heure. Sur Vercel, la clé utilise l’adresse IP fournie par `x-vercel-forwarded-for`, validée et hachée; les autres en-têtes de transfert ne sont pas acceptés. Hors Vercel en production, les visiteurs partagent une clé de secours restrictive jusqu’à configuration d’un proxy fiable. Une IP partagée partage ce quota, et changer réellement d’IP peut le renouveler; cette protection anti-spam ne prétend pas identifier une personne. Un stockage indisponible bloque l’envoi. Les idées sont envoyées avec le service Resend déjà utilisé par le projet.

Le destinataire est choisi dans cet ordre :

1. `SITE_FEEDBACK_EMAIL`;
2. `CRM_NOTIFICATION_EMAIL`;
3. `COMPANY_EMAIL`;
4. `BOOKING_EMAIL`;
5. l’adresse de notification NOWIS de repli.

Configurer `SITE_FEEDBACK_EMAIL` dans Vercel est la façon recommandée de choisir précisément la boîte qui reçoit les suggestions.

La conversation d’aide n’est pas jointe au courriel; seuls l’idée explicitement soumise, le courriel facultatif du visiteur, la page d’origine et des métadonnées techniques minimales sont transmis.
