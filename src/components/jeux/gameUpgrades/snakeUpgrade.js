const STORE = 'nowis:snake:';

const MODES = {
  relax: {
    name: 'Détente',
    desc: '18 × 18 · bords traversables · rythme doux',
    cols: 18,
    rows: 18,
    baseStep: 185,
    minStep: 92,
    wrap: true,
    rockEvery: 0,
    multiplier: 0.8,
  },
  classic: {
    name: 'Classique',
    desc: '20 × 20 · murs solides · obstacles progressifs',
    cols: 20,
    rows: 20,
    baseStep: 158,
    minStep: 70,
    wrap: false,
    rockEvery: 2,
    multiplier: 1,
  },
  expert: {
    name: 'Expert',
    desc: '22 × 22 · rapide · jungle plus dense',
    cols: 22,
    rows: 22,
    baseStep: 132,
    minStep: 56,
    wrap: false,
    rockEvery: 1,
    multiplier: 1.35,
  },
};

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const keyOf = (cell) => `${cell.x},${cell.y}`;
const sameCell = (a, b) => Boolean(a && b && a.x === b.x && a.y === b.y);
const load = (storage, key, fallback) => {
  try {
    return { ...fallback, ...(JSON.parse(storage.getItem(key) || 'null') || {}) };
  } catch {
    return { ...fallback };
  }
};
const save = (storage, key, value) => {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {}
};

function randomCell(cols, rows, blocked, rng = Math.random) {
  const free = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const key = `${x},${y}`;
      if (!blocked.has(key)) free.push({ x, y });
    }
  }
  if (!free.length) return null;
  return free[Math.floor(rng() * free.length)];
}

function stepDelay(mode, level) {
  const config = MODES[mode];
  return Math.max(config.minStep, config.baseStep - (level - 1) * (mode === 'expert' ? 7 : 6));
}

function levelForFood(foodCount) {
  return 1 + Math.floor(foodCount / 5);
}

function formatScore(value) {
  return Math.max(0, Math.round(value)).toLocaleString('fr-CA');
}

function haptic(win, pattern) {
  try {
    win.navigator?.vibrate?.(pattern);
  } catch {}
}

