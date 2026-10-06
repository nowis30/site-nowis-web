# Contrôle fournisseur avant migration/déploiement

`node scripts/provider-preflight.cjs` est destiné à l’environnement natif Vercel utilisant les secrets déjà configurés. Ne charger ni exporter ces secrets dans un poste local. Le script ne lit aucun fichier .env et n’interroge aucune base. Les tests locaux utilisent uniquement des fonctions de transport simulées et des valeurs fictives.

L’exécution effectue uniquement un GET HTTPS Resend sur la liste des domaines et cinq lectures de métadonnées S3 : HeadBucket, GetPublicAccessBlock, GetBucketPolicyStatus, GetBucketAcl, GetBucketPolicy. Aucun courriel, objet, listing d’objets, upload, mutation, paiement ou migration n’est effectué. Chaque appel, y compris la lecture de réponse, est borné à 10 secondes. La réponse JSON Resend et la policy sont bornées à 256 Kio; les redirections Resend sont refusées.

La sortie est une seule ligne JSON contenant uniquement des statuts fixes, des booléens et le domaine `nowis.store`. Aucune valeur ou longueur de secret, région, bucket, clé d’objet, identifiant AWS/domaine, policy, corps d’erreur ou message SDK brut n’est sérialisé. Les exceptions inattendues produisent seulement `internal_error`.

## Critères bloquants

Le code de sortie est 1 lorsque `blocked:true`, sinon 0.

- Clé effective JWT, portail ou calendrier absente, inférieure à 32 octets UTF-8 ou égale à une clé de développement publiée. Les clés publiques/envois optionnelles sont aussi contrôlées si configurées; leurs replis portail/JWT suivent exactement l’application. La présence directe et l’usage du repli sont des booléens distincts. Ce contrôle de longueur ne mesure pas l’entropie.
- Clé Resend absente ou rejetée explicitement en 401; domaine absent d’une liste explicitement complète, domaine non vérifié, ou capacité d’envoi désactivée. Aucun envoi ne sert de test.
- Configuration S3 requise absente (`S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`), endpoint configuré hors HTTPS, bucket signalé introuvable, ou erreur explicite de credentials/signature/expiration.
- Grant public de lecture d’objets couvrant potentiellement `client-files/`, `crm-files/` ou `legacy-uploads/`, sans Condition/Deny nécessitant interprétation et sans `RestrictPublicBuckets` observé. C’est un risque de policy à examiner, pas la preuve qu’un document précis a été lu publiquement. Les grants exclusivement sous `audio/` ou `games/` sont reconnus comme médias.
- ACL publique WRITE/FULL_CONTROL sans `IgnorePublicAcls` observé. READ sur l’ACL du bucket signifie listing; le script ne l’assimile pas à la lecture du contenu de chaque objet.

## Contrôles non établis

Un refus de GetBucketPolicy ou d’une autre lecture administrative, une opération non prise en charge, un timeout, une réponse incomplète, une pagination qui ne contient pas encore le domaine, ou une policy avec conditions/denials conduit à `review_required`/`not_established`. Ces cas ne forcent pas l’échec du build à eux seuls. Ils ne prouvent jamais que le bucket ou le service est sûr. Les IAM du runtime peuvent autoriser GetObject/PutObject sans les lectures administratives; HeadBucket nécessite notamment ListBucket. Resend peut utiliser une clé restreinte à l’envoi qui ne permet pas la liste des domaines. Ne pas élargir aveuglément leurs permissions pour faire passer le contrôle.

Le contrôle S3 de métadonnées peut nécessiter ListBucket, GetBucketPublicAccessBlock, GetBucketPolicyStatus, GetBucketAcl et GetBucketPolicy. L’interprétation des wildcards de ressources est conservatrice; des grants complexes ou vers d’autres prefixes demandent une revue humaine. La liste de domaines utilise une seule page bornée; son absence n’est bloquante que si `has_more:false`.

Même `passed_with_limits` ne certifie pas les permissions d’écriture, la livraison des emails, le Block Public Access du compte/organisation, les access points/CDN ni les ACL de chaque objet historique. Le script ne teste aucun document privé réel, ne modifie pas la policy d’un bucket mêlant fichiers et médias et ne privatise pas automatiquement les URL historiques. Évaluer séparément ces limites avant publication.

## Validation et sources

L’unique test de livraison autorisé est séparé : `node scripts/provider-otp-delivery-check.cjs --send-authorized-test`. Il est exécuté seulement après un préflight non bloquant et la revue des contrôles non établis, dans le build Vercel natif ciblant production (`VERCEL=1`, `VERCEL_ENV=production`). Il n’est ajouté à aucun script automatique ou au préflight. Aucun secret n’est importé en local.

Cet envoi possède un destinataire fixe autorisé par l’utilisateur et le même expéditeur que le CRM. Il utilise un seul POST `/emails`, un délai de 10 secondes, aucun retry interne et l’Idempotency-Key fixe `nowis-security-otp-delivery-20261006`. Le code de six chiffres provient de `crypto.randomInt`; il est purement décoratif et n’a aucun AuthGrant, session ou droit d’accès. Aucun code, destinataire, identifiant ou corps provider n’est imprimé. L’acceptation par l’API **ne prouve pas la réception** : seul le destinataire peut confirmer la boîte de réception.

Un rebuild avec le même identifiant et un nouveau code peut provoquer un conflit d’idempotence, signalé sans tenter un deuxième envoi. Ce script ne doit pas rester dans la commande de build après le test; une réexécution future hors rétention de l’idempotence du fournisseur pourrait envoyer un autre message et demanderait une nouvelle autorisation. Trois tests de transport simulé couvrent les gardes CLI/environnement, le contenu statique sans accès, l’absence de données sensibles dans la sortie, la clé d’idempotence, les erreurs et le délai.

Huit tests simulés vérifient les seules opérations autorisées, les sorties sans données sensibles, les critères de clés/Resend, les refus IAM non bloquants, les grants publics privés/médias, les ACL, les délais et les réponses malformées/volumineuses. Ils n’effectuent aucune requête réseau réelle.

- [GET domaines Resend](https://resend.com/docs/api-reference/domains/list-domains)
- [Statut des policies S3](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketPolicyStatus.html)
- [Permissions des opérations S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-with-s3-policy-actions.html)
- [Block Public Access et hiérarchie compte/bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)
- [Correspondance des permissions ACL bucket/objet](https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html)

