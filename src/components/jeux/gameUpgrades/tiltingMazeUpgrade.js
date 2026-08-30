const STORE = 'nowis:tilting-maze:';
const SIZE = 640;
const TAU = Math.PI * 2;
const MODES = {
  relax: { name: 'Détente', desc: 'Parcours zen · aucune limite de temps · peu de pièges', lives: 5, holes: 0, grid: 6, accel: 4.7, friction: 0.9, mult: 0.85, limit: 0 },
  classic: { name: 'Classique', desc: 'Labyrinthes progressifs · pièges · 3 vies', lives: 3, holes: 1, grid: 7, accel: 5.6, friction: 0.88, mult: 1, limit: 0 },
  chrono: { name: 'Chrono', desc: '75 secondes · rythme soutenu · bonus de temps', lives: 3, holes: 2, grid: 7, accel: 6.2, friction: 0.87, mult: 1.25, limit: 75 },
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const keyOf = (x, y) => `${x},${y}`;
const load = (storage, key, fallback) => { try { return { ...fallback, ...(JSON.parse(storage.getItem(key) || 'null') || {}) }; } catch { return { ...fallback }; } };
const save = (storage, key, value) => { try { storage.setItem(key, JSON.stringify(value)); } catch {} };

function buildMaze(n) {
  const cells = Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => ({ x, y, t: true, r: true, b: true, l: true, seen: false })));
  const stack = [cells[0][0]];
  cells[0][0].seen = true;
  while (stack.length) {
    const cell = stack[stack.length - 1];
    const options = [];
    if (cell.y > 0 && !cells[cell.y - 1][cell.x].seen) options.push(['t', 'b', cells[cell.y - 1][cell.x]]);
    if (cell.x < n - 1 && !cells[cell.y][cell.x + 1].seen) options.push(['r', 'l', cells[cell.y][cell.x + 1]]);
    if (cell.y < n - 1 && !cells[cell.y + 1][cell.x].seen) options.push(['b', 't', cells[cell.y + 1][cell.x]]);
    if (cell.x > 0 && !cells[cell.y][cell.x - 1].seen) options.push(['l', 'r', cells[cell.y][cell.x - 1]]);
    if (!options.length) { stack.pop(); continue; }
    const [a, b, next] = pick(options);
    cell[a] = false;
    next[b] = false;
    next.seen = true;
    stack.push(next);
  }
  cells.flat().forEach((cell) => { cell.seen = false; });
  return cells;
}

function solvePath(cells) {
  const n = cells.length;
  const queue = [[0, 0]];
  const previous = new Map([[keyOf(0, 0), null]]);
  for (let i = 0; i < queue.length; i += 1) {
    const [x, y] = queue[i];
    if (x === n - 1 && y === n - 1) break;
    const cell = cells[y][x];
    const next = [];
    if (!cell.t) next.push([x, y - 1]);
    if (!cell.r) next.push([x + 1, y]);
    if (!cell.b) next.push([x, y + 1]);
    if (!cell.l) next.push([x - 1, y]);
    for (const point of next) {
      const k = keyOf(point[0], point[1]);
      if (!previous.has(k)) { previous.set(k, [x, y]); queue.push(point); }
    }
  }
  const path = [];
  let current = [n - 1, n - 1];
  while (current) {
    path.push(current);
    current = previous.get(keyOf(current[0], current[1]));
  }
  return path.reverse();
}

