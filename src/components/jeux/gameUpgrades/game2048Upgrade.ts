type Direction = 'left' | 'right' | 'up' | 'down';
type Mode = 'classic' | 'timed' | 'zen';
type Snapshot = {
  board: number[];
  score: number;
  moves: number;
  streak: number;
  reachedGoal: boolean;
};
type Stats = {
  bestScore: number;
  bestTile: number;
  games: number;
  wins: number;
  bestTimeMs: number | null;
};
type ModeConfig = {
  label: string;
  description: string;
  goal: number;
  timeLimitMs: number;
  undoLimit: number;
};

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const SIZE = 4;
const CELL_COUNT = SIZE * SIZE;
const STATS_KEY = 'nowis:2048:stats';

const MODES: Record<Mode, ModeConfig> = {
  classic: {
    label: 'Classique',
    description: 'Atteins 2048 avec les règles classiques et une annulation de secours.',
    goal: 2048,
    timeLimitMs: 0,
    undoLimit: 1,
  },
  timed: {
    label: 'Chrono',
    description: 'Trois minutes pour faire le meilleur score possible. Aucune annulation.',
    goal: 2048,
    timeLimitMs: 180_000,
    undoLimit: 0,
  },
  zen: {
    label: 'Zen 4096',
    description: 'Sans limite de temps, avec annulations illimitées et un objectif de 4096.',
    goal: 4096,
    timeLimitMs: 0,
    undoLimit: Number.POSITIVE_INFINITY,
  },
};

function emptyStats(): Stats {
  return { bestScore: 0, bestTile: 0, games: 0, wins: 0, bestTimeMs: null };
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function maxTile(board: number[]) {
  return Math.max(0, ...board);
}

function boardsEqual(a: number[], b: number[]) {
  return a.every((value, index) => value === b[index]);
}

function canMove(board: number[]) {
  if (board.some((value) => value === 0)) return true;
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const index = row * SIZE + col;
      if (col < SIZE - 1 && board[index] === board[index + 1]) return true;
      if (row < SIZE - 1 && board[index] === board[index + SIZE]) return true;
    }
  }
  return false;
}

function lineIndices(direction: Direction, line: number) {
  if (direction === 'left') return [0, 1, 2, 3].map((col) => line * SIZE + col);
  if (direction === 'right') return [3, 2, 1, 0].map((col) => line * SIZE + col);
  if (direction === 'up') return [0, 1, 2, 3].map((row) => row * SIZE + line);
  return [3, 2, 1, 0].map((row) => row * SIZE + line);
}

function slideLine(values: number[]) {
  const compact = values.filter((value) => value !== 0);
  const output: number[] = [];
  const mergedOffsets: number[] = [];
  let gained = 0;

  for (let index = 0; index < compact.length; index += 1) {
    const value = compact[index];
    if (compact[index + 1] === value) {
      const merged = value * 2;
      output.push(merged);
      mergedOffsets.push(output.length - 1);
      gained += merged;
      index += 1;
    } else {
      output.push(value);
    }
  }

  while (output.length < SIZE) output.push(0);
  return { output, mergedOffsets, gained };
}

