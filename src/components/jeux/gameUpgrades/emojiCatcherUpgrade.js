const STORE = 'nowis:emoji-catcher:';

const MODES = {
  zen: {
    name: 'Zen',
    description: '75 s · aucune vie perdue sur un emoji manqué · rythme doux',
    duration: 75,
    lives: 5,
    spawnMs: 920,
    fallMs: 4700,
    hazards: 0.05,
    missCostsLife: false,
    scoreMultiplier: 0.8,
  },
  classic: {
    name: 'Classique',
    description: '75 s · 4 vies · vitesse et densité progressives',
    duration: 75,
    lives: 4,
    spawnMs: 760,
    fallMs: 4000,
    hazards: 0.1,
    missCostsLife: true,
    scoreMultiplier: 1,
  },
  expert: {
    name: 'Expert',
    description: '60 s · 3 vies · trajectoires rapides · plus de pièges',
    duration: 60,
    lives: 3,
    spawnMs: 620,
    fallMs: 3300,
    hazards: 0.15,
    missCostsLife: true,
    scoreMultiplier: 1.35,
  },
};

const GOOD = [
  { icon: '😀', name: 'sourire', points: 10, weight: 26, sway: 0.8 },
  { icon: '😍', name: 'cœur dans les yeux', points: 13, weight: 20, sway: 1.05 },
  { icon: '😎', name: 'cool', points: 16, weight: 17, sway: 1.15 },
  { icon: '🤩', name: 'étoiles', points: 20, weight: 14, sway: 1.3 },
  { icon: '🥳', name: 'fête', points: 24, weight: 10, sway: 1.4 },
  { icon: '🚀', name: 'fusée', points: 28, weight: 7, sway: 1.55 },
];

const BONUS = { icon: '🌟', name: 'étoile dorée', points: 55, kind: 'bonus', sway: 1.15 };
const RAINBOW = { icon: '🌈', name: 'arc-en-ciel', points: 80, kind: 'rainbow', sway: 0.9 };
const HAZARD = { icon: '💣', name: 'bombe', points: -35, kind: 'hazard', sway: 1.2 };

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const levelFor = (caught) => 1 + Math.floor(caught / 10);
const spawnFor = (mode, level) => {
  const floor = mode === 'expert' ? 285 : mode === 'classic' ? 360 : 470;
  const step = mode === 'expert' ? 30 : 34;
  return Math.max(floor, MODES[mode].spawnMs - (level - 1) * step);
};
const fallFor = (mode, level) => {
  const floor = mode === 'expert' ? 1600 : mode === 'classic' ? 1900 : 2450;
  const step = mode === 'expert' ? 105 : 120;
  return Math.max(floor, MODES[mode].fallMs - (level - 1) * step);
};
const maxActiveFor = (mode, level) => clamp((mode === 'expert' ? 5 : mode === 'classic' ? 4 : 3) + Math.floor((level - 1) / 2), 3, 8);
const comboMultiplier = (combo) => 1 + Math.min(2.5, Math.floor(Math.max(0, combo - 1) / 4) * 0.25);
const scoreFor = (points, combo, mode) => Math.round(points * comboMultiplier(combo) * MODES[mode].scoreMultiplier);
const formatScore = (value) => Math.max(0, Math.round(value)).toLocaleString('fr-CA');

function weightedGood(random = Math.random) {
  let cursor = random() * GOOD.reduce((sum, item) => sum + item.weight, 0);
  for (const item of GOOD) {
    cursor -= item.weight;
    if (cursor <= 0) return { ...item, kind: 'good' };
  }
  return { ...GOOD[0], kind: 'good' };
}

function pickTarget(mode, level, random = Math.random) {
  const roll = random();
  const hazardChance = Math.min(0.26, MODES[mode].hazards + Math.max(0, level - 1) * 0.008);
  if (roll < Math.min(0.025, 0.007 + level * 0.0012)) return RAINBOW;
  if (roll < 0.075) return BONUS;
  if (roll < 0.075 + hazardChance) return HAZARD;
  return weightedGood(random);
}

function load(storage, key, fallback) {
  try {
    return { ...fallback, ...(JSON.parse(storage.getItem(key) || 'null') || {}) };
  } catch {
    return { ...fallback };
  }
}

