const STORE = 'nowis:shape-studio:';

const MODES = {
  zen: {
    name: 'Atelier détente',
    desc: 'Sans chrono global · prends le temps de viser juste.',
    duration: 0,
    lives: 0,
    targetTime: 7.2,
    scoreMult: 0.78,
  },
  classic: {
    name: 'Défi classique',
    desc: '3 vies · les consignes deviennent plus précises.',
    duration: 0,
    lives: 3,
    targetTime: 6,
    scoreMult: 1,
  },
  rush: {
    name: 'Rush 60 s',
    desc: '60 secondes · rythme rapide et pièges visuels.',
    duration: 60,
    lives: 0,
    targetTime: 4.2,
    scoreMult: 1.35,
  },
};

const SHAPES = [
  { id: 'circle', name: 'cercle' },
  { id: 'square', name: 'carré' },
  { id: 'triangle', name: 'triangle' },
  { id: 'diamond', name: 'losange' },
  { id: 'hexagon', name: 'hexagone' },
  { id: 'star', name: 'étoile' },
  { id: 'pill', name: 'capsule' },
  { id: 'cross', name: 'croix' },
];

const COLORS = [
  { id: 'coral', name: 'corail', value: '#ef6b5b' },
  { id: 'blue', name: 'bleu', value: '#2f66d0' },
  { id: 'gold', name: 'jaune', value: '#e7b63d' },
  { id: 'mint', name: 'menthe', value: '#58a987' },
  { id: 'violet', name: 'violet', value: '#8665b6' },
  { id: 'rose', name: 'rose', value: '#d46e95' },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const fmt = (value) => Math.max(0, Math.round(value)).toLocaleString('fr-CA');

const load = (storage, key, fallback) => {
  try { return { ...fallback, ...(JSON.parse(storage.getItem(key) || 'null') || {}) }; }
  catch { return { ...fallback }; }
};

const save = (storage, key, value) => {
  try { storage.setItem(key, JSON.stringify(value)); }
  catch { /* stockage privé ou indisponible */ }
};

function randomInt(win, max) {
  if (max <= 1) return 0;
  try {
    const range = 0x100000000;
    const limit = Math.floor(range / max) * max;
    const values = new Uint32Array(1);
    let value = limit;
    while (value >= limit) {
      win.crypto.getRandomValues(values);
      [value] = values;
    }
    return value % max;
  } catch {
    return Math.floor(Math.random() * max);
  }
}

function shuffle(win, source) {
  const list = [...source];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const other = randomInt(win, index + 1);
    [list[index], list[other]] = [list[other], list[index]];
  }
  return list;
}

function difficultyFor(mode, level) {
  const stage = Math.max(0, level - 1);
  const count = clamp(4 + Math.floor(stage / 2), 4, mode === 'rush' ? 12 : 10);
  const shapePool = clamp(4 + Math.floor(stage / 2), 4, SHAPES.length);
  const colorPool = clamp(3 + Math.floor(stage / 3), 3, COLORS.length);
  const requireColor = level >= 4;
  const moving = level >= 5;
  const motionSpeed = mode === 'rush' ? 1.05 + stage * 0.08 : 0.72 + stage * 0.055;
  const baseTarget = MODES[mode].targetTime;
  const targetTime = clamp(baseTarget - stage * (mode === 'rush' ? 0.12 : 0.1), mode === 'rush' ? 2.2 : 3.2, baseTarget);
  return { count, shapePool, colorPool, requireColor, moving, motionSpeed, targetTime };
}

function makeRound(win, mode, level) {
  const difficulty = difficultyFor(mode, level);
  const shapes = SHAPES.slice(0, difficulty.shapePool);
  const colors = COLORS.slice(0, difficulty.colorPool);
  const targetShape = shapes[randomInt(win, shapes.length)];
  const targetColor = colors[randomInt(win, colors.length)];
  const target = {
    shapeId: targetShape.id,
    shapeName: targetShape.name,
    colorId: targetColor.id,
    colorName: targetColor.name,
    requireColor: difficulty.requireColor,
  };

  const items = [{ shape: targetShape, color: targetColor, target: true }];
  let guard = 0;
  while (items.length < difficulty.count && guard < 500) {
    guard += 1;
    const shape = shapes[randomInt(win, shapes.length)];
    const color = colors[randomInt(win, colors.length)];
    const wouldMatch = target.requireColor
      ? shape.id === target.shapeId && color.id === target.colorId
      : shape.id === target.shapeId;
    if (wouldMatch) continue;
    items.push({ shape, color, target: false });
  }

  while (items.length < difficulty.count) {
    const fallbackShape = shapes.find((shape) => shape.id !== target.shapeId) || shapes[0];
    items.push({ shape: fallbackShape, color: colors[randomInt(win, colors.length)], target: false });
  }

  return { difficulty, target, items: shuffle(win, items) };
}

