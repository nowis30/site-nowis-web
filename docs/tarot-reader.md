# Clair de cartes sur NOWIS

La page publique `/tarot` héberge la liseuse dans une iframe de même origine, servie depuis `public/tarot-reader`. Le menu principal, le pied de page, Explorer et le sitemap donnent accès à cette page. Aucune connexion ni service externe n'est nécessaire pour un tirage.

Le bouton « Partager la page Tarot » réutilise le menu de partage NOWIS : partage natif si disponible, copie du lien ou sélection manuelle. Il utilise toujours `https://nowis.store/tarot`, y compris depuis un aperçu. La question, le questionnaire et les cartes ne sont pas inclus dans le partage.

Un encadré « Avertissement » reste visible après l’introduction et avant le tirage, y compris lorsque la liseuse est ouverte directement. Il précise la nature symbolique et récréative des réponses, l’absence d’affirmation de vérité et de prédiction garantie, la décharge de responsabilité de NOWIS et la responsabilité de chacun dans ses décisions. Conserver cet encadré lors des mises à jour des fichiers statiques.

La liseuse comprend 78 cartes, des tirages de 2 à 5 cartes, les interprétations liées à la question et à la position, une synthèse et quatre questions facultatives. Les questions, réponses et cartes restent dans l'historique de la liseuse et dans le stockage de session du navigateur, limité à cet onglet, pour retrouver le tirage après actualisation de NOWIS. Effacer les réponses met aussi à jour cette copie locale. Le composant parent ne lit que ses dimensions et ajuste la fenêtre Sources à la partie visible de l'écran.

Les six fichiers statiques proviennent du projet Clair de cartes, version `abbb5877b9fa0c95b60848df7318187a78d8e0b0`. Adaptations pour NOWIS : retrait de l'URL du notebook privé, références publiques conservées, polices système sans requête Google Fonts et placement du dialogue adapté au header fixe. Pour mettre à jour la liseuse, reporter les changements dans ces fichiers en préservant ces adaptations.

Les significations de base viennent de Street Tarots et du guide des arcanes mineurs Apprendre le Tarot de Marseille. Les lectures développées sont des interprétations symboliques locales, sans génération IA à chaque tirage ni calcul de probabilité. La définition du Mat reste à compléter à partir d'une source vérifiée.
