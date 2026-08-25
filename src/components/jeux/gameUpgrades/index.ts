import { upgradeCandyCrush } from './candyCrushUpgrade';
import { upgradeChess } from './chessUpgrade';
import { upgradeDoodleJump } from './doodleJumpUpgrade';
import { upgradePacMan } from './pacManUpgrade';
import { upgradeSolitaire } from './solitaireUpgrade';

type UpgradeFn = (doc: Document, win: Window) => void;

const upgrades: Record<string, UpgradeFn> = {
  'candy-crush': upgradeCandyCrush,
  'pac-man': upgradePacMan,
  chess: upgradeChess,
  'doodle-jump': upgradeDoodleJump,
  solitaire: upgradeSolitaire,
};

export function upgradeEmbeddedGame(doc: Document, win: Window, slug: string) {
  const upgrade = upgrades[slug];
  if (!upgrade) return false;
  upgrade(doc, win);
  return true;
}