function createAudio(win) {
  let ctx;
  let enabled = true;
  const tone = (frequency, duration = 0.07, type = 'triangle', gain = 0.022, delay = 0) => {
    if (!enabled) return;
    try {
      ctx ??= new (win.AudioContext || win.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const at = ctx.currentTime + delay;
      const oscillator = ctx.createOscillator();
      const volume = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, at);
      volume.gain.setValueAtTime(gain, at);
      volume.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(volume).connect(ctx.destination);
      oscillator.start(at);
      oscillator.stop(at + duration);
    } catch { /* WebAudio non disponible */ }
  };
  return {
    correct(combo) {
      tone(430 + Math.min(280, combo * 18), 0.06, 'triangle', 0.026);
      tone(690 + Math.min(220, combo * 14), 0.08, 'sine', 0.02, 0.045);
    },
    wrong() { tone(170, 0.13, 'sawtooth', 0.022); },
    level() { [392, 523, 659, 784].forEach((frequency, index) => tone(frequency, 0.08, 'triangle', 0.022, index * 0.04)); },
    tick() { tone(310, 0.035, 'square', 0.008); },
    end() { [659, 523, 392].forEach((frequency, index) => tone(frequency, 0.11, 'triangle', 0.022, index * 0.065)); },
    set(value) { enabled = value; },
  };
}

const buzz = (win, pattern, enabled) => {
  if (!enabled) return;
  try { win.navigator?.vibrate?.(pattern); }
  catch { /* vibration non disponible */ }
};