function starPath(ctx, x, y, outer, inner, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 ? inner : outer;
    const angle = -Math.PI / 2 + i * Math.PI / points;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function upgradeTiltingMaze(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisTiltingMazePro === 'true') return;
  root.dataset.nowisTiltingMazePro = 'true';
  root.lang = 'fr';
  doc.title = 'Labyrinthe incliné NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#071311;color:#f7f4e9;font-family:Inter,ui-rounded,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{min-height:100dvh;overflow:hidden;overscroll-behavior:none;user-select:none;-webkit-tap-highlight-color:transparent}button{font:inherit}.maze{min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:7px;padding:max(7px,env(safe-area-inset-top)) max(7px,env(safe-area-inset-right)) max(9px,env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));background:radial-gradient(circle at 12% 0,#3fb7a126,transparent 30%),radial-gradient(circle at 92% 10%,#c7974d21,transparent 28%),linear-gradient(155deg,#071311,#10241f 52%,#161b18)}.head,.hud,.play,.message,.tools{width:min(100%,820px)}.head{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand small{display:block;color:#7dd3c4;font-size:9px;font-weight:950;letter-spacing:.18em;text-transform:uppercase}.brand h1{margin:2px 0 0;font-size:clamp(24px,7vw,39px);line-height:.94;letter-spacing:-.05em;color:#fff7df;text-shadow:0 4px 30px #0008}.right{display:flex;align-items:center;gap:6px}.chip{padding:7px 10px;border-radius:999px;background:#0b1d18dd;border:1px solid #7dd3c43f;color:#d8fff7;font-size:10px;font-weight:900}.b,.mode,.modal button{min-height:44px;border:1px solid #f0e5cb29;border-radius:14px;background:#0b1d18e8;color:#f8f3e7;font-weight:900;cursor:pointer;touch-action:manipulation}.b:active,.mode:active,.modal button:active{transform:scale(.97)}.b:focus-visible,.mode:focus-visible,.modal button:focus-visible,canvas:focus-visible,.pad:focus-visible{outline:3px solid #f4cc7b;outline-offset:2px}.icon{min-width:44px}.hud{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.stat{text-align:center;padding:6px 2px;border-radius:12px;background:#0b1d18b8;border:1px solid #c9b98c20}.stat span{display:block;color:#a6b8ad;font-size:8px;font-weight:900;text-transform:uppercase;white-space:nowrap}.stat strong{display:block;font-size:clamp(14px,4vw,20px);font-variant-numeric:tabular-nums}.play{display:grid;grid-template-columns:minmax(210px,1fr) 148px;gap:9px;min-height:0;align-items:center;justify-content:center}.stage{position:relative;width:min(100%,590px);aspect-ratio:1;border-radius:24px;padding:7px;background:linear-gradient(145deg,#745c32,#d0ab62 22%,#775e34 46%,#302719 74%,#b98d4a);box-shadow:0 28px 80px #0009,0 0 0 1px #f5d99535;overflow:hidden}.stage::before{content:"";position:absolute;inset:7px;border-radius:18px;pointer-events:none;box-shadow:inset 0 0 42px #000a,inset 0 1px #fff4}.stage canvas{position:relative;display:block;width:100%;height:100%;border-radius:18px;background:#152a23;touch-action:none}.tiltMark{position:absolute;right:15px;bottom:14px;width:44px;height:44px;border-radius:50%;border:1px solid #f4cc7b55;background:#071311b8;pointer-events:none}.tiltDot{position:absolute;left:50%;top:50%;width:9px;height:9px;border-radius:50%;background:#f5d788;box-shadow:0 0 13px #f5d788;transform:translate(calc(-50% + var(--tx,0px)),calc(-50% + var(--ty,0px)))}.side{display:grid;gap:8px;align-content:center}.card{padding:11px 8px;border-radius:18px;background:#0b1d18c7;border:1px solid #c9b98c22;text-align:center}.card span{display:block;color:#9eb2a7;font-size:8px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}.card strong{display:block;margin-top:3px;color:#f7d68b;font-size:19px}.pad{position:relative;width:132px;height:132px;margin:auto;border-radius:50%;border:1px solid #d9c99c38;background:radial-gradient(circle,#17372e 0 28%,#0b211b 29% 57%,#091a16 58%);box-shadow:inset 0 0 28px #0008,0 14px 28px #0005;touch-action:none}.pad::before,.pad::after{content:"";position:absolute;background:#d5c79a24}.pad::before{left:15%;right:15%;top:50%;height:1px}.pad::after{top:15%;bottom:15%;left:50%;width:1px}.knob{position:absolute;left:50%;top:50%;width:46px;height:46px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 35% 30%,#fff4c9,#d6ae62 40%,#6e542c 78%);box-shadow:0 9px 18px #0008,inset 0 1px #fff9;pointer-events:none}.padLabel{margin-top:6px;color:#a6b8ad;font-size:9px;font-weight:850;line-height:1.25}.dpad{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}.dpad .b{min-height:42px;padding:0;font-size:16px}.dpad .up{grid-column:2}.dpad .left{grid-column:1;grid-row:2}.dpad .down{grid-column:2;grid-row:2}.dpad .right{grid-column:3;grid-row:2}.message{min-height:32px;display:flex;align-items:center;justify-content:center;padding:6px 10px;border-radius:12px;background:#0b1d18b8;color:#c8d4cc;text-align:center;font-size:11px;font-weight:800}.message strong{color:#f6d58a}.tools{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.tools .b{min-height:39px;padding:5px;font-size:10px}.tools .b[aria-pressed=false]{color:#70867a}.sensor.on{color:#d8fff7;border-color:#7dd3c46b;background:#15372d}.ov{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:18px;background:#04100ddf;backdrop-filter:blur(14px)}.ov.hide{display:none}.modal{width:min(100%,480px);max-height:90dvh;overflow:auto;padding:21px;border-radius:25px;border:1px solid #d1b36a42;background:linear-gradient(155deg,#0d211c,#172720 57%,#342b1c);box-shadow:0 32px 90px #000b}.eye{color:#8bd7c9;font-size:9px;font-weight:950;letter-spacing:.17em;text-transform:uppercase}.modal h2{margin:4px 0;font-size:clamp(27px,8vw,38px);line-height:1;color:#fff6df}.modal p,.modal li{color:#c8d3cc;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{text-align:left;padding:12px}.mode strong,.mode span{display:block}.mode span{margin-top:3px;color:#9caf9f;font-size:11px}.mode.on{border-color:#e2c17078;background:#e2c17010}.acts{display:grid;grid-template-columns:1fr 1fr;gap:7px}.modal button{padding:10px}.primary{color:#172017!important;border-color:#f8dea1!important;background:linear-gradient(135deg,#87d9c9,#f2d286 55%,#d69b57)!important}.results{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:14px 0}.results div{text-align:center;padding:9px 3px;border-radius:12px;background:#07140f82}.results span{display:block;color:#92a69a;font-size:8px;text-transform:uppercase}.results strong{font-size:18px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
    @media(max-width:650px){.hud{grid-template-columns:repeat(3,1fr)}.stat:nth-child(n+4){display:none}.play{grid-template-columns:minmax(180px,1fr) 105px;gap:6px}.stage{border-radius:19px;padding:5px}.stage canvas{border-radius:14px}.pad{width:96px;height:96px}.knob{width:38px;height:38px}.side{gap:5px}.card{padding:7px 3px}.card strong{font-size:15px}.dpad .b{min-height:38px}.brand h1{font-size:28px}.tools{grid-template-columns:repeat(5,1fr)}.tools .b{font-size:9px;padding:3px}.message{font-size:10px}}
    @media(max-width:390px){.play{grid-template-columns:minmax(165px,1fr) 82px}.pad{width:78px;height:78px}.knob{width:31px;height:31px}.padLabel{font-size:8px}.card span{font-size:7px}.card strong{font-size:13px}.dpad .b{min-width:0;min-height:34px}.tools .b{min-width:0;font-size:8px}.stage{padding:4px}.message{min-height:28px}.hud .stat{padding:4px 2px}}
    @media(max-height:720px){.message{display:none}.head{min-height:38px}.brand h1{font-size:26px}.hud .stat{padding:4px 2px}.stage{max-height:calc(100dvh - 177px);width:auto}.play{flex:1}.tools .b{min-height:34px}.padLabel{display:none}}
    @media(orientation:landscape) and (max-height:540px){.maze{display:grid;grid-template-columns:260px minmax(250px,1fr) 190px;grid-template-rows:auto auto 1fr auto;column-gap:8px;align-items:start}.head{grid-column:1}.hud{grid-column:1;grid-template-columns:repeat(3,1fr)}.play{grid-column:2/4;grid-row:1/5;width:100%;grid-template-columns:minmax(250px,calc(100dvh - 16px)) 155px;justify-content:center}.stage{height:calc(100dvh - 16px);width:auto;max-height:none}.message{display:none}.tools{grid-column:1;grid-row:3;grid-template-columns:repeat(2,1fr);align-self:start}.tools .b{min-height:38px}.pad{width:108px;height:108px}.brand h1{font-size:25px}}
    @media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `<main class="maze"><header class="head"><div class="brand"><small>Table gyroscopique NOWIS</small><h1>Labyrinthe incliné</h1></div><div class="right"><span class="chip" id="modeChip">Classique</span><button class="b icon" id="helpTop" aria-label="Aide">?</button></div></header><section class="hud"><div class="stat"><span>Score</span><strong id="score">0</strong></div><div class="stat"><span>Record</span><strong id="best">0</strong></div><div class="stat"><span>Niveau</span><strong id="level">1</strong></div><div class="stat"><span>Étoiles</span><strong id="stars">0/3</strong></div><div class="stat"><span>Vies</span><strong id="lives">3</strong></div><div class="stat"><span>Temps</span><strong id="time">0:00</strong></div></section><section class="play"><div class="stage"><canvas id="board" width="640" height="640" tabindex="0" aria-label="Labyrinthe. Incline la planche avec le pavé tactile ou utilise les flèches du clavier pour guider la bille vers le portail."></canvas><div class="tiltMark" aria-hidden="true"><span class="tiltDot" id="tiltDot"></span></div></div><aside class="side"><div class="card"><span>Objectif</span><strong id="objective">Portail</strong></div><div class="pad" id="pad" tabindex="0" role="application" aria-label="Pavé d'inclinaison tactile. Glisse dans la direction voulue."><span class="knob" id="knob"></span></div><div class="padLabel">Glisse le levier pour incliner la table</div><div class="dpad" aria-label="Commandes directionnelles"><button class="b up" data-dir="up" aria-label="Incliner vers le haut">▲</button><button class="b left" data-dir="left" aria-label="Incliner à gauche">◀</button><button class="b down" data-dir="down" aria-label="Incliner vers le bas">▼</button><button class="b right" data-dir="right" aria-label="Incliner à droite">▶</button></div></aside></section><div class="message" id="msg">Guide la bille jusqu’au <strong>portail lumineux</strong> et ramasse les étoiles.</div><nav class="tools"><button class="b" id="pause">⏸ Pause</button><button class="b" id="restart">↻ Rejouer</button><button class="b sensor" id="sensor" aria-pressed="false">📱 Inclinaison</button><button class="b" id="sound" aria-pressed="true">🔊 Son</button><button class="b" id="vibe" aria-pressed="true">📳 Vibration</button></nav><div class="sr" id="live" aria-live="assertive"></div></main><div class="ov" id="overlay"><section class="modal" id="modal"></section></div>`;

  const $ = (id) => doc.getElementById(id);
  const canvas = $('board');
  const ctx = canvas.getContext('2d');
  const overlay = $('overlay');
  const modal = $('modal');
  const pad = $('pad');
  const knob = $('knob');
  const tiltDot = $('tiltDot');
  const prefersReduced = win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const storage = win.localStorage;
  const prefs = load(storage, `${STORE}prefs`, { mode: 'classic', sound: true, vibe: true });
  const stats = load(storage, `${STORE}stats`, { best: 0, bestLevel: 1, bestTime: 0, runs: 0, clears: 0, stars: 0 });

  let mode = MODES[prefs.mode] ? prefs.mode : 'classic';
  let maze = [];
  let solution = [];
  let grid = MODES[mode].grid;
  let holes = [];
  let starItems = [];
  let particles = [];
  let ball = { x: 0.5, y: 0.5, vx: 0, vy: 0, r: 0.17 };
  let level = 1;
  let score = 0;
  let lives = MODES[mode].lives;
  let stars = 0;
  let started = false;
  let running = false;
  let paused = false;
  let finished = false;
  let levelStartElapsed = 0;
  let runStartedAt = 0;
  let pausedAt = 0;
  let pausedTotal = 0;
  let lastFrame = 0;
  let controlX = 0;
  let controlY = 0;
  let touchX = 0;
  let touchY = 0;
  let touchActive = false;
  let pointerId = null;
  let keys = new Set();
  let sensorOn = false;
  let sensorX = 0;
  let sensorY = 0;
  let sensorBase = null;
  let sensorListening = false;
  let audio = null;
  let announceTimer = 0;

  function storageSave() {
    prefs.mode = mode;
    save(storage, `${STORE}prefs`, prefs);
    save(storage, `${STORE}stats`, stats);
  }

  function announce(text) {
    $('live').textContent = '';
    win.clearTimeout(announceTimer);
    announceTimer = win.setTimeout(() => { $('live').textContent = text; }, 20);
  }

  function vibrate(pattern = 18) {
    if (!prefs.vibe || !win.navigator?.vibrate) return;
    try { win.navigator.vibrate(pattern); } catch {}
  }

  function tone(kind = 'tap') {
    if (!prefs.sound) return;
    try {
      audio ||= new (win.AudioContext || win.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const now = audio.currentTime;
      const map = { tap: [280, 0.035], wall: [150, 0.025], star: [720, 0.08], goal: [440, 0.16], fall: [95, 0.2], win: [620, 0.22] };
      const [frequency, duration] = map[kind] || map.tap;
      oscillator.type = kind === 'fall' ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      if (kind === 'goal' || kind === 'win') oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.6, now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now); oscillator.stop(now + duration + 0.02);
    } catch {}
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function elapsedSeconds(now = performance.now()) {
    if (!started) return 0;
    const pausedExtra = paused && pausedAt ? now - pausedAt : 0;
    return Math.max(0, (now - runStartedAt - pausedTotal - pausedExtra) / 1000);
  }

  function currentTime(now = performance.now()) {
    const config = MODES[mode];
    const elapsed = elapsedSeconds(now);
    return config.limit ? Math.max(0, config.limit - elapsed) : elapsed;
  }

  function updateHud(now = performance.now()) {
    $('score').textContent = Math.max(0, Math.round(score)).toLocaleString('fr-CA');
    $('best').textContent = Math.max(stats.best, Math.round(score)).toLocaleString('fr-CA');
    $('level').textContent = String(level);
    $('stars').textContent = `${stars}/${starItems.length}`;
    $('lives').textContent = String(lives);
    $('time').textContent = formatTime(currentTime(now));
    $('modeChip').textContent = MODES[mode].name;
    $('objective').textContent = holes.length ? `${holes.length} piège${holes.length > 1 ? 's' : ''}` : 'Portail';
  }

  function neighborsForPath(path) {
    return new Set(path.map(([x, y]) => keyOf(x, y)));
  }

  function makeLevel() {
    const config = MODES[mode];
    grid = clamp(config.grid + Math.floor((level - 1) / 2), config.grid, 11);
    maze = buildMaze(grid);
    solution = solvePath(maze);
    ball = { x: 0.5, y: 0.5, vx: 0, vy: 0, r: grid >= 10 ? 0.15 : 0.17 };
    const pathSet = neighborsForPath(solution);
    const free = [];
    for (let y = 0; y < grid; y += 1) for (let x = 0; x < grid; x += 1) {
      const k = keyOf(x, y);
      if (k !== '0,0' && k !== keyOf(grid - 1, grid - 1) && !pathSet.has(k)) free.push([x, y]);
    }
    holes = [];
    const holeCount = Math.min(free.length, config.holes + Math.floor((level - 1) / 2));
    while (holes.length < holeCount && free.length) {
      const index = Math.floor(Math.random() * free.length);
      const [x, y] = free.splice(index, 1)[0];
      holes.push({ x: x + 0.5, y: y + 0.5, r: 0.21 });
    }
    const candidates = solution.slice(1, -1);
    const wanted = Math.min(3 + Math.floor((level - 1) / 3), 5, candidates.length);
    starItems = [];
    for (let i = 1; i <= wanted; i += 1) {
      const idx = Math.min(candidates.length - 1, Math.floor(i * candidates.length / (wanted + 1)));
      const [x, y] = candidates[idx];
      if (!starItems.some((item) => item.cx === x && item.cy === y)) starItems.push({ cx: x, cy: y, x: x + 0.5, y: y + 0.5, got: false });
    }
    stars = 0;
    levelStartElapsed = elapsedSeconds();
    particles = [];
    $('msg').innerHTML = `Niveau ${level} · trouve le <strong>portail lumineux</strong>${holes.length ? ' et évite les puits.' : '.'}`;
    updateHud();
  }

  function resetRun() {
    const config = MODES[mode];
    level = 1;
    score = 0;
    lives = config.lives;
    started = true;
    running = true;
    paused = false;
    finished = false;
    runStartedAt = performance.now();
    pausedTotal = 0;
    lastFrame = 0;
    controlX = controlY = touchX = touchY = sensorX = sensorY = 0;
    keys.clear();
    resetPad();
    makeLevel();
    overlay.classList.add('hide');
    $('pause').textContent = '⏸ Pause';
    canvas.focus();
    announce(`Partie ${config.name}. Niveau 1.`);
  }

  function burst(x, y, color, count = 14) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * TAU;
      const speed = 0.25 + Math.random() * 0.9;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.45 + Math.random() * 0.35, max: 0.8, color });
    }
  }

  function loseLife() {
    if (!running || finished) return;
    lives -= 1;
    tone('fall');
    vibrate([40, 30, 65]);
    burst(ball.x, ball.y, '#6b2f28', 18);
    if (lives <= 0) { finishRun('Plus de vies'); return; }
    ball.x = 0.5; ball.y = 0.5; ball.vx = 0; ball.vy = 0;
    score = Math.max(0, score - 180);
    $('msg').innerHTML = `Oups — la bille est tombée. <strong>${lives} vie${lives > 1 ? 's' : ''}</strong> restante${lives > 1 ? 's' : ''}.`;
    announce(`Bille tombée. ${lives} vies restantes.`);
    updateHud();
  }

  function finishLevel() {
    if (!running || finished) return;
    tone('goal'); vibrate([22, 18, 22]); burst(grid - 0.5, grid - 0.5, '#f5d788', 28);
    const levelTime = Math.max(1, elapsedSeconds() - levelStartElapsed);
    const collected = stars;
    const bonus = Math.round((950 + level * 180 + collected * 220 + Math.max(0, 50 - levelTime) * 9) * MODES[mode].mult);
    score += bonus;
    stats.clears += 1;
    stats.stars += collected;
    stats.bestLevel = Math.max(stats.bestLevel, level);
    level += 1;
    score += lives * 35;
    if (mode === 'chrono') {
      const bonusMs = Math.min(9000, 3500 + Math.max(0, collected - 2) * 900);
      runStartedAt += bonusMs;
    }
    storageSave();
    $('msg').innerHTML = `Portail franchi · <strong>+${bonus.toLocaleString('fr-CA')} points</strong>. Niveau ${level}.`;
    announce(`Niveau réussi. ${bonus} points. Niveau ${level}.`);
    makeLevel();
  }

  function finishRun(reason = 'Partie terminée') {
    if (finished) return;
    finished = true; running = false; paused = false;
    const final = Math.round(score);
    const wasBest = final > stats.best;
    stats.best = Math.max(stats.best, final);
    stats.runs += 1;
    storageSave();
    tone(wasBest ? 'win' : 'tap');
    vibrate(wasBest ? [25, 30, 25, 30, 55] : 30);
    showResults(reason, wasBest);
  }

  function showMenu() {
    running = false; paused = false; finished = false; started = false;
    modal.innerHTML = `<div class="eye">Remake NOWIS · jeu #21</div><h2>Maîtrise l’inclinaison</h2><p>Guide la bille dans un labyrinthe généré à chaque niveau. Ramasse les étoiles, contourne les puits et atteins le portail.</p><div class="modes">${Object.entries(MODES).map(([key, config]) => `<button class="mode ${key === mode ? 'on' : ''}" data-mode="${key}"><strong>${config.name}</strong><span>${config.desc}</span></button>`).join('')}</div><div class="acts"><button id="menuHelp">Comment jouer</button><button class="primary" id="start">Commencer</button></div><p>Record : <strong>${stats.best.toLocaleString('fr-CA')}</strong> · meilleur niveau : <strong>${stats.bestLevel}</strong></p>`;
    overlay.classList.remove('hide');
    modal.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
      mode = button.dataset.mode;
      prefs.mode = mode; storageSave(); showMenu(); tone('tap');
    }));
    $('menuHelp').addEventListener('click', showHelp);
    $('start').addEventListener('click', resetRun);
  }

  function showHelp() {
    const resume = started && !finished;
    if (resume && running) pauseGame(false);
    modal.innerHTML = `<div class="eye">Aide</div><h2>Comment jouer</h2><ul><li><strong>Téléphone :</strong> glisse directement sur la planche ou utilise le levier rond pour l’incliner. Les quatre flèches fonctionnent aussi.</li><li><strong>Inclinaison réelle :</strong> le bouton 📱 peut utiliser les capteurs du téléphone lorsque le navigateur l’autorise.</li><li><strong>Clavier :</strong> flèches ou W/A/S/D pour incliner, P pour pause.</li><li>Les <strong>étoiles</strong> donnent des points bonus. Le <strong>portail doré</strong> termine le niveau.</li><li>Les puits noirs coûtent une vie. Le chemin principal vers le portail demeure toujours praticable.</li></ul><div class="acts"><button id="helpBack">${resume ? 'Reprendre' : 'Retour'}</button><button class="primary" id="helpRestart">Nouvelle partie</button></div>`;
    overlay.classList.remove('hide');
    $('helpBack').addEventListener('click', () => { if (resume) resumeGame(); else showMenu(); });
    $('helpRestart').addEventListener('click', resetRun);
  }

  function showPause() {
    modal.innerHTML = `<div class="eye">Planche immobilisée</div><h2>Pause</h2><p>La bille est figée. Reprends quand tu es prêt.</p><div class="acts"><button id="pauseQuit">Changer de mode</button><button class="primary" id="resume">Reprendre</button></div>`;
    overlay.classList.remove('hide');
    $('pauseQuit').addEventListener('click', showMenu);
    $('resume').addEventListener('click', resumeGame);
  }

  function showResults(reason, wasBest) {
    modal.innerHTML = `<div class="eye">${wasBest ? 'Nouveau record' : 'Parcours terminé'}</div><h2>${reason}</h2><div class="results"><div><span>Score</span><strong>${Math.round(score).toLocaleString('fr-CA')}</strong></div><div><span>Niveau</span><strong>${level}</strong></div><div><span>Record</span><strong>${stats.best.toLocaleString('fr-CA')}</strong></div></div><p>${wasBest ? 'Belle maîtrise : nouveau meilleur score.' : 'Repars pour améliorer ton parcours et ta récolte d’étoiles.'}</p><div class="acts"><button id="resultMenu">Modes</button><button class="primary" id="again">Rejouer</button></div>`;
    overlay.classList.remove('hide');
    $('resultMenu').addEventListener('click', showMenu);
    $('again').addEventListener('click', resetRun);
  }

  function pauseGame(show = true) {
    if (!started || !running || paused || finished) return;
    paused = true; pausedAt = performance.now(); ball.vx = ball.vy = 0; keys.clear(); resetPad(); $('pause').textContent = '▶ Reprendre';
    if (show) showPause();
    announce('Jeu en pause.');
  }

  function resumeGame() {
    if (!started || finished) return;
    if (paused && pausedAt) pausedTotal += performance.now() - pausedAt;
    pausedAt = 0; paused = false; running = true; lastFrame = 0; $('pause').textContent = '⏸ Pause';
    overlay.classList.add('hide'); canvas.focus(); announce('Jeu repris.');
  }

  function wallAtX(x, y, direction) {
    const rowMin = clamp(Math.floor(y - ball.r + 0.001), 0, grid - 1);
    const rowMax = clamp(Math.floor(y + ball.r - 0.001), 0, grid - 1);
    const cx = clamp(Math.floor(x), 0, grid - 1);
    for (let row = rowMin; row <= rowMax; row += 1) if (maze[row][cx]?.[direction]) return true;
    return false;
  }

  function wallAtY(x, y, direction) {
    const colMin = clamp(Math.floor(x - ball.r + 0.001), 0, grid - 1);
    const colMax = clamp(Math.floor(x + ball.r - 0.001), 0, grid - 1);
    const cy = clamp(Math.floor(y), 0, grid - 1);
    for (let col = colMin; col <= colMax; col += 1) if (maze[cy][col]?.[direction]) return true;
    return false;
  }

  function moveBall(dx, dy) {
    const bounce = 0.28;
    if (dx !== 0) {
      let nx = ball.x + dx;
      if (dx > 0) {
        const boundary = Math.floor(ball.x) + 1;
        if (nx + ball.r > boundary && wallAtX(ball.x, ball.y, 'r')) { nx = boundary - ball.r; ball.vx = -Math.abs(ball.vx) * bounce; tone('wall'); }
      } else {
        const boundary = Math.floor(ball.x);
        if (nx - ball.r < boundary && wallAtX(ball.x, ball.y, 'l')) { nx = boundary + ball.r; ball.vx = Math.abs(ball.vx) * bounce; tone('wall'); }
      }
      ball.x = clamp(nx, ball.r, grid - ball.r);
    }
    if (dy !== 0) {
      let ny = ball.y + dy;
      if (dy > 0) {
        const boundary = Math.floor(ball.y) + 1;
        if (ny + ball.r > boundary && wallAtY(ball.x, ball.y, 'b')) { ny = boundary - ball.r; ball.vy = -Math.abs(ball.vy) * bounce; tone('wall'); }
      } else {
        const boundary = Math.floor(ball.y);
        if (ny - ball.r < boundary && wallAtY(ball.x, ball.y, 't')) { ny = boundary + ball.r; ball.vy = Math.abs(ball.vy) * bounce; tone('wall'); }
      }
      ball.y = clamp(ny, ball.r, grid - ball.r);
    }
  }

  function effectiveControls() {
    let kx = 0, ky = 0;
    if (keys.has('arrowleft') || keys.has('a')) kx -= 1;
    if (keys.has('arrowright') || keys.has('d')) kx += 1;
    if (keys.has('arrowup') || keys.has('w')) ky -= 1;
    if (keys.has('arrowdown') || keys.has('s')) ky += 1;
    if (kx || ky) { const m = Math.hypot(kx, ky) || 1; return [kx / m, ky / m]; }
    if (touchActive) return [touchX, touchY];
    if (sensorOn) return [sensorX, sensorY];
    return [controlX, controlY];
  }

  function update(dt, now) {
    if (!running || paused || finished) return;
    if (MODES[mode].limit && currentTime(now) <= 0) { finishRun('Temps écoulé'); return; }
    const [ix, iy] = effectiveControls();
    const config = MODES[mode];
    const levelBoost = 1 + Math.min(0.38, (level - 1) * 0.035);
    const accel = config.accel * levelBoost;
    ball.vx += ix * accel * dt;
    ball.vy += iy * accel * dt;
    const friction = Math.pow(config.friction, dt * 60);
    ball.vx *= friction; ball.vy *= friction;
    const maxSpeed = 3.2 + Math.min(1.35, level * 0.1);
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > maxSpeed) { ball.vx = ball.vx / speed * maxSpeed; ball.vy = ball.vy / speed * maxSpeed; }
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(ball.vx), Math.abs(ball.vy)) * dt / 0.12));
    for (let i = 0; i < steps; i += 1) moveBall(ball.vx * dt / steps, ball.vy * dt / steps);

    for (const item of starItems) {
      if (item.got || Math.hypot(ball.x - item.x, ball.y - item.y) > ball.r + 0.18) continue;
      item.got = true; stars += 1; score += Math.round(180 * config.mult * (1 + level * 0.04));
      tone('star'); vibrate(14); burst(item.x, item.y, '#f7d477', 12); announce(`Étoile ${stars}.`);
    }
    for (const hole of holes) {
      if (Math.hypot(ball.x - hole.x, ball.y - hole.y) < hole.r + ball.r * 0.55) { loseLife(); break; }
    }
    if (Math.hypot(ball.x - (grid - 0.5), ball.y - (grid - 0.5)) < 0.31) finishLevel();

    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.98; p.vy *= 0.98; p.life -= dt; }
    particles = particles.filter((p) => p.life > 0);
    updateHud(now);
  }

  function draw(now) {
    const w = SIZE, h = SIZE;
    ctx.clearRect(0, 0, w, h);
    const cell = SIZE / grid;
    const [ix, iy] = effectiveControls();
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#17382f'); bg.addColorStop(0.55, '#10261f'); bg.addColorStop(1, '#0b1915');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#d8c798'; ctx.lineWidth = 1;
    for (let i = 1; i < grid; i += 1) { ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(w, i * cell); ctx.stroke(); }
    ctx.restore();

    const goalX = (grid - 0.5) * cell, goalY = (grid - 0.5) * cell;
    const pulse = prefersReduced ? 1 : 0.92 + Math.sin(now / 260) * 0.08;
    ctx.save();
    ctx.translate(goalX, goalY);
    ctx.shadowColor = '#f7d67b'; ctx.shadowBlur = 24;
    ctx.strokeStyle = '#f7d67b'; ctx.lineWidth = Math.max(4, cell * 0.055);
    ctx.beginPath(); ctx.arc(0, 0, cell * 0.25 * pulse, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#86d8c7'; ctx.lineWidth = Math.max(2, cell * 0.025); ctx.beginPath(); ctx.arc(0, 0, cell * 0.15, 0, TAU); ctx.stroke();
    ctx.restore();

    for (const hole of holes) {
      const x = hole.x * cell, y = hole.y * cell, r = hole.r * cell;
      const grad = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r * 1.45);
      grad.addColorStop(0, '#020504'); grad.addColorStop(0.58, '#06100d'); grad.addColorStop(1, '#7b513018');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, r * 1.38, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#a8764245'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 1.08, 0, TAU); ctx.stroke();
    }

    for (const item of starItems) {
      if (item.got) continue;
      ctx.save(); ctx.translate(item.x * cell, item.y * cell); if (!prefersReduced) ctx.rotate(now / 1200);
      ctx.shadowColor = '#f7d477'; ctx.shadowBlur = 14; ctx.fillStyle = '#f7d477'; starPath(ctx, 0, 0, cell * 0.15, cell * 0.065); ctx.fill(); ctx.restore();
    }

    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const wallW = Math.max(6, cell * 0.085);
    ctx.shadowColor = '#050c09'; ctx.shadowBlur = wallW * 1.2; ctx.shadowOffsetX = ix * 5; ctx.shadowOffsetY = iy * 5;
    ctx.strokeStyle = '#d0b06a'; ctx.lineWidth = wallW;
    for (let y = 0; y < grid; y += 1) for (let x = 0; x < grid; x += 1) {
      const c = maze[y]?.[x]; if (!c) continue;
      const x0 = x * cell, y0 = y * cell, x1 = (x + 1) * cell, y1 = (y + 1) * cell;
      if (c.t) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke(); }
      if (c.l) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.stroke(); }
      if (x === grid - 1 && c.r) { ctx.beginPath(); ctx.moveTo(x1, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
      if (y === grid - 1 && c.b) { ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke(); }
    }
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#f5e5b24f'; ctx.lineWidth = Math.max(1, wallW * 0.18);
    for (let y = 0; y < grid; y += 1) for (let x = 0; x < grid; x += 1) {
      const c = maze[y]?.[x]; if (!c) continue;
      const x0 = x * cell, y0 = y * cell, x1 = (x + 1) * cell, y1 = (y + 1) * cell;
      if (c.t) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke(); }
      if (c.l) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.stroke(); }
    }

    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x * cell, p.y * cell, Math.max(2, cell * 0.025), 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    const bx = ball.x * cell, by = ball.y * cell, br = ball.r * cell;
    ctx.save();
    ctx.fillStyle = '#0007'; ctx.beginPath(); ctx.ellipse(bx + ix * br * 0.55 + 3, by + iy * br * 0.55 + 5, br * 0.95, br * 0.62, 0, 0, TAU); ctx.fill();
    const marble = ctx.createRadialGradient(bx - br * 0.35, by - br * 0.4, br * 0.08, bx, by, br);
    marble.addColorStop(0, '#ffffff'); marble.addColorStop(0.25, '#d9fff7'); marble.addColorStop(0.58, '#6ec9b7'); marble.addColorStop(1, '#22695a');
    ctx.fillStyle = marble; ctx.shadowColor = '#74e6d0'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill();
    ctx.restore();

    tiltDot.style.setProperty('--tx', `${ix * 12}px`); tiltDot.style.setProperty('--ty', `${iy * 12}px`);
  }

  function frame(now) {
    const dt = lastFrame ? Math.min(0.032, (now - lastFrame) / 1000) : 0;
    lastFrame = now;
    if (running && !paused && !finished) update(dt, now);
    draw(now);
    win.requestAnimationFrame(frame);
  }

  function setPadFromEvent(event) {
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    let dx = (event.clientX - cx) / (rect.width * 0.34);
    let dy = (event.clientY - cy) / (rect.height * 0.34);
    const mag = Math.hypot(dx, dy);
    if (mag > 1) { dx /= mag; dy /= mag; }
    touchX = clamp(dx, -1, 1); touchY = clamp(dy, -1, 1); touchActive = true;
    knob.style.transform = `translate(calc(-50% + ${touchX * rect.width * 0.22}px),calc(-50% + ${touchY * rect.height * 0.22}px))`;
  }

  function resetPad() {
    touchActive = false; touchX = 0; touchY = 0; pointerId = null;
    if (knob) knob.style.transform = 'translate(-50%,-50%)';
  }

  pad.addEventListener('pointerdown', (event) => { if (!running || paused) return; pointerId = event.pointerId; pad.setPointerCapture?.(event.pointerId); setPadFromEvent(event); tone('tap'); });
  pad.addEventListener('pointermove', (event) => { if (event.pointerId === pointerId) setPadFromEvent(event); });
  pad.addEventListener('pointerup', (event) => { if (event.pointerId === pointerId) resetPad(); });
  pad.addEventListener('pointercancel', resetPad);

  let boardPointer = null, boardStartX = 0, boardStartY = 0;
  canvas.addEventListener('pointerdown', (event) => {
    if (!running || paused) return;
    boardPointer = event.pointerId; boardStartX = event.clientX; boardStartY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId); touchActive = true; touchX = 0; touchY = 0;
  });
  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== boardPointer) return;
    const rect = canvas.getBoundingClientRect();
    let dx = (event.clientX - boardStartX) / Math.max(42, rect.width * 0.13);
    let dy = (event.clientY - boardStartY) / Math.max(42, rect.height * 0.13);
    const mag = Math.hypot(dx, dy); if (mag > 1) { dx /= mag; dy /= mag; }
    touchX = clamp(dx, -1, 1); touchY = clamp(dy, -1, 1); touchActive = true;
  });
  const stopBoard = (event) => { if (!event || event.pointerId === boardPointer) { boardPointer = null; resetPad(); } };
  canvas.addEventListener('pointerup', stopBoard); canvas.addEventListener('pointercancel', stopBoard);

  doc.querySelectorAll('[data-dir]').forEach((button) => {
    const values = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
    const start = (event) => { event.preventDefault(); if (!running || paused) return; const [x, y] = values[button.dataset.dir]; controlX = x; controlY = y; tone('tap'); };
    const stop = () => { controlX = 0; controlY = 0; };
    button.addEventListener('pointerdown', start); button.addEventListener('pointerup', stop); button.addEventListener('pointerleave', stop); button.addEventListener('pointercancel', stop);
  });

  win.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd', 'p'].includes(key)) event.preventDefault();
    if (key === 'p') { if (paused) resumeGame(); else pauseGame(); return; }
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(key)) keys.add(key);
  });
  win.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

  function mappedOrientation(event) {
    const beta = Number(event.beta) || 0, gamma = Number(event.gamma) || 0;
    const angle = Number(win.screen?.orientation?.angle) || Number(win.orientation) || 0;
    if (angle === 90) return [beta, -gamma];
    if (angle === -90 || angle === 270) return [-beta, gamma];
    if (angle === 180) return [-gamma, -beta];
    return [gamma, beta];
  }

  function orientationHandler(event) {
    if (!sensorOn) return;
    const [x, y] = mappedOrientation(event);
    if (!sensorBase) { sensorBase = [x, y]; return; }
    sensorX = clamp((x - sensorBase[0]) / 18, -1, 1);
    sensorY = clamp((y - sensorBase[1]) / 18, -1, 1);
  }

  async function toggleSensor() {
    if (sensorOn) {
      sensorOn = false; sensorBase = null; sensorX = sensorY = 0; $('sensor').classList.remove('on'); $('sensor').setAttribute('aria-pressed', 'false'); $('sensor').textContent = '📱 Inclinaison'; announce('Inclinaison du téléphone désactivée.'); return;
    }
    const DeviceOrientation = win.DeviceOrientationEvent;
    if (!DeviceOrientation) { $('msg').innerHTML = 'Les capteurs ne sont pas disponibles ici. Utilise le <strong>levier tactile</strong>.'; announce('Capteurs non disponibles.'); return; }
    try {
      if (typeof DeviceOrientation.requestPermission === 'function') {
        const permission = await DeviceOrientation.requestPermission();
        if (permission !== 'granted') throw new Error('permission');
      }
      if (!sensorListening) { win.addEventListener('deviceorientation', orientationHandler, true); sensorListening = true; }
      sensorOn = true; sensorBase = null; sensorX = sensorY = 0; $('sensor').classList.add('on'); $('sensor').setAttribute('aria-pressed', 'true'); $('sensor').textContent = '📱 Actif';
      $('msg').innerHTML = 'Inclinaison réelle active · garde le téléphone dans une position confortable pendant la <strong>calibration</strong>.';
      announce('Inclinaison du téléphone activée.'); vibrate(15);
    } catch {
      sensorOn = false; $('msg').innerHTML = 'Permission refusée ou capteur bloqué. Le <strong>levier tactile</strong> reste disponible.'; announce('Permission des capteurs refusée.');
    }
  }

  $('sensor').addEventListener('click', toggleSensor);
  $('pause').addEventListener('click', () => { if (paused) resumeGame(); else pauseGame(); });
  $('restart').addEventListener('click', resetRun);
  $('helpTop').addEventListener('click', showHelp);
  $('sound').addEventListener('click', () => { prefs.sound = !prefs.sound; $('sound').setAttribute('aria-pressed', String(prefs.sound)); $('sound').textContent = prefs.sound ? '🔊 Son' : '🔇 Son'; storageSave(); if (prefs.sound) tone('tap'); });
  $('vibe').addEventListener('click', () => { prefs.vibe = !prefs.vibe; $('vibe').setAttribute('aria-pressed', String(prefs.vibe)); $('vibe').textContent = prefs.vibe ? '📳 Vibration' : '📴 Vibration'; storageSave(); if (prefs.vibe) vibrate(14); });
  $('sound').setAttribute('aria-pressed', String(prefs.sound)); $('sound').textContent = prefs.sound ? '🔊 Son' : '🔇 Son';
  $('vibe').setAttribute('aria-pressed', String(prefs.vibe)); $('vibe').textContent = prefs.vibe ? '📳 Vibration' : '📴 Vibration';

  doc.addEventListener('visibilitychange', () => { if (doc.hidden) pauseGame(false); });
  win.addEventListener('blur', () => { if (running && !paused) pauseGame(false); });
  win.addEventListener('contextmenu', (event) => event.preventDefault());

  maze = buildMaze(grid); solution = solvePath(maze); starItems = []; holes = [];
  updateHud(); draw(performance.now()); showMenu(); win.requestAnimationFrame(frame);
}
