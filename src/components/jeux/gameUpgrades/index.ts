import { upgrade2048 } from './game2048Upgrade';
import { upgradeArchery } from './archeryUpgrade';
import { upgradeBreakout } from './breakoutUpgrade';
import { upgradeCandyCrush } from './candyCrushUpgrade';
import { upgradeChess } from './chessUpgrade';
import { upgradeConnectFour } from './connectFourUpgrade';
import { upgradeCrossyRoad } from './crossyRoadUpgrade';
import { upgradeDiceRollSimulator } from './diceRollUpgrade';
import { upgradeDoodleJump } from './doodleJumpUpgrade';
import { upgradeFlappyBird } from './flappyBirdUpgrade';
import { upgradeHangman } from './hangmanUpgrade';
import { upgradeInsectCatch } from './insectCatchUpgrade';
import { upgradeMemoryCard } from './memoryCardUpgrade';
import { upgradeMinesweeper } from './minesweeperUpgrade';
import { upgradePacMan } from './pacManUpgrade';
import { upgradePingPong } from './pingPongUpgrade';
import { upgradeRockPaperScissors } from './rockPaperScissorsUpgrade';
import { upgradeShapeClicker } from './shapeClickerSafeUpgrade';
import { upgradeSnake } from './snakeUpgrade';
import { upgradeSolitaire } from './solitaireUpgrade';
import { upgradeSpeedTyping } from './speedTypingUpgrade';
import { upgradeSudoku } from './sudokuUpgrade';
import { upgradeTetris } from './tetrisUpgrade';
import { upgradeTicTacToe } from './ticTacToeUpgrade';
import { upgradeTiltingMaze } from './tiltingMazeUpgrade';
import { upgradeTowerBlocks } from './towerBlocksUpgrade';
import { upgradeTypeNumberGuessing } from './typeNumberGuessingUpgrade';
import { upgradeTyping } from './typingUpgrade';
import { upgradeTypingChallenge } from './typingChallengeUpgrade';
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
  hangman: upgradeHangman,
  'tower-blocks': upgradeTowerBlocks,
  archery: upgradeArchery,
  'tic-tac-toe': upgradeTicTacToe,
  minesweeper: upgradeMinesweeper,
  'speed-typing': upgradeSpeedTyping,
  breakout: upgradeBreakout,
  'ping-pong': upgradePingPong,
  tetris: upgradeTetris,
  'tilting-maze': upgradeTiltingMaze,
  'memory-card': upgradeMemoryCard,
  'type-number-guessing': upgradeTypeNumberGuessing,
  snake: upgradeSnake,
  'connect-four': upgradeConnectFour,
  'insect-catch': upgradeInsectCatch,
  typing: upgradeTyping,
  'dice-roll-simulator': upgradeDiceRollSimulator,
  'shape-clicker': upgradeShapeClicker,
  'typing-challenge': upgradeTypingChallenge,
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