function makeAudio(win) {
  let ctx = null;
  let enabled = true;
  const ensure = () => {
    if (!enabled) return null;
    try {
      if (!ctx) ctx = new (win.AudioContext || win.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  };
  const tone = (frequency, duration = 0.06, type = 'sine', gain = 0.035, delay = 0) => {
    const audio = ensure();
    if (!audio) return;
    const at = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const vol = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, at);
    vol.gain.setValueAtTime(gain, at);
    vol.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(vol).connect(audio.destination);
    osc.start(at);
    osc.stop(at + duration);
  };
  return {
    eat() {
      tone(520, 0.05, 'triangle', 0.035);
      tone(730, 0.07, 'triangle', 0.025, 0.045);
    },
    bonus() {
      tone(620, 0.07, 'sine', 0.04);
      tone(820, 0.08, 'sine', 0.035, 0.055);
      tone(1040, 0.1, 'sine', 0.03, 0.11);
    },
    level() {
      tone(392, 0.08, 'triangle', 0.035);
      tone(523, 0.09, 'triangle', 0.035, 0.07);
      tone(659, 0.12, 'triangle', 0.03, 0.14);
    },
    crash() {
      tone(118, 0.18, 'sawtooth', 0.045);
      tone(82, 0.22, 'square', 0.025, 0.07);
    },
    move() {
      tone(250, 0.025, 'sine', 0.012);
    },
    setEnabled(value) {
      enabled = value;
    },
    get enabled() {
      return enabled;
    },
  };
}

export function upgradeSnake(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisSnakePro === 'true') return;
  root.dataset.nowisSnakePro = 'true';
  root.lang = 'fr';
  doc.title = 'Serpent NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
*{box-sizing:border-box}html,body{margin:0;width:100%;min-height:100%;background:#07110d;color:#f7f2dc;font-family:Inter,ui-rounded,system-ui,-apple-system,"Segoe UI",sans-serif}body{min-height:100dvh;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}button{font:inherit}.jungle{min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:7px;padding:max(7px,env(safe-area-inset-top)) max(7px,env(safe-area-inset-right)) max(9px,env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));background:radial-gradient(circle at 10% 0,#5ca25d21,transparent 28%),radial-gradient(circle at 90% 8%,#d6a84717,transparent 30%),linear-gradient(145deg,#07110d,#0d1b14 55%,#08130f)}.top,.hud,.stage,.status,.controls{width:min(100%,820px)}.top{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand small{display:block;color:#91b98e;font-size:9px;font-weight:950;letter-spacing:.17em;text-transform:uppercase}.brand h1{margin:2px 0 0;font-size:clamp(25px,7vw,40px);line-height:.92;letter-spacing:-.055em;color:#f4edcf;text-shadow:0 2px 18px #000}.topTools{display:flex;gap:6px;align-items:center}.badge{padding:7px 10px;border-radius:999px;border:1px solid #c8c0932d;background:#0a1711d9;color:#d9d1aa;font-size:10px;font-weight:950}.btn,.dir,.mode,.modal button{min-height:44px;border:1px solid #d5ca8d26;border-radius:14px;background:linear-gradient(180deg,#15261b,#0b1710);color:#f7f0d2;font-weight:900;cursor:pointer;touch-action:manipulation}.btn:active,.dir:active,.mode:active,.modal button:active{transform:scale(.97)}.btn:focus-visible,.dir:focus-visible,.mode:focus-visible,.modal button:focus-visible{outline:3px solid #8bd68c;outline-offset:2px}.icon{min-width:44px}.hud{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.stat{text-align:center;padding:6px 3px;border:1px solid #e4dca11b;border-radius:12px;background:#0b1812cc;box-shadow:inset 0 1px #fff1}.stat span{display:block;color:#86a58a;font-size:8px;font-weight:950;text-transform:uppercase;white-space:nowrap}.stat strong{display:block;color:#fff5d3;font-size:clamp(14px,4vw,20px);font-variant-numeric:tabular-nums}.stage{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:7px;border-radius:26px;border:1px solid #d8cf9852;background:linear-gradient(145deg,#77663c,#ba9f5f 4px,#273425 6px,#132218 10px,#0a140e 100%);box-shadow:0 24px 70px #000b,inset 0 1px #f8e6a766}.stage:before,.stage:after{content:"";position:absolute;pointer-events:none;border-radius:50%}.stage:before{width:180px;height:180px;left:-95px;top:-75px;background:repeating-conic-gradient(from 15deg,#648a4b 0 8deg,#436b3d 8deg 14deg);filter:blur(1px);opacity:.14}.stage:after{width:150px;height:150px;right:-85px;bottom:-70px;background:repeating-conic-gradient(from 10deg,#b48f3b 0 6deg,#315c3d 6deg 13deg);opacity:.12}.boardWrap{position:relative;aspect-ratio:1;width:min(100%,calc(100dvh - 235px),680px);max-height:100%;border-radius:19px;overflow:hidden;border:1px solid #d9d09b42;background:#07120c;box-shadow:inset 0 0 45px #000,0 8px 30px #0008}.boardWrap:after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 45%,transparent 35%,#0005 100%)}canvas{display:block;width:100%;height:100%;touch-action:none}.levelFlash{position:absolute;z-index:5;left:50%;top:50%;transform:translate(-50%,-50%) scale(.8);padding:11px 18px;border:1px solid #f0db836d;border-radius:999px;background:#0d1b13e8;color:#ffe9a6;font-size:clamp(18px,6vw,30px);font-weight:950;letter-spacing:-.03em;opacity:0;pointer-events:none}.levelFlash.show{animation:flash .85s ease}.status{min-height:34px;display:flex;align-items:center;justify-content:center;padding:6px 10px;border:1px solid #d8cf981b;border-radius:12px;background:#0a1711c7;color:#a8b99e;text-align:center;font-size:11px;font-weight:800}.status strong{color:#e8d481}.controls{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:6px;align-items:center}.tools{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.tools .btn{min-height:42px;padding:4px 8px;font-size:10px}.tools .btn[aria-pressed=false]{color:#728075}.dpad{display:grid;grid-template-columns:repeat(3,48px);grid-template-rows:repeat(2,44px);gap:4px}.dir{display:flex;align-items:center;justify-content:center;padding:0;font-size:18px}.dir.up{grid-column:2}.dir.left{grid-column:1;grid-row:2}.dir.down{grid-column:2;grid-row:2}.dir.right{grid-column:3;grid-row:2}.legend{text-align:right;color:#718779;font-size:9px;font-weight:800;line-height:1.35}.legend b{color:#d4cc9e}.ov{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:18px;background:#050b08e8;backdrop-filter:blur(13px)}.ov.hide{display:none}.modal{width:min(100%,510px);max-height:90dvh;overflow:auto;padding:21px;border:1px solid #d7ca8c45;border-radius:26px;background:linear-gradient(155deg,#101f16,#152b1d 62%,#161d11);box-shadow:0 32px 90px #000d}.eyebrow{color:#92b58d;font-size:9px;font-weight:950;letter-spacing:.17em;text-transform:uppercase}.modal h2{margin:4px 0;font-size:clamp(27px,8vw,39px);line-height:1;color:#f7edc8}.modal p,.modal li{color:#b5c1ac;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{text-align:left;padding:12px}.mode strong,.mode span{display:block}.mode span{margin-top:3px;color:#8fa08e;font-size:11px}.mode.on{border-color:#94d48c6b;background:#315c3544}.acts{display:grid;grid-template-columns:1fr 1fr;gap:7px}.modal button{padding:10px}.primary{border-color:#a9df9366!important;background:linear-gradient(135deg,#3f773e,#6fae55)!important;color:#fffde9!important}.results{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:14px 0}.results div{text-align:center;padding:9px 3px;border-radius:12px;background:#09130dd1}.results span{display:block;color:#81917f;font-size:8px;text-transform:uppercase}.results strong{font-size:18px}.helpGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:12px 0}.helpGrid div{padding:10px;border-radius:12px;background:#09130daf;border:1px solid #fff1}.helpGrid b{display:block;color:#e6d893;font-size:11px}.helpGrid span{color:#9aaa98;font-size:10px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}.fruitKey,.bonusKey,.rockKey{display:inline-block;width:9px;height:9px;margin-right:3px;border-radius:50%}.fruitKey{background:#e26656}.bonusKey{background:#f4c94f;box-shadow:0 0 8px #f4c94f}.rockKey{border-radius:3px;background:#7d836d}@keyframes flash{0%{opacity:0;transform:translate(-50%,-50%) scale(.75)}18%,70%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.08)}}
@media(max-width:650px){.hud{grid-template-columns:repeat(3,1fr)}.stat:nth-child(n+4){display:none}.brand h1{font-size:28px}.stage{border-radius:20px;padding:6px}.boardWrap{width:min(100%,calc(100dvh - 270px))}.controls{grid-template-columns:1fr auto}.legend{display:none}.tools{grid-template-columns:repeat(3,1fr)}.dpad{grid-template-columns:repeat(3,46px);grid-template-rows:repeat(2,42px)}}
@media(max-width:390px){.brand h1{font-size:24px}.badge{padding:6px 8px}.hud .stat{padding:4px 2px}.stage{padding:4px}.controls{gap:4px}.dpad{grid-template-columns:repeat(3,43px);grid-template-rows:repeat(2,40px);gap:3px}.tools .btn{font-size:9px;padding:3px}.boardWrap{width:min(100%,calc(100dvh - 257px))}}
@media(max-height:720px){.status{display:none}.brand h1{font-size:25px}.hud .stat{padding:4px 2px}.tools .btn{min-height:38px}.dpad{grid-template-rows:repeat(2,38px)}.boardWrap{width:min(100%,calc(100dvh - 190px))}}
@media(orientation:landscape) and (max-height:560px){.jungle{display:grid;grid-template-columns:205px minmax(300px,1fr) 185px;grid-template-rows:auto auto 1fr auto;column-gap:8px;align-items:start}.top{grid-column:1}.hud{grid-column:1;grid-template-columns:repeat(3,1fr)}.stage{grid-column:2;grid-row:1/5;height:calc(100dvh - 16px)}.boardWrap{width:auto;height:min(100%,calc(100dvh - 30px))}.status{grid-column:1;display:flex}.controls{grid-column:3;grid-row:1/5;display:flex;flex-direction:column;justify-content:center;height:100%;align-items:stretch}.tools{grid-template-columns:1fr}.dpad{align-self:center}.legend{text-align:center}.brand h1{font-size:24px}.badge{display:none}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition:none!important}}
`;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
<main class="jungle" aria-label="Jeu du serpent NOWIS">
  <header class="top">
    <div class="brand"><small>Jardin ancien · NOWIS</small><h1>Serpent</h1></div>
    <div class="topTools"><span class="badge" id="modeBadge">Classique</span><button class="btn icon" id="pauseBtn" type="button" aria-label="Mettre en pause">Ⅱ</button></div>
  </header>
  <section class="hud" aria-label="Statistiques">
    <div class="stat"><span>Score</span><strong id="score">0</strong></div>
    <div class="stat"><span>Record</span><strong id="best">0</strong></div>
    <div class="stat"><span>Niveau</span><strong id="level">1</strong></div>
    <div class="stat"><span>Longueur</span><strong id="length">4</strong></div>
    <div class="stat"><span>Fruits</span><strong id="foods">0</strong></div>
    <div class="stat"><span>Vitesse</span><strong id="speed">1×</strong></div>
  </section>
  <section class="stage" aria-label="Plateau du serpent">
    <div class="boardWrap" id="boardWrap">
      <canvas id="gameCanvas" role="img" aria-label="Plateau du serpent. Utilisez les flèches, WASD, les boutons ou un glissement du doigt pour diriger le serpent."></canvas>
      <div class="levelFlash" id="levelFlash" aria-hidden="true">Niveau 2</div>
    </div>
  </section>
  <div class="status" id="status">Mangez les <strong>&nbsp;fruits rouges&nbsp;</strong> sans toucher les murs ni votre queue.</div>
  <section class="controls" aria-label="Commandes">
    <div class="tools">
      <button class="btn" id="soundBtn" type="button" aria-pressed="true">Son ✓</button>
      <button class="btn" id="vibeBtn" type="button" aria-pressed="true">Vibration ✓</button>
      <button class="btn" id="helpBtn" type="button">Aide ?</button>
    </div>
    <div class="dpad" aria-label="Pavé directionnel">
      <button class="dir up" data-dir="up" type="button" aria-label="Haut">▲</button>
      <button class="dir left" data-dir="left" type="button" aria-label="Gauche">◀</button>
      <button class="dir down" data-dir="down" type="button" aria-label="Bas">▼</button>
      <button class="dir right" data-dir="right" type="button" aria-label="Droite">▶</button>
    </div>
    <div class="legend"><div><span class="fruitKey"></span><b>Fruit</b> + points</div><div><span class="bonusKey"></span><b>Fruit d’or</b> bonus</div><div><span class="rockKey"></span><b>Roche</b> obstacle</div></div>
  </section>
  <div class="sr" id="live" aria-live="polite" aria-atomic="true"></div>
</main>
<div class="ov" id="overlay">
  <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <div class="eyebrow">Expédition NOWIS</div>
    <h2 id="modalTitle">Choisissez votre jungle</h2>
    <p id="modalText">Guidez le serpent, cueillez les fruits et survivez à un terrain qui se densifie à mesure que votre niveau grimpe.</p>
    <div class="modes" id="modes"></div>
    <div class="results" id="results" hidden></div>
    <div class="helpGrid" id="helpGrid" hidden>
      <div><b>Mobile</b><span>Glissez sur le plateau ou utilisez le pavé directionnel.</span></div>
      <div><b>Clavier</b><span>Flèches ou WASD · P pour pause.</span></div>
      <div><b>Fruit d’or</b><span>Apparaît régulièrement et disparaît après quelques secondes.</span></div>
      <div><b>Progression</b><span>La vitesse augmente tous les 5 fruits; les roches arrivent ensuite.</span></div>
    </div>
    <div class="acts"><button id="secondaryBtn" type="button">Aide</button><button class="primary" id="primaryBtn" type="button">Jouer</button></div>
  </section>
</div>`;

  const $ = (id) => doc.getElementById(id);
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d');
  const boardWrap = $('boardWrap');
  const overlay = $('overlay');
  const modesEl = $('modes');
  const resultsEl = $('results');
  const helpGrid = $('helpGrid');
  const modalTitle = $('modalTitle');
  const modalText = $('modalText');
  const primaryBtn = $('primaryBtn');
  const secondaryBtn = $('secondaryBtn');
  const scoreEl = $('score');
  const bestEl = $('best');
  const levelEl = $('level');
  const lengthEl = $('length');
  const foodsEl = $('foods');
  const speedEl = $('speed');
  const modeBadge = $('modeBadge');
  const pauseBtn = $('pauseBtn');
  const soundBtn = $('soundBtn');
  const vibeBtn = $('vibeBtn');
  const helpBtn = $('helpBtn');
  const statusEl = $('status');
  const live = $('live');
  const levelFlash = $('levelFlash');
  const audio = makeAudio(win);
  const storage = win.localStorage;

  const settings = load(storage, `${STORE}settings`, { mode: 'classic', sound: true, vibration: true });
  let records = load(storage, `${STORE}records`, {
    relax: { best: 0, longest: 4, level: 1, games: 0 },
    classic: { best: 0, longest: 4, level: 1, games: 0 },
    expert: { best: 0, longest: 4, level: 1, games: 0 },
  });
  Object.keys(MODES).forEach((mode) => {
    records[mode] = { best: 0, longest: 4, level: 1, games: 0, ...(records[mode] || {}) };
  });

  const state = {
    mode: MODES[settings.mode] ? settings.mode : 'classic',
    running: false,
    paused: false,
    over: false,
    score: 0,
    foodCount: 0,
    level: 1,
    snake: [],
    rocks: [],
    food: null,
    bonus: null,
    bonusUntil: 0,
    direction: 'right',
    queuedDirection: 'right',
    lastStep: 0,
    accumulator: 0,
    raf: 0,
    touch: null,
    showHelp: false,
  };

  audio.setEnabled(settings.sound !== false);
  let vibration = settings.vibration !== false;

  const config = () => MODES[state.mode];
  const announce = (text) => {
    live.textContent = '';
    win.setTimeout(() => { live.textContent = text; }, 20);
  };

  function blockedSet(includeFood = true) {
    const blocked = new Set(state.snake.map(keyOf));
    state.rocks.forEach((cell) => blocked.add(keyOf(cell)));
    if (includeFood && state.food) blocked.add(keyOf(state.food));
    if (state.bonus) blocked.add(keyOf(state.bonus));
    return blocked;
  }

  function spawnFood() {
    state.food = randomCell(config().cols, config().rows, blockedSet(false));
    if (!state.food) finish(true);
  }

  function spawnBonus(now) {
    const cell = randomCell(config().cols, config().rows, blockedSet(true));
    if (!cell) return;
    state.bonus = cell;
    state.bonusUntil = now + 6500;
    announce('Un fruit d’or est apparu.');
  }

  function addRocks(level) {
    const count = config().rockEvery ? config().rockEvery + Math.floor(level / 3) : 0;
    if (!count) return;
    const head = state.snake[0];
    const blocked = blockedSet(true);
    for (let i = 0; i < count; i += 1) {
      let cell = null;
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const candidate = randomCell(config().cols, config().rows, blocked);
        if (!candidate) break;
        const distance = Math.abs(candidate.x - head.x) + Math.abs(candidate.y - head.y);
        if (distance >= 4) { cell = candidate; break; }
      }
      if (!cell) break;
      state.rocks.push(cell);
      blocked.add(keyOf(cell));
    }
  }

  function updateHud() {
    const record = records[state.mode];
    scoreEl.textContent = formatScore(state.score);
    bestEl.textContent = formatScore(Math.max(record.best, state.score));
    levelEl.textContent = String(state.level);
    lengthEl.textContent = String(state.snake.length || 4);
    foodsEl.textContent = String(state.foodCount);
    const ratio = config().baseStep / stepDelay(state.mode, state.level);
    speedEl.textContent = `${ratio.toFixed(ratio >= 2 ? 1 : 2).replace(/\.0$/, '')}×`;
    modeBadge.textContent = config().name;
  }

  function renderModes() {
    modesEl.innerHTML = Object.entries(MODES).map(([key, mode]) => `<button class="mode ${key === state.mode ? 'on' : ''}" data-mode="${key}" type="button"><strong>${mode.name}</strong><span>${mode.desc}</span></button>`).join('');
    modesEl.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        state.mode = button.dataset.mode;
        settings.mode = state.mode;
        save(storage, `${STORE}settings`, settings);
        renderModes();
        updateHud();
      });
    });
  }

  function showStart() {
    state.running = false;
    state.paused = false;
    state.over = false;
    state.showHelp = false;
    modalTitle.textContent = 'Choisissez votre jungle';
    modalText.textContent = 'Guidez le serpent, cueillez les fruits et survivez à un terrain qui se densifie à mesure que votre niveau grimpe.';
    helpGrid.hidden = true;
    resultsEl.hidden = true;
    modesEl.hidden = false;
    primaryBtn.textContent = 'Jouer';
    secondaryBtn.textContent = 'Aide';
    renderModes();
    overlay.classList.remove('hide');
    primaryBtn.focus();
  }

  function showHelp(returnToGame = false) {
    state.showHelp = true;
    if (returnToGame && state.running && !state.paused) pause(false);
    modalTitle.textContent = 'Comment jouer';
    modalText.textContent = 'Une seule règle absolue : ne faites jamais demi-tour directement. Anticipez votre prochain virage.';
    modesEl.hidden = true;
    resultsEl.hidden = true;
    helpGrid.hidden = false;
    primaryBtn.textContent = state.running ? 'Reprendre' : 'Compris';
    secondaryBtn.textContent = state.running ? 'Recommencer' : 'Modes';
    overlay.classList.remove('hide');
    primaryBtn.focus();
  }

  function showPause() {
    modalTitle.textContent = 'Pause dans la jungle';
    modalText.textContent = 'Votre serpent reste exactement où il est. Reprenez quand vous êtes prêt.';
    modesEl.hidden = true;
    resultsEl.hidden = true;
    helpGrid.hidden = true;
    primaryBtn.textContent = 'Reprendre';
    secondaryBtn.textContent = 'Recommencer';
    overlay.classList.remove('hide');
    primaryBtn.focus();
  }

  function showGameOver(won = false) {
    const record = records[state.mode];
    modalTitle.textContent = won ? 'Jungle conquise !' : 'Fin de la piste';
    modalText.textContent = won ? 'Vous avez rempli tout le terrain disponible. Impressionnant.' : 'Le serpent a heurté un obstacle. Votre progression est enregistrée.';
    resultsEl.hidden = false;
    resultsEl.innerHTML = `<div><span>Score</span><strong>${formatScore(state.score)}</strong></div><div><span>Longueur</span><strong>${state.snake.length}</strong></div><div><span>Record</span><strong>${formatScore(record.best)}</strong></div>`;
    modesEl.hidden = true;
    helpGrid.hidden = true;
    primaryBtn.textContent = 'Rejouer';
    secondaryBtn.textContent = 'Changer de mode';
    overlay.classList.remove('hide');
    primaryBtn.focus();
  }

  function reset() {
    const { cols, rows } = config();
    const x = Math.floor(cols / 2);
    const y = Math.floor(rows / 2);
    state.snake = [{ x, y }, { x: x - 1, y }, { x: x - 2, y }, { x: x - 3, y }];
    state.rocks = [];
    state.food = null;
    state.bonus = null;
    state.bonusUntil = 0;
    state.direction = 'right';
    state.queuedDirection = 'right';
    state.score = 0;
    state.foodCount = 0;
    state.level = 1;
    state.lastStep = 0;
    state.accumulator = 0;
    state.over = false;
    spawnFood();
    updateHud();
    statusEl.innerHTML = config().wrap ? 'Les bords sont <strong>&nbsp;traversables&nbsp;</strong> en mode Détente.' : 'Mangez les <strong>&nbsp;fruits rouges&nbsp;</strong> et gardez une voie de sortie.';
    draw();
  }

  function start() {
    reset();
    state.running = true;
    state.paused = false;
    overlay.classList.add('hide');
    pauseBtn.textContent = 'Ⅱ';
    pauseBtn.setAttribute('aria-label', 'Mettre en pause');
    announce(`Partie ${config().name} commencée.`);
    win.cancelAnimationFrame(state.raf);
    state.raf = win.requestAnimationFrame(loop);
  }

  function pause(showOverlay = true) {
    if (!state.running || state.over) return;
    state.paused = true;
    pauseBtn.textContent = '▶';
    pauseBtn.setAttribute('aria-label', 'Reprendre');
    if (showOverlay) showPause();
  }

  function resume() {
    if (!state.running || state.over) return;
    state.paused = false;
    state.lastStep = 0;
    state.accumulator = 0;
    overlay.classList.add('hide');
    pauseBtn.textContent = 'Ⅱ';
    pauseBtn.setAttribute('aria-label', 'Mettre en pause');
    announce('Partie reprise.');
  }

  function finish(won = false) {
    if (state.over) return;
    state.over = true;
    state.running = false;
    state.paused = false;
    const record = records[state.mode];
    record.best = Math.max(record.best, state.score);
    record.longest = Math.max(record.longest, state.snake.length);
    record.level = Math.max(record.level, state.level);
    record.games += 1;
    save(storage, `${STORE}records`, records);
    updateHud();
    audio.crash();
    if (vibration) haptic(win, won ? [40, 40, 90] : [90, 45, 130]);
    announce(won ? 'Jungle conquise.' : `Partie terminée. Score ${state.score}.`);
    showGameOver(won);
  }

  function setDirection(next) {
    if (!DIRS[next] || !state.running || state.paused || state.over) return;
    if (OPPOSITE[state.direction] === next) return;
    state.queuedDirection = next;
    audio.move();
  }

  function move(now) {
    const cfg = config();
    if (OPPOSITE[state.direction] !== state.queuedDirection) state.direction = state.queuedDirection;
    const vector = DIRS[state.direction];
    const head = state.snake[0];
    let next = { x: head.x + vector.x, y: head.y + vector.y };

    if (cfg.wrap) {
      next.x = (next.x + cfg.cols) % cfg.cols;
      next.y = (next.y + cfg.rows) % cfg.rows;
    } else if (next.x < 0 || next.x >= cfg.cols || next.y < 0 || next.y >= cfg.rows) {
      finish(false);
      return;
    }

    const eatsFood = sameCell(next, state.food);
    const eatsBonus = sameCell(next, state.bonus);
    const bodyToCheck = eatsFood || eatsBonus ? state.snake : state.snake.slice(0, -1);
    if (bodyToCheck.some((cell) => sameCell(cell, next)) || state.rocks.some((cell) => sameCell(cell, next))) {
      finish(false);
      return;
    }

    state.snake.unshift(next);
    if (eatsFood || eatsBonus) {
      const previousLevel = state.level;
      if (eatsFood) {
        state.foodCount += 1;
        state.score += Math.round((100 * state.level + Math.min(500, state.snake.length * 4)) * cfg.multiplier);
        audio.eat();
        if (vibration) haptic(win, 25);
        spawnFood();
        if (state.foodCount > 0 && state.foodCount % 5 === 0 && !state.bonus) spawnBonus(now);
      } else {
        state.score += Math.round(420 * state.level * cfg.multiplier);
        state.bonus = null;
        state.bonusUntil = 0;
        audio.bonus();
        if (vibration) haptic(win, [22, 35, 45]);
        announce('Fruit d’or cueilli. Bonus de score.');
      }
      state.level = levelForFood(state.foodCount);
      if (state.level > previousLevel) {
        addRocks(state.level);
        audio.level();
        levelFlash.textContent = `Niveau ${state.level}`;
        levelFlash.classList.remove('show');
        void levelFlash.offsetWidth;
        levelFlash.classList.add('show');
        announce(`Niveau ${state.level}. La jungle accélère.`);
      }
    } else {
      state.snake.pop();
    }

    if (state.bonus && now >= state.bonusUntil) {
      state.bonus = null;
      state.bonusUntil = 0;
    }
    updateHud();
  }

  function resizeCanvas() {
    const rect = boardWrap.getBoundingClientRect();
    const dpr = Math.min(2, Math.max(1, win.devicePixelRatio || 1));
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function roundRect(context, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    context.beginPath();
    if (typeof context.roundRect === 'function') context.roundRect(x, y, w, h, radius);
    else context.rect(x, y, w, h);
  }

  function draw() {
    resizeCanvas();
    const cfg = config();
    const width = canvas.width;
    const height = canvas.height;
    const cell = Math.min(width / cfg.cols, height / cfg.rows);
    const boardW = cell * cfg.cols;
    const boardH = cell * cfg.rows;
    const ox = (width - boardW) / 2;
    const oy = (height - boardH) / 2;
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createRadialGradient(width * 0.48, height * 0.42, cell, width * 0.5, height * 0.5, width * 0.7);
    bg.addColorStop(0, '#15301f');
    bg.addColorStop(1, '#07120c');
    ctx.fillStyle = bg;
    ctx.fillRect(ox, oy, boardW, boardH);

    ctx.strokeStyle = 'rgba(202,213,163,.075)';
    ctx.lineWidth = Math.max(1, width / 800);
    ctx.beginPath();
    for (let x = 1; x < cfg.cols; x += 1) {
      const px = ox + x * cell;
      ctx.moveTo(px, oy); ctx.lineTo(px, oy + boardH);
    }
    for (let y = 1; y < cfg.rows; y += 1) {
      const py = oy + y * cell;
      ctx.moveTo(ox, py); ctx.lineTo(ox + boardW, py);
    }
    ctx.stroke();

    state.rocks.forEach((rock) => {
      const x = ox + rock.x * cell + cell * 0.14;
      const y = oy + rock.y * cell + cell * 0.14;
      const s = cell * 0.72;
      const grad = ctx.createLinearGradient(x, y, x + s, y + s);
      grad.addColorStop(0, '#9b9a7b'); grad.addColorStop(1, '#4c5947');
      ctx.fillStyle = grad;
      roundRect(ctx, x, y, s, s, cell * 0.18); ctx.fill();
      ctx.fillStyle = 'rgba(255,250,205,.17)';
      roundRect(ctx, x + s * 0.16, y + s * 0.12, s * 0.46, s * 0.16, s * 0.08); ctx.fill();
    });

    const drawFruit = (fruit, bonus = false) => {
      if (!fruit) return;
      const cx = ox + (fruit.x + 0.5) * cell;
      const cy = oy + (fruit.y + 0.52) * cell;
      const radius = cell * (bonus ? 0.34 : 0.31);
      if (bonus) {
        ctx.save();
        ctx.shadowColor = '#ffd75c'; ctx.shadowBlur = cell * 0.75;
        ctx.fillStyle = '#f4c94f';
      } else {
        ctx.fillStyle = '#e46355';
      }
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = bonus ? '#fff2a6' : '#ffb1a2';
      ctx.beginPath(); ctx.arc(cx - radius * 0.26, cy - radius * 0.27, radius * 0.23, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6fa15a';
      ctx.beginPath(); ctx.ellipse(cx + radius * 0.2, cy - radius * 0.9, radius * 0.32, radius * 0.14, -0.45, 0, Math.PI * 2); ctx.fill();
      if (bonus) ctx.restore();
    };
    drawFruit(state.food, false);
    drawFruit(state.bonus, true);

    for (let i = state.snake.length - 1; i >= 0; i -= 1) {
      const segment = state.snake[i];
      const t = i / Math.max(1, state.snake.length - 1);
      const x = ox + segment.x * cell + cell * 0.08;
      const y = oy + segment.y * cell + cell * 0.08;
      const s = cell * 0.84;
      ctx.fillStyle = i === 0 ? '#d7e46b' : `hsl(${112 + t * 18} 42% ${54 - t * 16}%)`;
      if (i === 0) { ctx.shadowColor = '#cde76e'; ctx.shadowBlur = cell * 0.35; }
      roundRect(ctx, x, y, s, s, cell * 0.25); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(10,34,17,.24)'; ctx.lineWidth = Math.max(1, cell * 0.04); ctx.stroke();
      if (i === 0) {
        const dir = DIRS[state.direction];
        const side = { x: -dir.y, y: dir.x };
        const centerX = x + s / 2 + dir.x * s * 0.2;
        const centerY = y + s / 2 + dir.y * s * 0.2;
        ctx.fillStyle = '#132417';
        [-1, 1].forEach((sign) => {
          ctx.beginPath();
          ctx.arc(centerX + side.x * s * 0.19 * sign, centerY + side.y * s * 0.19 * sign, Math.max(1.4, s * 0.075), 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(238,240,151,.13)';
        ctx.beginPath(); ctx.arc(x + s * 0.37, y + s * 0.35, s * 0.13, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function loop(timestamp) {
    if (!state.running || state.over) return;
    if (!state.paused) {
      if (!state.lastStep) state.lastStep = timestamp;
      const elapsed = Math.min(250, timestamp - state.lastStep);
      state.lastStep = timestamp;
      state.accumulator += elapsed;
      const delay = stepDelay(state.mode, state.level);
      let safety = 0;
      while (state.accumulator >= delay && safety < 4 && state.running && !state.over) {
        move(timestamp);
        state.accumulator -= delay;
        safety += 1;
      }
      if (state.bonus && timestamp >= state.bonusUntil) {
        state.bonus = null;
        state.bonusUntil = 0;
      }
    } else {
      state.lastStep = timestamp;
      state.accumulator = 0;
    }
    draw();
    if (state.running && !state.over) state.raf = win.requestAnimationFrame(loop);
  }

  primaryBtn.addEventListener('click', () => {
    if (state.showHelp) {
      state.showHelp = false;
      if (state.running) resume(); else showStart();
      return;
    }
    if (state.running && state.paused) resume();
    else start();
  });

  secondaryBtn.addEventListener('click', () => {
    if (state.showHelp) {
      state.showHelp = false;
      if (state.running) start(); else showStart();
      return;
    }
    if (state.over) showStart();
    else if (state.running) start();
    else showHelp(false);
  });

  pauseBtn.addEventListener('click', () => {
    if (!state.running) return;
    if (state.paused) resume(); else pause(true);
  });
  helpBtn.addEventListener('click', () => showHelp(state.running));
  soundBtn.addEventListener('click', () => {
    settings.sound = !audio.enabled;
    audio.setEnabled(settings.sound);
    soundBtn.setAttribute('aria-pressed', String(settings.sound));
    soundBtn.textContent = settings.sound ? 'Son ✓' : 'Son —';
    save(storage, `${STORE}settings`, settings);
    if (settings.sound) audio.eat();
  });
  vibeBtn.addEventListener('click', () => {
    vibration = !vibration;
    settings.vibration = vibration;
    vibeBtn.setAttribute('aria-pressed', String(vibration));
    vibeBtn.textContent = vibration ? 'Vibration ✓' : 'Vibration —';
    save(storage, `${STORE}settings`, settings);
    if (vibration) haptic(win, 30);
  });

  doc.querySelectorAll('[data-dir]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      setDirection(button.dataset.dir);
    });
  });

  canvas.addEventListener('pointerdown', (event) => {
    canvas.setPointerCapture?.(event.pointerId);
    state.touch = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointerup', (event) => {
    if (!state.touch) return;
    const dx = event.clientX - state.touch.x;
    const dy = event.clientY - state.touch.y;
    state.touch = null;
    const distance = Math.hypot(dx, dy);
    if (distance < 16) return;
    if (Math.abs(dx) > Math.abs(dy)) setDirection(dx > 0 ? 'right' : 'left');
    else setDirection(dy > 0 ? 'down' : 'up');
  });
  canvas.addEventListener('pointercancel', () => { state.touch = null; });

  doc.addEventListener('keydown', (event) => {
    const map = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    if (map[event.key]) {
      event.preventDefault();
      setDirection(map[event.key]);
    } else if (event.key === 'p' || event.key === 'P') {
      event.preventDefault();
      if (state.running) {
        if (state.paused) resume();
        else pause(true);
      }
    } else if ((event.key === ' ' || event.key === 'Enter') && !overlay.classList.contains('hide')) {
      event.preventDefault();
      primaryBtn.click();
    }
  });

  const autoPause = () => {
    if (state.running && !state.paused && !state.over) pause(true);
  };
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) autoPause(); });
  win.addEventListener('blur', autoPause);
  win.addEventListener('resize', draw, { passive: true });

  soundBtn.setAttribute('aria-pressed', String(audio.enabled));
  soundBtn.textContent = audio.enabled ? 'Son ✓' : 'Son —';
  vibeBtn.setAttribute('aria-pressed', String(vibration));
  vibeBtn.textContent = vibration ? 'Vibration ✓' : 'Vibration —';
  reset();
  showStart();
}
