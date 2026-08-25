import { upgradeCandyCrush } from './candyCrushUpgrade';

type UpgradeFn = (doc: Document, win: Window) => void;

const upgrades: Record<string, UpgradeFn> = {
  'candy-crush': upgradeCandyCrush,
};

export function upgradeEmbeddedGame(doc: Document, win: Window, slug: string) {
  const upgrade = upgrades[slug];
  if (!upgrade) return false;
  upgrade(doc, win);
  return true;
}
