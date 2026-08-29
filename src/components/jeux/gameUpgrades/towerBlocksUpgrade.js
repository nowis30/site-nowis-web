const STATS_KEY = 'nowis:tower-blocks:stats';
const SETTINGS_KEY = 'nowis:tower-blocks:settings';

const WORLD_W = 420;
const WORLD_H = 620;
const BLOCK_H = 26;
const GROUND_Y = 568;
const START_WIDTH = 248;
const EDGE = 18;

const MODES = {
  classic: {
    label: 'Classique',
    description: 'Une erreur et la tour tombe. Le mode pur, précis et nerveux.',
    lives: 1,
    baseSpeed: 112,
    speedStep: 8,
    scoreMultiplier: 1,
    timeLimit: 0,
  },
  relax: {
    label: 'Détente',
    description: 'Trois chances, blocs un peu plus lents et récupération sur les parfaits.',
    lives: 3,
    baseSpeed: 88,
    speedStep: 6,
    scoreMultiplier: 0.82,
    timeLimit: 0,
  },
  sprint: {
    label: 'Sprint 60 s',
    description: 'Deux chances. Monte le plus haut possible avant la fin du chrono.',
    lives: 2,
    baseSpeed: 124,
    speedStep: 9,
    scoreMultiplier: 1.35,
    timeLimit: 60000,
  },
};

