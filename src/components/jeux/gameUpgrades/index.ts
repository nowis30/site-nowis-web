import { upgrade2048 } from './game2048Upgrade';
import { upgradeCandyCrush } from './candyCrushUpgrade';
import { upgradeChess } from './chessUpgrade';
import { upgradeCrossyRoad } from './crossyRoadUpgrade';
import { upgradeDoodleJump } from './doodleJumpUpgrade';
import { upgradeFlappyBird } from './flappyBirdUpgrade';
import { upgradePacMan } from './pacManUpgrade';
import { upgradeRockPaperScissors } from './rockPaperScissorsUpgrade';
import { upgradeSolitaire } from './solitaireUpgrade';
import { upgradeSudoku } from './sudokuUpgrade';
import { upgradeWordle } from './wordleUpgrade';

type UpgradeFn = (doc: Document, win: Window) => void;

const sourceGames: Record<string, UpgradeFn> = {
  'candy-crush': upgradeCandyCrush,
  'pac-man': upgradePacMan,
  chess: upgradeChess,
  'doodle-jump': upgradeDoodleJump,
  solitaire: upgradeSolitaire,
  sudoku: upgradeSudoku,
  'crossy-road': upgradeCrossyRoad,
  'rock-paper-scissors': upgradeRockPaperScissors,
  'flappy-bird': upgradeFlappyBird,
  '2048': upgrade2048,
  wordle: upgradeWordle,
};

export function hasSourceGame(slug: string) {
  return Boolean(sourceGames[slug]);
}

export function upgradeEmbeddedGame(doc: Document, win: Window, slug: string) {
  const upgrade = sourceGames[slug];
  if (!upgrade) return false;
  upgrade(doc, win);
  return true;
}
