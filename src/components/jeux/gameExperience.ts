export type GameLayout = 'square' | 'portrait' | 'landscape' | 'tall';
export type GameTouchAction = 'auto' | 'manipulation' | 'none';

export type GameExperienceProfile = {
  slug: string;
  layout: GameLayout;
  interaction: string;
  instruction: string;
  swipeToKeys?: boolean;
  touchAction?: GameTouchAction;
  allowMicrophone?: boolean;
  preventContextMenu?: boolean;
};

const profiles: GameExperienceProfile[] = [
  {
    slug: 'candy-crush',
    layout: 'square',
    interaction: 'Glisser',
    instruction: 'Fais glisser les bonbons directement avec ton doigt. La grille est agrandie et bloquée contre le défilement accidentel.',
    touchAction: 'none',
    preventContextMenu: true,
  },
  {
    slug: 'pac-man',
    layout: 'square',
    interaction: 'Glisser ou flèches',
    instruction: 'Glisse dans la direction voulue directement sur le jeu, ou utilise le pavé tactile sous la zone de jeu.',
    swipeToKeys: true,
    touchAction: 'none',
  },
  {
    slug: 'chess',
    layout: 'tall',
    interaction: 'Toucher',
    instruction: 'Touche une pièce puis sa case de destination. L’échiquier reste centré et lisible sur écran étroit.',
    touchAction: 'manipulation',
  },
  {
    slug: 'doodle-jump',
    layout: 'portrait',
    interaction: 'Gauche / droite',
    instruction: 'Utilise gauche et droite pour diriger le personnage. Le bouton Action reste accessible pour démarrer ou sauter si nécessaire.',
    touchAction: 'none',
  },
  {
    slug: 'solitaire',
    layout: 'tall',
    interaction: 'Toucher / glisser',
    instruction: 'Déplace les cartes au doigt. La zone de jeu autorise le glissement sans faire défiler la page par erreur.',
    touchAction: 'none',
    preventContextMenu: true,
  },
  {
    slug: 'sudoku',
    layout: 'tall',
    interaction: 'Toucher + chiffres',
    instruction: 'Sélectionne une case puis utilise le clavier du jeu ou les chiffres tactiles lorsqu’ils sont disponibles.',
    touchAction: 'manipulation',
  },
  {
    slug: 'crossy-road',
    layout: 'portrait',
    interaction: 'Glisser ou flèches',
    instruction: 'Glisse vers le haut, le bas, la gauche ou la droite pour traverser, ou utilise le pavé tactile.',
    swipeToKeys: true,
    touchAction: 'none',
  },
  {
    slug: 'rock-paper-scissors',
    layout: 'square',
    interaction: 'Toucher',
    instruction: 'Choisis pierre, papier ou ciseaux directement avec de gros boutons tactiles.',
    touchAction: 'manipulation',
  },
  {
    slug: 'flappy-bird',
    layout: 'portrait',
    interaction: 'Tap',
    instruction: 'Tape sur Action pour battre des ailes. En mode immersif, les commandes restent sous ton pouce.',
    touchAction: 'none',
  },
  {
    slug: '2048',
    layout: 'square',
    interaction: 'Glisser ou flèches',
    instruction: 'Glisse sur la grille pour fusionner les nombres, comme dans une application mobile native.',
    swipeToKeys: true,
    touchAction: 'none',
  },
  {
    slug: 'wordle',
    layout: 'portrait',
    interaction: 'Clavier',
    instruction: 'Touche le champ ou le clavier du jeu. Les entrées restent à 16 px pour éviter le zoom automatique sur iPhone.',
    touchAction: 'manipulation',
  },
  {
    slug: 'hangman',
    layout: 'portrait',
    interaction: 'Lettres tactiles',
    instruction: 'Utilise le clavier de lettres NOWIS sous le jeu pour choisir rapidement chaque lettre.',
    touchAction: 'manipulation',
  },
  {
    slug: 'tower-blocks',
    layout: 'portrait',
    interaction: 'Tap',
    instruction: 'Tape sur Action au bon moment pour empiler le prochain bloc.',
    touchAction: 'none',
  },
  {
    slug: 'archery',
    layout: 'landscape',
    interaction: 'Toucher / Action',
    instruction: 'Vise directement dans le jeu; le bouton Action sert de secours si la version du jeu attend la barre d’espace.',
    touchAction: 'none',
  },
  {
    slug: 'tic-tac-toe',
    layout: 'square',
    interaction: 'Toucher',
    instruction: 'Touche simplement la case où tu veux jouer. La grille est agrandie pour les doigts.',
    touchAction: 'manipulation',
  },
  {
    slug: 'minesweeper',
    layout: 'tall',
    interaction: 'Toucher',
    instruction: 'Touche les cases avec précision. Le menu contextuel mobile est neutralisé pour éviter les appuis accidentels.',
    touchAction: 'manipulation',
    preventContextMenu: true,
  },
  {
    slug: 'speed-typing',
    layout: 'landscape',
    interaction: 'Clavier',
    instruction: 'Touche le champ de saisie puis écris avec ton clavier mobile. Les champs restent assez grands pour jouer vite.',
    touchAction: 'auto',
  },
  {
    slug: 'breakout',
    layout: 'landscape',
    interaction: 'Gauche / droite + Action',
    instruction: 'Déplace la raquette avec gauche/droite et utilise Action pour lancer la balle ou démarrer la manche.',
    touchAction: 'none',
  },
  {
    slug: 'ping-pong',
    layout: 'landscape',
    interaction: 'Haut / bas',
    instruction: 'Contrôle la raquette avec les gros boutons haut et bas sans quitter la zone de jeu des yeux.',
    touchAction: 'none',
  },
  {
    slug: 'tetris',
    layout: 'portrait',
    interaction: 'Flèches + rotation',
    instruction: 'Déplace les pièces avec les flèches, tourne-les avec Rotation et accélère la chute avec Descendre.',
    swipeToKeys: true,
    touchAction: 'none',
  },
  {
    slug: 'tilting-maze',
    layout: 'square',
    interaction: 'Glisser ou flèches',
    instruction: 'Glisse dans la direction souhaitée pour guider la bille dans le labyrinthe.',
    swipeToKeys: true,
    touchAction: 'none',
  },
  {
    slug: 'memory-card',
    layout: 'tall',
    interaction: 'Toucher',
    instruction: 'Retourne deux cartes au toucher. Les cartes sont forcées à rester dans la largeur du téléphone.',
    touchAction: 'manipulation',
  },
  {
    slug: 'type-number-guessing',
    layout: 'portrait',
    interaction: 'Clavier numérique',
    instruction: 'Touche le champ, entre ton nombre avec le clavier du téléphone puis valide.',
    touchAction: 'auto',
  },
  {
    slug: 'snake',
    layout: 'square',
    interaction: 'Glisser ou flèches',
    instruction: 'Glisse pour changer la direction du serpent ou utilise le pavé tactile.',
    swipeToKeys: true,
    touchAction: 'none',
  },
  {
    slug: 'connect-four',
    layout: 'square',
    interaction: 'Toucher',
    instruction: 'Touche la colonne où tu veux déposer ton pion. La grille est adaptée à la largeur du téléphone.',
    touchAction: 'manipulation',
  },
  {
    slug: 'insect-catch',
    layout: 'landscape',
    interaction: 'Toucher',
    instruction: 'Tape directement sur les insectes. Les éléments tactiles sont protégés contre le double-tap et le zoom.',
    touchAction: 'manipulation',
  },
  {
    slug: 'typing',
    layout: 'landscape',
    interaction: 'Clavier',
    instruction: 'Touche la zone de saisie et tape le texte le plus vite possible avec le clavier mobile.',
    touchAction: 'auto',
  },
  {
    slug: 'dice-roll-simulator',
    layout: 'square',
    interaction: 'Toucher',
    instruction: 'Touche le bouton de lancer. Les boutons sont agrandis pour être confortables au pouce.',
    touchAction: 'manipulation',
  },
  {
    slug: 'shape-clicker',
    layout: 'landscape',
    interaction: 'Toucher',
    instruction: 'Tape les formes dès qu’elles apparaissent. Le jeu ne déclenche plus de zoom accidentel sur mobile.',
    touchAction: 'manipulation',
  },
  {
    slug: 'typing-challenge',
    layout: 'landscape',
    interaction: 'Clavier',
    instruction: 'Deuxième défi de frappe maintenant accessible sur sa propre page. Touche le champ puis écris rapidement.',
    touchAction: 'auto',
  },
  {
    slug: 'speak-number-guessing',
    layout: 'portrait',
    interaction: 'Microphone',
    instruction: 'Autorise le microphone quand le navigateur le demande, puis prononce ton nombre clairement.',
    touchAction: 'manipulation',
    allowMicrophone: true,
  },
  {
    slug: 'fruit-slicer',
    layout: 'landscape',
    interaction: 'Glisser',
    instruction: 'Tranche les fruits avec un vrai geste de glissement. Le défilement de la page est bloqué pendant le geste.',
    touchAction: 'none',
    preventContextMenu: true,
  },
  {
    slug: 'quiz',
    layout: 'portrait',
    interaction: 'Toucher',
    instruction: 'Choisis ta réponse avec de grands boutons lisibles sur téléphone.',
    touchAction: 'manipulation',
  },
  {
    slug: 'emoji-catcher',
    layout: 'landscape',
    interaction: 'Toucher',
    instruction: 'Attrape les emojis au toucher avec une zone de jeu qui occupe toute la largeur disponible.',
    touchAction: 'manipulation',
  },
  {
    slug: 'whack-a-mole',
    layout: 'square',
    interaction: 'Toucher',
    instruction: 'Tape les taupes directement. Les cibles sont gardées à une taille confortable pour le téléphone.',
    touchAction: 'manipulation',
  },
  {
    slug: 'simon-says',
    layout: 'square',
    interaction: 'Toucher',
    instruction: 'Observe la séquence puis reproduis-la au toucher. La grille reste centrée et stable.',
    touchAction: 'manipulation',
  },
  {
    slug: 'sliding-puzzle',
    layout: 'tall',
    interaction: 'Toucher',
    instruction: 'Touche les tuiles pour les déplacer. Le puzzle est redimensionné sans déborder de l’écran.',
    touchAction: 'manipulation',
  },
];

const profileMap = new Map(profiles.map((profile) => [profile.slug, profile]));

const fallbackProfile: GameExperienceProfile = {
  slug: 'default',
  layout: 'portrait',
  interaction: 'Toucher',
  instruction: 'Joue directement au toucher dans la zone de jeu.',
  touchAction: 'manipulation',
};

export function getGameExperience(slug: string): GameExperienceProfile {
  return profileMap.get(slug) ?? { ...fallbackProfile, slug };
}
