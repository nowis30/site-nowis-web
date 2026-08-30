import { upgradeShapeClicker as upgradeShapeClickerCore } from './shapeClickerUpgrade';

export function upgradeShapeClicker(doc, win) {
  let inputLocked = false;
  let activeShape = null;

  const stopEvent = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  const unlockIfRoundChanged = () => {
    if (activeShape && !activeShape.isConnected) {
      inputLocked = false;
      activeShape = null;
    }
  };

  // Empêche une pause automatique pendant la très courte transition d'une cible validée.
  // Sans cela, un changement d'onglet au même instant pourrait interrompre le passage
  // à la prochaine cible et permettre de recompter la même forme au retour.
  doc.addEventListener('visibilitychange', (event) => {
    if (inputLocked) stopEvent(event);
  }, true);

  upgradeShapeClickerCore(doc, win);

  const board = doc.querySelector('#board');
  if (!board) return;

  const lockShape = (button) => {
    inputLocked = true;
    activeShape = button;
  };

  const observer = new win.MutationObserver(unlockIfRoundChanged);
  observer.observe(board, { childList: true });

  board.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-index]');
    if (!button) return;
    unlockIfRoundChanged();
    if (inputLocked) {
      stopEvent(event);
      return;
    }
    lockShape(button);
  }, true);

  // Les commandes qui remplacent ou suspendent la manche attendent la fin de la
  // transition courante. Cela neutralise les doubles pressions et les anciens timers.
  doc.addEventListener('click', (event) => {
    if (!inputLocked) return;
    const control = event.target.closest?.('#pause,#restart,#menuBtn,#helpTop');
    if (control) stopEvent(event);
  }, true);

  doc.addEventListener('keydown', (event) => {
    unlockIfRoundChanged();
    const isPauseKey = event.key === 'p' || event.key === 'P' || event.key === 'Escape';
    const button = event.target?.matches?.('[data-index]') ? event.target : null;
    const isActivation = button && (event.key === ' ' || event.key === 'Enter');

    if (inputLocked && (isPauseKey || isActivation)) {
      stopEvent(event);
      return;
    }
    if (!inputLocked && isActivation) lockShape(button);
  }, true);
}
