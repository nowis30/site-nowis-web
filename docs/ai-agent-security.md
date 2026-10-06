# Protection de l’agent NOWIS — 6 octobre 2026

Ces protections réduisent l’impact d’attaques connues. Elles ne garantissent ni une invulnérabilité ni la détection de toutes les injections de prompt.

## Périmètre et contrôles

Les trois appels payants (assistant du site, vision du tarot et conclusion) exigent une session vérifiée et partagent la limite durable existante de 20 commandes par compte et par jour civil de Toronto. Deux compteurs persistants supplémentaires utilisent la table existante `api_rate_limits` : 5 réservations par compte et par minute, et 500 réservations collectives par jour UTC pour les trois fonctions. Les fenêtres minute et UTC sont fixes : elles ne constituent pas une limitation glissante. `AI_GLOBAL_DAILY_COMMAND_LIMIT` permet de modifier le plafond collectif (entier de 1 à 100000). Une configuration invalide ou une panne du stockage bloque les appels au fournisseur.

Le contrôle de rafale précède le quota personnel; le plafond collectif le suit. Une réservation personnelle reste consommée si le plafond collectif, le fournisseur ou le filtre de réponse bloque ensuite la demande. Le compteur collectif couvre les tentatives autorisées, pas les dollars ni les réponses réellement abouties. Aucun changement de schéma et aucune nouvelle dépendance ne sont nécessaires.

Le fournisseur reçoit une instruction serveur et un seul message utilisateur. L’historique envoyé par le navigateur, même étiqueté « Assistant », reste une donnée non fiable. Aucun outil n’est configuré (`tools: []`, `tool_choice: none`) et aucune sortie d’appel d’outil ou réponse mixte de refus n’est acceptée. L’agent n’a pas accès aux bases de données, fichiers, paiements, navigateur ou exécution de commandes.

Les endpoints de fournisseur sont fixes. Les redirections HTTP sont interdites, les requêtes ne sont pas mises en cache et `store: false` est envoyé. La lecture JSON vérifie le type de contenu, le UTF-8, les octets effectivement reçus (128 Kio maximum, indépendamment de Content-Length) et le délai, y compris après réception des en-têtes. Les limites de texte et de mots restent propres à chaque fonction.

Les sorties contenant du HTML, des schémas d’URL externes, des contrôles invisibles dangereux ou certaines formes reconnaissables de clés sont refusées. Le guide vérifie les chemins publics détectés; un refus entraîne les raccourcis locaux. Le tarot ne présente pas une réponse rejetée comme une vision IA. React affiche du texte échappé, sans interpréter de HTML. Les clés connues collées dans le chat sont refusées avant toute réservation; les mêmes signatures présentes dans un prompt symbolique empêchent son envoi au fournisseur. Ce contrôle ne reconnaît pas tous les secrets, leur encodage ou toutes les données personnelles.

## Couverture des familles d’attaque

| Famille | Protection / limite |
| --- | --- |
| Injection directe, jailbreak, historique falsifié, faux rôle système | Instructions séparées; aucun outil; sorties filtrées. La conformité sémantique du modèle n’est pas garantie. |
| Injection indirecte, contenu récupéré malveillant | Aucun navigateur, RAG ou ingestion de documents externes dans ces trois fonctions. Réévaluer avant d’en ajouter. |
| Exfiltration et divulgation de secrets | Aucun secret dans le contexte; clés uniquement dans les en-têtes; signatures de clés et URL rejetées; logs techniques limités. Une réponse textuelle trompeuse reste possible. |
| SSRF, exécution de code, détournement d’outil, action non autorisée | Endpoints fixes, redirections refusées, outils absents; appel d’outil du fournisseur rejeté. |
| XSS et traitement dangereux des réponses | Texte échappé côté interface; pas d’exécution de HTML, commande ou SQL issu du modèle; contrôle supplémentaire des sorties. |
| Usurpation, CSRF, accès anonyme | Contrôles de session serveur, d’origine et de corps existants maintenus; quota lié à l’identité authentifiée. |
| Consommation non bornée, comptes multiples, réponse géante ou lente | Limites de compte, rafale, plafond collectif, tokens, taille et délais. Le plafond collectif réduit l’impact de comptes multiples sans empêcher leur création. |
| Empoisonnement des données, vecteurs, chaîne d’approvisionnement | Corpus serveur connu, pas d’entraînement ni base vectorielle modifiable par le visiteur; audit des dépendances. L’infrastructure du fournisseur reste hors de cet audit. |
| Désinformation et surconfiance | Guide limité aux pages connues; lectures symboliques explicitement incertaines. Les filtres ne prouvent pas la vérité d’un texte. |
| DDoS réseau, compromission de compte d’hébergement, IAM, sauvegardes | Non résolus par ces filtres. Les règles WAF, alertes et sauvegardes effectives nécessitent une vérification séparée. |

Références : [OWASP Top 10 LLM](https://genai.owasp.org/initiatives/top-10-for-llm-and-genai/), [conception contre l’injection de prompt](https://openai.com/index/designing-agents-to-resist-prompt-injection/).

## Validation

Les tests adverses utilisent des fournisseurs simulés : faux rôles, clés, HTML, liens, sorties d’outils, refus mixtes, corps surdimensionnés avec taille déclarée fausse ou absente, flux bloqué, indisponibilité des compteurs et plafonds. Les tests existants de concurrence sur PostgreSQL embarqué et d’isolation des comptes sont conservés. Ils ne constituent pas un test d’intrusion illimité ni une validation des paramètres privés du fournisseur. `store: false` ne signifie pas absence de tout journal chez le fournisseur.
