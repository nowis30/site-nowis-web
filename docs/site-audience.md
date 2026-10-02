# Compteur de fréquentation

Le compteur total mesure des **visites par session**, à partir de son activation. Il ne représente ni des personnes identifiées ni un historique reconstitué. Une session devient une nouvelle visite après **30 minutes d’inactivité**. Un navigateur est « en ligne » lorsque son dernier signal reçu par le serveur date de **moins de 180 secondes**. À exactement 180 secondes, il cesse d’être en ligne.

Le navigateur envoie uniquement un UUID aléatoire partagé entre ses onglets et `analyticsConsent: true`. Il ne doit envoyer ce signal que sur une page publique, après accord de mesure d’audience, avec un onglet visible. La création initiale de cet UUID doit être coordonnée entre onglets ; les rafraîchissements et les navigations conservent le même identifiant. Le retrait de l’accord arrête les signaux et retire cet identifiant côté navigateur.

La création utilise Web Locks pour éviter deux identifiants lors de l’ouverture simultanée de plusieurs onglets. Si ce verrouillage ou le stockage partagé est indisponible, les agrégats restent affichés, mais aucune nouvelle session de mesure n’est créée ; une session partagée déjà valide peut être réutilisée.

L’affichage utilise une seule boucle de rafraîchissement, toutes les 60 secondes et au retour d’un onglet visible. Avec consentement sur une page publique, elle envoie un `POST` si un identifiant partagé est utilisable ; sinon, elle lit les agrégats par `GET`. Une seule requête est active à la fois. Un changement de consentement ou de page annule la boucle précédente, empêchant ses résultats ou erreurs de remplacer le nouvel état. Chaque requête expire après 12 secondes ; aucun signal n’est envoyé depuis un onglet masqué.

Le serveur conserve uniquement le SHA-256 de cet UUID, lié au namespace, et la date du dernier signal. Il ne collecte pas d’adresse IP, d’agent utilisateur, d’empreinte, de page visitée ou d’identité de compte. Les dates viennent du serveur. Les sessions inactives depuis 30 minutes sont supprimées lors des lectures/signaux suivants ; le total permanent subsiste. Sans nouvelle requête, une ligne expirée peut rester physiquement présente mais n’est jamais comptée « en ligne ».

## API

`GET /api/site-audience` lit les agrégats sans enregistrer de visite, même avant consentement. La première lecture initialise le compteur vide de son namespace et sa date de début ; les lectures suivantes peuvent nettoyer des sessions expirées. Elle ne crée aucun identifiant navigateur.

`POST /api/site-audience` accepte exclusivement :

```json
{"sessionId":"019a0421-1111-4111-8111-111111111111","analyticsConsent":true}
```

L’`Origin` doit être strictement égal à l’origine de l’URL de la requête. Le corps JSON réel est limité à 1 024 octets, indépendamment de `Content-Length`. Origine incorrecte : `403` ; UUID/accord/corps incorrect : `400` ; taille excessive : `413` ; type non JSON : `415`.

Les deux méthodes répondent `200` avec le contrat :

```ts
{
  totalVisits: number;
  online: number;
  startedAt: string; // ISO UTC, début réel du compteur de ce namespace
  windowSeconds: 180;
  scope: 'site' | 'local' | 'preview';
}
```

Les réponses portent `Cache-Control: no-store, max-age=0`. Si le stockage est absent, endommagé ou inaccessible, l’API répond `503` avec un message d’indisponibilité, **sans chiffres**. L’en-tête doit alors masquer les chiffres ou indiquer l’indisponibilité. Aucune panne SQL ne déclenche un autre stockage.

## Persistance et portée

PostgreSQL utilise deux nouvelles tables Prisma : `SiteAudienceCounter` pour le total et `SiteAudienceSession` pour les présences. La clé primaire composite `(namespace, sessionHash)` et une transaction `Serializable` assurent qu’un ensemble de signaux concurrents de la même session ajoute une seule visite. Les conflits Prisma `P2034`/`P2002` sont retentés, au plus six tentatives au total.

Le namespace public `site` regroupe les domaines publics HTTPS configurés, avec `nowis.store` et `www.nowis.store`. Un déploiement Vercel preview possède un namespace séparé, stable par URL de branche lorsqu’elle existe. Chaque origine loopback possède un namespace local séparé, même si elle utilise la base commune. Les autres origines de revue sont isolées comme previews. Le namespace est décidé côté serveur ; le client ne peut pas le fournir. Les portées `local` et `preview` doivent être indiquées explicitement dans l’interface.

Le stockage fichier de revue est activé **uniquement** lorsque les trois conditions suivantes sont réunies :

- `SITE_AUDIENCE_LOCAL_STORE=1` ;
- le hostname de la requête est `localhost`, `127.0.0.1` ou `::1` ;
- la variable `VERCEL` est absente ou vide.

Il utilise alors le fichier réel `.local-review/site-audience.json` sous le répertoire courant, ignoré par Git, et annonce `scope: 'local'`. Un mutex partagé entre instances de modules sérialise les accès dans **un seul processus Node**. Les remplacements du fichier passent par une écriture temporaire puis un renommage atomique. Ce store est réservé à une seule instance locale ; il ne convient pas à plusieurs processus ou à la production.

## Validation et déploiement

Exécuter `npx tsx scripts/site-audience.test.ts` pour vérifier les seuils, la déduplication, la persistance fichier, la concurrence locale, l’isolation des namespaces, la validation et les retries. Ces tests n’utilisent aucune base distante. Ils ne remplacent pas un test d’intégration PostgreSQL des transactions concurrentes.

La migration `20261001120000_site_audience` est additive et ne modifie aucun mandat/client existant. Elle doit être appliquée à la base visée avant l’activation publique, puis le client Prisma doit être généré. Une table manquante provoque `503`, jamais un total inventé. Attention : `npm run build` lance déjà le script de prébuild qui déploie les migrations ; ne pas le lancer contre une base partagée avant l’autorisation du déploiement/migration.

Le consentement et la page de confidentialité doivent mentionner cette mesure interne en plus de Google Analytics. Le comptage couvre les sessions qui acceptent cette mesure ; il ne prétend pas compter les visiteurs ayant refusé. Une API publique ne peut pas garantir que chaque requête provient d’un humain, et aucune déduplication par IP ou empreinte n’est effectuée.
