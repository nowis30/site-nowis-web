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
- Témoignages clients : textes et autorisations à fournir. Les sélections de chansons ne sont pas présentées comme des avis clients.
- Vérification de toutes les intégrations tierces, audit de sécurité global, paiement, accès privés et conformité juridique non couverts.

## Avant fusion
Vérifier le rendu réel et la réception dans Soumissions et Tâches du CRM en environnement de test. Confirmer les termes commerciaux. La branche ne remplace ni les comptes clients ni les systèmes de paiement.

## Deuxième lot : catalogue, médias et corrections techniques
- Vidéo : affiche WebP de 23 236 octets; chargement au clic; version H.264/AAC 540 × 960 de 7 770 337 octets contre 29 931 084 octets (74 % de réduction). Original conservé. Commande : `ffmpeg -i ORIGINAL -vf scale=540:-2 -c:v libx264 -preset fast -crf 28 -c:a aac -b:a 96k -movflags +faststart SORTIE`.
- Canonical propres à `/portfolio` et `/shop` avec Open Graph cohérent.
- Appels commerciaux Google remplacés par les demandes publiques, y compris les anciennes valeurs CMS de PageHero et du CTA final chanson. Connexion du portail conservée.
- Jeu : initialisation depuis l’effet même si le document de l’iframe est déjà chargé avant l’hydratation; initialisation unique par document; délai maximal et bouton de nouvelle tentative.
- Bibliothèque : recherche insensible aux accents/casse, filtre de plateforme, pagination par 12 et état vide explicite. Seuls les champs utilisés par les cartes sont transmis au composant client.
- Accueil : accès directs aux dix dernières chansons et aux dix plus populaires sur YouTube.
- Tarifs : contrastes des montants corrigés, conditions à confirmer placées près des offres, distinction entre forfait atelier et formule par personne. Montants inchangés.
- Suppression des textes de maintenance visibles et de plusieurs main imbriqués; lien d’évitement du menu ajouté.
- Tests ajoutés : téléchargement vidéo au clic, recherche/filtre/pagination, canonical, parcours commerciaux, jeu avec hydratation retardée et retour de navigation.
- Le navigateur de QA utilise Chrome pour les codecs H.264/AAC (voir https://playwright.dev/docs/browsers). La lecture réelle et une nouvelle tentative après erreur réseau sont contrôlées.

## Sélections musicales demandées
- Deux sélections de dix chansons sur `/musique`, avec rangs et nombres de vues dans la sélection populaire. Le catalogue complet reste accessible via une recherche dépliable.
- Source : onglet Vidéos de https://www.youtube.com/@nowis30/videos, tris « Les plus récentes » et « Populaires », vérifiés le 28 septembre 2026. La publicité `pub atelier` est exclue du classement musical. Les Shorts ne font pas partie de ces listes.
- Les dates exactes des dix dernières viennent du flux public https://www.youtube.com/feeds/videos.xml?channel_id=UCFx4xRldiLu_PIbMoKFuWNw. Aucune date approximative n’est inventée pour les anciens titres absents du catalogue.
- Quatorze fiches ajoutées au catalogue existant; les anciens liens restent disponibles. Les sélections et les compteurs sont un instantané daté dans `data/youtube-selections.json`, sans promesse d’actualisation automatique. À actualiser ensemble après vérification YouTube.
- La validation interdit les sélections incomplètes ou les liens perdus lors de la déduplication du catalogue.
