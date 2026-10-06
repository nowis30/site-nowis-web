# Livraison et retour arrière du durcissement de sécurité

Cette procédure prépare une livraison contrôlée. Le travail d'audit et les tests locaux n'ont appliqué aucune migration à production, envoyé aucun code de connexion réel, écrit dans S3 ou PayPal ni publié les changements sur `nowis.store`. Une publication, une promotion Vercel et toute modification de production exigent l'accord explicite de l'utilisateur sur le résultat préparé.

## Dossier à préparer avant l'accord de publication

- Fixer la révision à livrer, conserver le verrou npm et le rapport privé d'audit. Ne pas publier de secrets ni de scénario d'exploitation détaillé dans un dépôt public.
- Compléter les résultats ci-dessous sur cette révision exacte. Les tests utilisent des services simulés et une base PostgreSQL isolée ; distinguer clairement ce qui a été vérifié localement des contrôles de fournisseurs réels.
- Vérifier les variables et les exigences de [production-env.md](./production-env.md), sans afficher leurs valeurs.
- Définir la fenêtre de maintenance, les personnes responsables de la base et de la validation, le point d'arrêt en cas d'échec et une sauvegarde restaurable avec son heure. Prévoir une communication de reconnexion des comptes.

| Validation de la révision finale | Résultat à joindre avant livraison |
| --- | --- |
| Tests serveur de sécurité et règles métier | 230 tests `npm test` réussis, aucun échec ou test sauté. 47 tests audio/tarot et assertions du parcours public supplémentaires passent. |
| Tests PostgreSQL isolés : migrations, grants, versions de comptes, concurrence des quotas | 39 migrations isolées et leurs triggers passent; deux scénarios Prisma TCP réels passent, dont 50 demandes / 20 succès / 30 refus. Aucune base de production utilisée. |
| TypeScript, lint, schéma/génération Prisma, build | Types, schéma/génération, lint et build production réussis. Lint : 0 erreur / 36 avertissements; build : 239 pages et deux avertissements astronomiques préexistants. |
| Audit npm de production et audit complet | Production : 0 alerte. Audit complet : 7 alertes élevées de développement, exception dans [dependency-security.md](./dependency-security.md). |
| Parcours navigateur desktop/mobile, radio/album, connexion, chat/tarot et refus sans session | Navigateur local desktop/mobile réussi : lecture audio réelle, continuité radio, album, tarot local, refus IA sans compte, accès/confirmation email. Connexions actives et fournisseurs : tests simulés ou PostgreSQL isolé, aucun envoi réel. |
| Fournisseurs et configuration effective | Non validés par les tests simulés : DB de preview distincte, Resend/SMS, AWS, callback OAuth, Calendly, PayPal et règles personnalisées du pare-feu. |

## Préconditions bloquantes

1. **Base isolée et sauvegardée.** La preview utilise une base distincte de production. Faire une sauvegarde cohérente de la base de production et vérifier son mode de restauration avant la première écriture de livraison. Conserver aussi l'état des variables, la révision active et les références des objets fichiers, sans exporter de secret dans les rapports.
2. **Historique Prisma revu.** Le checkout contient 39 fichiers de migration : 38 historiques et `20261006010000_persistent_auth_grants`. Comparer cet historique aux migrations réellement appliquées. Lire chaque migration non appliquée ; certaines anciennes migrations de logement sont destructives. Ne pas appliquer toute la chaîne automatiquement pour résoudre un décalage ou une table manquante. Toute divergence demande une décision de migration distincte.
3. **Envoi de connexion opérationnel.** Les variables Twilio/SMS étaient absentes lors de la revue : vérifier la livraison du code CRM par Resend vers une adresse staff persistée et accessible, et l'autorisation du domaine expéditeur. Un échec d'envoi doit refuser la session ; ne jamais activer une connexion CRM par mot de passe seul en production pour contourner cette précondition.
4. **Secrets privés suffisants.** Vérifier sans les imprimer les clés de signature retenues et la clé de chiffrement calendrier : au moins 32 octets, privées, non issues des exemples publics. Préserver les clés compatibles avec les données et liens déjà émis, sauf rotation explicitement préparée.
5. **Fichiers et autorisations.** Vérifier IAM/KMS, ACL, CORS, politique S3 et CDN par préfixe. Préserver l'audio et les jeux publics. Une URL privée encore publique ne devient pas confidentielle grâce aux seuls contrôles du serveur. Préparer la revue des propriétaires et URL historiques plutôt qu'une suppression ou privatisation globale.

## Impacts attendus sur les comptes et liens

La migration ajoute `authVersion` aux utilisateurs/contacts, `emailVerifiedAt` aux utilisateurs et les grants persistants. Les anciens jetons de session, liens de connexion et intentions sans grant ne sont plus acceptés : tous les comptes doivent se reconnecter. Les liens de réinitialisation de mot de passe antérieurs sont supprimés par la migration et doivent être redemandés.

Les comptes staff `ADMIN` et `ASSISTANT` sont marqués comme provisionnés par un administrateur lors de la migration ; vérifier leur adresse et leur statut avant livraison. Cela ne désactive pas le code OTP de production. Les comptes portail historiques ne reçoivent pas automatiquement une preuve de courriel. Leur reprise nécessite un lien sécurisé, une vérification/réinitialisation ou le parcours Google vérifié autorisé par le serveur. L'adoption d'un ancien compte non vérifié invalide son ancien mot de passe, ses anciennes sessions, ses anciens liens de reset et ses liaisons OAuth anciennes ; prévoir l'aide pour définir ensuite un mot de passe personnel si souhaité.

