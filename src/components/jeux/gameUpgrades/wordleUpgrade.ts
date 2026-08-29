type LetterState = 'correct' | 'present' | 'absent';
type GameMode = 'classic' | 'daily' | 'expert';
type TileState = LetterState | 'empty' | 'filled' | 'revealed';
type GuessResult = { guess: string; states: LetterState[] };
type StoredStats = {
  games: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  bestScore: number;
  distribution: number[];
};
type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

const WORD_LENGTH = 5;
const STATS_KEY = 'nowis:wordle:stats';
const TARGETS = [
  'ABRIS', 'ACIER', 'ADIEU', 'AGILE', 'AIGLE', 'AIMER', 'ALBUM', 'AMOUR', 'ANCRE', 'ANGLE',
  'APPEL', 'ARBRE', 'ARCHE', 'AVION', 'BADGE', 'BALLE', 'BARBE', 'BARIL', 'BELLE', 'BIJOU',
  'BLANC', 'BLEUE', 'BOIRE', 'BOITE', 'BOMBE', 'BONNE', 'BOULE', 'BRAVE', 'BRUIT', 'CABLE',
  'CADRE', 'CALME', 'CANAL', 'CARTE', 'CEDRE', 'CHANT', 'CHAUD', 'CHIEN', 'CHOSE', 'COEUR',
  'COMME', 'CORDE', 'COURS', 'CRANE', 'CREME', 'DANSE', 'DENTS', 'DOUCE', 'DROIT', 'ECLAT',
  'ECRAN', 'ECOLE', 'ECRIT', 'ENFIN', 'ENJEU', 'ESSAI', 'ETOLE', 'ETUDE', 'FAIRE', 'FEMME',
  'FERME', 'FILLE', 'FLEUR', 'FORCE', 'FORME', 'FRUIT', 'GARDE', 'GEANT', 'GLACE', 'GRAND',
  'GUIDE', 'HAUTE', 'HERBE', 'IDEAL', 'IMAGE', 'JOLIE', 'JOUER', 'JUSTE', 'LARGE', 'LARME',
  'LIVRE', 'LOURD', 'MAGIE', 'MAINS', 'MARIN', 'METAL', 'MONDE', 'MOULE', 'NAGER', 'NUAGE',
  'OCEAN', 'ODEUR', 'OMBRE', 'ONGLE', 'ORAGE', 'PAIRE', 'PARLE', 'PERLE', 'PETIT', 'PIANO',
  'PIECE', 'PLAGE', 'PLUME', 'PORTE', 'RADIO', 'REINE', 'REPAS', 'ROUGE', 'ROUTE', 'SABLE',
  'SAINE', 'SALLE', 'SAUCE', 'SIGNE', 'SOEUR', 'SPORT', 'TABLE', 'TERRE', 'TIGRE', 'TOILE',
  'TRAIN', 'TRAME', 'VAGUE', 'VERRE', 'VILLE', 'VIVRE', 'VOILE', 'ZEBRE',
] as const;

const KEY_ROWS = ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'];

function emptyStats(): StoredStats {
  return { games: 0, wins: 0, currentStreak: 0, bestStreak: 0, bestScore: 0, distribution: [0, 0, 0, 0, 0, 0] };
}

function normalizeWord(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, WORD_LENGTH);
}

function evaluateGuess(target: string, guess: string): LetterState[] {
  const states: LetterState[] = Array(WORD_LENGTH).fill('absent');
  const remaining = new Map<string, number>();

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (guess[index] === target[index]) {
      states[index] = 'correct';
    } else {
      remaining.set(target[index], (remaining.get(target[index]) ?? 0) + 1);
    }
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (states[index] === 'correct') continue;
    const letter = guess[index];
    const count = remaining.get(letter) ?? 0;
    if (count > 0) {
      states[index] = 'present';
      remaining.set(letter, count - 1);
    }
  }

  return states;
}

