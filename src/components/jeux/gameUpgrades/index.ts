import { upgradeCandyCrush } from './candyCrushUpgrade';
import { upgradeChess } from './chessUpgrade';
import { upgradeDoodleJump } from './doodleJumpUpgrade';
import { upgradePacMan } from './pacManUpgrade';

type UpgradeFn = (doc: Document, win: Window) => void;

const upgrades: Record<string, UpgradeFn> = {
  'candy-crush': upgradeCandyCrush,
  'pac-man': upgradePacMan,
  chess: upgradeChess,
  'doodle-jump': upgradeDoodleJump,
};

export function upgradeEmbeddedGame(doc: Document, win: Window, slug: string) {
  const upgrade = upgrades[slug];
  if (!upgrade) return false;
  upgrade(doc, win);
  return true;
}
