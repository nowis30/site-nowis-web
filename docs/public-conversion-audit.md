# Audit public — version de travail du 28 septembre 2026

Cette branche propose des corrections. Ne pas la considérer comme déployée en production sans validation explicite du déploiement.

## Modifications
- Accueil : titre et deux parcours principaux avant la vidéo; pas de lecture automatique; autres activités plus bas. Seuils 768 et 1200 px conservés.
- Contact, première demande d’atelier et chanson : formulaire public séparé de l’API privée. Les demandes et tâches de suivi sont sauvegardées sans créer, associer ou modifier un compte. Aucune commande ni aucun paiement n’est créé.
- Nouvelle API : origine vérifiée, corps borné à 16 Ko, validation stricte, honeypot, quotas persistants global/IP/courriel, réponse sans identifiant de contact. Notifications internes seulement si SMTP configuré. Le courriel déclaré n’est pas considéré vérifié.
- Cookies : choix explicites par catégorie, Google bloqué avant décision; ancienne simple prise de connaissance non reprise comme consentement; préférences modifiables et retrait avec rechargement. Assistant masqué pendant le bandeau.
- Un seul main sur les trois pages de demande corrigées.
- Repères de prix pris dans la source existante; aucun nouveau montant, délai ou nombre de révisions inventé.

## Validation
Le workflow ajouté n’utilise aucun secret ni base de production. Il prépare un Postgres local jetable, vérifie les types, les gardes et les parcours à 390, 768, 900, 1199, 1200 et 1440 px. Google est simulé lors du test d’acceptation. Les tests d’envoi sont interdits si la base ne correspond pas exactement à la base locale de QA.

La compilation Vercel et les résultats du workflow doivent être lus séparément. Une compilation réussie n’est pas une validation visuelle.

## Points encore à confirmer / hors de cette livraison
- Atelier 500 $ : nombre de participants inclus, raison du même prix pour les durées, suppléments et conditions du 10 $/personne.
- Chanson souvenir 30 $ : durée, formats, révisions, délai; distinguer précisément les niveaux sur mesure.
- Garantie/remboursement : conditions à faire valider par l’entreprise; texte contractuel non réécrit.
- Vrais sous-titres de la vidéo : transcription à obtenir, pas de piste fictive ajoutée.
- Témoignages et exemples contextualisés : uniquement avec sources et autorisations.
- Les anciens appels Google présents dans d’autres composants publics non modifiés et les textes secondaires restent à harmoniser.
- La page Tarifs et les autres pages peuvent encore contenir des main imbriqués et des contenus à réviser.
- Vérification de toutes les intégrations tierces, audit de sécurité global, paiement, accès privés et conformité juridique non couverts.

## Avant fusion
Vérifier le rendu réel et la réception dans Soumissions et Tâches du CRM en environnement de test. Confirmer les termes commerciaux. La branche ne remplace ni les comptes clients ni les systèmes de paiement.
