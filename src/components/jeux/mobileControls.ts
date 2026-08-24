export type MobileControlButton = {
  id: string;
  label: string;
  key: string;
  code: string;
  mode: 'hold' | 'tap';
};

export type MobileControlsConfig = {
  move: MobileControlButton[];
  actions: MobileControlButton[];
  hint: string;
  letterPad?: boolean;
};

const noControls: MobileControlsConfig = {
  move: [],
  actions: [],
  hint: 'Ce jeu se joue surtout au toucher directement dans la zone du jeu.',
  letterPad: false,
};

const arrowsOnly: MobileControlsConfig = {
  move: [
    { id: 'up', label: '↑', key: 'ArrowUp', code: 'ArrowUp', mode: 'hold' },
    { id: 'left', label: '←', key: 'ArrowLeft', code: 'ArrowLeft', mode: 'hold' },
    { id: 'down', label: '↓', key: 'ArrowDown', code: 'ArrowDown', mode: 'hold' },
    { id: 'right', label: '→', key: 'ArrowRight', code: 'ArrowRight', mode: 'hold' },
  ],
  actions: [],
  hint: 'Utilise les flèches tactiles pour déplacer ton personnage.',
  letterPad: false,
};

const arrowsWithAction: MobileControlsConfig = {
  move: arrowsOnly.move,
  actions: [{ id: 'action', label: 'Action', key: ' ', code: 'Space', mode: 'tap' }],
  hint: 'Flèches pour bouger, bouton Action pour l’action principale.',
  letterPad: false,
};

const leftRightAction: MobileControlsConfig = {
  move: [
    { id: 'left', label: '←', key: 'ArrowLeft', code: 'ArrowLeft', mode: 'hold' },
    { id: 'right', label: '→', key: 'ArrowRight', code: 'ArrowRight', mode: 'hold' },
  ],
  actions: [{ id: 'action', label: 'Action', key: ' ', code: 'Space', mode: 'tap' }],
  hint: 'Utilise gauche/droite et Action.',
  letterPad: false,
};

const upDownAction: MobileControlsConfig = {
  move: [
    { id: 'up', label: '↑', key: 'ArrowUp', code: 'ArrowUp', mode: 'hold' },
    { id: 'down', label: '↓', key: 'ArrowDown', code: 'ArrowDown', mode: 'hold' },
  ],
  actions: [{ id: 'action', label: 'Démarrer', key: ' ', code: 'Space', mode: 'tap' }],
  hint: 'Utilise haut/bas pour la raquette et Démarrer si la partie est en attente.',
  letterPad: false,
};

function tapControl(label: string): MobileControlsConfig {
  return {
    move: [],
    actions: [{ id: 'action', label, key: ' ', code: 'Space', mode: 'tap' }],
    hint: `Appuie sur ${label} pour lancer l’action principale.`,
    letterPad: false,
  };
}

const hangmanLetters: MobileControlsConfig = {
  move: [],
  actions: [],
  hint: 'Choisis les lettres directement avec le clavier mobile ci-dessous.',
  letterPad: true,
};

const sudokuDigits: MobileControlsConfig = {
  move: [],
  actions: [
    ...Array.from({ length: 9 }, (_, index) => {
      const digit = String(index + 1);
      return {
        id: `digit-${digit}`,
        label: digit,
        key: digit,
        code: `Digit${digit}`,
        mode: 'tap' as const,
      };
    }),
    { id: 'erase', label: 'Effacer', key: 'Backspace', code: 'Backspace', mode: 'tap' },
  ],
  hint: 'Sélectionne une case puis touche un chiffre. Effacer envoie Backspace.',
  letterPad: false,
};

const tetrisControls: MobileControlsConfig = {
  move: arrowsOnly.move,
  actions: [
    { id: 'rotate', label: 'Rotation ↻', key: 'ArrowUp', code: 'ArrowUp', mode: 'tap' },
    { id: 'drop', label: 'Chute', key: ' ', code: 'Space', mode: 'tap' },
  ],
  hint: 'Flèches pour déplacer, Rotation pour tourner, Chute pour accélérer.',
  letterPad: false,
};

const bySlug: Record<string, MobileControlsConfig> = {
  'pac-man': arrowsOnly,
  'doodle-jump': leftRightAction,
  sudoku: sudokuDigits,
  'crossy-road': arrowsOnly,
  'flappy-bird': tapControl('Battre des ailes'),
  '2048': arrowsOnly,
  'tower-blocks': tapControl('Poser le bloc'),
  archery: tapControl('Tirer'),
  breakout: {
    ...leftRightAction,
    actions: [{ id: 'action', label: 'Lancer', key: ' ', code: 'Space', mode: 'tap' }],
  },
  'ping-pong': upDownAction,
  tetris: tetrisControls,
  'tilting-maze': arrowsOnly,
  snake: arrowsOnly,
  'speed-typing': noControls,
  typing: noControls,
  'typing-challenge': noControls,
  wordle: noControls,
  hangman: hangmanLetters,
  'speak-number-guessing': noControls,
};

export function getMobileControlsForGame(slug: string): MobileControlsConfig {
  return bySlug[slug] ?? noControls;
}
