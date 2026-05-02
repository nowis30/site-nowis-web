# Messagerie interne du portail client

La messagerie interne du portail client est desactivee.

- Les anciennes routes frontend messages affichent maintenant une page de transition vers le courriel.
- Les routes API de messagerie retournent 410 Gone.
- Le modele Prisma Message est conserve temporairement pour eviter une migration destructive prematuree.
- Les tables Message sont conservees temporairement pour permettre une validation production sereine.

Une migration de suppression pourra etre preparee plus tard, apres validation production, avec un plan non destructif puis une suppression definitive dans une phase separee.