# Clair de cartes sur NOWIS

La page publique `/tarot` héberge la liseuse dans une iframe de même origine, servie depuis `public/tarot-reader`. Le menu principal, le pied de page, Explorer et le sitemap donnent accès à cette page. Aucune connexion ni service externe n'est nécessaire pour un tirage.

La liseuse comprend 78 cartes, des tirages de 2 à 5 cartes, les interprétations liées à la question et à la position, une synthèse et quatre questions facultatives. Les questions, réponses et cartes restent dans l'historique de l'onglet de la liseuse. Le composant parent ne lit que ses dimensions et ajuste la fenêtre Sources à la partie visible de l'écran.

Les six fichiers statiques proviennent du projet Clair de cartes, version `abbb5877b9fa0c95b60848df7318187a78d8e0b0`. Adaptations pour NOWIS : retrait de l'URL du notebook privé, références publiques conservées, polices système sans requête Google Fonts et placement du dialogue adapté au header fixe. Pour mettre à jour la liseuse, reporter les changements dans ces fichiers en préservant ces adaptations.

Les significations de base viennent de Street Tarots et du guide des arcanes mineurs Apprendre le Tarot de Marseille. Les lectures développées sont des interprétations symboliques locales, sans génération IA à chaque tirage ni calcul de probabilité. La définition du Mat reste à compléter à partir d'une source vérifiée.