function save(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // A blocked localStorage must not block gameplay.
  }
}

function createAudio(win) {
  let context;
  let enabled = true;
  const tone = (frequency, duration = 0.06, type = 'sine', gain = 0.025, delay = 0) => {
    if (!enabled) return;
    try {
      const AudioContextCtor = win.AudioContext || win.webkitAudioContext;
      if (!AudioContextCtor) return;
      context ||= new AudioContextCtor();
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
    } catch {
      // Audio is progressive enhancement only.
    }
  };
  return {
    catch(points) {
      tone(410 + points * 7, 0.055, 'triangle', 0.025);
      tone(620 + points * 6, 0.065, 'sine', 0.018, 0.032);
    },
    bonus() {
      [659, 880, 1175].forEach((frequency, index) => tone(frequency, 0.095, 'triangle', 0.028, index * 0.055));
    },
    hazard() {
      tone(150, 0.14, 'sawtooth', 0.03);
      tone(92, 0.18, 'square', 0.018, 0.055);
    },
    miss() {
      tone(210, 0.05, 'triangle', 0.014);
    },
    level() {
      [440, 554, 659].forEach((frequency, index) => tone(frequency, 0.08, 'triangle', 0.023, index * 0.05));
    },
    end() {
      [523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, 0.1, 'triangle', 0.025, index * 0.065));
    },
    setEnabled(value) {
      enabled = value;
    },
  };
}

function vibrate(win, pattern, enabled) {
  if (!enabled) return;
  try {
    win.navigator?.vibrate?.(pattern);
  } catch {
    // Haptics are optional.
  }
}

