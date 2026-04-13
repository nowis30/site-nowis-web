# SEO Conversion Audit

## Pages auditees

- /
- /a-propos
- /services
- /ateliers
- /ateliers/atelier-creatif
- /commander-une-chanson
- /contact
- /autres-services
- /tarifs
- /creations
- /logements
- /logements/[slug]
- /musique
- /videos
- /artistes
- /booking
- layouts prives et routes d authentification
- robots et sitemap

## Problemes trouves

- La page d accueil utilisait surtout les metadata globales du layout, sans title et description specifiques a la page.
- La page ateliers n avait pas de metadata propres, alors qu elle porte une part importante de l offre publique.
- Les pages privees client, CRM, connexion et inscription n etaient pas assez verrouillees cote indexation.
- Le robots.txt autorisait tout sans exclure les espaces prives ni les endpoints techniques.
- Le sitemap contenait des pages secondaires et omettait des pages fortes comme /ateliers, /tarifs, /logements et /ateliers/atelier-creatif.
- Le maillage interne etait encore perfectible sur certaines pages d offre, surtout /services et /creations.
- Plusieurs messages de reassurance conversion etaient implicites, alors qu ils gagnent a etre explicites: soumission sur demande, reponse humaine, accompagnement par Nowis Morin.
- Les donnees structurees metier etaient absentes pour la marque et pour les services principaux.
- Les alt texts de certaines images principales pouvaient etre plus descriptifs et plus utiles pour le contexte SEO.

## Corrections appliquees

- Ajout ou renforcement des metadata sur les pages publiques principales, avec titres plus clairs, descriptions plus naturelles et mots-cles integres sans bourrage.
- Ajout d un helper SEO plus souple pour gerer les cas noindex et harmoniser Open Graph / Twitter.
- Ajout d un helper de donnees structurees pour la marque, les services et les FAQ reelles.
- Ajout d un schema LocalBusiness / Organization global pour Creation Nowis.
- Ajout d un schema Service sur /ateliers et /commander-une-chanson.
- Ajout d un schema FAQPage sur /ateliers, car une vraie FAQ existe deja sur la page.
- Durcissement de l indexation privee: noindex sur les layouts client et CRM, plus sur les segments /connexion et /inscription.
- Nettoyage du robots.txt pour desindexer /client, /crm, /connexion, /inscription et /api.
- Mise a jour du sitemap pour mettre en avant les pages publiques les plus utiles au SEO.
- Renforcement des micro-textes conversion sur la page d accueil, /services, /contact, /ateliers, /commander-une-chanson, /autres-services et /tarifs.
- Amelioration du maillage interne entre services, creations, ateliers, videos, contact et chanson personnalisee.
- Amelioration de certains alt texts sur les visuels cles et sur les images des logements publics.

## Recommandations restantes

- Verifier page par page que les textes admin dynamiques ne remplacent pas les formulations SEO renforcees sur certaines sections publiques.
- Envisager un passage editorial sur /musique, /videos et /artistes si l objectif est de les pousser davantage sur des requetes SEO secondaires.
- Evaluer si /logements doit vraiment rester indexe sur nowis.store, car cette verticale peut diluer le positionnement principal du site si elle n est pas strategique.
- Confirmer si les montants affiches sur /tarifs doivent rester publics ou devenir seulement indicatifs, selon la strategie commerciale.
- Ajouter plus tard des dates de mise a jour reelles par page dans le sitemap si une source fiable existe.

## Elements a valider manuellement

- Verifier le rendu visuel des nouveaux micro-textes sur mobile, surtout sur /services, /creations et /contact.
- Verifier dans le navigateur les balises title, meta description, canonical et robots des pages principales.
- Verifier le JSON-LD dans l inspecteur ou via Rich Results Test pour les pages /, /ateliers et /commander-une-chanson.
- Verifier que les redirections et la desindexation des espaces prives correspondent bien au comportement souhaite pour Vercel et Google.
- Verifier que la page /logements et ses fiches doivent bien rester dans la strategie publique du domaine nowis.store.