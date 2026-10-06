# Stockage des documents privés

Les routes de documents vérifient la session actuelle, les permissions CRM ou le dossier Contact propriétaire et la visibilité du document. Les réponses qui présentent les documents enregistrés aux clients contiennent une URL de téléchargement authentifiée, sans clé S3 ni URL brute du fichier final. La préparation de l'upload fournit nécessairement une URL d'écriture et une clé temporaires. Les téléchargements clients sont servis avec `Content-Disposition: attachment`, `Cache-Control: private, no-store` et `X-Content-Type-Options: nosniff`.

## Mise en service

- Appliquer la migration qui crée `AuthGrant` avant d'activer les nouveaux uploads. La préparation et la finalisation refusent l'opération si cette persistance est indisponible.
- Configurer un secret privé d'au moins 32 octets. `FILE_UPLOAD_JWT_SECRET` est optionnel : à défaut, le serveur utilise `CLIENT_PORTAL_JWT_SECRET`, puis `JWT_SECRET`. Les valeurs de développement publiques et les secrets trop courts sont refusés en production. Ne jamais exposer ces variables sous un nom `NEXT_PUBLIC_*`.
- Accorder au rôle serveur uniquement les opérations S3 nécessaires sur les préfixes de documents : création de staging, lecture des métadonnées, copie conditionnelle, lecture et suppression. Une copie S3 requiert aussi les droits de lecture sur la source et d'écriture sur la destination. Vérifier les droits KMS correspondants si le bucket utilise SSE-KMS.
- Vérifier que les préfixes `client-files/` et `crm-files/` ne sont pas lisibles publiquement via la politique du bucket, une ACL ou un CDN. Le bucket peut aussi contenir de l'audio public : garder les droits publics limités aux préfixes publics prévus, sans rendre tous ses objets privés ou publics indistinctement.
- Limiter les origines CORS autorisées aux origines du site pour les uploads directs. CORS ne remplace ni la signature, ni les permissions du bucket, ni les contrôles serveur.

## Garanties du flux

La clé temporaire est générée par le serveur dans `client-files/<Contact>/staging/` ou `crm-files/<User>/staging/`. L'intention signée dure 30 minutes et lie l'identité à la clé, au nom, au type MIME et à la taille autorisés. Sa consommation en base est atomique et unique : une seconde finalisation ou deux finalisations simultanées ne créent pas deux documents.

Le serveur contrôle la taille et le type MIME déclarés par S3, puis copie la version contrôlée vers une nouvelle clé finale avec une condition sur son ETag. La clé finale n'est jamais présignée pour une écriture. Réutiliser l'URL d'upload temporaire ne modifie donc pas le document enregistré. Si la version a changé, la copie échoue avant tout enregistrement. Ces vérifications ne constituent pas une analyse antivirus ou une inspection du contenu du fichier.

Les suppressions clients utilisent uniquement la clé du document effectivement retrouvé dans leur dossier. Les documents livrés par un membre CRM, rattachés à une facture ou à un devis ne sont pas supprimables depuis le compte client.

## Entretien et limites à vérifier

Les nettoyages après erreur sont limités aux clés créées par la requête et restent au mieux : une panne S3 ou base peut laisser un objet sans document. Prévoir une règle de cycle de vie sur les seuls préfixes `staging/` et un traitement contrôlé des objets finaux orphelins. Purger périodiquement les `AuthGrant` expirés selon la politique de rétention définie pour les autres jetons.

Les fichiers historiques gardent leur autorisation de dossier enregistrée. Un ancien enregistrement sans provenance fiable ne devient pas fiable par ce correctif : sa propriété doit être revue avant toute migration ou suppression. L'ancien portail CRM peut encore utiliser des URL brutes de documents historiques ; vérifier leur confidentialité et migrer ces accès avant d'affirmer que toutes les anciennes URL ont été retirées.

Les tests locaux simulent S3, la base et les sessions. Ils couvrent l'accès entre dossiers, la finalisation concurrente, le rejeu, la copie conditionnelle, les erreurs de copie et les en-têtes de téléchargement. Ils ne valident pas la politique effective du bucket, les ACL, le CDN, les droits IAM/KMS, le comportement réel des ETags ni la configuration CORS en production. Ces points exigent une vérification de configuration AWS puis un essai contrôlé sur un environnement de test.
