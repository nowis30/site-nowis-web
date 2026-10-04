# Lieux de naissance de la carte du ciel

Le catalogue `public/tarot-reader/astro-places/` est une adaptation de l’extrait officiel **GeoNames cities1000**. Il contient 171 103 lieux dans 246 pays et territoires, avec leurs coordonnées et leur identifiant de fuseau IANA. La couverture vise les villes de plus de 1 000 habitants ainsi que les sièges administratifs jusqu’au niveau PPLA3. Certaines petites localités n’y figurent pas : une saisie manuelle des coordonnées et du fuseau reste nécessaire pour ces lieux.

Les coordonnées WGS84 représentent le lieu et sont arrondies à quatre décimales. Elles ne désignent pas une adresse ou une maternité. Le catalogue géographique est distinct des règles historiques d’heure légale : le navigateur applique sa propre base de fuseaux aux dates saisies.

## Format et chargement

- `manifest.json` contient la version, la date de construction, l’attribution, la couverture, le nombre total de lieux, les fuseaux utilisables et la liste des pays.
- Chaque entrée de `countries` possède `{ code, name, count, url }`. Les noms des pays sont produits en français par `Intl.DisplayNames`.
- Un fichier par pays, par exemple `CA.json`, contient un tableau de lieux `{ id, name, aliases?, region, countryCode, latitude, longitude, timeZone }`.
- `id` est l’identifiant numérique GeoNames, stable et unique dans le catalogue. Les variantes de nom sont limitées à trois et ne constituent pas une liste exhaustive de traductions.
- Les homonymes utilisent la région de premier niveau. Lorsqu’elle ne suffit pas, le libellé inclut la subdivision de second niveau puis, si nécessaire, les coordonnées. Les lieux ne sont pas fusionnés sur la seule base de leur nom.
- Les 437 fuseaux proposés proviennent de `Intl.supportedValuesOf('timeZone')` et des fuseaux GeoNames, tous acceptés par `Intl.DateTimeFormat` lors de la construction. La prise en charge doit également être vérifiée dans le navigateur du visiteur.

Le manifeste mesure environ 31 Ko. Le corpus complet représente 28,0 Mo de JSON compact, soit environ 4,33 Mo avec gzip. Le fichier des États-Unis, le plus volumineux, mesure 3,06 Mo brut et environ 502 Ko compressé. Le chargement différé par pays évite de télécharger le corpus entier pour une seule recherche.

Tous les fichiers sont servis depuis le site. Aucun service GeoNames, géocodage externe ou clé API n’est requis à l’exécution. La recherche dans les noms et variantes se fait localement, après téléchargement du fichier du pays. Les dates de naissance et coordonnées saisies n’ont pas à être envoyées avec ces requêtes de fichiers.

## Sources et attribution

Sources officielles :

- [cities1000.zip](https://download.geonames.org/export/dump/cities1000.zip)
- [countryInfo.txt](https://download.geonames.org/export/dump/countryInfo.txt)
- [admin1CodesASCII.txt](https://download.geonames.org/export/dump/admin1CodesASCII.txt)
- [admin2Codes.txt](https://download.geonames.org/export/dump/admin2Codes.txt)
- [Format et couverture](https://download.geonames.org/export/dump/readme.txt)

**Données géographiques : [GeoNames](https://www.geonames.org/), sous licence [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).** Adaptation NOWIS : sélection de champs, coordonnées arrondies, variantes de nom limitées et fichiers répartis par pays. La source est proposée sans garantie d’exactitude ou d’exhaustivité. L’attribution et le lien de licence sont également conservés dans `manifest.source` et `ATTRIBUTION.txt`.

Le SHA-256 de l’archive importée est `1f3e079d8eacbe1f2ef28d235ca2d34ec2e6db3ff5da6b7d6fc2b559ae55beca`.

## Reconstruction

Le script Node utilise uniquement les modules intégrés :

```powershell
node scripts/build-astro-places.cjs --input-dir ../astro-geography
```

Pour récupérer une nouvelle version des cinq fichiers officiels avant la reconstruction :

```powershell
node --use-system-ca scripts/build-astro-places.cjs --download --input-dir ../astro-geography
```

Les téléchargements sont réservés à cette étape de construction. L’archive ZIP est lue en mémoire ; seule son entrée `cities1000.txt` est extraite. Le script refuse une licence différente de CC BY 4.0 tant qu’elle n’a pas été examinée. Le manifeste conserve la date de construction et le SHA-256 de l’archive. `--generated-at` permet de reproduire la date de manifeste d’un import existant.

La validation de l’import vérifie le nombre de lignes et les champs autorisés, l’unicité des identifiants, les limites des coordonnées, les fuseaux, les trois variantes maximum, les comptes par pays et la distinction des libellés homonymes. Les 171 103 lignes de l’archive téléchargée ont été conservées sans rejet.
