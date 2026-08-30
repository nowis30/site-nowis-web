const STORE = 'nowis:fruit-slicer:';
const MODES = {
  zen: { name: 'Zen', desc: '90 s · aucune vie perdue · presque aucune bombe', duration: 90, lives: 5, spawn: 760, max: 7, bomb: 0.025, miss: false, mult: 0.8 },
  classic: { name: 'Classique', desc: '75 s · 3 vies · bombes progressives', duration: 75, lives: 3, spawn: 610, max: 8, bomb: 0.075, miss: true, mult: 1 },
  expert: { name: 'Expert', desc: '60 s · 3 vies · rythme rapide · plus de bombes', duration: 60, lives: 3, spawn: 475, max: 10, bomb: 0.12, miss: true, mult: 1.35 },
};
const FRUITS = [
  { id: 'apple', name: 'pomme', color: '#ef5350', accent: '#ffd4cf', points: 10 },
  { id: 'orange', name: 'orange', color: '#ff9f43', accent: '#ffe1b2', points: 12 },
  { id: 'kiwi', name: 'kiwi', color: '#8bc34a', accent: '#d7f5a6', points: 14 },
  { id: 'berry', name: 'baie', color: '#9c6ade', accent: '#e5d3ff', points: 16 },
  { id: 'melon', name: 'melon', color: '#36c98f', accent: '#c8ffe7', points: 18 },
];
const GOLD = { id: 'gold', name: 'fruit doré', color: '#f6c85f', accent: '#fff2b2', points: 50 };
const BOMB = { id: 'bomb', name: 'bombe', color: '#27313a', accent: '#ff766c', points: -35 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const levelFor = (slices) => 1 + Math.floor(slices / 12);
const spawnFor = (mode, level) => Math.max(mode === 'expert' ? 250 : mode === 'classic' ? 315 : 420, MODES[mode].spawn - (level - 1) * 28);
const scoreFor = (points, combo, mode) => Math.round(points * (1 + Math.min(2.5, Math.floor(Math.max(0, combo - 1) / 3) * 0.25)) * MODES[mode].mult);
const fmt = (value) => Math.max(0, Math.round(value)).toLocaleString('fr-CA');
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

function chooseTarget(mode, level, random = Math.random) {
  if (random() < Math.min(0.055, 0.014 + level * 0.0028)) return GOLD;
  if (random() < Math.min(0.22, MODES[mode].bomb + Math.max(0, level - 1) * 0.006)) return BOMB;
  return FRUITS[Math.floor(random() * FRUITS.length) % FRUITS.length];
}

function segmentCircle(ax, ay, bx, by, cx, cy, radius) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(cx - ax, cy - ay) <= radius;
  const t = clamp(((cx - ax) * dx + (cy - ay) * dy) / lengthSq, 0, 1);
  const px = ax + dx * t;
  const py = ay + dy * t;
  return Math.hypot(cx - px, cy - py) <= radius;
}

function makeAudio(win) {
  let context;
  let enabled = true;
  const tone = (frequency, duration = 0.06, type = 'sine', gain = 0.025, delay = 0) => {
    if (!enabled) return;
    try {
      context ??= new (win.AudioContext || win.webkitAudioContext)();
      if (context.state === 'suspended') context.resume();
      const start = context.currentTime + delay;
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      volume.gain.setValueAtTime(gain, start);
      volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(volume).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
    } catch {}
  };
  return {
    slice(combo) {
      tone(390 + Math.min(500, combo * 18), 0.045, 'triangle', 0.025);
      tone(620 + Math.min(440, combo * 10), 0.055, 'sine', 0.016, 0.02);
    },
    gold() {
      [659, 831, 1047].forEach((frequency, index) => tone(frequency, 0.09, 'triangle', 0.026, index * 0.05));
    },
    bomb() {
      tone(95, 0.22, 'sawtooth', 0.035);
      tone(62, 0.26, 'square', 0.02, 0.04);
    },
    miss() {
      tone(185, 0.08, 'triangle', 0.015);
    },
    level() {
      [440, 554, 659].forEach((frequency, index) => tone(frequency, 0.075, 'triangle', 0.02, index * 0.045));
    },
    end() {
      [523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, 0.09, 'triangle', 0.022, index * 0.06));
    },
    set(value) {
      enabled = value;
    },
  };
}

