const frenchGameNames: Record<string, string> = {
  'candy-crush': 'Candy Crush',
  'pac-man': 'Pac-Man',
  chess: 'Échecs',
  'doodle-jump': 'Doodle Jump',
  solitaire: 'Solitaire',
  sudoku: 'Sudoku',
  'crossy-road': 'Crossy Road',
  'rock-paper-scissors': 'Pierre, papier, ciseaux',
  'flappy-bird': 'Flappy Bird',
  '2048': '2048',
  wordle: 'Wordle',
  hangman: 'Le pendu',
  'tower-blocks': 'Tour de blocs',
  archery: 'Tir à l’arc',
  'tic-tac-toe': 'Morpion',
  minesweeper: 'Démineur',
  'speed-typing': 'Frappe rapide',
  breakout: 'Casse-briques',
  'ping-pong': 'Ping-pong',
  tetris: 'Tetris',
  'tilting-maze': 'Labyrinthe inclinable',
  'memory-card': 'Jeu de mémoire',
  'type-number-guessing': 'Devine le nombre',
  snake: 'Serpent',
  'connect-four': 'Puissance 4',
  'insect-catch': 'Attrape-insectes',
  typing: 'Jeu de frappe',
  'dice-roll-simulator': 'Simulateur de dés',
  'shape-clicker': 'Clique-formes',
  'typing-challenge': 'Défi de frappe',
  'speak-number-guessing': 'Devine le nombre à voix haute',
  'fruit-slicer': 'Coupe-fruits',
  quiz: 'Quiz',
  'emoji-catcher': 'Attrape-émojis',
  'whack-a-mole': 'Tape-taupe',
  'simon-says': 'Jacques a dit',
  'sliding-puzzle': 'Puzzle coulissant',
};

const commonTranslations: Record<string, string> = {
  'start': 'Démarrer',
  'start game': 'Démarrer la partie',
  'play': 'Jouer',
  'play game': 'Jouer',
  'play again': 'Rejouer',
  'restart': 'Recommencer',
  'restart game': 'Recommencer la partie',
  'new game': 'Nouvelle partie',
  'continue': 'Continuer',
  'next': 'Suivant',
  'next level': 'Niveau suivant',
  'next question': 'Question suivante',
  'previous': 'Précédent',
  'back': 'Retour',
  'pause': 'Pause',
  'resume': 'Reprendre',
  'reset': 'Réinitialiser',
  'submit': 'Valider',
  'check': 'Vérifier',
  'close': 'Fermer',
  'cancel': 'Annuler',
  'yes': 'Oui',
  'no': 'Non',
  'score': 'Score',
  'high score': 'Meilleur score',
  'best score': 'Meilleur score',
  'level': 'Niveau',
  'time': 'Temps',
  'timer': 'Chronomètre',
  'moves': 'Coups',
  'move': 'Coup',
  'attempts': 'Essais',
  'attempt': 'Essai',
  'lives': 'Vies',
  'life': 'Vie',
  'round': 'Manche',
  'wins': 'Victoires',
  'losses': 'Défaites',
  'win': 'Victoire',
  'lose': 'Défaite',
  'winner': 'Gagnant',
  'game over': 'Partie terminée',
  'you win': 'Tu as gagné !',
  'you won': 'Tu as gagné !',
  'you lose': 'Tu as perdu !',
  'you lost': 'Tu as perdu !',
  'draw': 'Égalité',
  'tie': 'Égalité',
  'correct': 'Bonne réponse !',
  'incorrect': 'Mauvaise réponse',
  'wrong': 'Mauvais',
  'easy': 'Facile',
  'medium': 'Moyen',
  'hard': 'Difficile',
  'difficulty': 'Difficulté',
  'settings': 'Paramètres',
  'sound': 'Son',
  'music': 'Musique',
  'on': 'Activé',
  'off': 'Désactivé',
  'loading': 'Chargement…',
  'ready': 'Prêt',
  'go': 'Go !',
  'try again': 'Réessaie',
  'congratulations': 'Félicitations !',
  'instructions': 'Instructions',
  'how to play': 'Comment jouer',
  'select': 'Choisir',
  'choose': 'Choisir',
  'clear': 'Effacer',
  'delete': 'Effacer',
  'enter': 'Entrer',
};

