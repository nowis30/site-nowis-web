type CandyKind = 'red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple';
type CandySpecial = 'none' | 'row' | 'column' | 'bomb';
type CandyCell = { kind: CandyKind; special: CandySpecial; id: number };
type Point = { row: number; col: number };
type MatchGroup = { cells: Point[]; orientation: 'row' | 'column' };

type CandyGameMode = 'moves' | 'timed' | 'endless';

const KINDS: CandyKind[] = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];
const SIZE = 8;
const BEST_KEY = 'nowis:candy-crush:best';

function randomKind(): CandyKind {
  return KINDS[Math.floor(Math.random() * KINDS.length)];
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;',
  }[char] ?? char));
}

export function upgradeCandyCrush(doc: Document, win: Window) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisCandyPro === 'true') return;
  root.dataset.nowisCandyPro = 'true';

  doc.title = 'Candy Crush NOWIS';
  root.lang = 'fr';

  doc.head.querySelectorAll('link[rel="stylesheet"], script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    :root {
      color-scheme: dark;
      font-family: Inter, ui-rounded, "SF Pro Rounded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --panel: rgba(15, 23, 42, .88);
      --panel-2: rgba(30, 41, 59, .94);
      --line: rgba(148, 163, 184, .24);
      --text: #f8fafc;
      --muted: #cbd5e1;
      --accent: #22d3ee;
      --gold: #facc15;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; background: #020617; color: var(--text); overscroll-behavior: none; }
    body { min-height: 100dvh; overflow-x: hidden; user-select: none; -webkit-tap-highlight-color: transparent; }
    button { font: inherit; }
    .nowis-candy {
      min-height: 100dvh;
      padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
      background:
        radial-gradient(circle at 15% 0%, rgba(236,72,153,.26), transparent 28%),
        radial-gradient(circle at 92% 15%, rgba(34,211,238,.20), transparent 30%),
        linear-gradient(160deg,#020617 0%,#111827 52%,#1e1b4b 100%);
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
    }
    .topbar, .status, .toolbar, .mission, .result-card {
      width: min(100%, 660px);
    }
    .topbar { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .brand { min-width:0; }
    .eyebrow { margin:0; color:#67e8f9; font-size:11px; font-weight:900; letter-spacing:.18em; text-transform:uppercase; }
    h1 { margin:2px 0 0; font-size:clamp(22px,6vw,34px); line-height:1; letter-spacing:-.04em; }
    .icon-btn, .toolbar button, .mode-card, .result-card button {
      border:1px solid var(--line); color:var(--text); background:rgba(15,23,42,.82); border-radius:14px; min-height:44px; cursor:pointer;
      transition:transform .12s ease, border-color .12s ease, background .12s ease;
    }
    button:active { transform:scale(.96); }
    .icon-btn { min-width:44px; padding:0 12px; }
    .status { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; }
    .stat { border:1px solid var(--line); background:rgba(15,23,42,.70); border-radius:14px; padding:8px 7px; text-align:center; box-shadow:0 10px 26px rgba(2,6,23,.24); }
    .stat span { display:block; color:var(--muted); font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.09em; }
    .stat strong { display:block; margin-top:2px; font-size:clamp(16px,4.5vw,22px); font-variant-numeric:tabular-nums; }
    .mission { border:1px solid rgba(34,211,238,.25); background:linear-gradient(90deg,rgba(34,211,238,.08),rgba(139,92,246,.08)); border-radius:15px; padding:9px 11px; display:flex; gap:10px; align-items:center; }
    .mission-copy { flex:1; min-width:0; }
    .mission p { margin:0; font-size:12px; color:#e2e8f0; }
    .progress { height:7px; margin-top:6px; background:rgba(148,163,184,.16); border-radius:999px; overflow:hidden; }
    .progress > div { height:100%; width:0; border-radius:inherit; background:linear-gradient(90deg,#22d3ee,#a78bfa,#f472b6); transition:width .25s ease; }
    .combo { min-width:72px; text-align:right; color:#fef08a; font-weight:900; font-size:13px; }
    .board-wrap { position:relative; width:min(100%,660px); display:flex; justify-content:center; }
    .board {
      width:min(96vw, 580px); aspect-ratio:1; display:grid; grid-template-columns:repeat(8,1fr); gap:clamp(2px,.7vw,5px); padding:clamp(5px,1.4vw,10px);
      border:1px solid rgba(148,163,184,.28); border-radius:clamp(18px,5vw,28px); background:linear-gradient(145deg,rgba(15,23,42,.96),rgba(30,41,59,.90));
      box-shadow:0 24px 70px rgba(2,6,23,.55), inset 0 1px rgba(255,255,255,.06); touch-action:none; overflow:hidden;
    }
    .candy { position:relative; aspect-ratio:1; border:0; padding:0; background:transparent; border-radius:25%; cursor:pointer; touch-action:none; outline:none; }
    .candy::before { content:""; position:absolute; inset:8%; border-radius:28% 46% 32% 50%; transform:rotate(8deg); box-shadow:inset -6px -8px 10px rgba(0,0,0,.16), inset 5px 6px 10px rgba(255,255,255,.35), 0 3px 8px rgba(2,6,23,.35); transition:transform .16s ease, filter .16s ease; }
    .candy::after { content:""; position:absolute; width:22%; height:22%; left:22%; top:17%; border-radius:50%; background:rgba(255,255,255,.45); filter:blur(.5px); }
    .candy[data-kind="red"]::before { background:linear-gradient(145deg,#fb7185,#e11d48); }
    .candy[data-kind="blue"]::before { background:linear-gradient(145deg,#60a5fa,#2563eb); border-radius:50%; }
    .candy[data-kind="green"]::before { background:linear-gradient(145deg,#4ade80,#16a34a); transform:rotate(45deg) scale(.82); border-radius:24%; }
    .candy[data-kind="yellow"]::before { background:linear-gradient(145deg,#fde047,#f59e0b); border-radius:50% 28% 50% 28%; }
    .candy[data-kind="orange"]::before { background:linear-gradient(145deg,#fb923c,#ea580c); border-radius:45% 55% 42% 58%; }
    .candy[data-kind="purple"]::before { background:linear-gradient(145deg,#c084fc,#7c3aed); border-radius:28% 50% 28% 50%; }
    .candy.selected { outline:3px solid #f8fafc; outline-offset:-4px; z-index:3; }
    .candy.selected::before { transform:scale(.86) rotate(-5deg); filter:brightness(1.2); }
    .candy.hint { animation:hint .75s ease-in-out infinite alternate; }
    .candy.matched { animation:pop .22s ease forwards; }
    .candy.special-row::before { box-shadow:inset 0 0 0 4px rgba(255,255,255,.75), inset -6px -8px 10px rgba(0,0,0,.16), 0 0 18px rgba(250,204,21,.65); }
    .candy.special-column::before { box-shadow:inset 0 0 0 4px rgba(34,211,238,.78), inset -6px -8px 10px rgba(0,0,0,.16), 0 0 18px rgba(34,211,238,.65); }
    .candy.special-bomb::before { background:radial-gradient(circle,#fff 0 8%,#111827 10% 28%,#a855f7 30% 42%,#ec4899 44% 58%,#111827 60%); border-radius:50%; }
    .float-score { position:absolute; pointer-events:none; z-index:20; color:#fef08a; font-weight:1000; text-shadow:0 2px 10px #000; animation:floatUp .8s ease forwards; }
    .toolbar { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; }
    .toolbar button { padding:8px 6px; font-size:12px; font-weight:850; color:#e2e8f0; }
    .toolbar button.primary { border-color:rgba(34,211,238,.42); background:rgba(8,145,178,.16); color:#cffafe; }
    .overlay { position:fixed; inset:0; z-index:99; display:flex; align-items:center; justify-content:center; padding:18px; background:rgba(2,6,23,.82); backdrop-filter:blur(14px); }
    .overlay.hidden { display:none; }
    .mode-card, .result-card { width:min(100%,420px); padding:22px; text-align:left; background:linear-gradient(155deg,#0f172a,#1e293b); box-shadow:0 30px 80px rgba(0,0,0,.55); }
    .mode-card h2, .result-card h2 { margin:0; font-size:28px; letter-spacing:-.04em; }
    .mode-card > p, .result-card > p { color:#cbd5e1; line-height:1.5; margin:8px 0 18px; }
    .mode-options { display:grid; gap:9px; }
    .mode-option { width:100%; padding:13px; text-align:left; }
    .mode-option strong { display:block; color:#fff; }
    .mode-option span { display:block; margin-top:3px; color:#94a3b8; font-size:12px; }
    .mode-option.recommended { border-color:rgba(34,211,238,.50); background:rgba(34,211,238,.10); }
    .result-actions { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
    .result-card button { padding:12px; font-weight:850; }
    .result-card .primary { background:#0891b2; border-color:#22d3ee; }
    .toast { position:fixed; left:50%; bottom:max(16px,env(safe-area-inset-bottom)); transform:translateX(-50%) translateY(20px); opacity:0; z-index:120; padding:10px 14px; border-radius:999px; border:1px solid rgba(255,255,255,.16); background:rgba(15,23,42,.94); color:#fff; font-size:12px; font-weight:850; pointer-events:none; transition:.2s ease; white-space:nowrap; max-width:92vw; overflow:hidden; text-overflow:ellipsis; }
    .toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
    @keyframes pop { to { transform:scale(.18) rotate(25deg); opacity:.08; } }
    @keyframes hint { from { filter:none; } to { filter:brightness(1.55) drop-shadow(0 0 9px #fef08a); transform:scale(.94); } }
    @keyframes floatUp { to { transform:translateY(-48px) scale(1.15); opacity:0; } }
    @media (max-width:430px) {
      .nowis-candy { gap:8px; }
      .status { gap:5px; }
      .stat { border-radius:11px; padding:6px 4px; }
      .mission { border-radius:12px; padding:7px 9px; }
      .toolbar { gap:5px; }
      .toolbar button { min-height:42px; border-radius:11px; font-size:11px; }
    }
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
    <main class="nowis-candy">
      <header class="topbar">
        <div class="brand"><p class="eyebrow">Arcade NOWIS</p><h1>Candy Crush</h1></div>
        <button class="icon-btn" id="soundBtn" type="button" aria-label="Activer ou désactiver le son">🔊</button>
      </header>
      <section class="status" aria-label="Statistiques de partie">
        <div class="stat"><span>Score</span><strong id="scoreValue">0</strong></div>
        <div class="stat"><span>Niveau</span><strong id="levelValue">1</strong></div>
        <div class="stat"><span id="resourceLabel">Coups</span><strong id="resourceValue">25</strong></div>
        <div class="stat"><span>Record</span><strong id="bestValue">0</strong></div>
      </section>
      <section class="mission">
        <div class="mission-copy"><p id="missionText">Atteins 1 000 points pour passer au niveau suivant.</p><div class="progress"><div id="progressFill"></div></div></div>
        <div class="combo" id="comboValue">Combo ×1</div>
      </section>
      <div class="board-wrap"><div class="board" id="board" role="grid" aria-label="Grille Candy Crush"></div></div>
      <section class="toolbar">
        <button class="primary" id="hintBtn" type="button">💡 Indice</button>
        <button id="shuffleBtn" type="button">🔀 Mélanger</button>
        <button id="pauseBtn" type="button">⏸ Pause</button>
        <button id="restartBtn" type="button">↻ Rejouer</button>
      </section>
    </main>
    <div class="overlay" id="modeOverlay">
      <section class="mode-card">
        <p class="eyebrow">Nouvelle version NOWIS</p>
        <h2>Choisis ton défi</h2>
        <p>Les échanges inutiles sont maintenant refusés, les cascades donnent des combos et les alignements de 4 ou 5 créent des bonbons spéciaux.</p>
        <div class="mode-options">
          <button class="mode-option recommended" data-mode="moves"><strong>🎯 Défi par coups</strong><span>25 coups, objectifs de niveau et progression.</span></button>
          <button class="mode-option" data-mode="timed"><strong>⏱ Contre-la-montre</strong><span>90 secondes pour battre ton record.</span></button>
          <button class="mode-option" data-mode="endless"><strong>♾ Détente</strong><span>Joue sans limite et travaille tes combos.</span></button>
        </div>
      </section>
    </div>
    <div class="overlay hidden" id="pauseOverlay"><section class="result-card"><h2>Pause</h2><p>Ta partie est conservée.</p><div class="result-actions"><button id="resumeBtn" class="primary">Reprendre</button><button id="pauseQuitBtn">Changer de mode</button></div></section></div>
    <div class="overlay hidden" id="resultOverlay"><section class="result-card"><p class="eyebrow" id="resultEyebrow">Partie terminée</p><h2 id="resultTitle">Bien joué !</h2><p id="resultText"></p><div class="result-actions"><button id="playAgainBtn" class="primary">Rejouer</button><button id="changeModeBtn">Changer de mode</button></div></section></div>
    <div class="toast" id="toast"></div>
  `;

  const boardEl = doc.getElementById('board') as HTMLElement;
  const scoreEl = doc.getElementById('scoreValue')!;
  const levelEl = doc.getElementById('levelValue')!;
  const resourceEl = doc.getElementById('resourceValue')!;
  const resourceLabelEl = doc.getElementById('resourceLabel')!;
  const bestEl = doc.getElementById('bestValue')!;
  const missionEl = doc.getElementById('missionText')!;
  const progressEl = doc.getElementById('progressFill') as HTMLElement;
  const comboEl = doc.getElementById('comboValue')!;
  const modeOverlay = doc.getElementById('modeOverlay')!;
  const pauseOverlay = doc.getElementById('pauseOverlay')!;
  const resultOverlay = doc.getElementById('resultOverlay')!;
  const resultTitle = doc.getElementById('resultTitle')!;
  const resultText = doc.getElementById('resultText')!;
  const resultEyebrow = doc.getElementById('resultEyebrow')!;
  const toastEl = doc.getElementById('toast') as HTMLElement;
  const soundBtn = doc.getElementById('soundBtn') as HTMLButtonElement;

  let board: CandyCell[][] = [];
  let idCounter = 0;
  let score = 0;
  let level = 1;
  let movesLeft = 25;
  let secondsLeft = 90;
  let target = 1000;
  let combo = 1;
  let selected: Point | null = null;
  let mode: CandyGameMode = 'moves';
  let running = false;
  let resolving = false;
  let soundOn = true;
  let timer: number | null = null;
  let pointerStart: { point: Point; x: number; y: number } | null = null;
  let best = Number(win.localStorage.getItem(BEST_KEY) || 0);
  bestEl.textContent = String(best);

  const AudioCtor = (win as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).AudioContext
    || (win as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  let audio: AudioContext | null = null;

  function beep(frequency: number, duration = 0.055, volume = 0.035) {
    if (!soundOn || !AudioCtor) return;
    try {
      audio ??= new AudioCtor();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(volume, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
    } catch { /* Audio is optional. */ }
  }

  function vibrate(pattern: number | number[]) {
    try { win.navigator.vibrate?.(pattern); } catch { /* Haptics are optional. */ }
  }

  function toast(message: string) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    win.setTimeout(() => toastEl.classList.remove('show'), 1300);
  }

  function pointKey(point: Point) { return `${point.row}:${point.col}`; }
  function inBounds(point: Point) { return point.row >= 0 && point.row < SIZE && point.col >= 0 && point.col < SIZE; }
  function adjacent(a: Point, b: Point) { return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1; }

  function createCell(): CandyCell { return { kind: randomKind(), special: 'none', id: ++idCounter }; }

  function makesInitialMatch(row: number, col: number, kind: CandyKind) {
    return (col >= 2 && board[row]?.[col - 1]?.kind === kind && board[row]?.[col - 2]?.kind === kind)
      || (row >= 2 && board[row - 1]?.[col]?.kind === kind && board[row - 2]?.[col]?.kind === kind);
  }

  function makeFreshBoard() {
    board = Array.from({ length: SIZE }, () => Array<CandyCell>(SIZE));
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        let cell = createCell();
        let guard = 0;
        while (makesInitialMatch(row, col, cell.kind) && guard++ < 30) cell = createCell();
        board[row][col] = cell;
      }
    }
    if (!findPossibleMove()) shuffleBoard(false);
  }

  function getMatches(): MatchGroup[] {
    const groups: MatchGroup[] = [];
    for (let row = 0; row < SIZE; row++) {
      let start = 0;
      for (let col = 1; col <= SIZE; col++) {
        if (col < SIZE && board[row][col].kind === board[row][start].kind) continue;
        const length = col - start;
        if (length >= 3) groups.push({ cells: Array.from({ length }, (_, i) => ({ row, col: start + i })), orientation: 'row' });
        start = col;
      }
    }
    for (let col = 0; col < SIZE; col++) {
      let start = 0;
      for (let row = 1; row <= SIZE; row++) {
        if (row < SIZE && board[row][col].kind === board[start][col].kind) continue;
        const length = row - start;
        if (length >= 3) groups.push({ cells: Array.from({ length }, (_, i) => ({ row: start + i, col })), orientation: 'column' });
        start = row;
      }
    }
    return groups;
  }

  function swap(a: Point, b: Point) {
    const tmp = board[a.row][a.col];
    board[a.row][a.col] = board[b.row][b.col];
    board[b.row][b.col] = tmp;
  }

  function findPossibleMove(): [Point, Point] | null {
    const dirs = [{ row: 0, col: 1 }, { row: 1, col: 0 }];
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const a = { row, col };
        for (const dir of dirs) {
          const b = { row: row + dir.row, col: col + dir.col };
          if (!inBounds(b)) continue;
          swap(a, b);
          const valid = getMatches().length > 0;
          swap(a, b);
          if (valid) return [a, b];
        }
      }
    }
    return null;
  }

  function shuffleBoard(showMessage = true) {
    const cells = board.flat();
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    board = Array.from({ length: SIZE }, (_, row) => cells.slice(row * SIZE, (row + 1) * SIZE));
    if (getMatches().length || !findPossibleMove()) {
      makeFreshBoard();
    }
    if (showMessage) {
      toast('Grille mélangée');
      beep(420, .08);
    }
    render();
  }

  function specialClass(special: CandySpecial) {
    if (special === 'row') return ' special-row';
    if (special === 'column') return ' special-column';
    if (special === 'bomb') return ' special-bomb';
    return '';
  }

  function render(highlights: Set<string> = new Set()) {
    const fragment = doc.createDocumentFragment();
    boardEl.innerHTML = '';
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const cell = board[row][col];
        const button = doc.createElement('button');
        button.type = 'button';
        button.className = `candy${specialClass(cell.special)}`;
        button.dataset.kind = cell.kind;
        button.dataset.row = String(row);
        button.dataset.col = String(col);
        button.setAttribute('role', 'gridcell');
        button.setAttribute('aria-label', `Bonbon ${cell.kind}, ligne ${row + 1}, colonne ${col + 1}`);
        if (selected?.row === row && selected?.col === col) button.classList.add('selected');
        if (highlights.has(pointKey({ row, col }))) button.classList.add('hint');
        fragment.appendChild(button);
      }
    }
    boardEl.appendChild(fragment);
    updateHud();
  }

  function updateHud() {
    scoreEl.textContent = score.toLocaleString('fr-CA');
    levelEl.textContent = String(level);
    bestEl.textContent = best.toLocaleString('fr-CA');
    comboEl.textContent = `Combo ×${combo}`;
    if (mode === 'moves') {
      resourceLabelEl.textContent = 'Coups';
      resourceEl.textContent = String(movesLeft);
      missionEl.textContent = `Atteins ${target.toLocaleString('fr-CA')} points pour réussir le niveau ${level}.`;
      progressEl.style.width = `${Math.min(100, (score / target) * 100)}%`;
    } else if (mode === 'timed') {
      resourceLabelEl.textContent = 'Temps';
      resourceEl.textContent = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;
      missionEl.textContent = 'Fais le meilleur score possible avant la fin du chrono.';
      progressEl.style.width = `${Math.max(0, (secondsLeft / 90) * 100)}%`;
    } else {
      resourceLabelEl.textContent = 'Série';
      resourceEl.textContent = `×${combo}`;
      missionEl.textContent = 'Mode détente : cherche les plus longues cascades possibles.';
      progressEl.style.width = `${Math.min(100, ((score % 2500) / 2500) * 100)}%`;
    }
  }

  function scoreFloat(points: number) {
    const node = doc.createElement('div');
    node.className = 'float-score';
    node.textContent = `+${points}`;
    node.style.left = `${45 + Math.random() * 10}%`;
    node.style.top = `${42 + Math.random() * 12}%`;
    boardEl.parentElement?.appendChild(node);
    win.setTimeout(() => node.remove(), 850);
  }

  function expandSpecials(points: Set<string>) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const key of [...points]) {
        const [row, col] = key.split(':').map(Number);
        const cell = board[row][col];
        if (!cell) continue;
        if (cell.special === 'row') {
          for (let c = 0; c < SIZE; c++) if (!points.has(`${row}:${c}`)) { points.add(`${row}:${c}`); changed = true; }
        } else if (cell.special === 'column') {
          for (let r = 0; r < SIZE; r++) if (!points.has(`${r}:${col}`)) { points.add(`${r}:${col}`); changed = true; }
        } else if (cell.special === 'bomb') {
          for (let r = Math.max(0, row - 1); r <= Math.min(SIZE - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(SIZE - 1, col + 1); c++) if (!points.has(`${r}:${c}`)) { points.add(`${r}:${c}`); changed = true; }
          }
        }
      }
    }
  }

  async function resolveMatches(initialGroups: MatchGroup[]) {
    resolving = true;
    let groups = initialGroups;
    combo = 1;
    while (groups.length) {
      const clear = new Set<string>();
      const specialCreates = new Map<string, CandySpecial>();
      groups.forEach((group) => {
        group.cells.forEach((point) => clear.add(pointKey(point)));
        if (group.cells.length >= 5) {
          const center = group.cells[Math.floor(group.cells.length / 2)];
          specialCreates.set(pointKey(center), 'bomb');
        } else if (group.cells.length === 4) {
          const center = group.cells[1];
          specialCreates.set(pointKey(center), group.orientation === 'row' ? 'row' : 'column');
        }
      });
      expandSpecials(clear);
      specialCreates.forEach((_, key) => clear.delete(key));

      const points = clear.size * 40 * combo + [...specialCreates.values()].length * 120 * combo;
      score += points;
      if (score > best) { best = score; win.localStorage.setItem(BEST_KEY, String(best)); }
      scoreFloat(points);
      beep(Math.min(900, 380 + combo * 90), .06 + Math.min(.08, combo * .01));
      if (combo >= 3) vibrate([15, 25, 15]);

      render();
      clear.forEach((key) => {
        const button = boardEl.querySelector(`[data-row="${key.split(':')[0]}"][data-col="${key.split(':')[1]}"]`);
        button?.classList.add('matched');
      });
      await new Promise<void>((resolve) => win.setTimeout(resolve, 190));

      for (const key of clear) {
        const [row, col] = key.split(':').map(Number);
        board[row][col] = null as unknown as CandyCell;
      }
      specialCreates.forEach((special, key) => {
        const [row, col] = key.split(':').map(Number);
        board[row][col].special = special;
      });

      for (let col = 0; col < SIZE; col++) {
        const survivors: CandyCell[] = [];
        for (let row = SIZE - 1; row >= 0; row--) if (board[row][col]) survivors.push(board[row][col]);
        for (let row = SIZE - 1, index = 0; row >= 0; row--, index++) board[row][col] = survivors[index] ?? createCell();
      }
      render();
      await new Promise<void>((resolve) => win.setTimeout(resolve, 125));
      combo += 1;
      groups = getMatches();
    }
    combo = Math.max(1, combo - 1);
    resolving = false;
    if (!findPossibleMove()) shuffleBoard(false);
    updateHud();
    checkEndConditions();
  }

  async function attemptSwap(a: Point, b: Point) {
    if (!running || resolving || !adjacent(a, b)) return;
    swap(a, b);
    const groups = getMatches();
    if (!groups.length) {
      swap(a, b);
      render();
      toast('Ce coup ne crée aucune combinaison');
      beep(170, .08, .025);
      vibrate(18);
      return;
    }
    if (mode === 'moves') movesLeft -= 1;
    selected = null;
    render();
    await resolveMatches(groups);
  }

  function checkEndConditions() {
    if (!running) return;
    if (mode === 'moves' && score >= target) {
      level += 1;
      movesLeft += 12;
      target = Math.round(target * 1.65 / 100) * 100;
      toast(`Niveau ${level} débloqué ! +12 coups`);
      beep(760, .12); win.setTimeout(() => beep(980, .14), 110); vibrate([25, 40, 25]);
      updateHud();
      return;
    }
    if (mode === 'moves' && movesLeft <= 0) finish(false);
  }

  function finish(success = true) {
    running = false;
    if (timer !== null) { win.clearInterval(timer); timer = null; }
    resultEyebrow.textContent = success ? 'Partie terminée' : 'Plus de coups';
    resultTitle.textContent = score >= best && score > 0 ? 'Nouveau record !' : 'Bien joué !';
    resultText.textContent = `Score : ${score.toLocaleString('fr-CA')} · Niveau : ${level} · Record : ${best.toLocaleString('fr-CA')}`;
    resultOverlay.classList.remove('hidden');
    beep(520, .1); win.setTimeout(() => beep(660, .12), 100);
  }

  function start(modeValue: CandyGameMode) {
    mode = modeValue;
    score = 0;
    level = 1;
    target = 1000;
    movesLeft = 25;
    secondsLeft = 90;
    combo = 1;
    selected = null;
    running = true;
    resolving = false;
    makeFreshBoard();
    modeOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    resultOverlay.classList.add('hidden');
    render();
    if (mode === 'timed') {
      timer = win.setInterval(() => {
        if (!running) return;
        secondsLeft -= 1;
        updateHud();
        if (secondsLeft <= 0) finish(true);
      }, 1000);
    }
  }

  function selectOrSwap(point: Point) {
    if (!running || resolving) return;
    if (!selected) {
      selected = point;
      render();
      beep(300, .025, .018);
      return;
    }
    if (selected.row === point.row && selected.col === point.col) {
      selected = null; render(); return;
    }
    if (!adjacent(selected, point)) {
      selected = point; render(); return;
    }
    const from = selected;
    selected = null;
    void attemptSwap(from, point);
  }

  boardEl.addEventListener('pointerdown', (event) => {
    const targetEl = (event.target as Element | null)?.closest<HTMLElement>('.candy');
    if (!targetEl) return;
    event.preventDefault();
    targetEl.setPointerCapture?.(event.pointerId);
    pointerStart = { point: { row: Number(targetEl.dataset.row), col: Number(targetEl.dataset.col) }, x: event.clientX, y: event.clientY };
  });

  boardEl.addEventListener('pointerup', (event) => {
    if (!pointerStart) return;
    event.preventDefault();
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    const distance = Math.hypot(dx, dy);
    const from = pointerStart.point;
    pointerStart = null;
    if (distance < 18) { selectOrSwap(from); return; }
    const to = Math.abs(dx) > Math.abs(dy)
      ? { row: from.row, col: from.col + (dx > 0 ? 1 : -1) }
      : { row: from.row + (dy > 0 ? 1 : -1), col: from.col };
    if (inBounds(to)) void attemptSwap(from, to);
  });

  doc.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => start(button.dataset.mode as CandyGameMode));
  });

  doc.getElementById('hintBtn')?.addEventListener('click', () => {
    if (!running || resolving) return;
    const move = findPossibleMove();
    if (!move) { shuffleBoard(); return; }
    render(new Set(move.map(pointKey)));
    toast('Deux bonbons peuvent être échangés');
    beep(620, .07);
    win.setTimeout(() => render(), 1250);
  });

  doc.getElementById('shuffleBtn')?.addEventListener('click', () => {
    if (!running || resolving) return;
    if (mode === 'moves' && movesLeft > 1) movesLeft -= 1;
    shuffleBoard();
  });

  doc.getElementById('pauseBtn')?.addEventListener('click', () => {
    if (!running) return;
    running = false;
    pauseOverlay.classList.remove('hidden');
  });
  doc.getElementById('resumeBtn')?.addEventListener('click', () => {
    running = true;
    pauseOverlay.classList.add('hidden');
  });
  doc.getElementById('pauseQuitBtn')?.addEventListener('click', () => {
    running = false;
    if (timer !== null) { win.clearInterval(timer); timer = null; }
    pauseOverlay.classList.add('hidden'); modeOverlay.classList.remove('hidden');
  });
  doc.getElementById('restartBtn')?.addEventListener('click', () => start(mode));
  doc.getElementById('playAgainBtn')?.addEventListener('click', () => start(mode));
  doc.getElementById('changeModeBtn')?.addEventListener('click', () => {
    resultOverlay.classList.add('hidden'); modeOverlay.classList.remove('hidden');
  });
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.textContent = soundOn ? '🔊' : '🔇';
    toast(soundOn ? 'Son activé' : 'Son désactivé');
    if (soundOn) beep(540, .06);
  });

  win.addEventListener('keydown', (event) => {
    if (!selected || !running || resolving) return;
    const delta: Record<string, Point> = {
      ArrowUp: { row: -1, col: 0 }, ArrowDown: { row: 1, col: 0 }, ArrowLeft: { row: 0, col: -1 }, ArrowRight: { row: 0, col: 1 },
    };
    const change = delta[event.key];
    if (!change) return;
    event.preventDefault();
    const to = { row: selected.row + change.row, col: selected.col + change.col };
    if (inBounds(to)) { const from = selected; selected = null; void attemptSwap(from, to); }
  });

  makeFreshBoard();
  render();
}