function vibrate(win, pattern, enabled) {
  if (!enabled) return;
  try {
    win.navigator?.vibrate?.(pattern);
  } catch {}
}

export function upgradeFruitSlicer(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisFruitSlicerPro === 'true') return;
  root.dataset.nowisFruitSlicerPro = 'true';
  root.lang = 'fr';
  doc.title = 'Tranche-fruits NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#07131b;color:#fff8e8;font-family:Inter,ui-rounded,system-ui,sans-serif}body{min-height:100dvh;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}button{font:inherit}.g{min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:7px;padding:max(7px,env(safe-area-inset-top)) max(7px,env(safe-area-inset-right)) max(9px,env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));background:radial-gradient(circle at 10% 2%,#ef6f5d20,transparent 30%),radial-gradient(circle at 92% 5%,#f4ca6420,transparent 28%),linear-gradient(145deg,#07131b,#102833 58%,#09161f)}.top,.hud,.board,.status,.ctrl{width:min(100%,920px)}.top{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand small{display:block;color:#f2a99a;font-size:9px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}.brand h1{margin:2px 0;font-size:clamp(24px,7vw,39px);line-height:.94;letter-spacing:-.05em;color:#fff2d6}.tools{display:flex;gap:5px}.badge,.btn,.mode,.modal button{min-height:44px;border:1px solid #ffe1ad30;border-radius:14px;background:#102733;color:#fff5df;font-weight:900}.badge{display:flex;align-items:center;padding:0 10px;font-size:10px}.btn{padding:6px 10px;cursor:pointer;touch-action:manipulation}.btn:focus-visible,.mode:focus-visible,.modal button:focus-visible,.board:focus-visible{outline:3px solid #8ee8d2;outline-offset:3px}.hud{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.stat{text-align:center;padding:6px 3px;border:1px solid #ffe7bc1c;border-radius:12px;background:#0b1b24cc}.stat span{display:block;color:#9ebbc4;font-size:8px;font-weight:900;text-transform:uppercase}.stat strong{display:block;color:#fff4d8;font-size:clamp(14px,4vw,20px)}.board{position:relative;flex:1;min-height:250px;overflow:hidden;border-radius:28px;border:1px solid #f0c77e4c;background:linear-gradient(180deg,#142f3d,#0b202c 63%,#07151e);box-shadow:0 26px 75px #000b,inset 0 1px #fff2;touch-action:none;user-select:none}.board:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,#fff0 0 34px,#ffffff05 35px 36px),radial-gradient(circle at 18% 18%,#f6ca6224,transparent 22%),radial-gradient(circle at 85% 15%,#ed6d5d1d,transparent 24%);pointer-events:none}.board:after{content:"";position:absolute;left:0;right:0;bottom:0;height:20%;background:linear-gradient(180deg,transparent,#02080db8);pointer-events:none}.board canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}.status{min-height:34px;display:grid;place-items:center;padding:6px 10px;border:1px solid #ffe4b71c;border-radius:12px;background:#0a1b24c7;color:#a9c0c5;text-align:center;font-size:11px;font-weight:800}.status strong{color:#ffd57b}.ctrl{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center}.ctrl .tools{display:grid;grid-template-columns:repeat(4,1fr)}.hint{color:#86a4ad;font-size:9px;font-weight:800}.ov{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:18px;background:#040b10e8;backdrop-filter:blur(13px)}.ov.hide{display:none}.modal{width:min(100%,560px);max-height:90dvh;overflow:auto;padding:21px;border:1px solid #f2cb8145;border-radius:26px;background:linear-gradient(155deg,#0f2530,#163744 62%,#2d2920);box-shadow:0 32px 90px #000d}.ey{color:#f2a18f;font-size:9px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}.modal h2{margin:4px 0;font-size:clamp(27px,8vw,39px);color:#fff0cd}.modal p{color:#b7c8c9;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{text-align:left;padding:12px;cursor:pointer}.mode strong,.mode span{display:block}.mode span{margin-top:3px;color:#9bb0b2;font-size:11px}.mode.on{border-color:#f3c66d;background:#6f56273f}.acts{display:grid;grid-template-columns:1fr 1fr;gap:7px}.modal button{padding:10px;cursor:pointer}.primary{background:#b35d4d!important}.cards{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:12px 0}.cards div{padding:10px;border-radius:12px;background:#091820;border:1px solid #fff1}.cards b{display:block;color:#ffd786;font-size:11px}.cards span{color:#9eb0b1;font-size:10px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@media(max-width:650px){.hud{grid-template-columns:repeat(3,1fr)}.stat:nth-child(n+4){display:none}.brand h1{font-size:27px}.ctrl{grid-template-columns:1fr}.hint{display:none}.board{min-height:270px}}@media(orientation:landscape) and (max-height:600px){.g{gap:4px}.brand h1{font-size:23px}.brand small{display:none}.hud{grid-template-columns:repeat(6,1fr)}.hud .stat:nth-child(n){display:block;padding:3px}.board{min-height:150px}.status{min-height:28px;padding:3px}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  doc.head.appendChild(style);
  doc.body.innerHTML = `<main class="g"><header class="top"><div class="brand"><small>Marché nocturne NOWIS</small><h1>Tranche-fruits</h1></div><div class="tools"><span class="badge" id="mb">Classique</span><button class="btn" id="help" aria-label="Aide">?</button></div></header><section class="hud"><div class="stat"><span>Score</span><strong id="sc">0</strong></div><div class="stat"><span>Record</span><strong id="rec">0</strong></div><div class="stat"><span>Temps</span><strong id="tm">75</strong></div><div class="stat"><span>Niveau</span><strong id="lv">1</strong></div><div class="stat"><span>Série</span><strong id="co">0</strong></div><div class="stat"><span>Vies</span><strong id="li">♥♥♥</strong></div></section><section class="board" id="board" tabindex="0" role="application" aria-label="Zone de tranche. Glisse sur les fruits. Au clavier, déplace le viseur avec les flèches et tranche avec Entrée."><canvas id="cv"></canvas></section><div class="status" id="st" role="status" aria-live="polite">Choisis un mode pour commencer.</div><section class="ctrl"><div class="tools"><button class="btn" id="pause">Pause</button><button class="btn" id="replay">Rejouer</button><button class="btn" id="snd" aria-pressed="true">Son ✓</button><button class="btn" id="hap" aria-pressed="true">Vibre ✓</button></div><div class="hint"><b>Glisser</b> pour trancher · Flèches + Entrée · P pause</div></section></main><div class="ov" id="ov"><div class="modal" id="modal" role="dialog" aria-modal="true"></div></div><div class="sr" id="ann" aria-live="assertive"></div>`;

  const $ = (selector) => doc.querySelector(selector);
  const board = $('#board');
  const canvas = $('#cv');
  const ctx = canvas.getContext('2d');
  const overlay = $('#ov');
  const modal = $('#modal');
  const audio = makeAudio(win);
  const reduced = win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const settings = load(win.localStorage, STORE + 'settings', { mode: 'classic', sound: true, haptic: true });
  let mode = MODES[settings.mode] ? settings.mode : 'classic';
  let records = load(win.localStorage, STORE + 'records', { zen: 0, classic: 0, expert: 0 });
  let stats = load(win.localStorage, STORE + 'stats', { games: 0, slices: 0, bestCombo: 0, bestLevel: 1 });
  let soundOn = settings.sound !== false;
  let hapticOn = settings.haptic !== false;
  let running = false;
  let paused = false;
  let ended = false;
  let score = 0;
  let slices = 0;
  let combo = 0;
  let maxCombo = 0;
  let level = 1;
  let lives = 3;
  let time = 75;
  let objects = [];
  let particles = [];
  let trail = [];
  let width = 1;
  let height = 1;
  let dpr = 1;
  let last = 0;
  let spawnClock = 0;
  let frame = 0;
  let pointerActive = false;
  let pointerId = null;
  let lastPoint = null;
  let reticle = { x: 0.5, y: 0.55, visible: false };
  audio.set(soundOn);

  const persistSettings = () => save(win.localStorage, STORE + 'settings', { mode, sound: soundOn, haptic: hapticOn });
  const announce = (text) => {
    $('#ann').textContent = '';
    win.setTimeout(() => {
      $('#ann').textContent = text;
    }, 20);
  };
  const status = (text) => {
    $('#st').innerHTML = text;
  };
  const updateHud = () => {
    $('#sc').textContent = fmt(score);
    $('#rec').textContent = fmt(Math.max(records[mode] || 0, score));
    $('#tm').textContent = Math.max(0, Math.ceil(time));
    $('#lv').textContent = String(level);
    $('#co').textContent = combo ? '×' + combo : '0';
    $('#li').textContent = '♥'.repeat(Math.max(0, lives)) || '—';
    $('#mb').textContent = MODES[mode].name;
    $('#pause').textContent = paused ? 'Reprendre' : 'Pause';
    $('#snd').textContent = soundOn ? 'Son ✓' : 'Son —';
    $('#hap').textContent = hapticOn ? 'Vibre ✓' : 'Vibre —';
    $('#snd').setAttribute('aria-pressed', String(soundOn));
    $('#hap').setAttribute('aria-pressed', String(hapticOn));
  };

  function resize() {
    const rect = board.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(2, Math.max(1, win.devicePixelRatio || 1));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function randomObject() {
    const target = chooseTarget(mode, level);
    const radius = clamp(Math.min(width, height) * (target.id === 'bomb' ? 0.055 : 0.06), 24, 38);
    const edgePadding = radius + 8;
    const x = edgePadding + Math.random() * Math.max(1, width - edgePadding * 2);
    const speedScale = 1 + Math.min(0.65, (level - 1) * 0.045) + (mode === 'expert' ? 0.13 : 0);
    const vy = -(height * (0.82 + Math.random() * 0.24) + 160) * speedScale;
    const vx = (Math.random() - 0.5) * width * 0.5 * speedScale;
    return {
      id: Math.random().toString(36).slice(2),
      target,
      x,
      y: height + radius + 8,
      vx,
      vy,
      radius,
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 3.4,
      sliced: false,
      missed: false,
    };
  }

  function addParticles(object) {
    if (reduced) return;
    const count = object.target.id === 'bomb' ? 12 : object.target.id === 'gold' ? 16 : 9;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.35;
      const speed = 45 + Math.random() * 130;
      particles.push({
        x: object.x,
        y: object.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 0.45 + Math.random() * 0.28,
        age: 0,
        color: object.target.id === 'bomb' ? '#ff766c' : object.target.accent,
      });
    }
  }

  function applySlice(object) {
    if (object.sliced || ended || paused || !running) return;
    object.sliced = true;
    addParticles(object);
    if (object.target.id === 'bomb') {
      combo = 0;
      score = Math.max(0, score + BOMB.points);
      if (mode !== 'zen') lives -= 1;
      audio.bomb();
      vibrate(win, [55, 35, 70], hapticOn);
      status('<strong>Boum !</strong> Évite les bombes.');
      announce('Bombe touchée.');
      if (lives <= 0) finish('plus de vies');
      updateHud();
      return;
    }
    slices += 1;
    combo += 1;
    maxCombo = Math.max(maxCombo, combo);
    const gained = scoreFor(object.target.points, combo, mode);
    score += gained;
    const nextLevel = levelFor(slices);
    if (object.target.id === 'gold') {
      time += mode === 'expert' ? 2 : 3;
      audio.gold();
      vibrate(win, [18, 24, 18], hapticOn);
      status(`<strong>Fruit doré !</strong> +${gained} points · temps bonus`);
    } else {
      audio.slice(combo);
      vibrate(win, 12, hapticOn);
      status(`${object.target.name} · <strong>+${gained}</strong>${combo >= 3 ? ` · série ×${combo}` : ''}`);
    }
    if (nextLevel > level) {
      level = nextLevel;
      audio.level();
      announce('Niveau ' + level + '. Le rythme accélère.');
    }
    updateHud();
  }

  function missObject(object) {
    if (object.missed || object.sliced || object.target.id === 'bomb') return;
    object.missed = true;
    combo = 0;
    if (MODES[mode].miss) {
      lives -= 1;
      audio.miss();
      vibrate(win, 18, hapticOn);
      status(`<strong>${object.target.name} manqué.</strong> ${Math.max(0, lives)} vie${lives === 1 ? '' : 's'} restante${lives === 1 ? '' : 's'}.`);
      announce(object.target.name + ' manqué.');
      if (lives <= 0) finish('plus de vies');
    }
    updateHud();
  }

  function sliceSegment(from, to) {
    if (!from || !to || !running || paused || ended) return;
    objects.forEach((object) => {
      if (!object.sliced && segmentCircle(from.x, from.y, to.x, to.y, object.x, object.y, object.radius + 8)) {
        applySlice(object);
      }
    });
    trail.push({ ax: from.x, ay: from.y, bx: to.x, by: to.y, age: 0 });
    if (trail.length > 14) trail.splice(0, trail.length - 14);
  }

  function slicePoint(x, y) {
    if (!running || paused || ended) return;
    const hit = objects
      .filter((object) => !object.sliced && Math.hypot(object.x - x, object.y - y) <= object.radius + 14)
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (hit) applySlice(hit);
  }

  function drawFruit(object) {
    ctx.save();
    ctx.translate(object.x, object.y);
    ctx.rotate(object.rotation);
    const radius = object.radius;
    ctx.shadowColor = '#0009';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = object.target.color;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = object.target.accent;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(-radius * 0.28, -radius * 0.28, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (object.target.id === 'bomb') {
      ctx.strokeStyle = '#e8c274';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(radius * 0.28, -radius * 0.65);
      ctx.quadraticCurveTo(radius * 0.6, -radius * 1.15, radius * 0.82, -radius * 0.92);
      ctx.stroke();
      ctx.fillStyle = '#ff766c';
      ctx.beginPath();
      ctx.arc(radius * 0.84, -radius * 0.94, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#214d37';
      ctx.fillRect(-2, -radius * 0.98, 4, radius * 0.3);
      ctx.fillStyle = '#56a665';
      ctx.beginPath();
      ctx.ellipse(radius * 0.18, -radius * 0.82, radius * 0.28, radius * 0.13, -0.45, 0, Math.PI * 2);
      ctx.fill();
      if (object.target.id === 'gold') {
        ctx.strokeStyle = '#fff2b2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = '#f7d89c';
    ctx.lineWidth = 1;
    for (let x = 24; x < width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - height * 0.24, height);
      ctx.stroke();
    }
    ctx.restore();
    objects.forEach((object) => {
      if (!object.sliced) drawFruit(object);
    });
    particles.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - particle.age / particle.life);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    trail.forEach((line) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - line.age / 0.22);
      ctx.strokeStyle = '#fff2c7';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#ef7f6b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(line.ax, line.ay);
      ctx.lineTo(line.bx, line.by);
      ctx.stroke();
      ctx.restore();
    });
    if (reticle.visible) {
      const x = reticle.x * width;
      const y = reticle.y * height;
      ctx.save();
      ctx.strokeStyle = '#8ee8d2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.moveTo(x - 27, y);
      ctx.lineTo(x - 10, y);
      ctx.moveTo(x + 10, y);
      ctx.lineTo(x + 27, y);
      ctx.moveTo(x, y - 27);
      ctx.lineTo(x, y - 10);
      ctx.moveTo(x, y + 10);
      ctx.lineTo(x, y + 27);
      ctx.stroke();
      ctx.restore();
    }
    if (paused && running) {
      ctx.save();
      ctx.fillStyle = '#061018cc';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff1d1';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${clamp(width * 0.055, 25, 42)}px system-ui`;
      ctx.fillText('PAUSE', width / 2, height / 2);
      ctx.restore();
    }
  }

  function tick(timestamp) {
    if (!running || ended) return;
    if (!last) last = timestamp;
    const delta = Math.min(0.035, Math.max(0, (timestamp - last) / 1000));
    last = timestamp;
    if (!paused) {
      time -= delta;
      spawnClock += delta * 1000;
      const interval = spawnFor(mode, level);
      if (spawnClock >= interval && objects.filter((object) => !object.sliced).length < MODES[mode].max) {
        spawnClock = 0;
        const count = Math.random() < Math.min(0.42, 0.14 + level * 0.025) ? 2 : 1;
        for (let index = 0; index < count; index += 1) objects.push(randomObject());
      }
      const gravity = height * 1.42 + 390;
      objects.forEach((object) => {
        if (object.sliced) return;
        object.vy += gravity * delta;
        object.x += object.vx * delta;
        object.y += object.vy * delta;
        object.rotation += object.vr * delta;
        if (object.x < object.radius && object.vx < 0) object.vx *= -0.8;
        if (object.x > width - object.radius && object.vx > 0) object.vx *= -0.8;
        if (object.y > height + object.radius + 20 && object.vy > 0) missObject(object);
      });
      objects = objects.filter((object) => !object.sliced && !object.missed && object.y < height + object.radius + 60);
      particles.forEach((particle) => {
        particle.age += delta;
        particle.vy += 420 * delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
      });
      particles = particles.filter((particle) => particle.age < particle.life);
      trail.forEach((line) => {
        line.age += delta;
      });
      trail = trail.filter((line) => line.age < 0.22);
      if (time <= 0) {
        time = 0;
        finish('temps écoulé');
      }
      updateHud();
    }
    draw();
    frame = win.requestAnimationFrame(tick);
  }

  function finish(reason = 'temps écoulé') {
    if (ended) return;
    ended = true;
    running = false;
    paused = false;
    win.cancelAnimationFrame(frame);
    const previous = records[mode] || 0;
    records[mode] = Math.max(previous, score);
    stats.games += 1;
    stats.slices += slices;
    stats.bestCombo = Math.max(stats.bestCombo || 0, maxCombo);
    stats.bestLevel = Math.max(stats.bestLevel || 1, level);
    save(win.localStorage, STORE + 'records', records);
    save(win.localStorage, STORE + 'stats', stats);
    audio.end();
    vibrate(win, [25, 35, 25], hapticOn);
    updateHud();
    overlay.classList.remove('hide');
    modal.innerHTML = `<div class="ey">Fin · ${MODES[mode].name}</div><h2>${fmt(score)} points</h2><p>${reason}. ${score > previous ? '<strong>Nouveau record !</strong>' : `Record : ${fmt(records[mode] || 0)}.`}</p><div class="cards"><div><b>${slices} fruits</b><span>tranchés cette partie</span></div><div><b>Série ×${maxCombo}</b><span>meilleure série</span></div><div><b>Niveau ${level}</b><span>rythme atteint</span></div><div><b>${fmt(records[mode] || 0)}</b><span>record ${MODES[mode].name}</span></div></div><div class="acts"><button id="again" class="primary">Rejouer</button><button id="modes">Changer de mode</button></div>`;
    $('#again').addEventListener('click', start);
    $('#modes').addEventListener('click', showMenu);
    announce('Partie terminée. Score ' + score + ' points.');
  }

  function start() {
    mode = MODES[mode] ? mode : 'classic';
    score = 0;
    slices = 0;
    combo = 0;
    maxCombo = 0;
    level = 1;
    lives = MODES[mode].lives;
    time = MODES[mode].duration;
    objects = [];
    particles = [];
    trail = [];
    running = true;
    paused = false;
    ended = false;
    pointerActive = false;
    pointerId = null;
    lastPoint = null;
    spawnClock = 280;
    last = 0;
    overlay.classList.add('hide');
    resize();
    status('Glisse franchement sur les fruits. <strong>Évite les bombes.</strong>');
    persistSettings();
    updateHud();
    win.cancelAnimationFrame(frame);
    frame = win.requestAnimationFrame(tick);
    board.focus({ preventScroll: true });
  }

  function pause(force) {
    if (!running || ended) return;
    paused = typeof force === 'boolean' ? force : !paused;
    pointerActive = false;
    pointerId = null;
    lastPoint = null;
    last = 0;
    status(paused ? '<strong>Pause.</strong> Appuie sur Reprendre pour continuer.' : 'Reprise. Glisse sur les fruits.');
    updateHud();
    draw();
  }

  function showMenu() {
    if (running && !ended) pause(true);
    overlay.classList.remove('hide');
    modal.innerHTML = `<div class="ey">Marché nocturne NOWIS</div><h2>Tranche-fruits</h2><p>Fais glisser ton doigt ou la souris à travers les fruits. Enchaîne les coupes pour multiplier les points et garde tes vies en évitant les bombes.</p><div class="modes">${Object.entries(MODES).map(([key, config]) => `<button class="mode ${key === mode ? 'on' : ''}" data-mode="${key}"><strong>${config.name}</strong><span>${config.desc}</span></button>`).join('')}</div><div class="cards"><div><b>Fruit doré</b><span>gros bonus + temps</span></div><div><b>Bombe</b><span>pénalité et vie perdue</span></div><div><b>Séries</b><span>multiplicateur tous les 3 fruits</span></div><div><b>Clavier</b><span>flèches + Entrée avec viseur</span></div></div><button id="play" class="primary" style="width:100%">Jouer</button>`;
    modal.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        mode = button.dataset.mode;
        modal.querySelectorAll('[data-mode]').forEach((item) => item.classList.toggle('on', item.dataset.mode === mode));
        updateHud();
        persistSettings();
      });
    });
    $('#play').addEventListener('click', start);
  }

  function showHelp() {
    const wasRunning = running && !ended;
    if (wasRunning) pause(true);
    overlay.classList.remove('hide');
    modal.innerHTML = `<div class="ey">Aide</div><h2>Comment trancher</h2><p><strong>Au téléphone :</strong> glisse directement dans la zone de jeu. Tu peux traverser plusieurs fruits en un seul geste.</p><p><strong>À la souris :</strong> maintiens le bouton et balaie les fruits.</p><p><strong>Au clavier :</strong> place le viseur avec les flèches ou WASD, puis appuie sur Entrée ou Espace. P ou Échap met en pause.</p><div class="cards"><div><b>Fruit normal</b><span>10 à 18 points avant multiplicateur</span></div><div><b>Fruit doré</b><span>50 points + secondes bonus</span></div><div><b>Fruit manqué</b><span>coûte une vie en Classique/Expert</span></div><div><b>Bombe</b><span>casse la série et coûte 35 points</span></div></div><button id="closeHelp" class="primary" style="width:100%">${wasRunning ? 'Reprendre' : 'Retour'}</button>`;
    $('#closeHelp').addEventListener('click', () => {
      overlay.classList.add('hide');
      if (wasRunning) pause(false);
      else showMenu();
    });
  }

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
    };
  }

  board.addEventListener('pointerdown', (event) => {
    if (!running || paused || ended) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    pointerActive = true;
    pointerId = event.pointerId;
    lastPoint = pointFromEvent(event);
    reticle.visible = false;
    try {
      board.setPointerCapture(event.pointerId);
    } catch {}
  });
  board.addEventListener('pointermove', (event) => {
    if (!pointerActive || event.pointerId !== pointerId || !running || paused || ended) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    sliceSegment(lastPoint, point);
    lastPoint = point;
  });
  const endPointer = (event) => {
    if (!pointerActive || (pointerId !== null && event.pointerId !== pointerId)) return;
    if (running && !paused && !ended && lastPoint) {
      const point = pointFromEvent(event);
      sliceSegment(lastPoint, point);
      if (Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) < 8) slicePoint(point.x, point.y);
    }
    pointerActive = false;
    pointerId = null;
    lastPoint = null;
  };
  board.addEventListener('pointerup', endPointer);
  board.addEventListener('pointercancel', () => {
    pointerActive = false;
    pointerId = null;
    lastPoint = null;
  });
  board.addEventListener('contextmenu', (event) => event.preventDefault());

  doc.addEventListener('keydown', (event) => {
    if (event.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    const key = event.key.toLowerCase();
    if (key === 'p' || key === 'escape') {
      event.preventDefault();
      pause();
      return;
    }
    if (!running || paused || ended) return;
    let moved = false;
    const step = event.shiftKey ? 0.08 : 0.045;
    if (key === 'arrowleft' || key === 'a') {
      reticle.x = clamp(reticle.x - step, 0.03, 0.97);
      moved = true;
    } else if (key === 'arrowright' || key === 'd') {
      reticle.x = clamp(reticle.x + step, 0.03, 0.97);
      moved = true;
    } else if (key === 'arrowup' || key === 'w') {
      reticle.y = clamp(reticle.y - step, 0.04, 0.96);
      moved = true;
    } else if (key === 'arrowdown' || key === 's') {
      reticle.y = clamp(reticle.y + step, 0.04, 0.96);
      moved = true;
    } else if (key === 'enter' || key === ' ') {
      event.preventDefault();
      reticle.visible = true;
      slicePoint(reticle.x * width, reticle.y * height);
      draw();
      return;
    }
    if (moved) {
      event.preventDefault();
      reticle.visible = true;
      draw();
    }
  });

  $('#pause').addEventListener('click', () => pause());
  $('#replay').addEventListener('click', start);
  $('#help').addEventListener('click', showHelp);
  $('#snd').addEventListener('click', () => {
    soundOn = !soundOn;
    audio.set(soundOn);
    persistSettings();
    updateHud();
  });
  $('#hap').addEventListener('click', () => {
    hapticOn = !hapticOn;
    persistSettings();
    updateHud();
  });
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden && running && !paused && !ended) pause(true);
  });
  win.addEventListener('blur', () => {
    if (running && !paused && !ended) pause(true);
  });
  win.addEventListener('resize', () => {
    resize();
    draw();
  });

  resize();
  updateHud();
  draw();
  showMenu();
}