function hashDate(dateKey: string) {
  let hash = 2166136261;
  for (let index = 0; index < dateKey.length; index += 1) {
    hash ^= dateKey.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function localDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimer(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function scoreGame(attemptsUsed: number, elapsedMs: number, mode: GameMode, hintsUsed: number) {
  const modeBonus = mode === 'expert' ? 350 : mode === 'daily' ? 250 : 150;
  const attemptBonus = Math.max(0, 7 - attemptsUsed) * 180;
  const speedBonus = Math.max(0, 480 - Math.floor(elapsedMs / 1000));
  return Math.max(100, 700 + modeBonus + attemptBonus + speedBonus - hintsUsed * 220);
}

function isHardModeGuessValid(history: GuessResult[], guess: string) {
  if (history.length === 0) return true;

  const requiredPositions = new Map<number, string>();
  const forbiddenPositions = new Map<number, Set<string>>();
  const minimumCounts = new Map<string, number>();

  for (const result of history) {
    const positiveCounts = new Map<string, number>();
    result.states.forEach((state, index) => {
      const letter = result.guess[index];
      if (state === 'correct') {
        requiredPositions.set(index, letter);
        positiveCounts.set(letter, (positiveCounts.get(letter) ?? 0) + 1);
      }
      if (state === 'present') {
        const set = forbiddenPositions.get(index) ?? new Set<string>();
        set.add(letter);
        forbiddenPositions.set(index, set);
        positiveCounts.set(letter, (positiveCounts.get(letter) ?? 0) + 1);
      }
    });

    for (const [letter, count] of positiveCounts) {
      minimumCounts.set(letter, Math.max(minimumCounts.get(letter) ?? 0, count));
    }
  }

  for (const [index, letter] of requiredPositions) {
    if (guess[index] !== letter) return false;
  }

  for (const [index, letters] of forbiddenPositions) {
    if (letters.has(guess[index])) return false;
  }

  for (const [letter, count] of minimumCounts) {
    const actual = [...guess].filter((candidate) => candidate === letter).length;
    if (actual < count) return false;
  }

  return true;
}

export function upgradeWordle(doc: Document, win: Window) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisWordlePro === 'true') return;
  root.dataset.nowisWordlePro = 'true';
  root.lang = 'fr';
  doc.title = 'Wordle NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"], script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    :root { color-scheme:dark; font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif; }
    * { box-sizing:border-box; }
    html,body { width:100%; min-height:100%; margin:0; background:#07111f; color:#f8fafc; }
    body { min-height:100dvh; overflow-x:hidden; user-select:none; -webkit-tap-highlight-color:transparent; }
    button { font:inherit; }
    .wd-app { min-height:100dvh; display:flex; flex-direction:column; align-items:center; gap:8px; padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left)); background:radial-gradient(circle at 15% -5%,rgba(45,212,191,.19),transparent 32%),radial-gradient(circle at 100% 28%,rgba(168,85,247,.18),transparent 30%),linear-gradient(180deg,#081426,#07111f 66%,#050914); }
    .wd-head,.wd-hud,.wd-board,.wd-keyboard,.wd-toolbar,.wd-progress { width:min(100%,560px); }
    .wd-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .wd-brand small { display:block; color:#5eead4; font-size:10px; font-weight:950; letter-spacing:.18em; text-transform:uppercase; }
    .wd-brand h1 { margin:1px 0 0; font-size:clamp(27px,8vw,42px); line-height:.95; letter-spacing:-.06em; background:linear-gradient(100deg,#5eead4,#fde047 48%,#c084fc); -webkit-background-clip:text; color:transparent; filter:drop-shadow(0 0 18px rgba(94,234,212,.12)); }
    .wd-actions { display:flex; gap:5px; }
    .wd-actions button,.wd-toolbar button,.wd-key { min-height:44px; border:1px solid rgba(148,163,184,.24); border-radius:13px; background:rgba(15,23,42,.84); color:#f8fafc; font-weight:900; cursor:pointer; touch-action:manipulation; }
    .wd-actions button { min-width:44px; padding:0 10px; }
    .wd-hud { display:grid; grid-template-columns:repeat(5,1fr); gap:5px; }
    .wd-stat { min-width:0; padding:6px 3px; border:1px solid rgba(45,212,191,.16); border-radius:11px; background:rgba(15,23,42,.72); text-align:center; box-shadow:inset 0 1px rgba(255,255,255,.03); }
    .wd-stat span { display:block; color:#94a3b8; font-size:8px; font-weight:950; letter-spacing:.05em; text-transform:uppercase; white-space:nowrap; }
    .wd-stat strong { display:block; margin-top:2px; overflow:hidden; font-size:clamp(12px,3.5vw,17px); white-space:nowrap; text-overflow:ellipsis; }
    .wd-progress { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:7px; padding:0 2px; }
    .wd-progress span { color:#cbd5e1; font-size:10px; font-weight:850; white-space:nowrap; }
    .wd-track { height:7px; overflow:hidden; border-radius:999px; background:#1e293b; box-shadow:inset 0 1px 4px rgba(0,0,0,.45); }
    .wd-track i { display:block; width:0; height:100%; border-radius:inherit; background:linear-gradient(90deg,#2dd4bf,#22c55e,#fde047,#c084fc); box-shadow:0 0 13px rgba(45,212,191,.35); transition:width .24s ease; }
    .wd-board { position:relative; display:grid; gap:5px; padding:8px; border:1px solid rgba(94,234,212,.2); border-radius:21px; background:linear-gradient(145deg,rgba(15,23,42,.92),rgba(13,20,37,.96)); box-shadow:0 22px 60px rgba(0,0,0,.4),0 0 42px rgba(45,212,191,.05); }
    .wd-row { display:grid; grid-template-columns:repeat(5,1fr); gap:5px; }
    .wd-tile { position:relative; display:flex; align-items:center; justify-content:center; aspect-ratio:1; min-width:0; overflow:hidden; border:2px solid #334155; border-radius:clamp(9px,2.5vw,14px); background:linear-gradient(145deg,#0f172a,#111c31); color:#fff; font-size:clamp(22px,8.2vw,42px); font-weight:1000; letter-spacing:-.04em; text-shadow:0 2px 4px rgba(0,0,0,.3); box-shadow:inset 0 1px rgba(255,255,255,.03); transform:translateZ(0); }
    .wd-tile.filled { border-color:#64748b; animation:wd-pop .14s ease-out; }
    .wd-tile.revealed { border-color:#38bdf8; color:#bae6fd; background:linear-gradient(145deg,#0c4a6e,#075985); }
    .wd-tile.correct { border-color:#34d399; background:linear-gradient(145deg,#10b981,#047857); box-shadow:inset 0 1px rgba(255,255,255,.14),0 0 17px rgba(16,185,129,.18); }
    .wd-tile.present { border-color:#facc15; background:linear-gradient(145deg,#eab308,#a16207); color:#fff8db; box-shadow:inset 0 1px rgba(255,255,255,.12),0 0 17px rgba(250,204,21,.14); }
    .wd-tile.absent { border-color:#475569; background:linear-gradient(145deg,#475569,#334155); color:#cbd5e1; }
    .wd-row.shake { animation:wd-shake .28s ease; }
    .wd-row.win .wd-tile { animation:wd-bounce .55s cubic-bezier(.2,.8,.2,1); }
    @keyframes wd-pop { 50% { transform:scale(1.08); } }
    @keyframes wd-shake { 25% { transform:translateX(-5px); } 50% { transform:translateX(5px); } 75% { transform:translateX(-3px); } }
    @keyframes wd-bounce { 35% { transform:translateY(-9px) scale(1.03); } 70% { transform:translateY(2px); } }
    .wd-message { min-height:30px; width:min(100%,560px); display:flex; align-items:center; justify-content:center; padding:5px 10px; border:1px solid rgba(148,163,184,.14); border-radius:12px; background:rgba(15,23,42,.52); color:#dbeafe; font-size:11px; font-weight:850; text-align:center; }
    .wd-message.good { color:#bbf7d0; border-color:rgba(52,211,153,.28); background:rgba(5,150,105,.1); }
    .wd-message.warn { color:#fef08a; border-color:rgba(250,204,21,.26); background:rgba(161,98,7,.12); }
    .wd-keyboard { display:grid; gap:5px; }
    .wd-key-row { display:flex; justify-content:center; gap:4px; }
    .wd-key { flex:1 1 0; min-width:0; padding:0 2px; border-radius:9px; background:linear-gradient(180deg,#273449,#182235); font-size:clamp(12px,3.6vw,17px); box-shadow:0 3px 0 rgba(2,6,23,.45); }
    .wd-key.wide { flex:1.55 1 0; font-size:11px; }
    .wd-key:active { transform:translateY(2px); box-shadow:0 1px 0 rgba(2,6,23,.45); }
    .wd-key.correct { border-color:#34d399; background:linear-gradient(180deg,#10b981,#047857); }
    .wd-key.present { border-color:#facc15; background:linear-gradient(180deg,#d9a40c,#92400e); }
    .wd-key.absent { border-color:#334155; background:#273449; color:#64748b; }
    .wd-toolbar { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; }
    .wd-toolbar button { padding:6px 3px; font-size:10px; }
    .wd-toolbar .accent { border-color:rgba(45,212,191,.35); color:#99f6e4; background:rgba(13,148,136,.13); }
    .wd-toolbar button:disabled { opacity:.38; cursor:not-allowed; }
    .wd-overlay { position:fixed; inset:0; z-index:80; display:flex; align-items:center; justify-content:center; padding:18px; background:rgba(2,6,23,.86); backdrop-filter:blur(13px); }
    .wd-overlay.hidden { display:none; }
    .wd-card { width:min(100%,460px); max-height:min(91dvh,720px); overflow:auto; padding:20px; border:1px solid rgba(94,234,212,.25); border-radius:22px; background:linear-gradient(155deg,#0f1c2e,#172033 55%,#21183b); box-shadow:0 30px 90px rgba(0,0,0,.62); }
    .wd-card small { color:#5eead4; font-size:10px; font-weight:950; letter-spacing:.16em; text-transform:uppercase; }
    .wd-card h2 { margin:5px 0 7px; font-size:clamp(25px,8vw,34px); letter-spacing:-.04em; }
    .wd-card p { margin:0 0 10px; color:#cbd5e1; font-size:13px; line-height:1.55; }
    .wd-card ul { margin:8px 0 14px; padding-left:20px; color:#cbd5e1; font-size:12px; line-height:1.55; }
    .wd-mode-grid { display:grid; gap:7px; margin-top:12px; }
    .wd-mode { width:100%; min-height:54px; padding:9px 11px; border:1px solid rgba(148,163,184,.22); border-radius:14px; background:rgba(15,23,42,.78); color:#fff; text-align:left; cursor:pointer; }
    .wd-mode strong { display:block; font-size:13px; }
    .wd-mode span { display:block; margin-top:2px; color:#94a3b8; font-size:10px; line-height:1.35; }
    .wd-mode.active { border-color:#5eead4; background:rgba(13,148,136,.14); box-shadow:0 0 20px rgba(45,212,191,.09); }
    .wd-card-actions { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-top:14px; }
    .wd-card-actions button { min-height:46px; border:1px solid rgba(148,163,184,.25); border-radius:13px; background:#1e293b; color:#fff; font-weight:900; cursor:pointer; }
    .wd-card-actions .primary { border-color:#2dd4bf; background:linear-gradient(135deg,#0f766e,#7c3aed); }
    .wd-result { margin:12px 0; padding:11px; border:1px solid rgba(45,212,191,.19); border-radius:14px; background:rgba(15,23,42,.68); }
    .wd-result-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; text-align:center; }
    .wd-result-grid span { color:#94a3b8; font-size:8px; font-weight:900; text-transform:uppercase; }
    .wd-result-grid strong { display:block; margin-top:2px; font-size:16px; }
    .wd-pause { text-align:center; }
    .wd-pause .logo { font-size:58px; filter:drop-shadow(0 0 20px rgba(94,234,212,.24)); }
    @media (max-height:700px) {
      .wd-app { gap:5px; padding-top:5px; }
      .wd-hud { gap:3px; }
      .wd-stat { padding:4px 2px; }
      .wd-board { gap:3px; padding:5px; }
      .wd-row { gap:3px; }
      .wd-keyboard { gap:3px; }
      .wd-key-row { gap:3px; }
      .wd-key { min-height:40px; }
      .wd-message { min-height:25px; }
    }
    @media (prefers-reduced-motion:reduce) {
      *,*::before,*::after { scroll-behavior:auto!important; animation-duration:.01ms!important; animation-iteration-count:1!important; transition-duration:.01ms!important; }
    }
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
    <main class="wd-app">
      <header class="wd-head">
        <div class="wd-brand"><small>Arcade NOWIS · français</small><h1>WORDLE</h1></div>
        <div class="wd-actions">
          <button type="button" data-action="sound" aria-label="Activer ou couper les sons">🔊</button>
          <button type="button" data-action="pause" aria-label="Mettre le jeu en pause">⏸</button>
          <button type="button" data-action="help" aria-label="Afficher l'aide">?</button>
        </div>
      </header>
      <section class="wd-hud" aria-label="Statistiques de la partie">
        <div class="wd-stat"><span>Mode</span><strong data-stat="mode">Classique</strong></div>
        <div class="wd-stat"><span>Essai</span><strong data-stat="attempt">1/6</strong></div>
        <div class="wd-stat"><span>Temps</span><strong data-stat="time">0:00</strong></div>
        <div class="wd-stat"><span>Série</span><strong data-stat="streak">0</strong></div>
        <div class="wd-stat"><span>Record</span><strong data-stat="best">0</strong></div>
      </section>
      <div class="wd-progress"><span>Mot</span><div class="wd-track"><i data-progress></i></div><span data-progress-label>0/5</span></div>
      <section class="wd-board" data-board aria-label="Grille Wordle"></section>
      <div class="wd-message" data-message role="status" aria-live="polite">Trouve le mot français de 5 lettres.</div>
      <section class="wd-keyboard" data-keyboard aria-label="Clavier français"></section>
      <section class="wd-toolbar">
        <button type="button" class="accent" data-action="new">Nouveau</button>
        <button type="button" data-action="hint">Indice</button>
        <button type="button" data-action="stats">Stats</button>
        <button type="button" data-action="help">Aide</button>
      </section>
    </main>
    <div class="wd-overlay hidden" data-overlay></div>
  `;

  const board = doc.querySelector<HTMLElement>('[data-board]');
  const keyboard = doc.querySelector<HTMLElement>('[data-keyboard]');
  const message = doc.querySelector<HTMLElement>('[data-message]');
  const overlay = doc.querySelector<HTMLElement>('[data-overlay]');
  const progress = doc.querySelector<HTMLElement>('[data-progress]');
  const progressLabel = doc.querySelector<HTMLElement>('[data-progress-label]');
  if (!board || !keyboard || !message || !overlay || !progress || !progressLabel) return;

  let mode: GameMode = 'classic';
  let target = TARGETS[Math.floor(Math.random() * TARGETS.length)];
  let attemptsAllowed = 6;
  let currentGuess = '';
  let history: GuessResult[] = [];
  let keyboardStates = new Map<string, LetterState>();
  let revealed = new Map<number, string>();
  let gameOver = false;
  let paused = false;
  let soundEnabled = true;
  let startAt = Date.now();
  let pausedAt = 0;
  let pausedTotal = 0;
  let hintsUsed = 0;
  let timerId = 0;
  let stats = emptyStats();

  try {
    stats = { ...emptyStats(), ...JSON.parse(win.localStorage.getItem(STATS_KEY) ?? '{}') } as StoredStats;
    if (!Array.isArray(stats.distribution) || stats.distribution.length !== 6) stats.distribution = [0, 0, 0, 0, 0, 0];
  } catch {
    stats = emptyStats();
  }

  const q = (selector: string) => doc.querySelector<HTMLElement>(selector);
  const setStat = (name: string, value: string | number) => {
    const node = q(`[data-stat="${name}"]`);
    if (node) node.textContent = String(value);
  };

  const persistStats = () => {
    try {
      win.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      // Le jeu reste fonctionnel même si le stockage local est bloqué.
    }
  };

  const elapsedMs = () => {
    const end = paused && pausedAt ? pausedAt : Date.now();
    return Math.max(0, end - startAt - pausedTotal);
  };

  const tone = (frequency: number, duration = 0.07, volume = 0.035) => {
    if (!soundEnabled) return;
    try {
      const audioWindow = win as AudioWindow;
      const AudioCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
      if (!AudioCtor) return;
      const context = new AudioCtor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
      oscillator.addEventListener('ended', () => context.close().catch(() => undefined));
    } catch {
      // Son optionnel.
    }
  };

  const vibrate = (pattern: number | number[]) => {
    try {
      win.navigator.vibrate?.(pattern);
    } catch {
      // Vibration optionnelle.
    }
  };

  const notify = (text: string, kind: 'neutral' | 'good' | 'warn' = 'neutral') => {
    message.textContent = text;
    message.className = `wd-message${kind === 'neutral' ? '' : ` ${kind}`}`;
  };

  const maxAttempts = () => attemptsAllowed;

  const setModeTarget = () => {
    if (mode === 'daily') {
      target = TARGETS[hashDate(localDateKey()) % TARGETS.length];
      attemptsAllowed = 6;
    } else if (mode === 'expert') {
      target = TARGETS[Math.floor(Math.random() * TARGETS.length)];
      attemptsAllowed = 5;
    } else {
      target = TARGETS[Math.floor(Math.random() * TARGETS.length)];
      attemptsAllowed = 6;
    }
  };

  const modeLabel = () => (mode === 'daily' ? 'Du jour' : mode === 'expert' ? 'Expert' : 'Classique');

  const renderBoard = () => {
    board.innerHTML = '';
    for (let rowIndex = 0; rowIndex < maxAttempts(); rowIndex += 1) {
      const row = doc.createElement('div');
      row.className = 'wd-row';
      row.dataset.row = String(rowIndex);
      const previous = history[rowIndex];
      const isCurrent = rowIndex === history.length && !gameOver;

      for (let column = 0; column < WORD_LENGTH; column += 1) {
        const tile = doc.createElement('div');
        tile.className = 'wd-tile';
        tile.setAttribute('role', 'img');
        const revealedLetter = revealed.get(column);
        const letter = previous?.guess[column] ?? (isCurrent ? currentGuess[column] : '') ?? '';
        const state: TileState = previous?.states[column] ?? (letter ? 'filled' : revealedLetter && isCurrent ? 'revealed' : 'empty');
        const displayed = letter || (revealedLetter && isCurrent ? revealedLetter : '');
        tile.textContent = displayed;
        tile.classList.add(state);
        const stateLabel = state === 'correct' ? 'bien placée' : state === 'present' ? 'présente ailleurs' : state === 'absent' ? 'absente' : state === 'revealed' ? 'lettre révélée' : state === 'filled' ? 'saisie' : 'vide';
        tile.setAttribute('aria-label', displayed ? `${displayed}, ${stateLabel}` : `Case ${column + 1}, vide`);
        row.appendChild(tile);
      }

      board.appendChild(row);
    }

    setStat('mode', modeLabel());
    setStat('attempt', gameOver ? `${history.length}/${maxAttempts()}` : `${history.length + 1}/${maxAttempts()}`);
    setStat('streak', stats.currentStreak);
    setStat('best', stats.bestScore);
    const filled = Math.min(WORD_LENGTH, currentGuess.length + revealed.size);
    progress.style.width = `${(filled / WORD_LENGTH) * 100}%`;
    progressLabel.textContent = `${Math.min(WORD_LENGTH, filled)}/${WORD_LENGTH}`;
  };

  const stateRank: Record<LetterState, number> = { absent: 1, present: 2, correct: 3 };
  const renderKeyboard = () => {
    keyboard.innerHTML = '';
    KEY_ROWS.forEach((letters, rowIndex) => {
      const row = doc.createElement('div');
      row.className = 'wd-key-row';
      if (rowIndex === 2) {
        const enter = doc.createElement('button');
        enter.type = 'button';
        enter.className = 'wd-key wide';
        enter.dataset.key = 'ENTER';
        enter.textContent = 'ENTRER';
        enter.setAttribute('aria-label', 'Valider le mot');
        row.appendChild(enter);
      }

      for (const letter of letters) {
        const key = doc.createElement('button');
        key.type = 'button';
        key.className = 'wd-key';
        const state = keyboardStates.get(letter);
        if (state) key.classList.add(state);
        key.dataset.key = letter;
        key.textContent = letter;
        key.setAttribute('aria-label', `Lettre ${letter}${state ? `, ${state === 'correct' ? 'bien placée' : state === 'present' ? 'présente' : 'absente'}` : ''}`);
        row.appendChild(key);
      }

      if (rowIndex === 2) {
        const backspace = doc.createElement('button');
        backspace.type = 'button';
        backspace.className = 'wd-key wide';
        backspace.dataset.key = 'BACKSPACE';
        backspace.textContent = '⌫';
        backspace.setAttribute('aria-label', 'Effacer une lettre');
        row.appendChild(backspace);
      }
      keyboard.appendChild(row);
    });
  };

  const updateKeyboardStates = (result: GuessResult) => {
    result.states.forEach((state, index) => {
      const letter = result.guess[index];
      const previous = keyboardStates.get(letter);
      if (!previous || stateRank[state] > stateRank[previous]) keyboardStates.set(letter, state);
    });
  };

  const closeOverlay = () => {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
  };

  const showHelp = () => {
    overlay.innerHTML = `
      <section class="wd-card" role="dialog" aria-modal="true" aria-label="Règles de Wordle">
        <small>Comment jouer</small><h2>5 lettres. À toi de déduire.</h2>
        <p>Tu as ${maxAttempts()} essais pour trouver le mot. Les accents ne sont pas nécessaires : ÉCOLE devient ECOLE.</p>
        <ul>
          <li><strong style="color:#6ee7b7">Vert</strong> : lettre exacte au bon endroit.</li>
          <li><strong style="color:#fde047">Jaune</strong> : lettre présente, mais ailleurs.</li>
          <li><strong style="color:#94a3b8">Gris</strong> : lettre absente du mot.</li>
          <li>Les doubles lettres sont comptées correctement, une par une.</li>
          <li>En Expert, tu dois réutiliser les indices déjà découverts.</li>
        </ul>
        <p>Clavier physique et clavier tactile fonctionnent. Un indice peut révéler une position en Classique, avec une pénalité de score.</p>
        <div class="wd-card-actions"><button type="button" data-overlay-action="close">Fermer</button><button type="button" class="primary" data-overlay-action="modes">Choisir un mode</button></div>
      </section>`;
    overlay.classList.remove('hidden');
  };

  const showModePicker = () => {
    overlay.innerHTML = `
      <section class="wd-card" role="dialog" aria-modal="true" aria-label="Choisir le mode de jeu">
        <small>Nouveau mot</small><h2>Choisis ton défi</h2>
        <p>Chaque mode garde les mêmes règles de lettres, mais change la pression et la progression.</p>
        <div class="wd-mode-grid">
          <button type="button" class="wd-mode${mode === 'classic' ? ' active' : ''}" data-mode="classic"><strong>🌿 Classique · 6 essais</strong><span>Partie rapide, indice disponible, idéale pour progresser.</span></button>
          <button type="button" class="wd-mode${mode === 'daily' ? ' active' : ''}" data-mode="daily"><strong>☀️ Mot du jour · 6 essais</strong><span>Même mot pour toute la journée sur cet appareil.</span></button>
          <button type="button" class="wd-mode${mode === 'expert' ? ' active' : ''}" data-mode="expert"><strong>⚡ Expert · 5 essais</strong><span>Les indices connus deviennent obligatoires. Aucun indice gratuit.</span></button>
        </div>
        <div class="wd-card-actions"><button type="button" data-overlay-action="close">Annuler</button><button type="button" class="primary" data-overlay-action="start">Jouer</button></div>
      </section>`;
    overlay.classList.remove('hidden');
  };

  const showStats = () => {
    const winRate = stats.games ? Math.round((stats.wins / stats.games) * 100) : 0;
    overlay.innerHTML = `
      <section class="wd-card" role="dialog" aria-modal="true" aria-label="Statistiques Wordle">
        <small>Progression</small><h2>Ton parcours</h2>
        <div class="wd-result"><div class="wd-result-grid">
          <div><span>Parties</span><strong>${stats.games}</strong></div><div><span>Victoires</span><strong>${winRate}%</strong></div><div><span>Série</span><strong>${stats.currentStreak}</strong></div><div><span>Record</span><strong>${stats.bestScore}</strong></div>
        </div></div>
        <p>Meilleure série : <strong>${stats.bestStreak}</strong>. Les records sont sauvegardés localement sur cet appareil.</p>
        <div class="wd-card-actions"><button type="button" data-overlay-action="close">Fermer</button><button type="button" class="primary" data-overlay-action="modes">Nouveau défi</button></div>
      </section>`;
    overlay.classList.remove('hidden');
  };

  const endGame = (won: boolean) => {
    gameOver = true;
    stats.games += 1;
    let score = 0;
    if (won) {
      stats.wins += 1;
      stats.currentStreak += 1;
      stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
      const bucket = Math.min(5, Math.max(0, history.length - 1));
      stats.distribution[bucket] += 1;
      score = scoreGame(history.length, elapsedMs(), mode, hintsUsed);
      stats.bestScore = Math.max(stats.bestScore, score);
      tone(880, 0.11, 0.05);
      win.setTimeout(() => tone(1174, 0.13, 0.045), 110);
      vibrate([45, 30, 80]);
      const row = board.querySelector<HTMLElement>(`[data-row="${history.length - 1}"]`);
      row?.classList.add('win');
      notify(`Bravo ! ${target} trouvé en ${history.length} essai${history.length > 1 ? 's' : ''}. +${score} points`, 'good');
    } else {
      stats.currentStreak = 0;
      tone(180, 0.16, 0.04);
      vibrate([80, 40, 80]);
      notify(`Le mot était ${target}. La prochaine grille t'attend.`, 'warn');
    }
    persistStats();
    renderBoard();
    win.setTimeout(() => showResult(won, score), 620);
  };

  const showResult = (won: boolean, score: number) => {
    const winRate = stats.games ? Math.round((stats.wins / stats.games) * 100) : 0;
    overlay.innerHTML = `
      <section class="wd-card" role="dialog" aria-modal="true" aria-label="Résultat Wordle">
        <small>${won ? 'Victoire' : 'Partie terminée'}</small><h2>${won ? 'Mot trouvé 🎉' : target}</h2>
        <p>${won ? `Tu as trouvé <strong>${target}</strong>.` : `Le mot à trouver était <strong>${target}</strong>.`}</p>
        <div class="wd-result"><div class="wd-result-grid"><div><span>Score</span><strong>${score}</strong></div><div><span>Essais</span><strong>${history.length}</strong></div><div><span>Temps</span><strong>${formatTimer(elapsedMs())}</strong></div><div><span>Victoires</span><strong>${winRate}%</strong></div></div></div>
        <div class="wd-card-actions"><button type="button" data-overlay-action="close">Voir la grille</button><button type="button" class="primary" data-overlay-action="modes">Rejouer</button></div>
      </section>`;
    overlay.classList.remove('hidden');
  };

  const showPause = () => {
    overlay.innerHTML = `<section class="wd-card wd-pause" role="dialog" aria-modal="true" aria-label="Jeu en pause"><div class="logo">🧩</div><small>Pause</small><h2>Le chrono est arrêté</h2><p>Reprends quand tu veux. Aucun temps n'est perdu pendant la pause.</p><div class="wd-card-actions"><button type="button" data-overlay-action="modes">Nouveau</button><button type="button" class="primary" data-overlay-action="resume">Reprendre</button></div></section>`;
    overlay.classList.remove('hidden');
  };

  const newGame = () => {
    currentGuess = '';
    history = [];
    keyboardStates = new Map<string, LetterState>();
    revealed = new Map<number, string>();
    gameOver = false;
    paused = false;
    pausedAt = 0;
    pausedTotal = 0;
    hintsUsed = 0;
    startAt = Date.now();
    setModeTarget();
    closeOverlay();
    notify(mode === 'expert' ? 'Mode Expert : respecte tous les indices connus.' : mode === 'daily' ? 'Mot du jour : six essais pour le trouver.' : 'Trouve le mot français de 5 lettres.');
    renderBoard();
    renderKeyboard();
    const hintButton = q('[data-action="hint"]') as HTMLButtonElement | null;
    if (hintButton) hintButton.disabled = mode !== 'classic';
  };

  const revealHint = () => {
    if (gameOver || paused || mode !== 'classic') return;
    const available = [...Array(WORD_LENGTH).keys()].filter((index) => !revealed.has(index) && !history.some((result) => result.states[index] === 'correct'));
    if (available.length === 0) {
      notify('Tous les emplacements utiles sont déjà connus.', 'warn');
      return;
    }
    const index = available[Math.floor(Math.random() * available.length)];
    revealed.set(index, target[index]);
    hintsUsed += 1;
    tone(620, 0.08);
    vibrate(25);
    notify(`Indice : la lettre ${target[index]} est en position ${index + 1}. -220 points au score final.`, 'warn');
    renderBoard();
  };

  const submitGuess = () => {
    if (gameOver || paused) return;
    if (currentGuess.length !== WORD_LENGTH) {
      notify('Il faut entrer exactement 5 lettres.', 'warn');
      const row = board.querySelector<HTMLElement>(`[data-row="${history.length}"]`);
      row?.classList.add('shake');
      win.setTimeout(() => row?.classList.remove('shake'), 300);
      tone(210, 0.08);
      return;
    }
    if (mode === 'expert' && !isHardModeGuessValid(history, currentGuess)) {
      notify('Mode Expert : conserve les lettres et positions déjà révélées.', 'warn');
      const row = board.querySelector<HTMLElement>(`[data-row="${history.length}"]`);
      row?.classList.add('shake');
      win.setTimeout(() => row?.classList.remove('shake'), 300);
      tone(210, 0.08);
      return;
    }

    const guess = currentGuess;
    const states = evaluateGuess(target, guess);
    const result = { guess, states };
    history.push(result);
    updateKeyboardStates(result);
    currentGuess = '';
    renderBoard();
    renderKeyboard();
    tone(430, 0.055);
    vibrate(18);

    if (guess === target) {
      endGame(true);
      return;
    }
    if (history.length >= maxAttempts()) {
      endGame(false);
      return;
    }

    const presentCount = states.filter((state) => state === 'present').length;
    const correctCount = states.filter((state) => state === 'correct').length;
    notify(correctCount ? `${correctCount} bien placée${correctCount > 1 ? 's' : ''}, ${presentCount} présente${presentCount > 1 ? 's' : ''} ailleurs.` : presentCount ? `${presentCount} lettre${presentCount > 1 ? 's' : ''} présente${presentCount > 1 ? 's' : ''}, mais ailleurs.` : 'Aucune de ces lettres. Change de piste.');
  };

  const inputKey = (rawKey: string) => {
    if (gameOver || paused || !overlay.classList.contains('hidden')) return;
    const key = rawKey.toUpperCase();
    if (key === 'ENTER') {
      submitGuess();
      return;
    }
    if (key === 'BACKSPACE' || key === 'DELETE') {
      currentGuess = currentGuess.slice(0, -1);
      tone(250, 0.035, 0.02);
      renderBoard();
      return;
    }
    const normalized = normalizeWord(key);
    if (normalized.length === 1 && currentGuess.length < WORD_LENGTH) {
      currentGuess += normalized;
      tone(520, 0.025, 0.018);
      renderBoard();
    }
  };

  keyboard.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-key]');
    if (!button) return;
    inputKey(button.dataset.key ?? '');
  });

  doc.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Enter' || event.key === 'Backspace' || event.key === 'Delete' || /^[a-zA-ZÀ-ÿ]$/.test(event.key)) {
      event.preventDefault();
      inputKey(event.key === 'Enter' ? 'ENTER' : event.key === 'Backspace' || event.key === 'Delete' ? 'BACKSPACE' : event.key);
    }
  });

  doc.addEventListener('click', (event) => {
    const actionButton = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-action]');
    if (actionButton) {
      const action = actionButton.dataset.action;
      if (action === 'sound') {
        soundEnabled = !soundEnabled;
        actionButton.textContent = soundEnabled ? '🔊' : '🔇';
        actionButton.setAttribute('aria-label', soundEnabled ? 'Couper les sons' : 'Activer les sons');
        if (soundEnabled) tone(660, 0.06);
      } else if (action === 'pause' && !gameOver) {
        if (!paused) {
          paused = true;
          pausedAt = Date.now();
          showPause();
        }
      } else if (action === 'help') {
        showHelp();
      } else if (action === 'new') {
        showModePicker();
      } else if (action === 'stats') {
        showStats();
      } else if (action === 'hint') {
        revealHint();
      }
      return;
    }

    const overlayButton = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-overlay-action]');
    if (overlayButton) {
      const action = overlayButton.dataset.overlayAction;
      if (action === 'close') closeOverlay();
      if (action === 'modes') showModePicker();
      if (action === 'resume') {
        if (paused && pausedAt) {
          pausedTotal += Date.now() - pausedAt;
          pausedAt = 0;
        }
        paused = false;
        closeOverlay();
      }
      if (action === 'start') newGame();
      return;
    }

    const modeButton = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-mode]');
    if (modeButton) {
      const candidate = modeButton.dataset.mode;
      if (candidate === 'classic' || candidate === 'daily' || candidate === 'expert') {
        mode = candidate;
        overlay.querySelectorAll('[data-mode]').forEach((node) => node.classList.toggle('active', node === modeButton));
      }
    }
  });

  timerId = win.setInterval(() => {
    if (!paused) setStat('time', formatTimer(elapsedMs()));
  }, 500);
  win.addEventListener('beforeunload', () => win.clearInterval(timerId), { once: true });

  renderBoard();
  renderKeyboard();
  setStat('time', '0:00');
  q('[data-action="hint"]')?.removeAttribute('disabled');
  showHelp();
}