La table OAuth doit exister. Les anciens comptes Google sans liaison persistée ne bénéficient plus d'une liaison automatique dégradée par courriel : établir d'abord une session prouvée pour le compte concerné puis suivre la liaison prévue. Les comptes désactivés ou contacts supprimés ne peuvent pas reprendre l'accès par un autre canal.

La déconnexion révoque le grant courant. Une modification sensible en base (mot de passe, courriel, rôle, activation, rattachement ou preuve de courriel) fait évoluer la version de compte et invalide les anciennes sessions. Ne pas supprimer ces triggers pour rétablir un ancien comportement.

Le quota IA est partagé entre chat, vision tarot et conclusion tarot : **20 commandes par compte et par jour civil à Toronto**, remise à zéro à minuit. Les erreurs fournisseurs après réservation restent comptées. Il faut informer les utilisateurs de la connexion nécessaire et de cette limite ; changer d'IP ou effacer le navigateur ne réinitialise pas le compteur.

## Séquence de livraison après accord explicite

1. Créer une preview avec sa base isolée, ses comptes de test et des services sandbox. Le build génère le client Prisma seulement. Examiner la liste des migrations de cette base, puis appliquer séparément les migrations revues. Ne lancer aucun seed sur production et ne synchroniser aucune copie de données réelles non nécessaire dans la preview.
2. Vérifier en preview les deux rôles staff, le code de connexion, la reprise d'un compte portail historique, une nouvelle vérification par courriel, un reset et la révocation après déconnexion/changement sensible. Tester aussi les refus d'accès entre dossiers et les liens périmés. Un scénario de récupération staff doit être prêt sans bypass.
3. Vérifier les uploads avec des fichiers de test : finalisation unique, rejeu refusé, changement de staging refusé par ETag, copie finale autorisée, téléchargement du seul propriétaire et suppression bornée. Les essais AWS se font sur un préfixe/environnement de test prévu ; les fixtures simulées ne prouvent pas IAM. Voir [file-storage-security.md](./file-storage-security.md).
4. Vérifier montant/devise et webhook PayPal en sandbox, signature Calendly et callback Google de test. Ne pas créer, capturer, annuler ou rembourser un paiement de production pour tester cette livraison.
5. Capturer la sauvegarde et l'état de migrations de production, confirmer à nouveau la base cible, puis appliquer explicitement les seules migrations approuvées durant la fenêtre prévue. Si une migration ou un contrôle échoue, arrêter avant promotion ; ne pas lancer `migrate reset`, le seed, une réparation automatique ou une série historique non revue.
6. Livrer la révision approuvée, attendre l'état Vercel `READY`, puis vérifier publiquement HTTP et les parcours autorisés : accueil, radio et album avec lecture réelle, connexion, refus sans compte et affichage du quota. Vérifier les données sensibles avec des comptes de test dédiés seulement. L'état `READY` seul ne valide pas les fonctions du site.
7. Surveiller les refus d'authentification/configuration, erreurs DB/S3/mail, codes 429 attendus et webhooks, avec des journaux qui ne contiennent pas les jetons, secrets ou documents privés. Conserver les preuves de validation et communiquer les impacts aux utilisateurs.

## Pare-feu Vercel

La revue disponible confirme le pare-feu de plateforme activé et sa protection par défaut. L'accès à la configuration des règles personnalisées a retourné 404 : aucune règle personnalisée ni politique complète n'a été vérifiée. Ne pas annoncer une protection personnalisée déjà configurée.

Toute nouvelle règle doit être préparée avec son périmètre, les chemins sensibles, les callbacks/webhooks et les utilisateurs affectés. Commencer par un mode de journalisation ou de challenge adapté, examiner les faux positifs, puis proposer l'activation publique à l'utilisateur. Ne pas bloquer aveuglément les webhooks, les téléchargements authentifiés ou les lectures audio. Aucune modification du pare-feu ne fait partie de l'audit local.

## Retour arrière

Avant toute migration ou écriture de production, on peut abandonner la preview et conserver le déploiement actuel ; documenter cependant les risques connus que cet ancien code laisse ouverts.

Après la migration d'authentification, **ne pas promouvoir automatiquement l'ancien code**. Il peut accepter de nouveau les anciens jetons et mots de passe, ignorer les versions/grants et réintroduire les failles corrigées. Les anciens liens de reset supprimés et les mots de passe invalidés lors d'adoptions ultérieures ne sont pas restaurés par un retour de code. Le schéma, les triggers, les données et la gestion des grants doivent rester compatibles avec le code retenu.

Privilégier un correctif compatible avec le schéma migré. En cas d'incident grave, suspendre les fonctions concernées ou placer le service en maintenance et préparer une restauration coordonnée. Une restauration DB exige une décision explicite, le point temporel choisi et la prise en compte des écritures depuis la sauvegarde : comptes créés, grants, quotas, factures/webhooks, documents et objets S3. Une restauration de base ne restaure ni S3, ni un paiement, ni un courriel déjà envoyé.

Avant de rouvrir après restauration, révoquer les accès concernés et vérifier la confidentialité des données ; ne pas rouvrir un code connu vulnérable comme solution durable. Ne supprimer aucune migration, aucun trigger, aucune version de compte ou table de grants pour faire disparaître une erreur. Si des clés ont été tournées ou des fichiers déplacés, suivre leur plan spécifique de reprise.

## Après livraison

Planifier le nettoyage borné des staging et des grants expirés, la revue de provenance des fichiers historiques et la migration des URL directes/locales privées. Les anciens fichiers ne sont ni déplacés ni supprimés automatiquement dans cette livraison. Réexaminer les alertes de dépendances de développement documentées dès qu'un correctif officiel existe. Conserver une séparation explicite entre correctifs du code, contrôles d'infrastructure vérifiés et limites restant à traiter.