const perGameTranslations: Record<string, Record<string, string>> = {
  chess: {
    "white's turn": 'Au tour des blancs',
    "black's turn": 'Au tour des noirs',
    'white wins': 'Les blancs gagnent',
    'black wins': 'Les noirs gagnent',
    'check': 'Échec',
    'checkmate': 'Échec et mat',
    'stalemate': 'Pat',
  },
  'rock-paper-scissors': {
    'rock': 'Pierre',
    'paper': 'Papier',
    'scissors': 'Ciseaux',
    'computer': 'Ordinateur',
    'player': 'Joueur',
    'you chose': 'Tu as choisi',
    'computer chose': 'L’ordinateur a choisi',
  },
  sudoku: {
    'mistakes': 'Erreurs',
    'mistake': 'Erreur',
    'notes': 'Notes',
    'erase': 'Effacer',
    'hint': 'Indice',
    'hints': 'Indices',
  },
  wordle: {
    'guess the word': 'Devine le mot',
    'not enough letters': 'Pas assez de lettres',
    'not in word list': 'Mot absent de la liste',
    'enter': 'Valider',
  },
  hangman: {
    'hangman': 'Le pendu',
    'guess the word': 'Devine le mot',
    'wrong guesses': 'Mauvaises lettres',
    'remaining guesses': 'Essais restants',
  },
  'tic-tac-toe': {
    "player x's turn": 'Au tour du joueur X',
    "player o's turn": 'Au tour du joueur O',
    'player x wins': 'Le joueur X gagne',
    'player o wins': 'Le joueur O gagne',
  },
  minesweeper: {
    'mines': 'Mines',
    'flags': 'Drapeaux',
    'mine': 'Mine',
    'flag': 'Drapeau',
  },
  'speed-typing': {
    'start typing': 'Commence à écrire',
    'typing speed': 'Vitesse de frappe',
    'time left': 'Temps restant',
    'words per minute': 'Mots par minute',
    'accuracy': 'Précision',
    'wpm': 'MPM',
  },
  typing: {
    'start typing': 'Commence à écrire',
    'typing speed': 'Vitesse de frappe',
    'time left': 'Temps restant',
    'words per minute': 'Mots par minute',
    'accuracy': 'Précision',
    'wpm': 'MPM',
  },
  'typing-challenge': {
    'start typing': 'Commence à écrire',
    'typing speed': 'Vitesse de frappe',
    'time left': 'Temps restant',
    'words per minute': 'Mots par minute',
    'accuracy': 'Précision',
    'wpm': 'MPM',
  },
  'type-number-guessing': {
    'guess a number': 'Devine un nombre',
    'guess the number': 'Devine le nombre',
    'too high': 'Trop haut',
    'too low': 'Trop bas',
    'your guess': 'Ton nombre',
  },
  'speak-number-guessing': {
    'guess a number': 'Devine un nombre',
    'guess the number': 'Devine le nombre',
    'speak': 'Parler',
    'speak now': 'Parle maintenant',
    'listen': 'Écouter',
    'listening': 'Écoute en cours…',
    'too high': 'Trop haut',
    'too low': 'Trop bas',
  },
  'connect-four': {
    "red's turn": 'Au tour des rouges',
    "yellow's turn": 'Au tour des jaunes',
    'red wins': 'Les rouges gagnent',
    'yellow wins': 'Les jaunes gagnent',
  },
  'dice-roll-simulator': {
    'roll dice': 'Lancer les dés',
    'roll': 'Lancer',
    'dice': 'Dés',
  },
  quiz: {
    'question': 'Question',
    'answer': 'Réponse',
    'correct answer': 'Bonne réponse',
    'your answer': 'Ta réponse',
  },
  'simon-says': {
    'simon says': 'Jacques a dit',
    'watch': 'Regarde',
    'your turn': 'À ton tour',
    'repeat the sequence': 'Répète la séquence',
  },
  'sliding-puzzle': {
    'shuffle': 'Mélanger',
    'puzzle solved': 'Puzzle réussi !',
  },
};

const dynamicPatterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^score\s*:\s*(.+)$/i, (m) => `Score : ${m[1]}`],
  [/^high score\s*:\s*(.+)$/i, (m) => `Meilleur score : ${m[1]}`],
  [/^best score\s*:\s*(.+)$/i, (m) => `Meilleur score : ${m[1]}`],
  [/^level\s*:\s*(.+)$/i, (m) => `Niveau : ${m[1]}`],
  [/^time\s*:\s*(.+)$/i, (m) => `Temps : ${m[1]}`],
  [/^time left\s*:\s*(.+)$/i, (m) => `Temps restant : ${m[1]}`],
  [/^moves\s*:\s*(.+)$/i, (m) => `Coups : ${m[1]}`],
  [/^attempts\s*:\s*(.+)$/i, (m) => `Essais : ${m[1]}`],
  [/^lives\s*:\s*(.+)$/i, (m) => `Vies : ${m[1]}`],
  [/^round\s*:\s*(.+)$/i, (m) => `Manche : ${m[1]}`],
  [/^question\s+(\d+)$/i, (m) => `Question ${m[1]}`],
  [/^question\s+(\d+)\s+of\s+(\d+)$/i, (m) => `Question ${m[1]} sur ${m[2]}`],
  [/^you scored\s+(.+)$/i, (m) => `Ton score : ${m[1]}`],
  [/^your score\s*:\s*(.+)$/i, (m) => `Ton score : ${m[1]}`],
];

const ignoredParentTags = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA']);
const translatedAttributes = ['placeholder', 'title', 'aria-label'] as const;

function normalize(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function preserveOuterWhitespace(original: string, translated: string) {
  const leading = original.match(/^\s*/)?.[0] ?? '';
  const trailing = original.match(/\s*$/)?.[0] ?? '';
  return `${leading}${translated}${trailing}`;
}

function translateString(value: string, slug: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 180) return value;

  const key = normalize(trimmed);
  const gameTranslation = perGameTranslations[slug]?.[key];
  const direct = gameTranslation ?? commonTranslations[key];
  if (direct) return preserveOuterWhitespace(value, direct);

  for (const [pattern, translator] of dynamicPatterns) {
    const match = trimmed.match(pattern);
    if (match) return preserveOuterWhitespace(value, translator(match));
  }

  return value;
}

function translateTextNode(node: Text, slug: string) {
  const parent = node.parentElement;
  if (!parent || ignoredParentTags.has(parent.tagName)) return;
  const translated = translateString(node.data, slug);
  if (translated !== node.data) node.data = translated;
}

function translateElementAttributes(element: Element, slug: string) {
  for (const attribute of translatedAttributes) {
    const current = element.getAttribute(attribute);
    if (!current) continue;
    const translated = translateString(current, slug);
    if (translated !== current) element.setAttribute(attribute, translated);
  }

  if (element instanceof HTMLInputElement && ['button', 'submit', 'reset'].includes(element.type)) {
    const translated = translateString(element.value, slug);
    if (translated !== element.value) element.value = translated;
  }
}

function translateSubtree(root: Node, slug: string) {
  const doc = root.ownerDocument ?? (root as Document);
  if (!doc?.createTreeWalker) return;

  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text, slug);
    return;
  }

  if (root instanceof Element) translateElementAttributes(root, slug);

  const textWalker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = textWalker.nextNode();
  while (current) {
    translateTextNode(current as Text, slug);
    current = textWalker.nextNode();
  }

  if (root instanceof Element || root instanceof Document) {
    const elementRoot = root instanceof Document ? root.documentElement : root;
    elementRoot?.querySelectorAll('*').forEach((element) => translateElementAttributes(element, slug));
  }
}

export function getFrenchGameName(slug: string, fallback: string) {
  return frenchGameNames[slug] ?? fallback;
}

export function localizeEmbeddedGame(doc: Document, slug: string) {
  const root = doc.documentElement;
  if (!root) return;

  root.lang = 'fr';
  const frenchTitle = frenchGameNames[slug];
  if (frenchTitle) doc.title = frenchTitle;

  translateSubtree(doc, slug);

  if (root.dataset.nowisFrenchObserver === 'true') return;
  root.dataset.nowisFrenchObserver = 'true';

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        translateTextNode(mutation.target as Text, slug);
        continue;
      }

      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        translateElementAttributes(mutation.target, slug);
        continue;
      }

      mutation.addedNodes.forEach((node) => translateSubtree(node, slug));
    }
  });

  observer.observe(doc.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...translatedAttributes, 'value'],
  });
}