export function upgrade2048(doc: Document, win: Window) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowis2048Pro === 'true') return;
  root.dataset.nowis2048Pro = 'true';
  root.lang = 'fr';
  doc.title = '2048 NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"], script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    :root { color-scheme:dark; font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif; }
    * { box-sizing:border-box; }
    html,body { width:100%; min-height:100%; margin:0; background:#080b1f; color:#fff; }
    body { min-height:100dvh; overflow-x:hidden; user-select:none; -webkit-tap-highlight-color:transparent; }
    button { font:inherit; }
    .g2048-app { min-height:100dvh; display:flex; flex-direction:column; align-items:center; gap:8px; padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left)); background:radial-gradient(circle at 50% -8%,rgba(124,58,237,.28),transparent 32%),radial-gradient(circle at 100% 35%,rgba(6,182,212,.13),transparent 28%),linear-gradient(180deg,#0b1028,#080b1f 65%,#060716); }
    .g2048-head,.g2048-hud,.g2048-board-wrap,.g2048-tools,.g2048-pad,.g2048-progress { width:min(100%,560px); }
    .g2048-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .g2048-brand small { display:block; color:#67e8f9; font-size:10px; font-weight:950; letter-spacing:.18em; text-transform:uppercase; }
    .g2048-brand h1 { margin:1px 0 0; font-size:clamp(28px,8vw,42px); line-height:.95; letter-spacing:-.07em; background:linear-gradient(100deg,#fde047,#fb7185 48%,#a78bfa); -webkit-background-clip:text; color:transparent; filter:drop-shadow(0 0 14px rgba(251,113,133,.16)); }
    .g2048-head-actions { display:flex; gap:6px; }
    .g2048-head button,.g2048-tools button,.g2048-pad button,.g2048-card button { min-height:44px; border:1px solid rgba(148,163,184,.25); border-radius:13px; background:rgba(15,23,42,.88); color:#e2e8f0; font-weight:850; cursor:pointer; touch-action:manipulation; }
    .g2048-head button { min-width:44px; padding:0 10px; }
    .g2048-hud { display:grid; grid-template-columns:repeat(5,1fr); gap:5px; }
    .g2048-stat { padding:6px 3px; text-align:center; border:1px solid rgba(139,92,246,.2); border-radius:11px; background:rgba(15,23,42,.72); box-shadow:inset 0 1px rgba(255,255,255,.03); }
    .g2048-stat span { display:block; color:#94a3b8; font-size:9px; font-weight:900; letter-spacing:.06em; text-transform:uppercase; }
    .g2048-stat strong { display:block; margin-top:2px; font-size:clamp(13px,3.8vw,18px); font-variant-numeric:tabular-nums; white-space:nowrap; }
    .g2048-progress { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:7px; padding:0 2px; }
    .g2048-progress span { color:#cbd5e1; font-size:10px; font-weight:850; white-space:nowrap; }
    .g2048-track { height:7px; overflow:hidden; border-radius:999px; background:#1e293b; box-shadow:inset 0 1px 4px rgba(0,0,0,.45); }
    .g2048-track > i { display:block; width:0; height:100%; border-radius:inherit; background:linear-gradient(90deg,#22d3ee,#8b5cf6,#f472b6,#facc15); box-shadow:0 0 12px rgba(167,139,250,.45); transition:width .24s ease; }
    .g2048-board-wrap { position:relative; display:flex; justify-content:center; padding:7px; border:1px solid rgba(167,139,250,.26); border-radius:22px; background:linear-gradient(145deg,rgba(30,41,59,.94),rgba(15,23,42,.94)); box-shadow:0 22px 65px rgba(0,0,0,.48),0 0 40px rgba(99,102,241,.08); }
    .g2048-board { width:min(100%,520px); aspect-ratio:1; display:grid; grid-template-columns:repeat(4,1fr); gap:clamp(6px,1.8vw,10px); padding:clamp(7px,2vw,11px); border-radius:17px; background:linear-gradient(145deg,#111936,#0c122c); touch-action:none; outline:none; }
    .g2048-cell { position:relative; display:flex; align-items:center; justify-content:center; min-width:0; aspect-ratio:1; overflow:hidden; border-radius:clamp(11px,3vw,17px); background:rgba(51,65,85,.38); box-shadow:inset 0 1px rgba(255,255,255,.04); }
    .g2048-tile { width:100%; height:100%; display:flex; align-items:center; justify-content:center; border-radius:inherit; color:#fff; font-size:clamp(22px,8.3vw,50px); font-weight:1000; letter-spacing:-.055em; text-shadow:0 2px 3px rgba(0,0,0,.23); box-shadow:inset 0 2px rgba(255,255,255,.18),0 8px 18px rgba(0,0,0,.22); transform:translateZ(0); }
    .g2048-tile[data-digits="4"] { font-size:clamp(20px,7.2vw,43px); }
    .g2048-tile[data-digits="5"] { font-size:clamp(17px,6.1vw,36px); }
    .g2048-tile.spawn { animation:g2048-spawn .2s cubic-bezier(.2,.9,.3,1.35); }
    .g2048-tile.merge { animation:g2048-merge .26s cubic-bezier(.2,.9,.3,1.45); }
    @keyframes g2048-spawn { from { opacity:.25; transform:scale(.45) rotate(-3deg); } to { opacity:1; transform:scale(1); } }
    @keyframes g2048-merge { 0% { transform:scale(.82); } 55% { transform:scale(1.16); filter:brightness(1.22); } 100% { transform:scale(1); } }
    .v2 { background:linear-gradient(145deg,#64748b,#475569); }
    .v4 { background:linear-gradient(145deg,#0ea5e9,#2563eb); }
    .v8 { background:linear-gradient(145deg,#06b6d4,#0891b2); }
    .v16 { background:linear-gradient(145deg,#10b981,#059669); }
    .v32 { background:linear-gradient(145deg,#84cc16,#4d7c0f); }
    .v64 { background:linear-gradient(145deg,#facc15,#eab308); color:#27220a; text-shadow:none; }
    .v128 { background:linear-gradient(145deg,#fb923c,#ea580c); }
    .v256 { background:linear-gradient(145deg,#fb7185,#e11d48); }
    .v512 { background:linear-gradient(145deg,#f472b6,#db2777); }
    .v1024 { background:linear-gradient(145deg,#c084fc,#7c3aed); box-shadow:inset 0 2px rgba(255,255,255,.2),0 0 24px rgba(168,85,247,.28); }
    .v2048 { background:linear-gradient(145deg,#fde047,#f59e0b 65%,#fb7185); color:#271705; text-shadow:0 1px rgba(255,255,255,.28); box-shadow:inset 0 2px rgba(255,255,255,.3),0 0 32px rgba(250,204,21,.42); }
    .v4096,.v8192,.vmax { background:linear-gradient(135deg,#22d3ee,#8b5cf6 38%,#ec4899 68%,#facc15); box-shadow:inset 0 2px rgba(255,255,255,.28),0 0 34px rgba(139,92,246,.42); }
    .g2048-message { position:absolute; top:12px; left:50%; z-index:5; transform:translateX(-50%) translateY(-8px); max-width:88%; padding:7px 12px; border:1px solid rgba(255,255,255,.16); border-radius:999px; background:rgba(2,6,23,.9); color:#fef08a; font-size:11px; font-weight:950; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; opacity:0; pointer-events:none; transition:.18s ease; }
    .g2048-message.show { opacity:1; transform:translateX(-50%) translateY(0); }
    .g2048-tools { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; }
    .g2048-tools button { padding:7px 3px; font-size:11px; }
    .g2048-tools .primary { color:#cffafe; border-color:rgba(34,211,238,.38); background:rgba(8,145,178,.16); }
    .g2048-tools button:disabled { opacity:.4; cursor:not-allowed; }
    .g2048-pad { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
    .g2048-pad button { min-height:50px; font-size:22px; background:linear-gradient(180deg,#1e293b,#111827); touch-action:none; }
    .g2048-pad button:active { transform:scale(.95); border-color:#a78bfa; color:#ddd6fe; background:#312e81; }
    .g2048-overlay { position:fixed; inset:0; z-index:70; display:flex; align-items:center; justify-content:center; padding:18px; background:rgba(2,6,23,.86); backdrop-filter:blur(13px); }
    .g2048-overlay.hidden { display:none; }
    .g2048-card { width:min(100%,450px); max-height:min(90dvh,700px); overflow:auto; padding:22px; border:1px solid rgba(167,139,250,.3); border-radius:22px; background:linear-gradient(155deg,#111936,#1e1b4b); box-shadow:0 30px 90px rgba(0,0,0,.62); }
    .g2048-card small { color:#67e8f9; font-size:10px; font-weight:950; letter-spacing:.16em; text-transform:uppercase; }
    .g2048-card h2 { margin:5px 0 7px; font-size:clamp(26px,8vw,34px); letter-spacing:-.045em; }
    .g2048-card p { margin:0; color:#cbd5e1; line-height:1.52; font-size:14px; }
    .g2048-mode-list { display:grid; gap:8px; margin-top:16px; }
    .g2048-mode { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:10px; width:100%; min-height:64px!important; padding:9px 11px; text-align:left; }
    .g2048-mode b { display:block; color:#fff; font-size:14px; }
    .g2048-mode span { display:block; margin-top:2px; color:#94a3b8; font-size:11px; line-height:1.35; }
    .g2048-mode em { color:#fde68a; font-size:20px; font-style:normal; }
    .g2048-actions { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:16px; }
    .g2048-card button { padding:11px; }
    .g2048-card .primary { border-color:#a78bfa; background:linear-gradient(135deg,#6d28d9,#7c3aed); color:#fff; }
    .g2048-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-top:14px; }
    .g2048-stats div { padding:9px 5px; text-align:center; border-radius:11px; background:rgba(30,41,59,.72); }
    .g2048-stats span { display:block; color:#94a3b8; font-size:9px; text-transform:uppercase; font-weight:900; }
    .g2048-stats strong { display:block; margin-top:3px; font-size:17px; }
    .sr-only { position:absolute!important; width:1px!important; height:1px!important; padding:0!important; margin:-1px!important; overflow:hidden!important; clip:rect(0,0,0,0)!important; white-space:nowrap!important; border:0!important; }
    @media (min-width:720px) { .g2048-pad { max-width:350px; } }
    @media (max-height:710px) { .g2048-app { gap:5px; } .g2048-head h1 { font-size:27px; } .g2048-board-wrap { max-width:min(100%,430px); } .g2048-pad button { min-height:44px; } }
    @media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation-duration:.001ms!important; transition-duration:.001ms!important; } }
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
    <main class="g2048-app">
      <header class="g2048-head">
        <div class="g2048-brand"><small>Casse-tête NOWIS</small><h1>2048</h1></div>
        <div class="g2048-head-actions"><button id="g2048Sound" type="button" aria-label="Activer ou désactiver le son">🔊</button><button id="g2048Help" type="button" aria-label="Aide">?</button></div>
      </header>
      <section class="g2048-hud" aria-label="Statistiques de la partie">
        <div class="g2048-stat"><span>Score</span><strong id="g2048Score">0</strong></div>
        <div class="g2048-stat"><span>Record</span><strong id="g2048Best">0</strong></div>
        <div class="g2048-stat"><span>Case</span><strong id="g2048Max">2</strong></div>
        <div class="g2048-stat"><span>Série</span><strong id="g2048Streak">×0</strong></div>
        <div class="g2048-stat"><span>Temps</span><strong id="g2048Time">0:00</strong></div>
      </section>
      <section class="g2048-progress" aria-label="Progression vers l'objectif"><span id="g2048ModeLabel">Classique</span><div class="g2048-track"><i id="g2048Progress"></i></div><span id="g2048Goal">2048</span></section>
      <section class="g2048-board-wrap">
        <div id="g2048Board" class="g2048-board" role="grid" tabindex="0" aria-label="Grille de 2048, glissez ou utilisez les flèches"></div>
        <div id="g2048Message" class="g2048-message">Fusion !</div>
      </section>
      <section class="g2048-tools">
        <button class="primary" id="g2048Pause" type="button">⏸ Pause</button>
        <button id="g2048Undo" type="button">↶ Annuler</button>
        <button id="g2048Restart" type="button">↻ Rejouer</button>
        <button id="g2048Mode" type="button">⚙ Mode</button>
      </section>
      <section class="g2048-pad" aria-label="Commandes tactiles">
        <button data-move="left" type="button" aria-label="Déplacer à gauche">←</button>
        <button data-move="up" type="button" aria-label="Déplacer vers le haut">↑</button>
        <button data-move="down" type="button" aria-label="Déplacer vers le bas">↓</button>
        <button data-move="right" type="button" aria-label="Déplacer à droite">→</button>
      </section>
      <div id="g2048Live" class="sr-only" aria-live="polite"></div>
    </main>
    <div class="g2048-overlay" id="g2048Intro"><section class="g2048-card"><small>Nouvelle version NOWIS</small><h2>Fusionne. Planifie. Survis.</h2><p>Chaque déplacement compte : une nouvelle case apparaît seulement si la grille a réellement bougé. Choisis ton défi.</p><div class="g2048-mode-list"><button class="g2048-mode" data-mode="classic" type="button"><em>🏆</em><span><b>Classique</b>Objectif 2048 · 1 annulation</span><strong>2048</strong></button><button class="g2048-mode" data-mode="timed" type="button"><em>⚡</em><span><b>Chrono</b>3 minutes · aucune annulation</span><strong>3:00</strong></button><button class="g2048-mode" data-mode="zen" type="button"><em>🌌</em><span><b>Zen 4096</b>Sans limite · annulations illimitées</span><strong>4096</strong></button></div></section></div>
    <div class="g2048-overlay hidden" id="g2048PauseOverlay"><section class="g2048-card"><small>Pause</small><h2>La grille est figée</h2><p>Ton score, ton temps et tes cases sont conservés.</p><div class="g2048-actions"><button class="primary" id="g2048Resume" type="button">Reprendre</button><button id="g2048PauseRestart" type="button">Recommencer</button></div></section></div>
    <div class="g2048-overlay hidden" id="g2048Result"><section class="g2048-card"><small id="g2048ResultSmall">Partie terminée</small><h2 id="g2048ResultTitle">Belle partie !</h2><p id="g2048ResultText"></p><div class="g2048-stats"><div><span>Score</span><strong id="g2048FinalScore">0</strong></div><div><span>Meilleure case</span><strong id="g2048FinalTile">0</strong></div><div><span>Temps</span><strong id="g2048FinalTime">0:00</strong></div></div><div class="g2048-actions"><button class="primary" id="g2048Again" type="button">Rejouer</button><button id="g2048Continue" type="button">Continuer</button></div></section></div>
    <div class="g2048-overlay hidden" id="g2048HelpOverlay"><section class="g2048-card"><small>Comment jouer</small><h2>Construis dans un coin</h2><p>Glisse ou utilise les flèches/WASD. Deux cases identiques fusionnent une seule fois par déplacement. Garde idéalement ta plus grosse case dans un coin et évite de casser tes rangées. Les séries indiquent combien de déplacements consécutifs ont produit au moins une fusion.</p><div class="g2048-actions"><button class="primary" id="g2048CloseHelp" type="button">Compris</button><button id="g2048HelpPlay" type="button">Jouer</button></div></section></div>
  `;

  const boardEl = doc.getElementById('g2048Board')!;
  const scoreEl = doc.getElementById('g2048Score')!;
  const bestEl = doc.getElementById('g2048Best')!;
  const maxEl = doc.getElementById('g2048Max')!;
  const streakEl = doc.getElementById('g2048Streak')!;
  const timeEl = doc.getElementById('g2048Time')!;
  const modeLabelEl = doc.getElementById('g2048ModeLabel')!;
  const goalEl = doc.getElementById('g2048Goal')!;
  const progressEl = doc.getElementById('g2048Progress') as HTMLElement;
  const messageEl = doc.getElementById('g2048Message')!;
  const liveEl = doc.getElementById('g2048Live')!;
  const introEl = doc.getElementById('g2048Intro')!;
  const pauseOverlay = doc.getElementById('g2048PauseOverlay')!;
  const resultOverlay = doc.getElementById('g2048Result')!;
  const helpOverlay = doc.getElementById('g2048HelpOverlay')!;
  const undoBtn = doc.getElementById('g2048Undo') as HTMLButtonElement;
  const soundBtn = doc.getElementById('g2048Sound') as HTMLButtonElement;
  const resultSmall = doc.getElementById('g2048ResultSmall')!;
  const resultTitle = doc.getElementById('g2048ResultTitle')!;
  const resultText = doc.getElementById('g2048ResultText')!;
  const finalScore = doc.getElementById('g2048FinalScore')!;
  const finalTile = doc.getElementById('g2048FinalTile')!;
  const finalTime = doc.getElementById('g2048FinalTime')!;
  const continueBtn = doc.getElementById('g2048Continue') as HTMLButtonElement;

  let stats = emptyStats();
  try {
    const stored = JSON.parse(win.localStorage.getItem(STATS_KEY) || 'null') as Partial<Stats> | null;
    if (stored) stats = { ...stats, ...stored };
  } catch {
    stats = emptyStats();
  }

  let board = Array<number>(CELL_COUNT).fill(0);
  let score = 0;
  let moves = 0;
  let streak = 0;
  let mode: Mode = 'classic';
  let history: Snapshot[] = [];
  let undoUsed = 0;
  let running = false;
  let paused = false;
  let reachedGoal = false;
  let resultReason: 'win' | 'over' | 'time' | null = null;
  let spawned = new Set<number>();
  let merged = new Set<number>();
  let soundOn = true;
  let elapsedBase = 0;
  let timerStartedAt = 0;
  let animationFrame = 0;
  let pointerStart: { x: number; y: number } | null = null;
  let messageTimer = 0;

  const AudioCtor = (win as AudioWindow).AudioContext || (win as AudioWindow).webkitAudioContext;
  let audioContext: AudioContext | null = null;

  function saveStats() {
    try {
      win.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      // Le jeu reste pleinement jouable si le stockage privé est indisponible.
    }
  }

  function tone(frequency: number, duration = 0.055, volume = 0.025) {
    if (!soundOn || !AudioCtor) return;
    try {
      audioContext ??= new AudioCtor();
      void audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch {
      // Audio optionnel.
    }
  }

  function vibrate(pattern: number | number[]) {
    try {
      win.navigator.vibrate?.(pattern);
    } catch {
      // Haptique optionnelle.
    }
  }

  function announce(text: string) {
    liveEl.textContent = text;
  }

  function showMessage(text: string, duration = 720) {
    messageEl.textContent = text;
    messageEl.classList.add('show');
    if (messageTimer) win.clearTimeout(messageTimer);
    messageTimer = win.setTimeout(() => messageEl.classList.remove('show'), duration);
  }

  function elapsedMs() {
    if (!running || paused) return elapsedBase;
    return elapsedBase + Math.max(0, win.performance.now() - timerStartedAt);
  }

  function pauseClock() {
    if (paused || !running) return;
    elapsedBase = elapsedMs();
    paused = true;
  }

  function resumeClock() {
    if (!paused || !running) return;
    paused = false;
    timerStartedAt = win.performance.now();
  }

  function tileClass(value: number) {
    if (value <= 0) return '';
    if (value <= 4096) return `v${value}`;
    if (value === 8192) return 'v8192';
    return 'vmax';
  }

  function render() {
    boardEl.innerHTML = '';
    board.forEach((value, index) => {
      const cell = doc.createElement('div');
      cell.className = 'g2048-cell';
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', value ? String(value) : 'Case vide');
      if (value) {
        const tile = doc.createElement('div');
        tile.className = `g2048-tile ${tileClass(value)}`;
        if (spawned.has(index)) tile.classList.add('spawn');
        if (merged.has(index)) tile.classList.add('merge');
        tile.dataset.digits = String(value).length >= 5 ? '5' : String(value).length >= 4 ? '4' : '3';
        tile.textContent = value.toLocaleString('fr-CA');
        cell.appendChild(tile);
      }
      boardEl.appendChild(cell);
    });

    const currentMax = Math.max(2, maxTile(board));
    stats.bestScore = Math.max(stats.bestScore, score);
    stats.bestTile = Math.max(stats.bestTile, currentMax);
    saveStats();
    scoreEl.textContent = score.toLocaleString('fr-CA');
    bestEl.textContent = stats.bestScore.toLocaleString('fr-CA');
    maxEl.textContent = currentMax.toLocaleString('fr-CA');
    streakEl.textContent = `×${streak}`;
    modeLabelEl.textContent = MODES[mode].label;
    goalEl.textContent = MODES[mode].goal.toLocaleString('fr-CA');
    const progress = Math.min(1, Math.log2(currentMax) / Math.log2(MODES[mode].goal));
    progressEl.style.width = `${Math.round(progress * 100)}%`;
    undoBtn.disabled = !running || paused || history.length === 0 || undoUsed >= MODES[mode].undoLimit;
    spawned = new Set<number>();
    merged = new Set<number>();
  }

  function spawnTile() {
    const empty = board.map((value, index) => (value === 0 ? index : -1)).filter((index) => index >= 0);
    if (!empty.length) return;
    const index = empty[Math.floor(Math.random() * empty.length)];
    board[index] = Math.random() < 0.1 ? 4 : 2;
    spawned.add(index);
  }

  function reset(modeChoice = mode) {
    mode = modeChoice;
    board = Array<number>(CELL_COUNT).fill(0);
    score = 0;
    moves = 0;
    streak = 0;
    history = [];
    undoUsed = 0;
    reachedGoal = false;
    resultReason = null;
    elapsedBase = 0;
    timerStartedAt = win.performance.now();
    paused = false;
    running = true;
    introEl.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    resultOverlay.classList.add('hidden');
    helpOverlay.classList.add('hidden');
    spawnTile();
    spawnTile();
    stats.games += 1;
    saveStats();
    render();
    showMessage('À TOI !', 500);
    boardEl.focus({ preventScroll: true });
  }

  function snapshot() {
    const config = MODES[mode];
    if (config.undoLimit === 0) return;
    history.push({ board: [...board], score, moves, streak, reachedGoal });
    const maxHistory = Number.isFinite(config.undoLimit) ? Math.max(1, config.undoLimit) : 40;
    if (history.length > maxHistory) history.splice(0, history.length - maxHistory);
  }

  function endGame(reason: 'over' | 'time') {
    if (!running) return;
    elapsedBase = elapsedMs();
    running = false;
    resultReason = reason;
    resultSmall.textContent = reason === 'time' ? 'Temps écoulé' : 'Plus aucun mouvement';
    resultTitle.textContent = reason === 'time' ? 'Chrono terminé !' : 'Grille bloquée';
    resultText.textContent = reason === 'time'
      ? 'Le temps est terminé. Ton score et ta meilleure case sont enregistrés.'
      : 'La grille est pleine et aucune fusion n’est encore possible.';
    continueBtn.style.display = 'none';
    showResult();
    tone(175, 0.28, 0.04);
    vibrate([40, 35, 70]);
  }

  function showResult() {
    finalScore.textContent = score.toLocaleString('fr-CA');
    finalTile.textContent = maxTile(board).toLocaleString('fr-CA');
    finalTime.textContent = formatTime(elapsedBase || elapsedMs());
    resultOverlay.classList.remove('hidden');
  }

  function celebrateGoal() {
    if (reachedGoal) return;
    reachedGoal = true;
    stats.wins += 1;
    const currentTime = elapsedMs();
    if (mode === 'classic' && (!stats.bestTimeMs || currentTime < stats.bestTimeMs)) stats.bestTimeMs = currentTime;
    saveStats();
    elapsedBase = currentTime;
    running = false;
    resultReason = 'win';
    resultSmall.textContent = 'Objectif atteint';
    resultTitle.textContent = `${MODES[mode].goal.toLocaleString('fr-CA')} !`;
    resultText.textContent = `Tu as atteint la case ${MODES[mode].goal.toLocaleString('fr-CA')} en ${formatTime(currentTime)}. Tu peux continuer pour viser encore plus haut.`;
    continueBtn.style.display = '';
    showResult();
    tone(880, 0.09, 0.035);
    win.setTimeout(() => tone(1174, 0.12, 0.03), 90);
    vibrate([25, 30, 25, 30, 55]);
  }

  function performMove(direction: Direction) {
    if (!running || paused || !resultOverlay.classList.contains('hidden')) return;
    const next = [...board];
    const mergeTargets = new Set<number>();
    let gained = 0;

    for (let line = 0; line < SIZE; line += 1) {
      const indices = lineIndices(direction, line);
      const values = indices.map((index) => board[index]);
      const result = slideLine(values);
      result.output.forEach((value, offset) => {
        next[indices[offset]] = value;
      });
      result.mergedOffsets.forEach((offset) => mergeTargets.add(indices[offset]));
      gained += result.gained;
    }

    if (boardsEqual(board, next)) {
      tone(150, 0.035, 0.012);
      showMessage('AUCUN MOUVEMENT', 430);
      if (!canMove(board)) endGame('over');
      return;
    }

    snapshot();
    board = next;
    merged = mergeTargets;
    score += gained;
    moves += 1;
    streak = gained > 0 ? Math.min(99, streak + 1) : 0;
    spawnTile();

    if (gained > 0) {
      const highestMerge = Math.max(...Array.from(mergeTargets, (index) => board[index]), 0);
      tone(Math.min(1250, 300 + Math.log2(Math.max(2, highestMerge)) * 65), 0.055, 0.025);
      vibrate(highestMerge >= 512 ? [12, 18, 24] : 12);
      if (streak >= 3) showMessage(`SÉRIE ×${streak} · +${gained}`, 620);
    } else {
      tone(235, 0.025, 0.009);
    }

    render();
    const currentMax = maxTile(board);
    announce(`Score ${score}. Meilleure case ${currentMax}.`);
    if (!reachedGoal && currentMax >= MODES[mode].goal) {
      win.setTimeout(celebrateGoal, 230);
      return;
    }
    if (!canMove(board)) win.setTimeout(() => endGame('over'), 260);
  }

  function undo() {
    if (!running || paused || !history.length || undoUsed >= MODES[mode].undoLimit) return;
    const previous = history.pop();
    if (!previous) return;
    board = [...previous.board];
    score = previous.score;
    moves = previous.moves;
    streak = previous.streak;
    reachedGoal = previous.reachedGoal;
    undoUsed += 1;
    spawned = new Set<number>();
    merged = new Set<number>();
    render();
    showMessage('COUP ANNULÉ', 520);
    tone(420, 0.06, 0.018);
  }

  function tick() {
    const config = MODES[mode];
    const elapsed = elapsedMs();
    if (config.timeLimitMs > 0) {
      const remaining = Math.max(0, config.timeLimitMs - elapsed);
      timeEl.textContent = formatTime(remaining);
      if (running && !paused && remaining <= 0) endGame('time');
    } else {
      timeEl.textContent = formatTime(elapsed);
    }
    animationFrame = win.requestAnimationFrame(tick);
  }

  function openPause() {
    if (!running || paused) return;
    pauseClock();
    pauseOverlay.classList.remove('hidden');
    render();
  }

  function closePause() {
    if (!paused) return;
    pauseOverlay.classList.add('hidden');
    resumeClock();
    render();
    boardEl.focus({ preventScroll: true });
  }

  function selectMode(nextMode: Mode) {
    reset(nextMode);
  }

  doc.querySelectorAll<HTMLElement>('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => selectMode(button.dataset.mode as Mode));
  });
  doc.querySelectorAll<HTMLElement>('[data-move]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      performMove(button.dataset.move as Direction);
    });
  });

  doc.addEventListener('keydown', (event) => {
    const keyMap: Record<string, Direction | undefined> = {
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right',
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
    };
    const direction = keyMap[event.key];
    if (direction) {
      event.preventDefault();
      performMove(direction);
    } else if ((event.key === 'z' || event.key === 'Z') && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      undo();
    } else if (event.key === 'Escape' && running) {
      event.preventDefault();
      if (paused) closePause(); else openPause();
    }
  });

  boardEl.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStart = { x: event.clientX, y: event.clientY };
    try { (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); } catch { /* facultatif */ }
  });
  boardEl.addEventListener('pointerup', (event) => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.hypot(dx, dy) < 26) return;
    if (Math.abs(dx) > Math.abs(dy)) performMove(dx > 0 ? 'right' : 'left');
    else performMove(dy > 0 ? 'down' : 'up');
  });
  boardEl.addEventListener('pointercancel', () => { pointerStart = null; });

  doc.getElementById('g2048Pause')!.addEventListener('click', openPause);
  doc.getElementById('g2048Resume')!.addEventListener('click', closePause);
  undoBtn.addEventListener('click', undo);
  doc.getElementById('g2048Restart')!.addEventListener('click', () => reset(mode));
  doc.getElementById('g2048PauseRestart')!.addEventListener('click', () => reset(mode));
  doc.getElementById('g2048Mode')!.addEventListener('click', () => {
    pauseClock();
    running = false;
    pauseOverlay.classList.add('hidden');
    resultOverlay.classList.add('hidden');
    introEl.classList.remove('hidden');
  });
  doc.getElementById('g2048Again')!.addEventListener('click', () => reset(mode));
  continueBtn.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
    resultReason = null;
    running = true;
    paused = false;
    timerStartedAt = win.performance.now();
    boardEl.focus({ preventScroll: true });
    showMessage('CONTINUE !', 500);
  });
  doc.getElementById('g2048Help')!.addEventListener('click', () => {
    if (running && !paused) pauseClock();
    helpOverlay.classList.remove('hidden');
  });
  doc.getElementById('g2048CloseHelp')!.addEventListener('click', () => {
    helpOverlay.classList.add('hidden');
    if (running && paused) resumeClock();
  });
  doc.getElementById('g2048HelpPlay')!.addEventListener('click', () => {
    helpOverlay.classList.add('hidden');
    if (!running) reset(mode);
    else if (paused) resumeClock();
  });
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.textContent = soundOn ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-label', soundOn ? 'Désactiver le son' : 'Activer le son');
    if (soundOn) tone(620, 0.06, 0.02);
  });

  bestEl.textContent = stats.bestScore.toLocaleString('fr-CA');
  timeEl.textContent = '0:00';
  render();
  animationFrame = win.requestAnimationFrame(tick);

  win.addEventListener('pagehide', () => {
    if (animationFrame) win.cancelAnimationFrame(animationFrame);
  }, { once: true });
}