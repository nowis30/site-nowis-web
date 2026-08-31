export type GameEntry = {
  slug: string;
  name: string;
};

// Canonical NOWIS catalog. Every entry below is backed by a source engine in
// gameUpgrades/index.ts; no legacy HTML/S3 URL is retained in the public model.
export const gameCatalog: GameEntry[] = [
  { slug: 'candy-crush', name: 'Candy Crush' },
  { slug: 'pac-man', name: 'Pac-Man' },
  { slug: 'chess', name: 'Échecs' },
  { slug: 'doodle-jump', name: 'Doodle Jump' },
  { slug: 'solitaire', name: 'Solitaire' },
  { slug: 'sudoku', name: 'Sudoku' },
  { slug: 'crossy-road', name: 'Crossy Road' },
  { slug: 'rock-paper-scissors', name: 'Pierre, papier, ciseaux' },
  { slug: 'flappy-bird', name: 'Flappy Bird' },
  { slug: '2048', name: '2048' },
  { slug: 'wordle', name: 'Wordle' },
  { slug: 'hangman', name: 'Le pendu' },
  { slug: 'tower-blocks', name: 'Tour de blocs' },
  { slug: 'archery', name: 'Tir à l’arc' },
  { slug: 'tic-tac-toe', name: 'Morpion' },
  { slug: 'minesweeper', name: 'Démineur' },
  { slug: 'speed-typing', name: 'Frappe rapide' },
  { slug: 'breakout', name: 'Casse-briques' },
  { slug: 'ping-pong', name: 'Ping-pong' },
  { slug: 'tetris', name: 'Tetris' },
  { slug: 'tilting-maze', name: 'Labyrinthe inclinable' },
  { slug: 'memory-card', name: 'Jeu de mémoire' },
  { slug: 'type-number-guessing', name: 'Devine le nombre' },
  { slug: 'snake', name: 'Serpent' },
  { slug: 'connect-four', name: 'Puissance 4' },
  { slug: 'insect-catch', name: 'Attrape-insectes' },
  { slug: 'typing', name: 'Jeu de frappe' },
  { slug: 'dice-roll-simulator', name: 'Simulateur de dés' },
  { slug: 'shape-clicker', name: 'Clique-formes' },
  { slug: 'typing-challenge', name: 'Défi de frappe' },
  { slug: 'speak-number-guessing', name: 'Devine le nombre à voix haute' },
  { slug: 'fruit-slicer', name: 'Coupe-fruits' },
  { slug: 'quiz', name: 'Quiz' },
  { slug: 'emoji-catcher', name: 'Attrape-émojis' },
  { slug: 'whack-a-mole', name: 'Tape-taupe' },
  { slug: 'simon-says', name: 'Jacques a dit' },
  { slug: 'sliding-puzzle', name: 'Puzzle coulissant' },
];

export function findGameBySlug(slug: string) {
  return gameCatalog.find((game) => game.slug === slug) ?? null;
}
