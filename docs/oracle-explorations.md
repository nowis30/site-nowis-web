# Oracle : sources et périmètre des explorations

Inventaire consulté le 6 octobre 2026 : https://www.evozen.fr/astrologie-et-horoscope, ainsi que ses rubriques tarot, numérologie et angéologie. NOWIS ne reproduit ni les textes, ni les illustrations, ni les algorithmes propriétaires d’Evozen.

## Fonctions disponibles

| Domaine | Lecture NOWIS | Méthode et limites |
| --- | --- | --- |
| Tarot de Marseille | Tirages existants de 2 à 5 cartes, question et position | Corpus existant ; réflexion contextualisée, pas de résultat certain |
| Belline | 53 définitions, tirage simple, trois cartes, relation, célibat, croix | Textes originaux en français simple, chaque fiche cite sa source ; positions NOWIS explicitement distinguées |
| Numérologie | Chemin de vie, expression, aspirations, personnalité, année/mois/jour personnels | Convention pythagoricienne A–Z ; accents normalisés ; Y vocalique au choix ; maîtres 11/22/33 préservés hors cycles personnels |
| Prénoms | Deux nombres et leurs significations à comparer | Pas de pourcentage, de verdict amoureux ou de sentiments attribués à autrui |
| Deux ciels | Signes solaires et lunaires, huit aspects les plus proches | Positions tropicales géocentriques ; aspects 0/60/90/120/180°, orbe 5° sauf sextile 3° ; incertitude horaire prise en compte |
| Thème natal | Planètes, signes, ascendant, descendant, maisons égales, éléments | Heure inconnue signalée ; aucun angle de naissance inventé |
| Lectures datées | Date choisie, aujourd’hui, demain | Transits à midi dans le fuseau du lieu de naissance |
| Année | Douze instantanés, trois transits par date | Le 15 de chaque mois, et non une couverture continue de tous les événements |
| Retour solaire | Instant exact du retour du Soleil à sa longitude natale, positions et ascendant | Heure connue obligatoire ; lieu de naissance comme référence, pas de relocalisation |
| Lune | Signe à midi UTC, fraction éclairée, quatre prochaines phases | Calcul astronomique distinct du sens symbolique ; aucune causalité émotionnelle affirmée |
| Conclusion IA | Synthèse des familles sélectionnées et des tirages existants | Consentement renouvelé après modification ; recalcul serveur ; liberté de choix rappelée |

Les modules anges/heures miroir n’ont pas de corpus de correspondances validé dans cette version. Les méthodes propriétaires Michel, numérologie universelle, Themoscope et indicateurs Belline d’Evozen, ses livres personnalisés et consultations humaines ne sont pas reproduits. Une réponse oui/non automatique n’est pas proposée sans table d’interprétation validée. La lecture natale générale reste utilisable sans créer de profil prédictif dédié aux enfants.

## Références

- Significations des nombres : pages individuelles Numerology.com citées dans `numerology-meanings.js`, reformulations originales, moins de 200 mots par page source.
- Chemin de vie : https://www.numerology.com/articles/your-numerology-chart/life-path-number-meanings/ ; réduction séparée des composantes. Exemple 22 octobre 1980 → 5.
- Expression : https://www.numerology.com/articles/your-numerology-chart/expression-number/ ; exemple Nicholas Evan Smith → 75 → 12 → 3.
- Voyelles et consonnes : https://www.numerology.com/articles/your-numerology-chart/core-numbers-numerology/
- Cycles : https://www.numerology.com/articles/about-numerology/calculate-personal-day-number/ et formule de l’année civile https://www.numerology.com/articles/numerology-news/2022-numerology-predictions/ (seule la méthode, pas les prédictions datées).
- Belline : https://www.oracle-de-belline.com/ ; les 53 pages individuelles sont référencées dans `belline-data.js`. Les titres inquiétants sont traités comme des métaphores, jamais comme des annonces médicales ou des accusations.
- Astrologie : Astrodienst/Astrowiki, pages individuelles de `astro-meanings.js`, https://www.astro.com/astrowiki/en/Descendant, https://www.astro.com/astrowiki/en/Comparative_Astrology et https://www.astro.com/astrowiki/en/Solar_Return_Chart.
- Calcul : Astronomy Engine 2.1.19, licence MIT, https://github.com/cosinekitty/astronomy.
- Phases : https://science.nasa.gov/moon/moon-phases/ ; validation indépendante USNO d’avril 2024 à moins de deux minutes : https://aa.usno.navy.mil/calculated/moon/phases?date=2024-4-08&format=p&nump=5&submit=Get+Data.

## Confidentialité et validation

Les nouvelles sélections restent en mémoire dans l’onglet, sans stockage local. Le partage concerne seulement la page. La conclusion transmet à NOWIS les données nécessaires après consentement, puis NOWIS recalcule les résultats. Les noms, dates/heures/lieux/coordonnées bruts de naissance ne sont pas inclus dans le contexte fourni au modèle. Une question libre peut contenir ce que l’utilisateur y écrit ; le formulaire invite à éviter les informations sensibles. Le journal n’est jamais transmis.

Tests : exemples publiés de numérologie, normalisation et validation des saisies, phases USNO, convergence du retour solaire (29 février et frontière d’année), symétrie des aspects, corpus complet, rejet des résultats fabriqués, absence des données brutes dans le contexte IA, consentement et annulation des réponses devenues obsolètes. Vérification visuelle avec données fictives sur ordinateur et à 390 px.
