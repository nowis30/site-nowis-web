import type { GameExperienceProfile } from './gameExperience';

const STYLE_ID = 'nowis-mobile-game-enhancer';
const VIEWPORT_MARKER = 'nowis-mobile-viewport';

function dispatchKey(targetWindow: Window, key: string, code: string) {
  const init: KeyboardEventInit = {
    key,
    code,
    bubbles: true,
    cancelable: true,
  };

  const targets: EventTarget[] = [targetWindow];
  if (targetWindow.document) {
    targets.push(targetWindow.document, targetWindow.document.body);
  }

  for (const target of targets) {
    if (!target) continue;
    target.dispatchEvent(new KeyboardEvent('keydown', init));
    target.dispatchEvent(new KeyboardEvent('keyup', init));
  }
}

function gestureTargetShouldBeIgnored(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, button, a, [contenteditable="true"]'));
}

function installSwipeControls(doc: Document, win: Window) {
  const root = doc.documentElement;
  if (root.dataset.nowisSwipeReady === 'true') return;
  root.dataset.nowisSwipeReady = 'true';

  let startX = 0;
  let startY = 0;
  let startAt = 0;
  let tracking = false;

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' || gestureTargetShouldBeIgnored(event.target)) return;
    startX = event.clientX;
    startY = event.clientY;
    startAt = Date.now();
    tracking = true;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!tracking || event.pointerType === 'mouse' || gestureTargetShouldBeIgnored(event.target)) {
      tracking = false;
      return;
    }

    tracking = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const distance = Math.hypot(dx, dy);
    const elapsed = Date.now() - startAt;

    if (distance < 24 || elapsed > 900) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      dispatchKey(win, dx > 0 ? 'ArrowRight' : 'ArrowLeft', dx > 0 ? 'ArrowRight' : 'ArrowLeft');
      return;
    }

    dispatchKey(win, dy > 0 ? 'ArrowDown' : 'ArrowUp', dy > 0 ? 'ArrowDown' : 'ArrowUp');
  };

  doc.addEventListener('pointerdown', onPointerDown, { passive: true });
  doc.addEventListener('pointerup', onPointerUp, { passive: true });
  doc.addEventListener('pointercancel', () => {
    tracking = false;
  }, { passive: true });
}

function ensureViewport(doc: Document) {
  let viewport = doc.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!viewport) {
    viewport = doc.createElement('meta');
    viewport.name = 'viewport';
    viewport.dataset.nowisMarker = VIEWPORT_MARKER;
    doc.head?.appendChild(viewport);
  }

  viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover';
}

function installStyles(doc: Document) {
  if (doc.getElementById(STYLE_ID)) return;

  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      width: 100%;
      max-width: 100%;
      min-height: 100%;
      margin: 0;
      overflow-x: hidden !important;
      overscroll-behavior: contain;
      -webkit-text-size-adjust: 100%;
    }
    body {
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
    }
    img, svg, video, canvas {
      max-width: 100% !important;
    }
    canvas {
      display: block;
      margin-inline: auto;
      object-fit: contain;
    }
    body > main,
    body > section,
    body > article,
    body > div,
    .container,
    .wrapper,
    .game-container,
    .game-wrapper,
    #game-container,
    #game-wrapper {
      max-width: 100% !important;
    }
    input, textarea, select {
      max-width: 100%;
    }
    input, textarea, select, button {
      font: inherit;
    }
    input, textarea, select {
      font-size: 16px !important;
    }
    .nowis-layout-square body,
    .nowis-layout-portrait body,
    .nowis-layout-landscape body,
    .nowis-layout-tall body {
      min-height: 100dvh;
    }
    .nowis-touch-none body,
    .nowis-touch-none canvas,
    .nowis-touch-none .board,
    .nowis-touch-none #board,
    .nowis-touch-none .game-board,
    .nowis-touch-none .game-container,
    .nowis-touch-none #game-container {
      touch-action: none !important;
    }
    .nowis-touch-manipulation body {
      touch-action: manipulation;
    }
    @media (max-width: 900px) {
      html, body {
        min-width: 0 !important;
      }
      body {
        padding-left: max(4px, env(safe-area-inset-left));
        padding-right: max(4px, env(safe-area-inset-right));
        padding-bottom: max(4px, env(safe-area-inset-bottom));
      }
      button,
      [role="button"],
      input[type="button"],
      input[type="submit"] {
        min-height: 44px;
        min-width: 44px;
        touch-action: manipulation;
      }
      table {
        max-width: 100% !important;
      }
      .container,
      .wrapper,
      .game-container,
      .game-wrapper,
      #game-container,
      #game-wrapper {
        width: min(100%, 100vw) !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
      .nowis-layout-square :is(canvas, #board, .board, .game-board, .game-grid, .grid),
      .nowis-layout-portrait :is(canvas, #board, .board, .game-board, .game-grid, .grid),
      .nowis-layout-tall :is(#board, .board, .game-board, .game-grid, .grid) {
        max-width: min(96vw, 720px) !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
      .nowis-layout-landscape canvas {
        max-height: calc(100dvh - 16px) !important;
      }
      .nowis-layout-tall body {
        overflow-y: auto !important;
      }
    }
  `;

  doc.head?.appendChild(style);
}

export function enhanceEmbeddedGame(
  iframe: HTMLIFrameElement,
  profile: GameExperienceProfile,
) {
  try {
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win || !doc.documentElement) return false;

    ensureViewport(doc);
    installStyles(doc);

    const root = doc.documentElement;
    root.dataset.nowisEnhanced = 'true';
    root.classList.remove(
      'nowis-layout-square',
      'nowis-layout-portrait',
      'nowis-layout-landscape',
      'nowis-layout-tall',
      'nowis-touch-none',
      'nowis-touch-manipulation',
    );
    root.classList.add(`nowis-layout-${profile.layout}`);

    if (profile.touchAction === 'none') {
      root.classList.add('nowis-touch-none');
    } else if (profile.touchAction === 'manipulation') {
      root.classList.add('nowis-touch-manipulation');
    }

    if (profile.preventContextMenu && root.dataset.nowisContextMenuReady !== 'true') {
      root.dataset.nowisContextMenuReady = 'true';
      doc.addEventListener('contextmenu', (event) => event.preventDefault());
    }

    if (profile.swipeToKeys) {
      installSwipeControls(doc, win);
    }

    win.focus();
    return true;
  } catch {
    // The S3 games are normally proxied through /games and are same-origin.
    // If a browser treats one as cross-origin, the game still remains playable.
    return false;
  }
}