const BLOCK_COLORS = [
  ['#22d3ee', '#0891b2'],
  ['#f472b6', '#db2777'],
  ['#fbbf24', '#d97706'],
  ['#a78bfa', '#7c3aed'],
  ['#34d399', '#059669'],
  ['#fb7185', '#e11d48'],
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function readJson(storage, key, fallback) {
  try {
    const value = JSON.parse(storage.getItem(key) || 'null');
    return value && typeof value === 'object' ? { ...fallback, ...value } : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Le stockage local est facultatif pour jouer.
  }
}

function defaultStats() {
  return {
    games: 0,
    bestScore: 0,
    bestHeight: 0,
    bestCombo: 0,
    totalBlocks: 0,
    perfects: 0,
  };
}

function defaultSettings() {
  return { sound: true, vibration: true, mode: 'classic' };
}

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function upgradeTowerBlocks(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisTowerBlocksPro === 'true') return;
  root.dataset.nowisTowerBlocksPro = 'true';
  root.lang = 'fr';
  doc.title = 'Tower Blocks NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"], script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    :root { color-scheme:dark; font-family:Inter,ui-rounded,system-ui,-apple-system,"Segoe UI",sans-serif; }
    * { box-sizing:border-box; }
    html,body { width:100%; min-height:100%; margin:0; background:#07111f; color:#f8fafc; }
    body { min-height:100dvh; overflow-x:hidden; overscroll-behavior:none; user-select:none; -webkit-tap-highlight-color:transparent; }
    button { font:inherit; }
    button:focus-visible { outline:3px solid #fef08a; outline-offset:3px; }
    .tb-app { min-height:100dvh; display:flex; flex-direction:column; align-items:center; gap:8px; padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left)); background:radial-gradient(circle at 12% 0%,rgba(34,211,238,.15),transparent 30%),radial-gradient(circle at 90% 8%,rgba(244,114,182,.16),transparent 28%),linear-gradient(180deg,#08172b,#07111f 58%,#050b13); }
    .tb-head,.tb-hud,.tb-stage-wrap,.tb-toolbar,.tb-message { width:min(100%,610px); }
    .tb-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .tb-brand small { display:block; color:#67e8f9; font-size:10px; font-weight:950; letter-spacing:.19em; text-transform:uppercase; }
    .tb-brand h1 { margin:2px 0 0; font-size:clamp(27px,7vw,41px); line-height:.94; letter-spacing:-.055em; background:linear-gradient(95deg,#67e8f9 0%,#f9a8d4 48%,#fde68a 100%); -webkit-background-clip:text; color:transparent; filter:drop-shadow(0 0 16px rgba(34,211,238,.13)); }
    .tb-head-actions { display:flex; gap:6px; }
    .tb-icon,.tb-toolbar button,.tb-drop,.tb-mode,.tb-modal button { min-height:44px; border:1px solid rgba(148,163,184,.25); border-radius:14px; background:rgba(12,27,45,.9); color:#f8fafc; font-weight:900; cursor:pointer; touch-action:manipulation; box-shadow:0 8px 24px rgba(2,6,23,.24),inset 0 1px rgba(255,255,255,.05); transition:transform .12s ease,border-color .12s ease,background .12s ease; }
    .tb-icon { min-width:44px; padding:0 11px; }
    button:active { transform:scale(.96); }
    .tb-hud { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:6px; }
    .tb-stat { min-width:0; padding:7px 5px; text-align:center; border:1px solid rgba(148,163,184,.18); border-radius:13px; background:rgba(10,25,43,.72); box-shadow:0 8px 20px rgba(2,6,23,.2); }
    .tb-stat span { display:block; color:#a9bbcf; font-size:9px; font-weight:900; letter-spacing:.09em; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .tb-stat strong { display:block; margin-top:2px; font-size:clamp(15px,4vw,20px); line-height:1; font-variant-numeric:tabular-nums; }
    .tb-stage-wrap { position:relative; display:flex; justify-content:center; min-height:0; }
    .tb-stage { position:relative; width:min(100%,430px); aspect-ratio:420/620; max-height:calc(100dvh - 225px); border-radius:24px; overflow:hidden; border:1px solid rgba(103,232,249,.24); background:#08172b; box-shadow:0 28px 70px rgba(2,6,23,.48),inset 0 0 0 1px rgba(255,255,255,.035); }
    .tb-stage::after { content:""; position:absolute; inset:0; pointer-events:none; background:linear-gradient(180deg,rgba(255,255,255,.04),transparent 20%,transparent 75%,rgba(2,6,23,.22)); }
    canvas { display:block; width:100%; height:100%; touch-action:none; cursor:pointer; }
    .tb-drop { position:absolute; z-index:5; left:50%; bottom:13px; transform:translateX(-50%); min-width:168px; padding:10px 20px; color:#07111f; border-color:#fde68a; background:linear-gradient(135deg,#fde68a,#fbbf24 54%,#fb7185); box-shadow:0 10px 30px rgba(251,191,36,.28),inset 0 1px rgba(255,255,255,.55); letter-spacing:.04em; }
    .tb-drop:active { transform:translateX(-50%) scale(.96); }
    .tb-message { min-height:28px; display:flex; align-items:center; justify-content:center; padding:5px 10px; color:#d7e7f8; font-size:12px; font-weight:800; text-align:center; border-radius:12px; background:rgba(10,25,43,.55); border:1px solid rgba(148,163,184,.12); }
    .tb-message strong { color:#fef08a; }
    .tb-toolbar { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
    .tb-toolbar button { padding:8px 5px; color:#dbeafe; font-size:11px; }
    .tb-toolbar button[aria-pressed="false"] { color:#8498af; }
    .tb-overlay { position:fixed; inset:0; z-index:80; display:flex; align-items:center; justify-content:center; padding:18px; background:rgba(3,9,18,.84); backdrop-filter:blur(14px); }
    .tb-overlay.hidden { display:none; }
    .tb-modal { width:min(100%,440px); max-height:min(88dvh,680px); overflow:auto; padding:22px; border:1px solid rgba(103,232,249,.24); border-radius:24px; background:linear-gradient(155deg,#0b1f35,#0b1728 58%,#18152d); box-shadow:0 30px 90px rgba(0,0,0,.56); }
    .tb-modal .eyebrow { margin:0; color:#67e8f9; font-size:10px; font-weight:950; letter-spacing:.17em; text-transform:uppercase; }
    .tb-modal h2 { margin:4px 0 0; font-size:clamp(27px,8vw,38px); line-height:1; letter-spacing:-.05em; }
    .tb-modal > p { color:#bfd0e2; line-height:1.48; font-size:13px; }
    .tb-modes { display:grid; gap:8px; margin:16px 0; }
    .tb-mode { width:100%; padding:13px 14px; text-align:left; }
    .tb-mode strong { display:block; color:#fff; font-size:15px; }
    .tb-mode span { display:block; margin-top:3px; color:#9fb1c5; font-size:12px; line-height:1.35; }
    .tb-mode.recommended { border-color:rgba(103,232,249,.46); background:linear-gradient(120deg,rgba(34,211,238,.11),rgba(244,114,182,.08)); }
    .tb-modal-actions { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:14px; }
    .tb-modal button { padding:11px 12px; }
    .tb-modal .primary { color:#07111f; border-color:#67e8f9; background:linear-gradient(135deg,#67e8f9,#22d3ee); }
    .tb-help-list { margin:12px 0 0; padding-left:19px; color:#c4d4e5; font-size:13px; line-height:1.55; }
    .tb-help-list strong { color:#fef08a; }
    .tb-kicker { display:inline-flex; align-items:center; gap:6px; padding:5px 9px; border-radius:999px; color:#dff9ff; background:rgba(34,211,238,.1); border:1px solid rgba(34,211,238,.22); font-size:11px; font-weight:900; }
    .tb-result-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; margin:15px 0; }
    .tb-result-grid div { padding:10px 6px; text-align:center; border-radius:13px; background:rgba(7,17,31,.64); border:1px solid rgba(148,163,184,.16); }
    .tb-result-grid span { display:block; color:#91a5bb; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:.08em; }
    .tb-result-grid strong { display:block; margin-top:3px; font-size:19px; }
    .tb-sr { position:absolute!important; width:1px!important; height:1px!important; padding:0!important; margin:-1px!important; overflow:hidden!important; clip:rect(0,0,0,0)!important; white-space:nowrap!important; border:0!important; }
    @media (max-width:430px) {
      .tb-app { gap:6px; }
      .tb-stage { max-height:calc(100dvh - 205px); border-radius:20px; }
      .tb-hud { gap:4px; }
      .tb-stat { padding:6px 3px; }
      .tb-toolbar button { min-height:42px; font-size:10px; }
      .tb-drop { bottom:10px; min-width:150px; min-height:42px; padding:8px 16px; }
      .tb-message { min-height:24px; padding:3px 8px; font-size:11px; }
    }
    @media (max-height:680px) {
      .tb-brand h1 { font-size:25px; }
      .tb-brand small { font-size:8px; }
      .tb-stage { max-height:calc(100dvh - 176px); }
      .tb-message { display:none; }
      .tb-toolbar button { min-height:38px; }
    }
    @media (orientation:landscape) and (max-height:520px) {
      .tb-app { display:grid; grid-template-columns:minmax(210px,1fr) minmax(260px,420px); grid-template-rows:auto auto 1fr; align-content:start; column-gap:10px; }
      .tb-head,.tb-hud,.tb-message,.tb-toolbar { width:100%; }
      .tb-head { grid-column:1; grid-row:1; }
      .tb-hud { grid-column:1; grid-row:2; grid-template-columns:repeat(3,1fr); }
      .tb-stat:nth-child(n+4) { display:none; }
      .tb-message { grid-column:1; grid-row:3; align-self:start; display:flex; }
      .tb-toolbar { grid-column:1; grid-row:3; align-self:end; }
      .tb-stage-wrap { grid-column:2; grid-row:1/4; width:100%; }
      .tb-stage { height:calc(100dvh - 18px); width:auto; max-height:none; }
    }
    @media (prefers-reduced-motion:reduce) {
      *,*::before,*::after { scroll-behavior:auto!important; transition:none!important; animation:none!important; }
    }
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
    <main class="tb-app">
      <header class="tb-head">
        <div class="tb-brand"><small>Arcade vertical NOWIS</small><h1>Tower Blocks</h1></div>
        <div class="tb-head-actions">
          <button class="tb-icon" id="tbPause" type="button" aria-label="Mettre le jeu en pause">Ⅱ</button>
          <button class="tb-icon" id="tbHelp" type="button" aria-label="Ouvrir l’aide">?</button>
        </div>
      </header>
      <section class="tb-hud" aria-label="Statistiques de la partie">
        <div class="tb-stat"><span>Score</span><strong id="tbScore">0</strong></div>
        <div class="tb-stat"><span>Record</span><strong id="tbBest">0</strong></div>
        <div class="tb-stat"><span>Étage</span><strong id="tbFloor">0</strong></div>
        <div class="tb-stat"><span>Série</span><strong id="tbCombo">×1</strong></div>
        <div class="tb-stat"><span id="tbLastLabel">Vies</span><strong id="tbLast">1</strong></div>
      </section>
      <section class="tb-stage-wrap">
        <div class="tb-stage" id="tbStage">
          <canvas id="tbCanvas" width="420" height="620" aria-label="Tour de blocs. Touchez pour lâcher le bloc mobile."></canvas>
          <button class="tb-drop" id="tbDrop" type="button">LÂCHER LE BLOC</button>
        </div>
      </section>
      <div class="tb-message" id="tbMessage" aria-live="polite">Aligne le bloc mobile, puis touche <strong>LÂCHER</strong>.</div>
      <nav class="tb-toolbar" aria-label="Options du jeu">
        <button id="tbRestart" type="button">↻ Rejouer</button>
        <button id="tbSound" type="button" aria-pressed="true">♫ Son</button>
        <button id="tbVibration" type="button" aria-pressed="true">⌁ Vibration</button>
        <button id="tbModeButton" type="button">◆ Mode</button>
      </nav>
      <div class="tb-sr" id="tbLive" aria-live="assertive"></div>
      <div class="tb-overlay" id="tbStartOverlay">
        <section class="tb-modal" role="dialog" aria-modal="true" aria-labelledby="tbStartTitle">
          <p class="eyebrow">Précision • rythme • hauteur</p>
          <h2 id="tbStartTitle">Bâtis la tour parfaite</h2>
          <p>Le bloc glisse de gauche à droite. Lâche-le au bon moment : seule la partie qui chevauche l’étage précédent reste sur la tour.</p>
          <div class="tb-modes" id="tbModes"></div>
          <span class="tb-kicker">Astuce : les poses parfaites restaurent un peu de largeur</span>
        </section>
      </div>
      <div class="tb-overlay hidden" id="tbPauseOverlay">
        <section class="tb-modal" role="dialog" aria-modal="true" aria-labelledby="tbPauseTitle">
          <p class="eyebrow">Partie en pause</p><h2 id="tbPauseTitle">La tour tient bon.</h2>
          <p>Le chrono et le bloc mobile sont gelés. Reprends quand tu es prêt.</p>
          <div class="tb-modal-actions"><button class="primary" id="tbResume" type="button">Reprendre</button><button id="tbPauseRestart" type="button">Recommencer</button></div>
        </section>
      </div>
      <div class="tb-overlay hidden" id="tbHelpOverlay">
        <section class="tb-modal" role="dialog" aria-modal="true" aria-labelledby="tbHelpTitle">
          <p class="eyebrow">Aide rapide</p><h2 id="tbHelpTitle">Comment jouer</h2>
          <ul class="tb-help-list">
            <li><strong>Touche l’écran</strong>, le bouton LÂCHER, <strong>Espace</strong> ou <strong>Entrée</strong> pour poser le bloc.</li>
            <li>La partie qui dépasse est coupée. Plus la tour rétrécit, plus la pose devient difficile.</li>
            <li>Un alignement quasi parfait augmente la <strong>série</strong> et redonne légèrement de la largeur.</li>
            <li>Tous les 5 étages, la vitesse augmente et la ville descend pour suivre ta tour.</li>
            <li>Le mode Sprint donne 60 secondes pour construire le plus haut possible.</li>
          </ul>
          <div class="tb-modal-actions"><button class="primary" id="tbHelpClose" type="button">Compris</button><button id="tbHelpRestart" type="button">Nouvelle partie</button></div>
        </section>
      </div>
      <div class="tb-overlay hidden" id="tbEndOverlay">
        <section class="tb-modal" role="dialog" aria-modal="true" aria-labelledby="tbEndTitle">
          <p class="eyebrow" id="tbEndEyebrow">Fin de partie</p><h2 id="tbEndTitle">Belle construction.</h2><p id="tbEndText">Ta tour rejoint la ligne d’horizon.</p>
          <div class="tb-result-grid"><div><span>Score</span><strong id="tbEndScore">0</strong></div><div><span>Étages</span><strong id="tbEndHeight">0</strong></div><div><span>Parfaits</span><strong id="tbEndPerfects">0</strong></div></div>
          <div class="tb-modal-actions"><button class="primary" id="tbPlayAgain" type="button">Rejouer</button><button id="tbChangeMode" type="button">Changer de mode</button></div>
        </section>
      </div>
    </main>`;

  const storage = win.localStorage;
  let stats = readJson(storage, STATS_KEY, defaultStats());
  let settings = readJson(storage, SETTINGS_KEY, defaultSettings());
  if (!MODES[settings.mode]) settings.mode = 'classic';

  const canvas = doc.getElementById('tbCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = doc.getElementById('tbScore');
  const bestEl = doc.getElementById('tbBest');
  const floorEl = doc.getElementById('tbFloor');
  const comboEl = doc.getElementById('tbCombo');
  const lastLabelEl = doc.getElementById('tbLastLabel');
  const lastEl = doc.getElementById('tbLast');
  const messageEl = doc.getElementById('tbMessage');
  const liveEl = doc.getElementById('tbLive');
  const startOverlay = doc.getElementById('tbStartOverlay');
  const pauseOverlay = doc.getElementById('tbPauseOverlay');
  const helpOverlay = doc.getElementById('tbHelpOverlay');
  const endOverlay = doc.getElementById('tbEndOverlay');
  const modesEl = doc.getElementById('tbModes');
  const dropButton = doc.getElementById('tbDrop');
  const pauseButton = doc.getElementById('tbPause');
  const soundButton = doc.getElementById('tbSound');
  const vibrationButton = doc.getElementById('tbVibration');
  if (!ctx) return;

  let modeKey = settings.mode;
  let running = false;
  let paused = false;
  let score = 0;
  let lives = MODES[modeKey].lives;
  let combo = 0;
  let bestComboRun = 0;
  let perfectsRun = 0;
  let elapsedMs = 0;
  let timeLeftMs = MODES[modeKey].timeLimit;
  let blocks = [];
  let active = null;
  let debris = [];
  let particles = [];
  let camera = 0;
  let cameraTarget = 0;
  let shake = 0;
  let flash = 0;
  let lastTimestamp = 0;
  let lastUiTick = 0;
  let rafId = 0;
  let audioContext = null;

  const stars = Array.from({ length: 42 }, (_, index) => ({
    x: (index * 97 + 41) % WORLD_W,
    y: (index * 53 + 29) % 300,
    r: 0.7 + ((index * 11) % 7) / 10,
    a: 0.22 + ((index * 17) % 55) / 100,
  }));

  function mode() { return MODES[modeKey] || MODES.classic; }
  function currentFloor() { return Math.max(0, blocks.length - 1); }
  function currentLevel() { return 1 + Math.floor(currentFloor() / 5); }
  function currentSpeed() { return Math.min(248, mode().baseSpeed + Math.max(0, currentLevel() - 1) * mode().speedStep); }
  function setMessage(text) { messageEl.innerHTML = text; }
  function announce(text) { liveEl.textContent = ''; win.setTimeout(() => { liveEl.textContent = text; }, 20); }
  function saveSettings() { settings = { ...settings, sound: Boolean(settings.sound), vibration: Boolean(settings.vibration), mode: modeKey }; writeJson(storage, SETTINGS_KEY, settings); }

  function ensureAudio() {
    if (!settings.sound) return null;
    const AudioCtor = win.AudioContext || win.webkitAudioContext;
    if (!AudioCtor) return null;
    try {
      if (!audioContext || audioContext.state === 'closed') audioContext = new AudioCtor();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      return audioContext;
    } catch { return null; }
  }

  function beep(frequency, duration = 0.08, gainValue = 0.035, type = 'sine', delay = 0) {
    const audio = ensureAudio();
    if (!audio) return;
    try {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(gainValue, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
    } catch { /* le son reste facultatif */ }
  }

  function vibrate(pattern) {
    if (!settings.vibration || !win.navigator || typeof win.navigator.vibrate !== 'function') return;
    try { win.navigator.vibrate(pattern); } catch { /* facultatif */ }
  }

  function playPerfect() { beep(660, 0.07, 0.035, 'triangle'); beep(880, 0.1, 0.03, 'triangle', 0.065); vibrate([18, 22, 28]); }
  function playPlace() { beep(350 + Math.min(260, currentFloor() * 8), 0.055, 0.025, 'square'); vibrate(12); }
  function playMiss() { beep(125, 0.18, 0.045, 'sawtooth'); vibrate([45, 35, 65]); }
  function playGameOver() { beep(220, 0.12, 0.035, 'triangle'); beep(165, 0.18, 0.035, 'triangle', 0.12); }

  function setSoundUi() {
    soundButton.setAttribute('aria-pressed', settings.sound ? 'true' : 'false');
    vibrationButton.setAttribute('aria-pressed', settings.vibration ? 'true' : 'false');
    soundButton.textContent = settings.sound ? '♫ Son' : '♫ Muet';
    vibrationButton.textContent = settings.vibration ? '⌁ Vibration' : '⌁ Sans vibration';
  }

  function updateHud(force = false) {
    if (!force && elapsedMs - lastUiTick < 120) return;
    lastUiTick = elapsedMs;
    scoreEl.textContent = String(score);
    bestEl.textContent = String(Math.max(stats.bestScore || 0, score));
    floorEl.textContent = String(currentFloor());
    comboEl.textContent = `×${Math.max(1, combo)}`;
    if (mode().timeLimit) { lastLabelEl.textContent = 'Temps'; lastEl.textContent = formatTime(timeLeftMs); }
    else { lastLabelEl.textContent = 'Vies'; lastEl.textContent = '♥'.repeat(Math.max(0, lives)) || '0'; }
  }

  function createBaseBlock() { return { x: (WORLD_W - START_WIDTH) / 2, width: START_WIDTH, worldY: 0, colorIndex: 0, perfect: false }; }

  function makeActive() {
    const top = blocks[blocks.length - 1];
    if (!top) return;
    const width = top.width;
    const fromLeft = currentFloor() % 2 === 0;
    active = { x: fromLeft ? EDGE : WORLD_W - EDGE - width, width, worldY: top.worldY + BLOCK_H, direction: fromLeft ? 1 : -1, colorIndex: currentFloor() % BLOCK_COLORS.length };
    cameraTarget = Math.max(0, active.worldY - 330);
  }

  function resetGame(nextMode = modeKey) {
    modeKey = MODES[nextMode] ? nextMode : 'classic';
    settings.mode = modeKey;
    saveSettings();
    score = 0; combo = 0; bestComboRun = 0; perfectsRun = 0; elapsedMs = 0;
    timeLeftMs = mode().timeLimit; lives = mode().lives; blocks = [createBaseBlock()]; debris = []; particles = [];
    camera = 0; cameraTarget = 0; shake = 0; flash = 0; running = true; paused = false;
    startOverlay.classList.add('hidden'); pauseOverlay.classList.add('hidden'); helpOverlay.classList.add('hidden'); endOverlay.classList.add('hidden');
    pauseButton.textContent = 'Ⅱ'; pauseButton.setAttribute('aria-label', 'Mettre le jeu en pause');
    makeActive(); updateHud(true); setMessage(`Mode <strong>${mode().label}</strong> — aligne puis lâche.`); announce(`Nouvelle partie, mode ${mode().label}.`); ensureAudio();
  }

  function worldToScreenY(worldY) { return GROUND_Y - (worldY - camera) - BLOCK_H; }

  function spawnCutPiece(x, width, worldY, direction) {
    if (width <= 1) return;
    debris.push({ x, y: worldToScreenY(worldY), width, height: BLOCK_H, vx: direction * (38 + Math.random() * 42), vy: -24, rotation: 0, vr: direction * (1.2 + Math.random() * 1.4), colorIndex: currentFloor() % BLOCK_COLORS.length, life: 1 });
  }

  function spawnParticles(x, y, perfect) {
    const count = perfect ? 18 : 8;
    for (let index = 0; index < count; index += 1) {
      const angle = -Math.PI * (0.12 + Math.random() * 0.76);
      const speed = (perfect ? 72 : 48) + Math.random() * (perfect ? 110 : 65);
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.45 + Math.random() * 0.45, maxLife: 0.9, size: 1.8 + Math.random() * 3.2, hue: perfect ? 48 + Math.random() * 20 : 185 + Math.random() * 35 });
    }
  }

  function dropBlock() {
    if (!running || paused || !active) return;
    ensureAudio();
    const top = blocks[blocks.length - 1];
    if (!top) return;
    const left = Math.max(active.x, top.x);
    const right = Math.min(active.x + active.width, top.x + top.width);
    const overlap = right - left;

    if (overlap <= 1.5) {
      lives -= 1; combo = 0; shake = 1; flash = -1; playMiss();
      spawnCutPiece(active.x, active.width, active.worldY, active.direction || 1);
      announce(lives > 0 ? `Bloc raté. Il reste ${lives} chance${lives > 1 ? 's' : ''}.` : 'Bloc raté. Fin de partie.');
      if (lives <= 0) { active = null; endGame('miss'); }
      else { setMessage(`Raté. <strong>${lives} chance${lives > 1 ? 's' : ''}</strong> restante${lives > 1 ? 's' : ''}.`); makeActive(); updateHud(true); }
      return;
    }

    const offset = active.x - top.x;
    const perfectTolerance = Math.max(3.2, Math.min(8, top.width * 0.022));
    const perfect = Math.abs(offset) <= perfectTolerance;
    let placedX = left;
    let placedWidth = overlap;

    if (perfect) {
      combo += 1; bestComboRun = Math.max(bestComboRun, combo); perfectsRun += 1;
      const recovery = modeKey === 'relax' ? 7 : 4;
      placedWidth = Math.min(START_WIDTH, top.width + recovery);
      placedX = clamp(top.x - (placedWidth - top.width) / 2, EDGE, WORLD_W - EDGE - placedWidth);
      flash = 1; playPerfect(); spawnParticles(WORLD_W / 2, worldToScreenY(active.worldY) + BLOCK_H / 2, true);
    } else {
      combo = 0; playPlace();
      const cutWidth = active.width - overlap;
      if (cutWidth > 1) { if (offset < 0) spawnCutPiece(active.x, cutWidth, active.worldY, -1); else spawnCutPiece(right, cutWidth, active.worldY, 1); }
      spawnParticles(offset < 0 ? left : right, worldToScreenY(active.worldY) + BLOCK_H / 2, false);
    }

    blocks.push({ x: placedX, width: placedWidth, worldY: active.worldY, colorIndex: active.colorIndex, perfect });
    const floor = currentFloor();
    const basePoints = 92 + floor * 12;
    const comboBonus = perfect ? Math.min(6, combo) * 55 : 0;
    const precisionBonus = Math.round((overlap / Math.max(1, top.width)) * 120);
    const earned = Math.round((basePoints + comboBonus + precisionBonus) * mode().scoreMultiplier);
    score += earned;

    if (perfect) { setMessage(`<strong>PARFAIT ×${combo}</strong> — largeur récupérée, +${earned} points.`); announce(`Pose parfaite. Série de ${combo}. Étage ${floor}.`); }
    else if (placedWidth / START_WIDTH < 0.32) { setMessage(`Ça devient <strong>très étroit</strong>. Étage ${floor}, +${earned} points.`); announce(`Bloc posé. La tour devient très étroite. Étage ${floor}.`); }
    else { setMessage(`Bloc posé — <strong>étage ${floor}</strong>, +${earned} points.`); announce(`Bloc posé. Étage ${floor}.`); }
    active = null; makeActive(); updateHud(true);
  }

  function endGame(reason) {
    if (!running) return;
    running = false; paused = false;
    const floor = currentFloor();
    const oldBest = stats.bestScore || 0;
    const oldHeight = stats.bestHeight || 0;
    stats.games = (stats.games || 0) + 1;
    stats.bestScore = Math.max(oldBest, score);
    stats.bestHeight = Math.max(oldHeight, floor);
    stats.bestCombo = Math.max(stats.bestCombo || 0, bestComboRun);
    stats.totalBlocks = (stats.totalBlocks || 0) + floor;
    stats.perfects = (stats.perfects || 0) + perfectsRun;
    writeJson(storage, STATS_KEY, stats); updateHud(true);
    doc.getElementById('tbEndScore').textContent = String(score);
    doc.getElementById('tbEndHeight').textContent = String(floor);
    doc.getElementById('tbEndPerfects').textContent = String(perfectsRun);
    const titleEl = doc.getElementById('tbEndTitle');
    const eyebrowEl = doc.getElementById('tbEndEyebrow');
    const textEl = doc.getElementById('tbEndText');
    if (score > oldBest) {
      eyebrowEl.textContent = 'Nouveau record'; titleEl.textContent = 'Ta tour touche les nuages !'; textEl.textContent = `Nouveau record de ${score} points avec ${floor} étages.`;
      beep(523, 0.08, 0.03, 'triangle'); beep(659, 0.08, 0.03, 'triangle', 0.09); beep(784, 0.16, 0.03, 'triangle', 0.18);
    } else if (reason === 'time') { eyebrowEl.textContent = 'Temps écoulé'; titleEl.textContent = 'Le chantier ferme !'; textEl.textContent = `${floor} étages construits en 60 secondes. Record : ${stats.bestScore}.`; playGameOver(); }
    else { eyebrowEl.textContent = 'Tour terminée'; titleEl.textContent = floor >= 20 ? 'Sacrée hauteur.' : 'Belle construction.'; textEl.textContent = `${floor} étages, ${perfectsRun} pose${perfectsRun > 1 ? 's' : ''} parfaite${perfectsRun > 1 ? 's' : ''}. Record : ${stats.bestScore}.`; playGameOver(); }
    endOverlay.classList.remove('hidden'); announce(`Fin de partie. ${score} points, ${floor} étages.`);
  }

  function togglePause(force) {
    if (!running) return;
    const next = typeof force === 'boolean' ? force : !paused;
    paused = next; pauseOverlay.classList.toggle('hidden', !paused); pauseButton.textContent = paused ? '▶' : 'Ⅱ';
    pauseButton.setAttribute('aria-label', paused ? 'Reprendre la partie' : 'Mettre le jeu en pause');
    if (paused) announce('Partie en pause.'); else { lastTimestamp = 0; announce('Partie reprise.'); }
  }

  function openHelp() { if (running && !paused) paused = true; helpOverlay.classList.remove('hidden'); pauseOverlay.classList.add('hidden'); }
  function closeHelp() { helpOverlay.classList.add('hidden'); if (running) { paused = false; lastTimestamp = 0; } }
  function openModeChooser() { running = false; paused = false; active = null; pauseOverlay.classList.add('hidden'); helpOverlay.classList.add('hidden'); endOverlay.classList.add('hidden'); startOverlay.classList.remove('hidden'); }

  function renderModes() {
    modesEl.innerHTML = Object.entries(MODES).map(([key, value]) => `<button class="tb-mode ${key === 'classic' ? 'recommended' : ''}" type="button" data-mode="${key}"><strong>${value.label}${key === settings.mode ? ' • actuel' : ''}</strong><span>${value.description}</span></button>`).join('');
    modesEl.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { const selected = button.getAttribute('data-mode'); if (selected && MODES[selected]) resetGame(selected); }));
  }

  function update(dt) {
    if (!running || paused) return;
    elapsedMs += dt * 1000;
    if (mode().timeLimit) { timeLeftMs = Math.max(0, timeLeftMs - dt * 1000); if (timeLeftMs <= 0) { endGame('time'); return; } }
    if (active) {
      const speed = currentSpeed(); active.x += active.direction * speed * dt;
      const leftBound = EDGE; const rightBound = WORLD_W - EDGE - active.width;
      if (active.x <= leftBound) { active.x = leftBound; active.direction = 1; }
      else if (active.x >= rightBound) { active.x = rightBound; active.direction = -1; }
    }
    camera += (cameraTarget - camera) * Math.min(1, dt * 4.8);
    shake = Math.max(0, shake - dt * 4.5);
    flash += flash > 0 ? -dt * 3.7 : flash < 0 ? dt * 4.6 : 0;
    if (Math.abs(flash) < 0.02) flash = 0;
    debris.forEach((piece) => { piece.vy += 420 * dt; piece.x += piece.vx * dt; piece.y += piece.vy * dt; piece.rotation += piece.vr * dt; piece.life -= dt * 0.7; });
    debris = debris.filter((piece) => piece.life > 0 && piece.y < WORLD_H + 100);
    particles.forEach((particle) => { particle.vy += 180 * dt; particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.life -= dt; });
    particles = particles.filter((particle) => particle.life > 0);
    updateHud();
  }

  function drawBackground() {
    const floor = currentFloor();
    const phase = clamp(floor / 32, 0, 1);
    const gradient = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    gradient.addColorStop(0, phase < 0.45 ? '#102b4b' : '#07162d'); gradient.addColorStop(0.55, phase < 0.5 ? '#3d2752' : '#171a42'); gradient.addColorStop(1, '#07111f');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.save();
    stars.forEach((star) => { const visibility = 0.25 + phase * 0.75; ctx.globalAlpha = star.a * visibility; ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.arc(star.x, star.y + (camera * 0.018) % 26, star.r, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
    const orbX = 330; const orbY = 84 + Math.min(75, floor * 1.4);
    const orb = ctx.createRadialGradient(orbX, orbY, 2, orbX, orbY, 45);
    orb.addColorStop(0, phase < 0.55 ? 'rgba(254,240,138,.95)' : 'rgba(224,242,254,.88)'); orb.addColorStop(0.28, phase < 0.55 ? 'rgba(251,191,36,.42)' : 'rgba(125,211,252,.28)'); orb.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = orb; ctx.fillRect(orbX - 50, orbY - 50, 100, 100); ctx.globalAlpha = 0.8; ctx.fillStyle = phase < 0.55 ? '#fde68a' : '#e0f2fe'; ctx.beginPath(); ctx.arc(orbX, orbY, 18, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    const horizon = 465 + Math.min(38, camera * 0.05);
    ctx.fillStyle = 'rgba(5,11,19,.56)';
    for (let index = 0; index < 14; index += 1) {
      const width = 28 + ((index * 17) % 34); const height = 28 + ((index * 31) % 82); const x = index * 34 - 12;
      ctx.fillRect(x, horizon - height, width, height); ctx.fillStyle = 'rgba(103,232,249,.14)';
      for (let wy = horizon - height + 12; wy < horizon - 8; wy += 17) if ((index + Math.floor(wy)) % 3 === 0) ctx.fillRect(x + 8, wy, 4, 3);
      ctx.fillStyle = 'rgba(5,11,19,.56)';
    }
    const glow = ctx.createLinearGradient(0, horizon - 30, 0, WORLD_H); glow.addColorStop(0, 'rgba(244,114,182,.06)'); glow.addColorStop(1, 'rgba(2,6,23,.38)'); ctx.fillStyle = glow; ctx.fillRect(0, horizon - 30, WORLD_W, WORLD_H - horizon + 30);
  }

  function drawBlock(block, isActive = false) {
    const y = worldToScreenY(block.worldY);
    if (y < -70 || y > WORLD_H + 40) return;
    const colors = BLOCK_COLORS[block.colorIndex % BLOCK_COLORS.length]; const x = block.x; const width = block.width;
    ctx.save();
    if (isActive) { ctx.shadowColor = colors[0]; ctx.shadowBlur = 18; }
    else if (block.perfect) { ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 9; }
    else { ctx.shadowColor = 'rgba(2,6,23,.42)'; ctx.shadowBlur = 8; }
    ctx.shadowOffsetY = 5;
    const face = ctx.createLinearGradient(x, y, x, y + BLOCK_H); face.addColorStop(0, colors[0]); face.addColorStop(1, colors[1]); ctx.fillStyle = face; roundedRect(ctx, x, y, width, BLOCK_H, Math.min(7, width / 6)); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.fillStyle = 'rgba(255,255,255,.22)'; roundedRect(ctx, x + 3, y + 3, Math.max(0, width - 6), 4, 2); ctx.fill();
    if (width > 54) { ctx.fillStyle = 'rgba(255,255,255,.23)'; const windows = Math.min(6, Math.floor(width / 43)); for (let index = 0; index < windows; index += 1) { const wx = x + 14 + index * ((width - 28) / Math.max(1, windows - 1)); ctx.fillRect(wx - 2, y + 11, 4, 6); } }
    if (isActive) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; roundedRect(ctx, x + 0.75, y + 0.75, width - 1.5, BLOCK_H - 1.5, Math.min(7, width / 6)); ctx.stroke(); }
    ctx.restore();
  }

  function drawGuides() {
    if (!active || !blocks.length || paused) return;
    const top = blocks[blocks.length - 1]; const y = worldToScreenY(active.worldY);
    ctx.save(); ctx.setLineDash([4, 5]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(254,240,138,.25)'; ctx.beginPath(); ctx.moveTo(top.x, y - 7); ctx.lineTo(top.x, y + BLOCK_H + 7); ctx.moveTo(top.x + top.width, y - 7); ctx.lineTo(top.x + top.width, y + BLOCK_H + 7); ctx.stroke(); ctx.restore();
  }

  function drawDebris() {
    debris.forEach((piece) => { const colors = BLOCK_COLORS[piece.colorIndex % BLOCK_COLORS.length]; ctx.save(); ctx.globalAlpha = clamp(piece.life, 0, 1); ctx.translate(piece.x + piece.width / 2, piece.y + piece.height / 2); ctx.rotate(piece.rotation); const gradient = ctx.createLinearGradient(0, -piece.height / 2, 0, piece.height / 2); gradient.addColorStop(0, colors[0]); gradient.addColorStop(1, colors[1]); ctx.fillStyle = gradient; roundedRect(ctx, -piece.width / 2, -piece.height / 2, piece.width, piece.height, Math.min(6, piece.width / 5)); ctx.fill(); ctx.restore(); });
  }

  function drawParticles() {
    particles.forEach((particle) => { ctx.save(); ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1); ctx.fillStyle = `hsl(${particle.hue} 92% 68%)`; ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
  }

  function drawLevelBadge() {
    ctx.save(); ctx.globalAlpha = 0.72; ctx.fillStyle = 'rgba(3,10,20,.5)'; roundedRect(ctx, 14, 14, 86, 28, 12); ctx.fill(); ctx.strokeStyle = 'rgba(103,232,249,.25)'; ctx.stroke(); ctx.fillStyle = '#c7f9ff'; ctx.font = '900 11px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`NIVEAU ${currentLevel()}`, 57, 28); ctx.restore();
  }

  function render() {
    const dpr = Math.min(2, win.devicePixelRatio || 1); const targetW = Math.round(WORLD_W * dpr); const targetH = Math.round(WORLD_H * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) { canvas.width = targetW; canvas.height = targetH; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, WORLD_W, WORLD_H); ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 9 * shake, (Math.random() - 0.5) * 6 * shake);
    drawBackground(); ctx.fillStyle = 'rgba(3,9,18,.72)'; ctx.fillRect(0, GROUND_Y + 1, WORLD_W, WORLD_H - GROUND_Y); ctx.fillStyle = 'rgba(103,232,249,.17)'; ctx.fillRect(0, GROUND_Y, WORLD_W, 2);
    blocks.forEach((block) => drawBlock(block, false)); drawGuides(); if (active) drawBlock(active, true); drawDebris(); drawParticles(); drawLevelBadge();
    if (paused && running) { ctx.fillStyle = 'rgba(3,9,18,.3)'; ctx.fillRect(0, 0, WORLD_W, WORLD_H); }
    if (flash !== 0) { ctx.globalAlpha = Math.min(0.28, Math.abs(flash) * 0.24); ctx.fillStyle = flash > 0 ? '#fef08a' : '#fb7185'; ctx.fillRect(0, 0, WORLD_W, WORLD_H); ctx.globalAlpha = 1; }
    ctx.restore();
  }

  function frame(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min(0.034, Math.max(0, (timestamp - lastTimestamp) / 1000)); lastTimestamp = timestamp;
    update(dt); render(); rafId = win.requestAnimationFrame(frame);
  }

  renderModes(); setSoundUi(); bestEl.textContent = String(stats.bestScore || 0); updateHud(true);
  canvas.addEventListener('pointerdown', (event) => { event.preventDefault(); dropBlock(); }, { passive: false });
  dropButton.addEventListener('click', dropBlock);
  pauseButton.addEventListener('click', () => togglePause());
  doc.getElementById('tbHelp').addEventListener('click', openHelp);
  doc.getElementById('tbResume').addEventListener('click', () => togglePause(false));
  doc.getElementById('tbPauseRestart').addEventListener('click', () => resetGame(modeKey));
  doc.getElementById('tbRestart').addEventListener('click', () => resetGame(modeKey));
  doc.getElementById('tbHelpClose').addEventListener('click', closeHelp);
  doc.getElementById('tbHelpRestart').addEventListener('click', () => resetGame(modeKey));
  doc.getElementById('tbPlayAgain').addEventListener('click', () => resetGame(modeKey));
  doc.getElementById('tbChangeMode').addEventListener('click', () => { renderModes(); openModeChooser(); });
  doc.getElementById('tbModeButton').addEventListener('click', () => { renderModes(); openModeChooser(); });
  soundButton.addEventListener('click', () => { settings.sound = !settings.sound; saveSettings(); setSoundUi(); if (settings.sound) beep(520, 0.06, 0.025, 'triangle'); });
  vibrationButton.addEventListener('click', () => { settings.vibration = !settings.vibration; saveSettings(); setSoundUi(); if (settings.vibration) vibrate(20); });

  doc.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (event.key === ' ' || event.key === 'Enter' || event.key === 'ArrowDown') {
      if (!startOverlay.classList.contains('hidden') || !helpOverlay.classList.contains('hidden') || !endOverlay.classList.contains('hidden')) return;
      event.preventDefault(); dropBlock();
    } else if (event.key.toLowerCase() === 'p' || event.key === 'Escape') {
      if (running && helpOverlay.classList.contains('hidden') && endOverlay.classList.contains('hidden')) { event.preventDefault(); togglePause(); }
    }
  });
  doc.addEventListener('visibilitychange', () => { if (doc.hidden && running && !paused) togglePause(true); });
  const cleanup = () => { if (rafId) win.cancelAnimationFrame(rafId); if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {}); };
  win.addEventListener('pagehide', cleanup, { once: true });
  rafId = win.requestAnimationFrame(frame);
}
