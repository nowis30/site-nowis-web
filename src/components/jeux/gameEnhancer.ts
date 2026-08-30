import type { GameExperienceProfile } from './gameExperience';
import { localizeEmbeddedGame } from './gameLocalization';
import { localizeGameRuntime } from './gameRuntimeLocalization';

const STYLE_ID = 'nowis-mobile-game-enhancer';
const VIEWPORT_MARKER = 'nowis-mobile-viewport';

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
    .nowis-touch-none body {
      user-select: none;
    }
    .nowis-touch-none input,
    .nowis-touch-none textarea,
    .nowis-touch-none select {
      user-select: text;
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

/**
 * Compatibility layer for the two legacy games that have not yet been rebuilt.
 * Source remakes are mounted directly by GameDetailScreen and never pass here.
 */
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
    localizeEmbeddedGame(doc, profile.slug);
    localizeGameRuntime(win);

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

    win.focus();
    return true;
  } catch {
    // Legacy /games content is expected to stay same-origin. If a browser isolates
    // the frame anyway, leave the original game intact rather than partially patching it.
    return false;
  }
}
