# Livraison et reprise du durcissement de sécurité

État du 6 octobre 2026 : la publication et l’exécution du plan de déploiement sont autorisées par l’utilisateur. La correction ciblée de l’adresse du compte ADMIN a également reçu son accord spécifique. La migration et la publication de production restent à exécuter et à vérifier ; ce document ne les annonce pas réalisées.

Les contrôles ont utilisé une CI Linux, des bases PostgreSQL isolées et des essais fournisseurs explicitement autorisés. Un email de test a été reçu et le test S3 a utilisé exclusivement un préfixe réservé ensuite nettoyé. Aucun paiement de production, document client réel ou changement global de politique S3 n’a servi de test. Les clés, connexions et détails de récupération ADMIN restent hors du dépôt public.

## Preuves par révision

La [CI GitHub 37416317331](https://github.com/nowis30/site-nowis-web/actions/runs/37416317331), sur `9718ec85`, a réussi toutes ses étapes. La suite utilise **Node 24.21.0 et npm 11.21.0**, le verrou du dépôt et une base PostgreSQL CI jetable. Le HEAD `58398e7` a ensuite intégré le dernier main `6703adf`, comprenant les ajustements d’API et de conclusion tarot. Le correctif astronomique final a été vérifié localement ; une nouvelle CI doit encore être rattachée à sa révision avant livraison.

| Contrôle | Preuve actuelle et portée |
| --- | --- |
| `npm test` sur `9718ec85` | **280 tests réussis**, zéro échec et zéro test sauté. Groupes des logs : 55 + 125 + 11 + 4 + 3 + 7 + 16 + 9 + 13 + 13 + 9 + 6 + 9. |
| `npm run test:public-media` sur `9718ec85` | **82 tests réussis** (3 + 79), zéro échec ou test sauté, plus les assertions du parcours public. |
| Types, Prisma et lint sur `9718ec85` | Génération du client, migrations CI et contrôle de types réussis. Lint strict : **zéro erreur et zéro avertissement**. |
| Audit complet sur `9718ec85` | `npm 11.21.0 audit --audit-level=low` : **zéro vulnérabilité signalée**, dépendances de développement comprises. Les anciennes sept alertes ne sont plus une exception acceptée. Voir [dependency-security.md](./dependency-security.md). |
| Build CI sur `9718ec85` | Réussi, **239 pages statiques**. Deux diagnostics `TP1002` de l’import astronomique restent visibles dans ces logs. Cette ancienne preuve ne doit pas être présentée comme un build à zéro avertissement. |
| Correctif final local après intégration de main | **79 tests** du moteur et des clients réussis ; types et lint strict à zéro erreur/avertissement ; build de **239 pages sans avertissement**. Nouvelle CI de cette révision encore attendue. |
| Build Vercel natif sur `6445e9f` | État `READY` et absence d’avertissement observés sur cette révision antérieure. Cette preuve ne remplace pas le build de la révision finale. |
| Domaine actif avant livraison | `6703adf` est `READY` sur le domaine actuel ; ce déploiement précède le durcissement décrit ici. L’attribution automatique des domaines de production est désactivée, confirmée aussi dans l’interface Vercel. |
| PostgreSQL réel en CI | Deux scénarios Prisma réussis : révocations, échange OTP concurrent et 50 demandes donnant exactement 20 succès, 30 refus et 20 appels IA simulés. |
| Render preview réel | Base distincte initialement vide, 39 migrations atomiques appliquées : **43 tables**, quatre colonnes auth, deux triggers, 39 historiques terminés, zéro incomplet. Aucun seed ni copie de données réelles. |
| Sessions et quota sur Render preview | Révocation sur déconnexion, mot de passe, rôle, désactivation et email ; **un gagnant sur 20 échanges OTP concurrents** ; **20 succès et 30 refus sur 50 commandes** ; quota conservé après reconnexion Prisma. Données synthétiques supprimées et nettoyage vérifié. |
| Fournisseurs natifs Vercel | Préflight exécuté avec les secrets déjà présents dans l’environnement natif. Essai S3 réservé réussi et nettoyé ; email de test reçu, confirmé par le destinataire. Les limites ci-dessous demeurent. |
| Navigateur local | Radio et album avec lecture réelle, continuité audio, mobile, accès public, refus IA sans compte et confirmations de vérification email contrôlés. Les parcours publics de production devront être vérifiés après livraison. |

Les preuves de CI, de preview et de fournisseurs sont distinctes. Un build `READY`, un transport email accepté ou une policy sans alerte ne constitue pas une validation complète de l’application.

## Base de production et sauvegarde

La base de production a été comparée en lecture seule au schéma et aux fichiers Prisma. Le checkout possède 39 migrations : 38 historiques et `20261006010000_persistent_auth_grants`. L’historique de production contient **40 migrations terminées, 38 anciennes tentatives rolled back et zéro tentative incomplète**. Deux anciens historiques résolus hors de cette arborescence sont conservés. Les écarts de checksum explicables par LF/CRLF ne sont pas des modifications de contenu et ne doivent pas faire réécrire les sommes enregistrées.

La seule migration nouvelle nécessaire est **`20261006010000_persistent_auth_grants`**, checksum LF `d734917b51e396496fc8f6df022b8e19a262fbaf059d073133bc77e60d92b040`. Aucun drift bloquant de types, enums, index ou contraintes existants n’a été trouvé. Les différences historiques de valeurs par défaut et de nullabilité prévues par les migrations sont préservées.

La sauvegarde Render affichée pour le **6 octobre à 03:49 UTC**, archive `.dir.tar.gz`, est disponible pendant sept jours. Une restauration PITR au point **03:37:07 UTC** a été testée dans une base isolée PostgreSQL 18.6 : 42 tables, 20 utilisateurs, 21 dossiers, 16 factures et 40 historiques réussis. Cette base temporaire a ensuite été supprimée. Il s’agit d’une preuve de restauration PITR ; ne pas la confondre avec un essai de restauration du fichier d’archive lui-même.

La dernière lecture de production confirme également 20 utilisateurs, 21 dossiers, 16 factures, 42 tables, 40 historiques réussis et zéro historique incomplet. Les préconditions de correction ADMIN ont été revues et approuvées : un compte cible à corriger et aucune collision avec l’adresse de destination. Conserver les références privées et confirmer la fraîcheur du point restaurable avant application. Aucune restauration n’a remplacé la base active ou déplacé des fichiers S3.

Le SQL de livraison applique uniquement la nouvelle migration et son nouvel historique Prisma dans une transaction. Ses gardes imposent la base et le rôle attendus, les 78 historiques existants, l’absence complète du nouveau schéma auth et le checksum exact. Attente de verrou limitée à cinq secondes, commandes à soixante secondes. Les contrôles pré/post exigent les mêmes nombres de comptes, dossiers et factures ainsi qu’un historique ancien inchangé. Après succès : 41 historiques terminés, 38 rolled back et zéro incomplet.

Sept tests PostgreSQL locaux du script de production passent, dont mauvaise base, mauvais rôle, historique incomplet, schéma partiel, rejeu refusé et annulation intégrale après un échec forcé suivant les DDL et l’invalidation des resets. Les scripts, manifestes et données d’approbation exactes restent dans le dossier privé de livraison.

Ne rejouer aucune ancienne migration de logement, ne lancer ni seed, ni `migrate reset`, ni réparation automatique, ni synchronisation du schéma pour faire disparaître un écart. Une garde qui échoue arrête la livraison et demande une nouvelle comparaison en lecture seule.

## Comptes, MFA et limite IA

La migration ajoute les versions d’authentification et les grants persistants. À l’activation du nouveau code, les anciens JWT, liens de connexion et intentions sans grant seront refusés : **reconnexion nécessaire pour tous les comptes**. Les liens de reset enregistrés avant la migration sont supprimés ; il faut en demander un nouveau.

Les comptes `ADMIN` et `ASSISTANT` provisionnés sont marqués email-vérifiés. Leur connexion de production exige toujours un code MFA : SMS si les quatre paramètres nécessaires sont configurés, sinon email vers l’adresse staff persistée en base. Un échec de transport refuse la session. L’OTP est borné à dix minutes, cinq tentatives et un échange atomique. Le mot de passe seul n’est permis qu’en développement explicite.

La correction autorisée de l’email ADMIN est une opération séparée, ciblée et conditionnée à la migration terminée. Elle conserve le compte et le mot de passe ; le trigger augmente sa version et révoque l’ancienne identité. Vérifier ses preuves de préservation et ensuite la connexion MFA avec le titulaire. Le mot de passe utilisateur et son véritable OTP n’étant pas connus, **aucune connexion MFA active n’est déclarée validée**. La réception du message de test confirme ce transport précis, pas chaque futur OTP. L’email MFA reste moins résistant qu’un facteur indépendant contre la compromission de la boîte email.

Les comptes portail historiques doivent prouver leur email. La reprise d’un compte non vérifié invalide les anciens mots de passe, sessions, resets et liaisons OAuth associées. Les anciens comptes Google sans liaison persistante doivent établir une session prouvée avant une liaison autorisée. Il n’y a aucun repli sans table OAuth ni accès aux comptes désactivés ou dossiers supprimés. Les comptes JSON historiques ne permettent plus une connexion de production avec un hash publié : leur reprise exige un stockage privé et une preuve email.

La déconnexion révoque le grant courant. Les modifications sensibles de mot de passe, email, rôle, activation, rattachement ou preuve email augmentent la version via les triggers. Une panne de base refuse l’accès au lieu d’accepter un JWT seul.

Chat, vision tarot et conclusion tarot partagent **20 commandes par utilisateur authentifié et par jour civil à Toronto**, avec remise à zéro à minuit. Le compteur est persistant et réservé côté serveur avant l’appel fournisseur. Les échecs fournisseur après réservation restent comptés. Changer d’IP, de navigateur ou de cookie ne réinitialise pas ce quota.

## Fournisseurs et limites restantes

Le préflight natif Vercel vérifie la configuration et les métadonnées accessibles sans exporter de secret. L’essai S3 autorisé valide les opérations prévues sur son préfixe synthétique, puis leur nettoyage. Il ne prouve pas les ACL de chaque objet historique, tous les chemins CDN, les access points, le Block Public Access de l’organisation, la configuration CORS ni toutes les possibilités IAM/KMS. Certaines lectures administratives peuvent rester `not_established` faute de droits ; ne pas augmenter les permissions uniquement pour obtenir un contrôle vert. Voir [provider-preflight.md](./provider-preflight.md) et [file-storage-security.md](./file-storage-security.md).

Treize variables serveur ont été revues pour la cible production uniquement. Sept classifications ont été renforcées de `encrypted` vers `sensitive` en préservant leurs valeurs ; les six autres étaient déjà `secret` ou `sensitive`. Aucun secret n’a été transmis au poste local. Le préflight natif final doit confirmer que leurs valeurs effectives restent utilisables après ce changement de métadonnées.

Les fichiers historiques sans provenance fiable restent à examiner. Ne pas privatiser globalement un bucket contenant aussi l’audio public. Les validations de type et taille ne constituent pas un antivirus. Les nettoyages de staging ou objets orphelins restent bornés et doivent avoir une politique de rétention.

Le message de test reçu utilisait un code décoratif sans grant, session ou droit. Sa commande ponctuelle n’est pas conservée dans le build normal. Aucun autre envoi, remboursement, capture ou transaction PayPal de production n’est autorisé par ce test. Les callbacks Google, signatures Calendly et webhooks PayPal restent couverts par les tests de code ; un contrôle fournisseur complet doit être réalisé avec des comptes ou services sandbox dédiés.

La revue confirme la protection de plateforme Vercel. La configuration des règles personnalisées n’a pas été établie. Toute nouvelle règle doit préserver les callbacks, webhooks, téléchargements authentifiés et lectures audio, puis être testée contre les faux positifs. Aucune protection personnalisée non observée ne doit être annoncée.

La protection SSO Vercel est activée, avec `deploymentType=all_except_custom_domains`, confirmé par l’API : les anciennes URL immuables restent protégées par SSO, tandis que les domaines personnalisés en service restent publics. Cette protection de déploiement ne remplace pas l’authentification de l’application.

## Séquence restante de livraison

1. Fixer la révision finale du correctif astronomique déjà vérifié localement et joindre sa nouvelle CI, ses types, son lint, son audit et son build. Conserver la séparation des preuves par révision. Vérifier [production-env.md](./production-env.md) et retirer toutes les commandes ponctuelles de test du build normal.
2. Confirmer la sauvegarde restaurable, son point temporel, la cible de production et l’historique lu à nouveau. Appliquer uniquement le SQL auth approuvé. Toute erreur arrête la procédure avant promotion ; après une erreur de transport, lire l’état avant de décider, sans retry aveugle.
3. Exécuter séparément la correction email ADMIN autorisée, avec ses gardes exactes et ses contrôles de préservation. Ne modifier aucun mot de passe ni ajouter un bypass de connexion pour la tester.
4. Livrer la révision approuvée et attendre Vercel `READY`. Vérifier ensuite le domaine public : HTTP, accueil, radio et album avec lecture réelle, connexion et code MFA, refus sans compte, compteur et message de quota. Utiliser uniquement des comptes synthétiques dédiés pour les contrôles sensibles.
5. Conserver les preuves de migration, correction ADMIN, révision active et validation publique. Communiquer la reconnexion nécessaire et la règle 20/jour. Surveiller erreurs DB/S3/email, refus d’authentification et 429 attendus sans journaliser jetons, secrets ou documents.
6. Révoquer le client Render temporaire autorisé et retirer uniquement les bases, déploiements et objets synthétiques prévus au nettoyage. Vérifier leur suppression sans toucher les sauvegardes de reprise ni la production.

## Retour arrière

Avant écriture de production, conserver le déploiement actif reste possible, en documentant les risques que son ancien code laisse ouverts.

Après migration, **ne pas promouvoir automatiquement l’ancien code** : il peut réaccepter les JWT stateless, ignorer les versions/grants et réintroduire les failles. Les resets supprimés, sessions révoquées et mots de passe invalidés lors d’adoptions ne sont pas restaurés par un simple retour de code. Ne diminuer aucune version d’authentification.

Privilégier un correctif compatible avec le nouveau schéma. En cas d’incident grave, suspendre les fonctions concernées puis préparer une restauration coordonnée avec un point temporel explicite et un inventaire des écritures postérieures. Une restauration DB ne restaure pas S3, un paiement ou un email envoyé. Vérifier les autorisations et révocations avant réouverture ; ne supprimer aucune migration, aucun trigger ou grant pour masquer une erreur.

## Suivi

Planifier le nettoyage borné des staging et grants expirés, la revue des anciennes URL privées et la maintenance des adaptateurs de dépendances. L’audit à zéro décrit le verrou et les avis connus au moment du contrôle ; il ne garantit pas l’absence de vulnérabilité future. Conserver séparément corrections du code, preuves d’infrastructure et limites non établies.
