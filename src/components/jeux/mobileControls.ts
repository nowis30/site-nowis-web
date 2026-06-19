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
  hint: 'Flèches pour bouger, bouton Action pour sauter/lancer.',
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

const upDownOnly: MobileControlsConfig = {
  move: [
    { id: 'up', label: '↑', key: 'ArrowUp', code: 'ArrowUp', mode: 'hold' },
    { id: 'down', label: '↓', key: 'ArrowDown', code: 'ArrowDown', mode: 'hold' },
  ],
  actions: [],
  hint: 'Utilise haut/bas pour contrôler le joueur.',
  letterPad: false,
};

const tapOnly: MobileControlsConfig = {
  move: [],
  actions: [{ id: 'action', label: 'Tap', key: ' ', code: 'Space', mode: 'tap' }],
  hint: 'Appuie sur Tap pour lancer l\'action principale.',
  letterPad: false,
};

const hangmanLetters: MobileControlsConfig = {
  move: [],
  actions: [],
  hint: 'Choisis les lettres directement avec le clavier mobile ci-dessous.',
  letterPad: true,
};

const bySlug: Record<string, MobileControlsConfig> = {
  'pac-man': arrowsOnly,
  'doodle-jump': leftRightAction,
  'crossy-road': arrowsOnly,
  'flappy-bird': tapOnly,
  '2048': arrowsOnly,
  'tower-blocks': tapOnly,
  'archery': tapOnly,
  'breakout': leftRightAction,
  'ping-pong': upDownOnly,
  'tetris': arrowsWithAction,
  'tilting-maze': arrowsOnly,
  snake: arrowsOnly,
  'speed-typing': noControls,
  typing: noControls,
  'wordle': noControls,
  'hangman': hangmanLetters,
  'speak-number-guessing': noControls,
};

export function getMobileControlsForGame(slug: string): MobileControlsConfig {
  return bySlug[slug] ?? noControls;
}