export function upgradeEmojiCatcher(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisEmojiCatcherPro === 'true') return;
  root.dataset.nowisEmojiCatcherPro = 'true';
  root.lang = 'fr';
  doc.title = 'Attrape-émojis NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#030713;color:#f8fbff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{height:100dvh;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}button{font:inherit}.game{position:relative;height:100dvh;width:100%;display:flex;flex-direction:column;gap:6px;padding:max(7px,env(safe-area-inset-top)) max(7px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));overflow:hidden;background:radial-gradient(circle at 14% 8%,rgba(65,200,255,.2),transparent 24%),radial-gradient(circle at 84% 12%,rgba(184,92,255,.2),transparent 28%),radial-gradient(circle at 52% 102%,rgba(255,125,65,.16),transparent 30%),linear-gradient(160deg,#02040d 0%,#081027 48%,#050919 100%)}.game:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.52;background-image:radial-gradient(circle,rgba(255,255,255,.9) 0 1px,transparent 1.4px),radial-gradient(circle,rgba(103,232,249,.8) 0 1px,transparent 1.4px);background-size:67px 67px,109px 109px;background-position:0 0,37px 29px}.top,.hud,.arena,.status,.controls{position:relative;z-index:2;width:min(100%,900px);margin-inline:auto}.top{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand small{display:block;color:#8ee9ff;font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.brand h1{margin:1px 0;font-size:clamp(24px,7vw,39px);line-height:.94;letter-spacing:-.055em;text-shadow:0 4px 20px #000}.tools{display:flex;gap:5px;align-items:center}.pill,.btn,.mode,.modal button{min-height:44px;border:1px solid rgba(143,225,255,.22);border-radius:14px;background:rgba(8,18,43,.82);color:#f7fbff;font-weight:900;box-shadow:inset 0 1px rgba(255,255,255,.08),0 8px 24px rgba(0,0,0,.22)}.pill{display:flex;align-items:center;padding:0 10px;font-size:10px;color:#bcefff}.btn{padding:7px 10px;cursor:pointer;touch-action:manipulation}.btn:focus-visible,.mode:focus-visible,.modal button:focus-visible,.catcher:focus-visible{outline:3px solid #75f4ff;outline-offset:3px}.hud{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px}.stat{min-width:0;text-align:center;padding:5px 3px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:linear-gradient(180deg,rgba(14,28,61,.9),rgba(6,13,31,.86));box-shadow:inset 0 1px rgba(255,255,255,.08)}.stat span{display:block;color:#8fa9ca;font-size:8px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}.stat strong{display:block;overflow:hidden;text-overflow:ellipsis;color:#fff;font-size:clamp(14px,4vw,20px);line-height:1.1}.arena{position:relative;flex:1;min-height:180px;overflow:hidden;border:1px solid rgba(126,224,255,.3);border-radius:28px;background:radial-gradient(circle at 50% 118%,rgba(76,220,255,.22),transparent 35%),linear-gradient(180deg,rgba(9,14,37,.96),rgba(4,9,26,.98));box-shadow:0 24px 68px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.13),inset 0 -30px 70px rgba(33,96,142,.12);touch-action:none;user-select:none}.arena:before{content:"";position:absolute;inset:7px;border-radius:21px;border:1px solid rgba(255,255,255,.08);pointer-events:none}.arena:after{content:"";position:absolute;left:5%;right:5%;bottom:13%;height:1px;background:linear-gradient(90deg,transparent,rgba(110,235,255,.55),transparent);box-shadow:0 0 18px rgba(110,235,255,.4);pointer-events:none}.entity{position:absolute;z-index:3;display:grid;place-items:center;width:var(--size);height:var(--size);border-radius:50%;transform:translate3d(var(--x),var(--y),0) rotate(var(--rot));will-change:transform;filter:drop-shadow(0 7px 9px rgba(0,0,0,.38));pointer-events:none}.entity span{font-size:calc(var(--size)*.68);line-height:1}.entity.bonus{background:radial-gradient(circle,rgba(255,232,107,.2),transparent 66%);filter:drop-shadow(0 0 12px rgba(255,222,77,.7))}.entity.rainbow{filter:drop-shadow(0 0 13px rgba(120,240,255,.74))}.entity.hazard{filter:drop-shadow(0 0 10px rgba(255,89,89,.7))}.catcher{position:absolute;z-index:5;left:0;bottom:8px;width:clamp(82px,22vw,132px);height:clamp(52px,12vw,72px);padding:0;border:0;background:transparent;transform:translate3d(var(--x),0,0);touch-action:none;cursor:grab;will-change:transform}.catcher:active{cursor:grabbing}.dish{position:absolute;left:8%;right:8%;bottom:0;height:55%;border:2px solid rgba(113,238,255,.85);border-radius:10px 10px 38px 38px;background:linear-gradient(180deg,rgba(80,209,255,.28),rgba(45,74,138,.72));box-shadow:0 0 24px rgba(80,220,255,.25),inset 0 2px rgba(255,255,255,.28)}.dish:before{content:"";position:absolute;left:13%;right:13%;top:-9px;height:12px;border-radius:50%;border:2px solid rgba(206,248,255,.8);background:#071326;box-shadow:0 0 16px rgba(100,235,255,.25)}.beam{position:absolute;left:50%;bottom:40%;width:64%;height:54%;transform:translateX(-50%);clip-path:polygon(30% 100%,70% 100%,100% 0,0 0);background:linear-gradient(180deg,rgba(120,245,255,0),rgba(120,245,255,.2));opacity:.8;pointer-events:none}.status{min-height:34px;display:grid;place-items:center;padding:6px 10px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(5,12,29,.82);color:#9db1cc;text-align:center;font-size:11px;font-weight:800}.status strong{color:#78ecff}.controls{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center}.controls .tools{display:grid;grid-template-columns:repeat(4,1fr)}.hint{color:#7f95b2;font-size:9px;font-weight:800}.overlay{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:18px;background:rgba(1,4,13,.9);backdrop-filter:blur(14px)}.overlay.hide{display:none}.modal{width:min(100%,540px);max-height:90dvh;overflow:auto;padding:21px;border:1px solid rgba(117,234,255,.25);border-radius:27px;background:linear-gradient(155deg,#0a1532,#101d43 58%,#1b113a);box-shadow:0 32px 95px rgba(0,0,0,.7),inset 0 1px rgba(255,255,255,.1)}.eyebrow{color:#79eaff;font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.modal h2{margin:4px 0;font-size:clamp(28px,8vw,40px);letter-spacing:-.04em}.modal p{margin:8px 0;color:#b6c5da;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{text-align:left;padding:12px;cursor:pointer}.mode strong,.mode span{display:block}.mode span{margin-top:3px;color:#8ea4c2;font-size:11px}.mode.on{border-color:#71eaff;background:rgba(54,181,223,.18)}.actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.modal button{padding:10px;cursor:pointer}.primary{border-color:rgba(114,235,255,.48)!important;background:linear-gradient(135deg,#147aa2,#6242b7)!important}.cards{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:12px 0}.cards div{padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(3,9,24,.6)}.cards b{display:block;color:#8ff0ff;font-size:11px}.cards span{color:#9fb0c8;font-size:10px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@media(max-width:650px){.hud{grid-template-columns:repeat(3,1fr)}.stat:nth-child(n+4){display:none}.brand h1{font-size:27px}.controls{grid-template-columns:1fr}.hint{display:none}.top .pill{display:none}}@media(orientation:landscape) and (max-height:600px){.game{gap:4px}.brand h1{font-size:22px}.brand small{display:none}.hud{grid-template-columns:repeat(6,minmax(0,1fr))}.hud .stat:nth-child(n){display:block;padding:3px}.arena{min-height:130px}.status{min-height:28px;padding:3px}.btn{min-height:40px}}@media(prefers-reduced-motion:reduce){.game:before{opacity:.25}.entity,.catcher{will-change:auto}.modal,.btn{transition:none!important}}
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
    <main class="game">
      <header class="top">
        <div class="brand"><small>Station orbitale NOWIS</small><h1>Attrape-émojis</h1></div>
        <div class="tools"><span class="pill" id="modeBadge">Classique</span><button class="btn" id="help" aria-label="Aide">?</button></div>
      </header>
      <section class="hud" aria-label="Statistiques de partie">
        <div class="stat"><span>Score</span><strong id="score">0</strong></div>
        <div class="stat"><span>Record</span><strong id="record">0</strong></div>
        <div class="stat"><span>Temps</span><strong id="time">75</strong></div>
        <div class="stat"><span>Niveau</span><strong id="level">1</strong></div>
        <div class="stat"><span>Série</span><strong id="combo">0</strong></div>
        <div class="stat"><span>Vies</span><strong id="lives">♥♥♥♥</strong></div>
      </section>
      <section class="arena" id="arena" aria-label="Zone de jeu Attrape-émojis">
        <div id="entities" aria-hidden="true"></div>
        <button class="catcher" id="catcher" type="button" role="slider" aria-label="Collecteur. Fais-le glisser horizontalement." aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
          <span class="beam"></span><span class="dish"></span>
        </button>
      </section>
      <div class="status" id="status" role="status" aria-live="polite">Choisis un mode pour commencer.</div>
      <section class="controls">
        <div class="tools">
          <button class="btn" id="pause">Pause</button>
          <button class="btn" id="replay">Rejouer</button>
          <button class="btn" id="sound" aria-pressed="true">Son ✓</button>
          <button class="btn" id="haptic" aria-pressed="true">Vibre ✓</button>
        </div>
        <div class="hint">Glisser · toucher une position · ← → / A D · P pause</div>
      </section>
    </main>
    <div class="overlay" id="overlay"><div class="modal" id="modal" role="dialog" aria-modal="true"></div></div>
    <div class="sr" id="announce" aria-live="assertive"></div>
  `;

  const $ = (selector) => doc.querySelector(selector);
  const arena = $('#arena');
  const catcher = $('#catcher');
  const entityLayer = $('#entities');
  const overlay = $('#overlay');
  const modal = $('#modal');
  const audio = createAudio(win);
  const settings = load(win.localStorage, STORE + 'settings', { mode: 'classic', sound: true, haptic: true });

  let mode = MODES[settings.mode] ? settings.mode : 'classic';
  let records = load(win.localStorage, STORE + 'records', { zen: 0, classic: 0, expert: 0 });
  let stats = load(win.localStorage, STORE + 'stats', { games: 0, catches: 0, bestCombo: 0, bestLevel: 1 });
  let soundOn = settings.sound !== false;
  let hapticOn = settings.haptic !== false;
  let running = false;
  let paused = false;
  let ended = false;
  let score = 0;
  let caught = 0;
  let combo = 0;
  let bestCombo = 0;
  let level = 1;
  let lives = MODES[mode].lives;
  let timeLeft = MODES[mode].duration;
  let entities = [];
  let lastFrame = 0;
  let spawnClock = 0;
  let raf = 0;
  let catcherX = 0.5;
  let dragging = false;
  let activePointerId = null;

  audio.setEnabled(soundOn);

  const announce = (text) => {
    const node = $('#announce');
    node.textContent = '';
    win.setTimeout(() => { node.textContent = text; }, 20);
  };

  const setStatus = (html) => { $('#status').innerHTML = html; };
  const persistSettings = () => save(win.localStorage, STORE + 'settings', { mode, sound: soundOn, haptic: hapticOn });

  function updateHud() {
    $('#score').textContent = formatScore(score);
    $('#record').textContent = formatScore(Math.max(records[mode] || 0, score));
    $('#time').textContent = Math.max(0, Math.ceil(timeLeft));
    $('#level').textContent = level;
    $('#combo').textContent = combo ? `×${combo}` : '0';
    $('#lives').textContent = '♥'.repeat(Math.max(0, lives)) || '—';
    $('#modeBadge').textContent = MODES[mode].name;
    $('#pause').textContent = paused ? 'Reprendre' : 'Pause';
    $('#sound').textContent = soundOn ? 'Son ✓' : 'Son —';
    $('#haptic').textContent = hapticOn ? 'Vibre ✓' : 'Vibre —';
    $('#sound').setAttribute('aria-pressed', String(soundOn));
    $('#haptic').setAttribute('aria-pressed', String(hapticOn));
  }

  function catcherMetrics() {
    const rect = arena.getBoundingClientRect();
    const width = catcher.getBoundingClientRect().width || Math.min(132, Math.max(82, rect.width * 0.22));
    return { rect, width, maxX: Math.max(0, rect.width - width) };
  }

  function placeCatcher(normalized = catcherX) {
    catcherX = clamp(normalized, 0, 1);
    const { maxX } = catcherMetrics();
    catcher.style.setProperty('--x', `${maxX * catcherX}px`);
    catcher.setAttribute('aria-valuenow', String(Math.round(catcherX * 100)));
  }

  function moveCatcherToClientX(clientX) {
    const { rect, width, maxX } = catcherMetrics();
    if (!maxX) return;
    const local = clientX - rect.left - width / 2;
    placeCatcher(local / maxX);
  }

  function clearEntities() {
    entities.forEach((entity) => entity.el.remove());
    entities = [];
    entityLayer.innerHTML = '';
  }

  function removeEntity(entity) {
    entity.dead = true;
    entity.el.remove();
  }

  function finish(reason = 'temps écoulé') {
    if (ended) return;
    ended = true;
    running = false;
    paused = false;
    win.cancelAnimationFrame(raf);
    clearEntities();
    const oldRecord = records[mode] || 0;
    records[mode] = Math.max(oldRecord, score);
    stats.games += 1;
    stats.catches += caught;
    stats.bestCombo = Math.max(stats.bestCombo || 0, bestCombo);
    stats.bestLevel = Math.max(stats.bestLevel || 1, level);
    save(win.localStorage, STORE + 'records', records);
    save(win.localStorage, STORE + 'stats', stats);
    audio.end();
    vibrate(win, [28, 45, 28], hapticOn);
    updateHud();
    overlay.classList.remove('hide');
    modal.innerHTML = `
      <div class="eyebrow">Fin · ${MODES[mode].name}</div>
      <h2>${formatScore(score)} points</h2>
      <p>${reason === 'vies' ? 'Le collecteur a subi trop de chocs.' : 'Le chrono est terminé.'} ${score > oldRecord ? '<strong>Nouveau record !</strong>' : ''}</p>
      <div class="cards">
        <div><b>Émojis captés</b><span>${caught}</span></div>
        <div><b>Meilleure série</b><span>×${bestCombo}</span></div>
        <div><b>Niveau atteint</b><span>${level}</span></div>
        <div><b>Record ${MODES[mode].name}</b><span>${formatScore(records[mode])}</span></div>
      </div>
      <div class="actions"><button class="primary" id="again">Rejouer</button><button id="modes">Changer de mode</button></div>
    `;
    $('#again').onclick = () => startGame();
    $('#modes').onclick = () => showModeMenu();
  }

  function applyLevel(nextLevel) {
    if (nextLevel === level) return;
    level = nextLevel;
    audio.level();
    vibrate(win, 18, hapticOn);
    setStatus(`<strong>Niveau ${level}</strong> · ça accélère.`);
    announce(`Niveau ${level}`);
  }

  function handleCatch(entity) {
    if (entity.dead) return;
    removeEntity(entity);
    if (entity.kind === 'hazard') {
      score = Math.max(0, score + entity.points);
      combo = 0;
      lives = Math.max(0, lives - 1);
      audio.hazard();
      vibrate(win, [55, 40, 55], hapticOn);
      setStatus('<strong>💣 Aïe.</strong> Bombe attrapée : série cassée et une vie perdue.');
      announce('Bombe attrapée. Une vie perdue.');
      updateHud();
      if (lives <= 0) finish('vies');
      return;
    }

    combo += 1;
    caught += 1;
    bestCombo = Math.max(bestCombo, combo);
    const earned = scoreFor(entity.points, combo, mode);
    score += earned;
    if (entity.kind === 'bonus') {
      timeLeft = Math.min(MODES[mode].duration + 12, timeLeft + 4);
      audio.bonus();
      vibrate(win, [18, 22, 18], hapticOn);
      setStatus(`<strong>🌟 +${earned}</strong> · +4 secondes.`);
      announce(`Étoile dorée, plus ${earned} points et quatre secondes.`);
    } else if (entity.kind === 'rainbow') {
      lives = Math.min(MODES[mode].lives + 1, lives + 1);
      audio.bonus();
      vibrate(win, [15, 18, 15, 18, 15], hapticOn);
      setStatus(`<strong>🌈 +${earned}</strong> · une vie bonus.`);
      announce(`Arc-en-ciel, plus ${earned} points et une vie.`);
    } else {
      audio.catch(entity.points);
      vibrate(win, 12, hapticOn);
      setStatus(`<strong>+${earned}</strong> · ${entity.name}${combo >= 5 ? ` · série ×${combo}` : ''}`);
    }
    applyLevel(levelFor(caught));
    updateHud();
  }

  function handleMiss(entity) {
    if (entity.dead) return;
    removeEntity(entity);
    if (entity.kind === 'hazard') return;
    combo = 0;
    if (MODES[mode].missCostsLife) {
      lives = Math.max(0, lives - 1);
      audio.miss();
      vibrate(win, 24, hapticOn);
      setStatus(`<strong>Manqué.</strong> ${entity.name} est passé. ${lives ? `${lives} vie${lives > 1 ? 's' : ''}.` : 'Plus de vie.'}`);
      announce('Émoji manqué.');
      updateHud();
      if (lives <= 0) finish('vies');
    } else {
      setStatus(`Manqué : ${entity.name}. En mode Zen, aucune vie perdue.`);
      updateHud();
    }
  }

  function spawnEntity() {
    if (entities.length >= maxActiveFor(mode, level)) return;
    const arenaRect = arena.getBoundingClientRect();
    if (arenaRect.width < 80 || arenaRect.height < 120) return;
    const target = pickTarget(mode, level);
    const size = clamp(arenaRect.width * 0.105, 44, 66);
    const maxX = Math.max(4, arenaRect.width - size - 4);
    const x = 4 + Math.random() * Math.max(1, maxX - 4);
    const drift = (Math.random() - 0.5) * Math.min(90, arenaRect.width * 0.14) * (target.sway || 1);
    const fallDuration = fallFor(mode, level) * (0.88 + Math.random() * 0.26);
    const el = doc.createElement('div');
    el.className = `entity ${target.kind || 'good'}`;
    el.style.setProperty('--size', `${size}px`);
    el.innerHTML = `<span>${target.icon}</span>`;
    entityLayer.appendChild(el);
    entities.push({
      ...target,
      el,
      x,
      y: -size - 6,
      size,
      drift,
      fallDuration,
      age: 0,
      dead: false,
      phase: Math.random() * Math.PI * 2,
      rotation: (Math.random() - 0.5) * 12,
    });
  }

  function collides(entity) {
    const arenaRect = arena.getBoundingClientRect();
    const catcherRect = catcher.getBoundingClientRect();
    const ex = arenaRect.left + entity.x;
    const ey = arenaRect.top + entity.y;
    const padX = Math.min(16, catcherRect.width * 0.13);
    const padY = Math.min(8, catcherRect.height * 0.15);
    return ex + entity.size * 0.82 >= catcherRect.left + padX &&
      ex + entity.size * 0.18 <= catcherRect.right - padX &&
      ey + entity.size * 0.82 >= catcherRect.top + padY &&
      ey + entity.size * 0.18 <= catcherRect.bottom;
  }

  function updateEntities(deltaMs) {
    const arenaRect = arena.getBoundingClientRect();
    const arenaHeight = arenaRect.height;
    const arenaWidth = arenaRect.width;
    const next = [];
    for (const entity of entities) {
      if (entity.dead) continue;
      entity.age += deltaMs;
      const progress = entity.age / entity.fallDuration;
      entity.y = -entity.size + progress * (arenaHeight + entity.size * 1.6);
      const sway = Math.sin(entity.phase + progress * Math.PI * 2.3) * entity.drift;
      const maxX = Math.max(4, arenaWidth - entity.size - 4);
      const currentX = clamp(entity.x + sway, 4, maxX);
      entity.el.style.setProperty('--x', `${currentX}px`);
      entity.el.style.setProperty('--y', `${entity.y}px`);
      entity.el.style.setProperty('--rot', `${entity.rotation + progress * 18}deg`);
      if (collides({ ...entity, x: currentX })) {
        handleCatch(entity);
        continue;
      }
      if (progress >= 1.06) {
        handleMiss(entity);
        continue;
      }
      next.push(entity);
    }
    entities = next;
  }

  function frame(now) {
    if (!running || ended) return;
    if (!lastFrame) lastFrame = now;
    const deltaMs = Math.min(50, Math.max(0, now - lastFrame));
    lastFrame = now;
    if (!paused) {
      timeLeft -= deltaMs / 1000;
      spawnClock += deltaMs;
      const interval = spawnFor(mode, level);
      while (spawnClock >= interval) {
        spawnClock -= interval;
        spawnEntity();
        if (entities.length >= maxActiveFor(mode, level)) break;
      }
      updateEntities(deltaMs);
      updateHud();
      if (timeLeft <= 0) {
        timeLeft = 0;
        finish('temps');
        return;
      }
    }
    raf = win.requestAnimationFrame(frame);
  }

  function setPaused(value, auto = false) {
    if (!running || ended) return;
    paused = value;
    lastFrame = 0;
    updateHud();
    if (paused) {
      setStatus(auto ? '<strong>Pause automatique.</strong> Reviens quand tu veux.' : '<strong>Pause.</strong> Appuie sur Reprendre pour continuer.');
      announce('Jeu en pause.');
    } else {
      setStatus('<strong>Reprise.</strong> Attrape les bons émojis.');
      announce('Jeu repris.');
    }
  }

  function startGame() {
    win.cancelAnimationFrame(raf);
    clearEntities();
    score = 0;
    caught = 0;
    combo = 0;
    bestCombo = 0;
    level = 1;
    lives = MODES[mode].lives;
    timeLeft = MODES[mode].duration;
    spawnClock = 0;
    lastFrame = 0;
    ended = false;
    paused = false;
    running = true;
    catcherX = 0.5;
    placeCatcher();
    overlay.classList.add('hide');
    updateHud();
    setStatus('<strong>Go.</strong> Glisse le collecteur sous les émojis. Évite les bombes.');
    announce(`Mode ${MODES[mode].name}. Partie commencée.`);
    raf = win.requestAnimationFrame(frame);
    catcher.focus({ preventScroll: true });
  }

  function renderModeButtons() {
    return Object.entries(MODES).map(([key, config]) => `
      <button class="mode ${key === mode ? 'on' : ''}" data-mode="${key}">
        <strong>${config.name}</strong><span>${config.description}</span>
      </button>
    `).join('');
  }

  function showModeMenu() {
    running = false;
    paused = false;
    win.cancelAnimationFrame(raf);
    clearEntities();
    overlay.classList.remove('hide');
    modal.innerHTML = `
      <div class="eyebrow">Station orbitale NOWIS</div>
      <h2>Attrape-émojis</h2>
      <p>Déplace le collecteur sous les émojis avant qu’ils quittent l’écran. Les séries font grimper le multiplicateur. <strong>🌟</strong> ajoute 4 secondes, <strong>🌈</strong> donne une vie et <strong>💣</strong> fait mal.</p>
      <div class="modes">${renderModeButtons()}</div>
      <div class="actions"><button class="primary" id="play">Jouer</button><button id="helpFromMenu">Comment jouer</button></div>
    `;
    modal.querySelectorAll('[data-mode]').forEach((button) => {
      button.onclick = () => {
        mode = button.dataset.mode;
        persistSettings();
        showModeMenu();
      };
    });
    $('#play').onclick = () => startGame();
    $('#helpFromMenu').onclick = () => showHelp(true);
  }

  function showHelp(fromMenu = false) {
    const wasPlaying = running && !paused;
    if (wasPlaying) setPaused(true);
    overlay.classList.remove('hide');
    modal.innerHTML = `
      <div class="eyebrow">Aide</div><h2>Comment jouer</h2>
      <div class="cards">
        <div><b>📱 Au doigt</b><span>Glisse dans l’arène ou touche une position : le collecteur suit immédiatement.</span></div>
        <div><b>⌨️ Au clavier</b><span>← → ou A / D déplacent le collecteur. P ou Échap met en pause.</span></div>
        <div><b>🔥 Série</b><span>Enchaîne les captures pour monter jusqu’à ×3,5. Un emoji manqué ou une bombe casse la série.</span></div>
        <div><b>⭐ Bonus</b><span>🌟 ajoute du temps. 🌈 ajoute une vie. Évite 💣.</span></div>
      </div>
      <p>Le niveau augmente toutes les 10 captures : les chutes s’accélèrent et plusieurs émojis peuvent arriver ensemble.</p>
      <div class="actions"><button class="primary" id="closeHelp">${fromMenu ? 'Retour aux modes' : 'Reprendre'}</button><button id="restartHelp">Rejouer</button></div>
    `;
    $('#closeHelp').onclick = () => {
      overlay.classList.add('hide');
      if (fromMenu) showModeMenu();
      else if (wasPlaying) setPaused(false);
    };
    $('#restartHelp').onclick = () => startGame();
  }

  function onPointerDown(event) {
    if (!running || paused || ended) return;
    dragging = true;
    activePointerId = event.pointerId;
    try { arena.setPointerCapture?.(event.pointerId); } catch {}
    moveCatcherToClientX(event.clientX);
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (!dragging || event.pointerId !== activePointerId || !running || paused || ended) return;
    moveCatcherToClientX(event.clientX);
    event.preventDefault();
  }

  function endPointer(event) {
    if (event.pointerId !== activePointerId) return;
    dragging = false;
    activePointerId = null;
  }

  arena.addEventListener('pointerdown', onPointerDown, { passive: false });
  arena.addEventListener('pointermove', onPointerMove, { passive: false });
  arena.addEventListener('pointerup', endPointer, { passive: true });
  arena.addEventListener('pointercancel', endPointer, { passive: true });

  catcher.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      event.preventDefault();
      placeCatcher(catcherX - 0.075);
    } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      event.preventDefault();
      placeCatcher(catcherX + 0.075);
    } else if (event.key === 'Home') {
      event.preventDefault();
      placeCatcher(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      placeCatcher(1);
    }
  });

  doc.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'p' || event.key === 'Escape') {
      if (!overlay.classList.contains('hide')) return;
      event.preventDefault();
      setPaused(!paused);
    }
  });

  $('#pause').onclick = () => setPaused(!paused);
  $('#replay').onclick = () => startGame();
  $('#help').onclick = () => showHelp(false);
  $('#sound').onclick = () => {
    soundOn = !soundOn;
    audio.setEnabled(soundOn);
    persistSettings();
    updateHud();
  };
  $('#haptic').onclick = () => {
    hapticOn = !hapticOn;
    persistSettings();
    updateHud();
  };

  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden && running && !paused && !ended) setPaused(true, true);
  });
  win.addEventListener('blur', () => {
    if (running && !paused && !ended) setPaused(true, true);
  });
  win.addEventListener('resize', () => placeCatcher(catcherX));

  updateHud();
  placeCatcher();
  showModeMenu();
}
