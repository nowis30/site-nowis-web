# Contrôles supplémentaires du 6 octobre 2026

Ce lot complète la protection IA déjà publiée. Aucun changement de schéma, de secret, de paiement ou de donnée client n'est requis pour sa livraison.

## Liens de documents

Les administrateurs peuvent révoquer un lien précis depuis les paramètres CRM. Les JWT déjà envoyés et les liens compacts sont concernés. La révocation est conservée dans `AuthGrant`, sous `public-document-revoked`, avec un hash SHA-256 du jeton et de l'auteur. Le jeton n'est pas stocké. Les autres liens ne sont pas modifiés. Les vérifications de signature précèdent la consultation des révocations; l'indisponibilité du stockage ne doit jamais autoriser la consultation d'un document.

Les liens compacts ont une représentation canonique afin qu'un ajout de zéro à l'expiration ne contourne pas la révocation. Le refus des archives de facture et de contacts archivés complète le contrôle. Les liens restent des capacités partageables, avec les expirations existantes de 14 ou 30 jours. Révoquer un lien n'efface pas les copies déjà téléchargées et n'annule pas une opération déjà engagée.

## PayPal

Les événements signés et reconnus sont identifiés par leur ID PayPal. Un journal persistant est conservé dans `api_rate_limits`, sous `paypal:webhook-receipt`, avec identifiant haché et fenêtre fixe au 1er janvier 1970. `count=0` signifie en cours, `count=1` traité. Le nettoyage opportuniste des quotas exclut ce scope. Conserver cette exclusion lors des futurs nettoyages.

Un événement déjà traité est acquitté sans nouvelle synchronisation. Un événement en cours reçoit 503 et Retry-After pour une nouvelle livraison. Une panne libère le bail; un bail expiré peut être repris après dix minutes. Le propriétaire du bail est vérifié avant clôture. Aucun paiement n'est déclenché par cette route. Un arrêt après la mise à jour métier mais avant la clôture peut entraîner une nouvelle synchronisation: le journal ne constitue pas une transaction exactement une fois avec PayPal. La synchronisation métier existante relit l'état fournisseur et protège ses écritures concurrentes par `updatedAt`.

## CSP et statistiques

Les pages de connexion, CRM, portail client et documents privés sont rendues par requête avec un nonce aléatoire de 192 bits. Le proxy remplace toute CSP ou nonce fourni par le client. `script-src` utilise nonce et strict-dynamic sans unsafe-inline en production. Les traversées entre site public et espace privé chargent un nouveau document, y compris les changements de route programmatiques, car une navigation SPA ne remplace pas la CSP du document. La radio conserve sa navigation publique continue.

Les origines de connexion du navigateur sont explicitement limitées au site, au stockage connu et aux domaines Google configurés. Les pages publiques statiques et jeux conservent leur compatibilité avec les scripts inline; une CSP stricte sur ces pages reste une amélioration distincte à vérifier avec tous les jeux. Les styles inline restent autorisés. Les pages contenant des capacités documentaires ou des liens de réinitialisation sont exclues du chargement initial des statistiques Google. Une balise chargée avant une navigation dans une même catégorie de pages doit aussi être prise en compte lors de futurs changements.

## Fichiers

La finalisation inspecte au plus les 4096 premiers octets avec GET Range et If-Match, puis copie uniquement la version examinée avec CopySourceIfMatch. Un corps sans bornes, incomplet ou incohérent n'est pas accepté. Les dépôts directs reçoivent le même contrôle de signature. La livraison reste en pièce jointe avec nosniff. Les erreurs de type donnent un refus 400 explicite.

Ce contrôle établit une cohérence minimale des formats PDF, JPEG, PNG, WebP, MP3, WAV, MP4/M4A, DOC, DOCX et texte UTF-8. Il ne prouve pas l'innocuité du fichier. Les signatures ZIP/OLE ne prouvent pas qu'un document Office est sans macro, qu'une archive est sans bombe de décompression, ni qu'un document est exempt de malware. Aucun antivirus n'est revendiqué. Aucun fichier historique n'est supprimé ou mis en quarantaine sans inventaire et procédure validée.

## Infrastructure observée

Le tableau de bord Render confirme `nowis_crm-db` disponible, PostgreSQL 18, sauvegarde exportée le 6 octobre à 03:49 UTC, restauration dans une fenêtre de trois jours, exports conservés au moins sept jours. L'accès externe autorise actuellement `0.0.0.0/0`, également aux niveaux workspace/environnement. Avant de retirer cette règle, établir les IP sortantes stables réellement affectées à Vercel et les connexions d'exploitation requises. Ne pas remplacer ces règles par des IP supposées ou bloquer la production.

La réception du MFA est confirmée par l'utilisateur. La session finale après saisie du code et le diagnostic des privilèges restent à vérifier par un compte ADMIN connecté. Le bouton de diagnostic CRM interroge uniquement les indicateurs du rôle PostgreSQL, le chiffrement de la connexion et les métadonnées fournisseurs, sans exposer de secret ni de donnée client. Ce diagnostic est réservé à ADMIN, respecte le contrôle d'origine et échoue avec 503 sans divulgation.

Une règle Vercel active journalise les trois routes IA exactes. Elle est en mode Log, sans challenge ou contournement des mitigations système. Observer les faux positifs avant d'activer une limite réseau. L'authentification, les quotas par compte et les plafonds globaux de l'application restent actifs. Les alertes financières et l'isolation preview/production doivent être établies dans les consoles concernées avant d'être annoncées.

## Validation

Les tests incluent une base PostgreSQL isolée PGlite et 50 réservations concurrentes du même événement PayPal, reprise de panne, fencing des anciens propriétaires, acquittement des répétitions, restrictions ADMIN/origine, refus des liens révoqués, représentation canonique, formats des fichiers et exclusion des URL privées des statistiques. Les tests métier, média, types, lint, compilation et audit des dépendances complètent ces contrôles. Vérifier ensuite le commit réellement actif, l'état READY, les en-têtes HTTP et l'utilisation du site dans le navigateur.

Un audit ne rend pas un système invulnérable. Les limites indiquées ici doivent rester visibles dans le rapport de livraison.
