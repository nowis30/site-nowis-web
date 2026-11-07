# Assistant de site NOWIS

L’assistant public est monté par `AppLayout` sur les pages publiques. Il n’est pas superposé aux routes CRM/client ni au monde des mini-jeux autonome.

## IA

La route POST /api/site-assistant/chat utilise uniquement le travailleur Qwen local NOWIS via une file privée. Configurer NOWIS_LOCAL_QUEUE_URL et NOWIS_LOCAL_QUEUE_SERVICE_KEY dans les secrets serveur. Les anciennes clés OpenAI, Gateway et OIDC ne sont pas utilisées. L'ordinateur n'est pas exposé à Internet. Si le travailleur est absent, le guide de navigation déterministe reste disponible. Les quotas et contrôles d'identité sont conservés.

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

Pour isoler les installations, utiliser une file et une identité de travailleur propres à chaque application, ou une identité serveur limitée à ses seules demandes dans un relais dédié. Ne pas copier la clé générale d’un autre CRM. Les travailleurs acceptent --data-dir et --port-verrou distincts ; --installer-cle --url configure le projet cible de leur propre identité.
