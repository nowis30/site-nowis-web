# Assistant de site NOWIS

L’assistant public est monté par `AppLayout` sur les pages publiques. Il n’est pas superposé aux routes CRM/client ni au monde des mini-jeux autonome.

## IA

La route `POST /api/site-assistant/chat` utilise, dans cet ordre :

1. Vercel AI Gateway avec `AI_GATEWAY_API_KEY`;
2. Vercel AI Gateway avec `VERCEL_OIDC_TOKEN` sur les déploiements Vercel;
3. OpenAI directement avec `OPENAI_API_KEY`;
4. un guide de navigation déterministe si aucun fournisseur IA n’est disponible.

Le modèle du Gateway peut être remplacé avec `SITE_ASSISTANT_MODEL`. Le modèle OpenAI direct peut être remplacé avec `OPENAI_MODEL`.

## Idées d’amélioration

La route `POST /api/site-assistant/feedback` valide les entrées, utilise un champ piège anti-robot et une limite légère par adresse IP. Les idées sont envoyées avec le service Resend déjà utilisé par le projet.

Le destinataire est choisi dans cet ordre :

1. `SITE_FEEDBACK_EMAIL`;
2. `CRM_NOTIFICATION_EMAIL`;
3. `COMPANY_EMAIL`;
4. `BOOKING_EMAIL`;
5. l’adresse de notification NOWIS de repli.

Configurer `SITE_FEEDBACK_EMAIL` dans Vercel est la façon recommandée de choisir précisément la boîte qui reçoit les suggestions.

La conversation d’aide n’est pas jointe au courriel; seuls l’idée explicitement soumise, le courriel facultatif du visiteur, la page d’origine et des métadonnées techniques minimales sont transmis.
