export type GameEntry = {
  slug: string;
  name: string;
  src: string;
};

const gamesBaseUrl = '/games/html-css-javascript-games-main';

const htmlCssJavaScriptGameFolders = [
  '01-Candy-Crush-Game',
  '02-Pac-Man-Game',
  '03-Chess-Game',
  '04-Doodle-Jump-Game',
  '05-Solitaire-Game',
  '06-Sudoku-Game',
  '07-Crossy-Road-Game',
  '08-Rock-Paper-Scissors',
  '09-Flappy-Bird-Game',
  '10-2048-Game',
  '11-Wordle-Game',
  '12-Hangman-Game',
  '13-Tower-Blocks',
  '14-Archery-Game',
  '15-Tic-Tac-Toe',
  '16-Minesweeper-Game',
  '17-Speed-Typing-Game',
  '18-Breakout-Game',
  '19-Ping-Pong-Game',
  '20-Tetris-Game',
  '21-Tilting-Maze-Game',
  '22-Memory-Card-Game',
  '23-Type-Number-Guessing-Game',
  '24-Snake-Game',
  '25-Connect-Four-Game',
  '26-Insect-Catch-Game',
  '27-Typing-Game',
  '28-Dice-Roll-Simulator',
  '29-Shape-Clicker-Game',
  '30-Typing-Game',
  '31-Speak-Number-Guessing-Game',
  '32-Fruit-Slicer-Game',
  '33-Quiz-Game',
  '34-Emoji-Catcher-Game',
  '35-Whack-A-Mole-Game',
  '36-Simon-Says-Game',
  '37-Sliding-Puzzle-Game',
] as const;

function formatGameTitle(folderName: string) {
  return folderName
    .replace(/^\d+-/, '')
    .replace(/-Game$/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function toSlug(folderName: string) {
  return folderName
    .replace(/^\d+-/, '')
    .replace(/-Game$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export const gameCatalog: GameEntry[] = htmlCssJavaScriptGameFolders.map((folderName) => ({
  slug: toSlug(folderName),
  name: formatGameTitle(folderName),
  src: `${gamesBaseUrl}/${folderName}/index.html`,
}));

export function findGameBySlug(slug: string) {
  return gameCatalog.find((game) => game.slug === slug) ?? null;
}