export function upgradeShapeClicker(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisShapeStudio === 'true') return;
  root.dataset.nowisShapeStudio = 'true';
  root.lang = 'fr';
  doc.title = 'Atelier des formes NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#eee7d7;color:#20201e;font-family:Inter,ui-rounded,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{min-height:100dvh;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}button{font:inherit}.app{min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:7px;padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(9px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));background:radial-gradient(circle at 8% 5%,#ef6b5b1c,transparent 27%),radial-gradient(circle at 93% 10%,#2f66d01c,transparent 27%),linear-gradient(145deg,#f3eddf,#e9dfca 54%,#f1eadc)}.top,.hud,.brief,.board,.bottom{width:min(100%,900px)}.top{display:flex;align-items:center;justify-content:space-between;gap:7px}.brand small{display:block;color:#756b5a;font-size:9px;font-weight:1000;letter-spacing:.18em;text-transform:uppercase}.brand h1{margin:2px 0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(24px,6.5vw,40px);line-height:.94;letter-spacing:-.045em}.tools{display:flex;gap:5px}.btn,.modal button{min-height:44px;border:2px solid #29282420;border-radius:12px;background:#fff9ed;color:#24231f;font-weight:950;cursor:pointer;touch-action:manipulation;box-shadow:0 5px 0 #3b37251f}.btn{min-width:44px;padding:7px 9px}.btn:active,.modal button:active,.shapeBtn:active{transform:translateY(2px);box-shadow:0 2px 0 #3b37251f}.btn:focus-visible,.modal button:focus-visible,.shapeBtn:focus-visible{outline:4px solid #2f66d0;outline-offset:2px}.hud{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.stat{text-align:center;padding:6px 2px;border:2px solid #302f2a16;border-radius:10px;background:#fff8ebcc;box-shadow:0 5px 14px #6c604a12}.stat span{display:block;color:#786f60;font-size:8px;font-weight:1000;text-transform:uppercase}.stat strong{display:block;font-size:clamp(14px,4vw,20px);font-variant-numeric:tabular-nums}.brief{position:relative;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:64px;padding:8px 12px;border:2px solid #29282422;border-radius:16px;background:#22211e;color:#fff8e8;overflow:hidden;box-shadow:0 9px 0 #2c27181c}.briefText small{display:block;color:#c9beaa;font-size:8px;font-weight:1000;letter-spacing:.14em;text-transform:uppercase}.briefText strong{display:block;margin-top:1px;font-family:Georgia,"Times New Roman",serif;font-size:clamp(20px,6vw,34px);line-height:1}.briefText em{display:block;margin-top:2px;color:#dfd2ba;font-size:10px;font-style:normal;font-weight:800}.timerRing{position:relative;flex:0 0 auto;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#e7b63d var(--p,100%),#5a554a33 0);box-shadow:inset 0 0 0 5px #292824}.timerRing:after{content:"";position:absolute;inset:7px;border-radius:50%;background:#292824}.timerRing b{position:relative;z-index:1;color:#fff4d4;font-size:11px;font-variant-numeric:tabular-nums}.board{position:relative;flex:1;min-height:310px;overflow:hidden;border:2px solid #2d2a241f;border-radius:24px;background:linear-gradient(90deg,#2a29230a 1px,transparent 1px),linear-gradient(#2a29230a 1px,transparent 1px),#fff9ed;background-size:34px 34px;box-shadow:0 18px 48px #6a5d451f,inset 0 1px #fff}.board:before,.board:after{content:"";position:absolute;pointer-events:none;opacity:.13}.board:before{width:180px;height:180px;right:-65px;top:-70px;border-radius:50%;background:#2f66d0}.board:after{width:150px;height:150px;left:-55px;bottom:-60px;background:#ef6b5b;clip-path:polygon(50% 0,100% 100%,0 100%)}.shapeBtn{--c:#ef6b5b;position:absolute;left:var(--x);top:var(--y);width:clamp(54px,13vw,86px);height:clamp(54px,13vw,86px);margin:0;transform:translate(-50%,-50%);border:0;background:transparent;display:grid;place-items:center;cursor:pointer;touch-action:manipulation;filter:drop-shadow(0 7px 5px #362f2524);transition:filter .12s,opacity .16s}.shapeBtn:active{transform:translate(-50%,-48%)}.shapeBtn .glyph{display:block;width:78%;height:78%;background:var(--c);border:3px solid #24231f;box-shadow:inset 0 0 0 2px #ffffff55}.shapeBtn.circle .glyph{border-radius:50%}.shapeBtn.square .glyph{border-radius:5px}.shapeBtn.triangle .glyph{clip-path:polygon(50% 3%,97% 94%,3% 94%)}.shapeBtn.diamond .glyph{transform:rotate(45deg) scale(.73);border-radius:4px}.shapeBtn.hexagon .glyph{clip-path:polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%)}.shapeBtn.star .glyph{clip-path:polygon(50% 2%,61% 34%,96% 35%,68% 56%,78% 91%,50% 70%,22% 91%,32% 56%,4% 35%,39% 34%)}.shapeBtn.pill .glyph{width:90%;height:52%;border-radius:999px}.shapeBtn.cross .glyph{clip-path:polygon(34% 0,66% 0,66% 34%,100% 34%,100% 66%,66% 66%,66% 100%,34% 100%,34% 66%,0 66%,0 34%,34% 34%)}.shapeBtn.correct{z-index:5;filter:drop-shadow(0 0 14px #58a987)}.shapeBtn.wrong{animation:shake .22s linear}@keyframes shake{25%{transform:translate(-55%,-50%)}75%{transform:translate(-45%,-50%)}}.flash{position:absolute;pointer-events:none;z-index:8;left:var(--x);top:var(--y);width:22px;height:22px;border:4px solid var(--c);border-radius:50%;transform:translate(-50%,-50%);animation:pop .4s ease-out forwards}@keyframes pop{to{width:120px;height:120px;opacity:0}}.bottom{display:grid;grid-template-columns:minmax(0,1.45fr) repeat(3,minmax(0,.65fr));gap:5px}.status{min-height:50px;display:flex;flex-direction:column;justify-content:center;padding:6px 10px;border:2px solid #29282416;border-radius:12px;background:#fff8eb}.status b{font-size:12px}.status span{color:#72695c;font-size:9px;font-weight:800}.bottom .btn{font-size:10px;padding:5px}.ov{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:18px;background:#1c1b18e6;backdrop-filter:blur(10px)}.ov.hide{display:none}.modal{width:min(100%,560px);max-height:91dvh;overflow:auto;padding:22px;border:2px solid #27262022;border-radius:24px;background:#f7efdf;box-shadow:0 32px 90px #0007}.ey{color:#746a59;font-size:9px;font-weight:1000;letter-spacing:.18em;text-transform:uppercase}.modal h2{margin:5px 0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(30px,8vw,42px);line-height:.98}.modal p,.modal li{color:#635c50;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{min-height:60px;text-align:left;padding:11px 12px}.mode strong,.mode span{display:block}.mode span{margin-top:3px;color:#756e63;font-size:11px}.mode.on{border-color:#2f66d0;background:#e5ebf9}.acts{display:grid;grid-template-columns:1fr 1fr;gap:7px}.modal button{padding:10px 12px}.primary{border-color:#20201e!important;background:#20201e!important;color:#fff7e6!important}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0}.cards div{text-align:center;padding:9px 3px;border:2px solid #2a292315;border-radius:12px;background:#fff8eb}.cards span{display:block;color:#7b7263;font-size:8px;font-weight:1000;text-transform:uppercase}.cards strong{display:block;font-size:17px}.record{margin:8px 0 14px;padding:10px;border-radius:12px;background:#e9dfcb;color:#625b4e;font-size:11px;font-weight:850}.sr{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}@media(max-width:560px){.app{gap:5px}.brand h1{font-size:26px}.brand small{font-size:7px}.hud{grid-template-columns:repeat(3,1fr)}.stat{padding:4px 2px}.brief{min-height:58px}.board{min-height:270px;border-radius:19px}.shapeBtn{width:58px;height:58px}.bottom{grid-template-columns:1.4fr repeat(3,.68fr)}.bottom .btn{font-size:9px}.status{min-height:46px}.cards{grid-template-columns:repeat(2,1fr)}}@media(max-height:650px) and (orientation:landscape){.app{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,1.45fr);grid-template-rows:auto auto 1fr auto;align-items:stretch}.top,.hud,.brief,.bottom{width:100%}.top{grid-column:1}.hud{grid-column:1;grid-row:2;grid-template-columns:repeat(3,1fr)}.brief{grid-column:1;grid-row:3;align-self:start}.board{grid-column:2;grid-row:1/5;width:100%;min-height:0}.bottom{grid-column:1;grid-row:4;grid-template-columns:1fr 1fr 1fr}.status{grid-column:1/4}.brand h1{font-size:25px}.shapeBtn{width:58px;height:58px}}@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;scroll-behavior:auto!important;transition:none!important}.shapeBtn{transition:none!important}}
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
    <main class="app">
      <header class="top">
        <div class="brand"><small>Studio géométrique NOWIS</small><h1>Atelier des formes</h1></div>
        <div class="tools"><button class="btn" id="sound" aria-label="Activer ou désactiver le son">🔊</button><button class="btn" id="vibration" aria-label="Activer ou désactiver les vibrations">📳</button><button class="btn" id="helpTop" aria-label="Afficher l'aide">?</button></div>
      </header>
      <section class="hud" aria-label="Statistiques de la partie">
        <div class="stat"><span>Score</span><strong id="score">0</strong></div>
        <div class="stat"><span>Record</span><strong id="best">0</strong></div>
        <div class="stat"><span>Niveau</span><strong id="level">1</strong></div>
        <div class="stat"><span>Série</span><strong id="combo">0</strong></div>
        <div class="stat"><span>Vies</span><strong id="lives">—</strong></div>
        <div class="stat"><span>Temps</span><strong id="time">∞</strong></div>
      </section>
      <section class="brief" aria-live="polite">
        <div class="briefText"><small>Trouve la bonne forme</small><strong id="prompt">Prêt ?</strong><em id="rule">Choisis un mode pour commencer.</em></div>
        <div class="timerRing" id="timerRing" aria-label="Temps restant pour la cible"><b id="targetTime">—</b></div>
      </section>
      <section class="board" id="board" aria-label="Zone de jeu"></section>
      <section class="bottom">
        <div class="status"><b id="message">Observe, puis touche la bonne forme.</b><span id="subMessage">Les cibles sont assez grandes pour jouer au pouce.</span></div>
        <button class="btn" id="pause">Pause</button>
        <button class="btn" id="restart">Rejouer</button>
        <button class="btn" id="menuBtn">Modes</button>
      </section>
      <div class="sr" id="announce" aria-live="assertive"></div>
    </main>
    <div class="ov" id="overlay"><section class="modal" id="modal" role="dialog" aria-modal="true"></section></div>
  `;

  const $ = (selector) => doc.querySelector(selector);
  const board = $('#board');
  const overlay = $('#overlay');
  const modal = $('#modal');
  const storage = win.localStorage;
  const audio = createAudio(win);
  const defaultStats = {
    zen: { bestScore: 0, bestCombo: 0, bestLevel: 1, hits: 0, games: 0 },
    classic: { bestScore: 0, bestCombo: 0, bestLevel: 1, hits: 0, games: 0 },
    rush: { bestScore: 0, bestCombo: 0, bestLevel: 1, hits: 0, games: 0 },
  };
  let stats = load(storage, `${STORE}stats`, defaultStats);
  let settings = load(storage, `${STORE}settings`, { sound: true, vibration: true, mode: 'classic' });
  let mode = MODES[settings.mode] ? settings.mode : 'classic';
  let soundOn = settings.sound !== false;
  let vibrationOn = settings.vibration !== false;
  let running = false;
  let paused = false;
  let score = 0;
  let level = 1;
  let combo = 0;
  let hits = 0;
  let lives = 0;
  let timeLeft = 0;
  let roundLeft = 0;
  let roundTotal = 1;
  let round = null;
  let raf = 0;
  let lastFrame = 0;
  let lastSecond = -1;
  let positions = [];
  let reducedMotion = Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  audio.set(soundOn);

  function modeStats(selected = mode) {
    return stats[selected] || defaultStats[selected];
  }

  function persistSettings() {
    settings = { sound: soundOn, vibration: vibrationOn, mode };
    save(storage, `${STORE}settings`, settings);
  }

  function storeProgress() {
    const previous = modeStats();
    stats[mode] = {
      ...previous,
      bestScore: Math.max(previous.bestScore || 0, score),
      bestCombo: Math.max(previous.bestCombo || 0, combo),
      bestLevel: Math.max(previous.bestLevel || 1, level),
      hits: Math.max(previous.hits || 0, hits),
    };
    save(storage, `${STORE}stats`, stats);
  }

  function setMessage(title, detail) {
    $('#message').textContent = title;
    $('#subMessage').textContent = detail;
  }

  function hud() {
    $('#score').textContent = fmt(score);
    $('#best').textContent = fmt(Math.max(modeStats().bestScore || 0, score));
    $('#level').textContent = String(level);
    $('#combo').textContent = String(combo);
    $('#lives').textContent = MODES[mode].lives ? String(lives) : '—';
    $('#time').textContent = MODES[mode].duration ? `${Math.ceil(timeLeft)} s` : '∞';
    $('#sound').textContent = soundOn ? '🔊' : '🔇';
    $('#sound').setAttribute('aria-pressed', String(soundOn));
    $('#vibration').textContent = vibrationOn ? '📳' : '—';
    $('#vibration').setAttribute('aria-pressed', String(vibrationOn));
    $('#pause').textContent = paused ? 'Reprendre' : 'Pause';
  }

  function createPosition(index, total) {
    const columns = total <= 6 ? 3 : total <= 10 ? 4 : 5;
    const rows = Math.ceil(total / columns);
    const column = index % columns;
    const rowIndex = Math.floor(index / columns);
    const xStep = 82 / Math.max(1, columns - 1);
    const yStep = 76 / Math.max(1, rows - 1);
    const jitterX = randomInt(win, 9) - 4;
    const jitterY = randomInt(win, 9) - 4;
    return {
      x: clamp(9 + column * xStep + jitterX, 8, 92),
      y: clamp(12 + rowIndex * yStep + jitterY, 10, 90),
      vx: (randomInt(win, 2) ? 1 : -1) * (0.35 + randomInt(win, 45) / 100),
      vy: (randomInt(win, 2) ? 1 : -1) * (0.3 + randomInt(win, 40) / 100),
    };
  }

  function renderRound() {
    board.innerHTML = '';
    positions = round.items.map((item, index) => createPosition(index, round.items.length));
    round.items.forEach((item, index) => {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = `shapeBtn ${item.shape.id}`;
      button.dataset.index = String(index);
      button.style.setProperty('--c', item.color.value);
      button.style.setProperty('--x', `${positions[index].x}%`);
      button.style.setProperty('--y', `${positions[index].y}%`);
      button.setAttribute('aria-label', `${item.shape.name} ${item.color.name}`);
      button.innerHTML = '<span class="glyph" aria-hidden="true"></span>';
      board.appendChild(button);
    });
    const prompt = round.target.requireColor
      ? `${round.target.shapeName} ${round.target.colorName}`
      : round.target.shapeName;
    $('#prompt').textContent = prompt.charAt(0).toUpperCase() + prompt.slice(1);
    $('#rule').textContent = round.target.requireColor
      ? 'La forme ET la couleur doivent correspondre.'
      : 'Seule la forme compte pour l’instant.';
    $('#announce').textContent = `Nouvelle cible : ${prompt}.`;
    roundTotal = round.difficulty.targetTime;
    roundLeft = roundTotal;
    updateTargetTimer();
  }

  function updateTargetTimer() {
    const ratio = clamp(roundLeft / Math.max(0.001, roundTotal), 0, 1);
    $('#targetTime').textContent = running ? `${Math.ceil(roundLeft)} s` : '—';
    $('#timerRing').style.setProperty('--p', `${Math.round(ratio * 100)}%`);
  }

  function nextRound() {
    round = makeRound(win, mode, level);
    lastSecond = Math.ceil(round.difficulty.targetTime);
    renderRound();
  }

  function finish(reason) {
    if (!running) return;
    running = false;
    paused = false;
    win.cancelAnimationFrame(raf);
    audio.end();
    buzz(win, [28, 50, 28], vibrationOn);
    const previous = modeStats();
    stats[mode] = {
      ...previous,
      bestScore: Math.max(previous.bestScore || 0, score),
      bestCombo: Math.max(previous.bestCombo || 0, combo),
      bestLevel: Math.max(previous.bestLevel || 1, level),
      hits: Math.max(previous.hits || 0, hits),
      games: (previous.games || 0) + 1,
    };
    save(storage, `${STORE}stats`, stats);
    hud();
    overlay.classList.remove('hide');
    modal.innerHTML = `<div class="ey">Partie terminée</div><h2>${reason}</h2><div class="cards"><div><span>Score</span><strong>${fmt(score)}</strong></div><div><span>Niveau</span><strong>${level}</strong></div><div><span>Cibles</span><strong>${hits}</strong></div><div><span>Série</span><strong>${modeStats().bestCombo}</strong></div></div><div class="record">Record ${MODES[mode].name} : ${fmt(modeStats().bestScore)} points · niveau ${modeStats().bestLevel}</div><div class="acts"><button id="finishMenu">Changer de mode</button><button class="primary" id="again">Rejouer</button></div>`;
    $('#finishMenu').onclick = showMenu;
    $('#again').onclick = () => start(mode);
  }

  function missRound(reason) {
    combo = 0;
    audio.wrong();
    buzz(win, 45, vibrationOn);
    if (mode === 'classic') {
      lives -= 1;
      if (lives <= 0) {
        hud();
        finish('Plus de vies');
        return;
      }
      setMessage(reason, `${lives} vie${lives > 1 ? 's' : ''} restante${lives > 1 ? 's' : ''}.`);
    } else if (mode === 'rush') {
      timeLeft = Math.max(0, timeLeft - 2);
      setMessage(reason, 'Pénalité : −2 secondes.');
    } else {
      score = Math.max(0, score - 20);
      setMessage(reason, 'Pas de vie perdue · −20 points.');
    }
    nextRound();
    hud();
  }

  function hitTarget(index, button) {
    const item = round.items[index];
    if (!item || !item.target) return false;
    combo += 1;
    hits += 1;
    const speedRatio = clamp(roundLeft / Math.max(0.001, roundTotal), 0, 1);
    const base = 100 + level * 22;
    const speedBonus = Math.round(180 * speedRatio);
    const chain = 1 + Math.min(1.75, Math.max(0, combo - 1) * 0.09);
    const gained = Math.round((base + speedBonus) * chain * MODES[mode].scoreMult);
    score += gained;
    const oldLevel = level;
    level = 1 + Math.floor(hits / 6);
    button.classList.add('correct');
    const flash = doc.createElement('span');
    flash.className = 'flash';
    flash.style.setProperty('--x', button.style.getPropertyValue('--x'));
    flash.style.setProperty('--y', button.style.getPropertyValue('--y'));
    flash.style.setProperty('--c', item.color.value);
    board.appendChild(flash);
    audio.correct(combo);
    buzz(win, combo >= 5 ? [15, 18, 15] : 16, vibrationOn);
    setMessage(`Excellent · +${fmt(gained)}`, combo >= 3 ? `Série de ${combo} !` : 'Continue comme ça.');
    $('#announce').textContent = `Bonne forme. Plus ${gained} points. Série ${combo}.`;
    storeProgress();
    if (level !== oldLevel) {
      audio.level();
      setMessage(`Niveau ${level}`, level >= 4 ? 'Les couleurs comptent maintenant.' : 'Plus de formes apparaissent.');
    }
    hud();
    win.setTimeout(() => {
      if (running && !paused) nextRound();
    }, reducedMotion ? 40 : 240);
    return true;
  }

  function choose(index, button) {
    if (!running || paused || !round) return;
    if (hitTarget(index, button)) return;
    button.classList.add('wrong');
    win.setTimeout(() => button.classList.remove('wrong'), 240);
    missRound('Ce n’était pas la bonne forme');
    $('#announce').textContent = 'Mauvaise forme.';
  }

  function animatePositions(delta) {
    if (!round?.difficulty.moving || reducedMotion) return;
    const speed = round.difficulty.motionSpeed * delta * 1.9;
    positions.forEach((position, index) => {
      position.x += position.vx * speed;
      position.y += position.vy * speed;
      if (position.x <= 7 || position.x >= 93) {
        position.vx *= -1;
        position.x = clamp(position.x, 7, 93);
      }
      if (position.y <= 9 || position.y >= 91) {
        position.vy *= -1;
        position.y = clamp(position.y, 9, 91);
      }
      const button = board.querySelector(`[data-index="${index}"]`);
      if (button) {
        button.style.setProperty('--x', `${position.x}%`);
        button.style.setProperty('--y', `${position.y}%`);
      }
    });
  }

  function frame(now) {
    if (!running || paused) return;
    if (!lastFrame) lastFrame = now;
    const delta = Math.min(0.08, (now - lastFrame) / 1000);
    lastFrame = now;
    if (MODES[mode].duration) {
      timeLeft -= delta;
      if (timeLeft <= 0) {
        timeLeft = 0;
        hud();
        finish('Temps écoulé');
        return;
      }
    }
    roundLeft -= delta;
    if (roundLeft <= 0) {
      roundLeft = 0;
      updateTargetTimer();
      missRound('Trop tard');
      lastFrame = now;
      if (!running) return;
    } else {
      const second = Math.ceil(roundLeft);
      if (second <= 3 && second !== lastSecond) audio.tick();
      lastSecond = second;
      updateTargetTimer();
      animatePositions(delta);
    }
    hud();
    raf = win.requestAnimationFrame(frame);
  }

  function start(selectedMode) {
    mode = selectedMode;
    persistSettings();
    running = true;
    paused = false;
    score = 0;
    level = 1;
    combo = 0;
    hits = 0;
    lives = MODES[mode].lives;
    timeLeft = MODES[mode].duration;
    round = null;
    lastFrame = 0;
    overlay.classList.add('hide');
    setMessage('À toi de jouer', 'Touche la forme demandée le plus vite possible.');
    nextRound();
    hud();
    win.cancelAnimationFrame(raf);
    raf = win.requestAnimationFrame(frame);
  }

  function showMenu() {
    running = false;
    paused = false;
    win.cancelAnimationFrame(raf);
    overlay.classList.remove('hide');
    modal.innerHTML = `<div class="ey">Atelier des formes</div><h2>Choisis ton défi</h2><p>Repère la forme demandée parmi les compositions. À partir du niveau 4, la couleur devient aussi importante.</p><div class="modes">${Object.entries(MODES).map(([key, item]) => `<button class="mode${key === mode ? ' on' : ''}" data-mode="${key}"><strong>${item.name}</strong><span>${item.desc}</span></button>`).join('')}</div><div class="record">Records · Détente ${fmt(modeStats('zen').bestScore)} · Classique ${fmt(modeStats('classic').bestScore)} · Rush ${fmt(modeStats('rush').bestScore)}</div><div class="acts"><button id="helpMenu">Comment jouer</button><button class="primary" id="play">Jouer</button></div>`;
    modal.querySelectorAll('[data-mode]').forEach((button) => {
      button.onclick = () => {
        mode = button.dataset.mode;
        persistSettings();
        showMenu();
      };
    });
    $('#helpMenu').onclick = () => showHelp(false);
    $('#play').onclick = () => start(mode);
  }

  function showHelp(wasPlaying = running && !paused) {
    if (wasPlaying) {
      paused = true;
      win.cancelAnimationFrame(raf);
    }
    overlay.classList.remove('hide');
    modal.innerHTML = `<div class="ey">Aide</div><h2>Observe. Trouve. Touche.</h2><ul><li>Lis la <b>consigne</b>, puis touche la forme correspondante.</li><li>Niveaux 1 à 3 : seule la <b>forme</b> compte. Dès le niveau 4 : forme <b>et couleur</b>.</li><li>Chaque série augmente les points. Une erreur ou une cible trop lente remet la série à zéro.</li><li><b>Classique :</b> trois vies. <b>Rush :</b> 60 secondes et −2 secondes par erreur. <b>Détente :</b> aucune vie perdue.</li><li>À partir du niveau 5, les formes se déplacent doucement. Le mode « réduire les animations » de ton appareil les garde fixes.</li></ul><p><b>Clavier :</b> Tab pour parcourir les formes · Entrée/Espace pour choisir · P ou Échap pour pause.</p><div class="acts"><button id="helpModes">Modes</button><button class="primary" id="closeHelp">${wasPlaying ? 'Reprendre' : 'Compris'}</button></div>`;
    $('#helpModes').onclick = showMenu;
    $('#closeHelp').onclick = () => {
      if (!wasPlaying) {
        showMenu();
        return;
      }
      overlay.classList.add('hide');
      paused = false;
      lastFrame = 0;
      hud();
      raf = win.requestAnimationFrame(frame);
    };
  }

  function togglePause(auto = false) {
    if (!running) return;
    paused = !paused;
    lastFrame = 0;
    if (paused) {
      win.cancelAnimationFrame(raf);
      overlay.classList.remove('hide');
      modal.innerHTML = `<div class="ey">${auto ? 'Pause automatique' : 'Pause'}</div><h2>Le studio est figé</h2><p>Le chrono et les formes sont arrêtés. Reprends quand tu veux.</p><div class="acts"><button id="pauseMenu">Modes</button><button class="primary" id="resume">Reprendre</button></div>`;
      $('#pauseMenu').onclick = showMenu;
      $('#resume').onclick = () => {
        overlay.classList.add('hide');
        paused = false;
        lastFrame = 0;
        hud();
        raf = win.requestAnimationFrame(frame);
      };
    } else {
      overlay.classList.add('hide');
      raf = win.requestAnimationFrame(frame);
    }
    hud();
  }

  board.addEventListener('click', (event) => {
    const button = event.target.closest('[data-index]');
    if (!button) return;
    choose(Number(button.dataset.index), button);
  });

  $('#pause').onclick = () => togglePause(false);
  $('#restart').onclick = () => start(mode);
  $('#menuBtn').onclick = showMenu;
  $('#helpTop').onclick = () => showHelp(running && !paused);
  $('#sound').onclick = () => {
    soundOn = !soundOn;
    audio.set(soundOn);
    persistSettings();
    hud();
  };
  $('#vibration').onclick = () => {
    vibrationOn = !vibrationOn;
    persistSettings();
    hud();
  };

  doc.addEventListener('keydown', (event) => {
    if ((event.key === 'p' || event.key === 'P' || event.key === 'Escape') && running) {
      event.preventDefault();
      togglePause(false);
      return;
    }
    if (!running || paused) return;
    const tag = event.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if ((event.key === ' ' || event.key === 'Enter') && event.target?.matches?.('[data-index]')) {
      event.preventDefault();
      choose(Number(event.target.dataset.index), event.target);
    }
  });

  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden && running && !paused) togglePause(true);
  });

  try {
    const media = win.matchMedia?.('(prefers-reduced-motion: reduce)');
    media?.addEventListener?.('change', (event) => { reducedMotion = event.matches; });
  } catch { /* MediaQueryList ancien */ }

  hud();
  showMenu();
}
