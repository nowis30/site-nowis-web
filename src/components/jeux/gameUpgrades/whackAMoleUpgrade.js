const STORE = 'nowis:whack-a-mole:';

const MODES = {
  zen: { name: 'Détente', description: '75 s · aucune vie perdue sur une taupe manquée', duration: 75, lives: 5, spawnMs: 860, visibleMs: 1250, hazards: 0.04, missCostsLife: false, scoreMultiplier: 0.85 },
  classic: { name: 'Classique', description: '70 s · 4 cœurs · difficulté progressive', duration: 70, lives: 4, spawnMs: 720, visibleMs: 1080, hazards: 0.08, missCostsLife: true, scoreMultiplier: 1 },
  expert: { name: 'Expert', description: '60 s · 3 cœurs · taupes rapides et leurres', duration: 60, lives: 3, spawnMs: 590, visibleMs: 890, hazards: 0.13, missCostsLife: true, scoreMultiplier: 1.3 },
};

const KINDS = {
  mole: { label: 'Taupe', icon: '●', base: 100 },
  gold: { label: 'Taupe dorée', icon: '★', base: 260 },
  hazard: { label: 'Leurre rouge', icon: '!', base: -180 },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const levelFor = (hits) => 1 + Math.floor(hits / 8);
const comboMultiplier = (combo) => 1 + Math.min(2.5, Math.floor(Math.max(0, combo - 1) / 4) * 0.25);
const spawnFor = (mode, level) => Math.max(mode === 'expert' ? 285 : mode === 'classic' ? 340 : 430, MODES[mode].spawnMs - (level - 1) * (mode === 'expert' ? 32 : mode === 'classic' ? 34 : 30));
const visibleFor = (mode, level) => Math.max(mode === 'expert' ? 500 : mode === 'classic' ? 600 : 720, MODES[mode].visibleMs - (level - 1) * (mode === 'expert' ? 38 : 42));
const maxActiveFor = (mode, level) => clamp((mode === 'expert' ? 2 : 1) + Math.floor((level - 1) / 3), 1, mode === 'zen' ? 2 : 3);
const hazardChanceFor = (mode, level) => Math.min(0.24, MODES[mode].hazards + Math.max(0, level - 1) * 0.008);
const scoreFor = (kind, combo, mode, reactionRatio) => {
  const base = KINDS[kind].base;
  if (base < 0) return base;
  return Math.round(base * comboMultiplier(combo) * MODES[mode].scoreMultiplier * (0.72 + clamp(reactionRatio, 0, 1) * 0.58));
};
const formatScore = (value) => Math.max(0, Math.round(value)).toLocaleString('fr-CA');

function chooseKind(mode, level, random = Math.random) {
  const roll = random();
  const goldChance = Math.min(0.11, 0.045 + level * 0.004);
  if (roll < goldChance) return 'gold';
  if (roll < goldChance + hazardChanceFor(mode, level)) return 'hazard';
  return 'mole';
}

function load(storage, key, fallback) {
  try { return { ...fallback, ...(JSON.parse(storage.getItem(key) || 'null') || {}) }; }
  catch { return { ...fallback }; }
}

function save(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); } catch { /* gameplay remains available */ }
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
    } catch { /* progressive enhancement */ }
  };
  return {
    hit(combo) { tone(320 + Math.min(combo, 12) * 18, 0.045, 'triangle'); tone(500 + Math.min(combo, 12) * 20, 0.055, 'sine', 0.018, 0.025); },
    gold() { [659, 880, 1175].forEach((frequency, index) => tone(frequency, 0.085, 'triangle', 0.028, index * 0.045)); },
    hazard() { tone(130, 0.15, 'sawtooth', 0.03); tone(86, 0.18, 'square', 0.018, 0.05); },
    miss() { tone(185, 0.05, 'triangle', 0.014); },
    level() { [440, 554, 659].forEach((frequency, index) => tone(frequency, 0.07, 'triangle', 0.022, index * 0.045)); },
    end() { [523, 659, 784].forEach((frequency, index) => tone(frequency, 0.1, 'triangle', 0.024, index * 0.06)); },
    setEnabled(value) { enabled = value; },
  };
}

function vibrate(win, pattern, enabled) {
  if (!enabled) return;
  try { win.navigator?.vibrate?.(pattern); } catch { /* optional */ }
}

export function upgradeWhackAMole(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisWhackAMolePro === 'true') return;
  root.dataset.nowisWhackAMolePro = 'true';
  root.lang = 'fr';
  doc.title = 'Tape-taupe NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#07100b;color:#fff9e8;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}body{height:100dvh;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}button{font:inherit;color:inherit}.game{position:relative;width:100%;height:100dvh;display:flex;flex-direction:column;gap:6px;padding:max(7px,env(safe-area-inset-top)) max(7px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));overflow:hidden;background:radial-gradient(circle at 20% 2%,#ffc75538,transparent 25%),radial-gradient(circle at 86% 16%,#46b56e3d,transparent 27%),linear-gradient(155deg,#08130d,#12291a 46%,#09150f)}.game:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.2;background-image:linear-gradient(#ffffff09 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:34px 34px}.top,.hud,.field,.status,.controls{position:relative;z-index:2;width:min(100%,820px);margin-inline:auto}.top{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand small{display:block;color:#ffd779;font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.brand h1{margin:1px 0;font-size:clamp(23px,7vw,38px);line-height:.94;letter-spacing:-.055em;text-shadow:0 4px 18px #000}.tools{display:flex;gap:5px;align-items:center}.btn,.mode,.modal button{min-height:44px;border:1px solid #ffe09138;border-radius:14px;background:linear-gradient(#26452f,#13271b);color:#fff9e8;font-weight:900;box-shadow:inset 0 1px #ffffff1a,0 8px 22px #0000003d}.btn{padding:7px 10px;cursor:pointer;touch-action:manipulation}.btn:focus-visible,.mode:focus-visible,.modal button:focus-visible,.hole:focus-visible{outline:3px solid #ffe08a;outline-offset:3px}.hud{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px}.stat{min-width:0;text-align:center;padding:5px 3px;border:1px solid #ffffff14;border-radius:12px;background:linear-gradient(#26402def,#0f1f16e6)}.stat span{display:block;color:#a9c7af;font-size:8px;font-weight:900;text-transform:uppercase}.stat strong{display:block;overflow:hidden;text-overflow:ellipsis;font-size:clamp(14px,4vw,20px);line-height:1.1}.field{flex:1;min-height:230px;display:grid;place-items:center;overflow:hidden;border:1px solid #ffe08f33;border-radius:28px;background:radial-gradient(circle at 50% 110%,#ffd06529,transparent 38%),linear-gradient(#122c1cf7,#08150efe);box-shadow:0 24px 64px #0008,inset 0 1px #ffffff1c;user-select:none}.workbench{position:relative;width:min(96%,610px);height:min(100%,610px);aspect-ratio:1;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:clamp(7px,2vw,14px);padding:clamp(9px,2.5vw,18px);border-radius:32px;background:linear-gradient(145deg,#8a572f,#5b351f 42%,#3f2418);box-shadow:inset 0 3px #ffebbe2e,inset 0 -8px 18px #0005,0 16px 35px #0006}.hole{position:relative;overflow:hidden;min-width:44px;min-height:44px;padding:0;border:0;border-radius:50%;background:radial-gradient(ellipse at 50% 62%,#050706 0 48%,#1a130f 50% 63%,#704829 65% 72%,#9b6b3f 74%);box-shadow:inset 0 14px 20px #000c,0 3px #ffe2ad1f;cursor:pointer;touch-action:manipulation}.hole:after{content:"";position:absolute;z-index:5;left:5%;right:5%;bottom:-2%;height:28%;border-radius:50%;background:linear-gradient(#5e381f,#27170f)}.mole{position:absolute;z-index:4;left:50%;bottom:-78%;width:70%;height:76%;transform:translateX(-50%);border-radius:48% 48% 39% 39%;background:linear-gradient(145deg,#9a7654,#5b402e 58%,#3c291e);box-shadow:inset 0 3px #ffffff29,0 5px 12px #0006;transition:bottom .105s cubic-bezier(.2,.9,.25,1),transform .09s;pointer-events:none}.hole.active .mole{bottom:9%}.hole.hit .mole{transform:translateX(-50%) scale(.86)}.mole:before,.mole:after{content:"";position:absolute;top:27%;width:10%;height:10%;border-radius:50%;background:#0c0c0c;box-shadow:0 0 0 2px #ffffff8c}.mole:before{left:27%}.mole:after{right:27%}.snout{position:absolute;left:50%;top:43%;width:38%;height:29%;transform:translateX(-50%);border-radius:50%;background:#d5a08b}.snout:before{content:"";position:absolute;left:50%;top:22%;width:34%;height:26%;transform:translateX(-50%);border-radius:50%;background:#38231f}.badge{position:absolute;z-index:7;right:10%;top:8%;display:grid;place-items:center;width:27%;aspect-ratio:1;border-radius:50%;font-size:clamp(12px,4vw,25px);font-weight:1000;opacity:0;transform:scale(.6);transition:.12s;pointer-events:none}.hole.active .badge{opacity:1;transform:scale(1)}.hole.gold .mole{background:linear-gradient(145deg,#ffe88b,#d39928 58%,#88550b);filter:drop-shadow(0 0 13px #ffdb5a99)}.hole.gold .badge{background:#fff1a6;color:#6d4300;box-shadow:0 0 14px #ffd75a}.hole.hazard .mole{background:linear-gradient(145deg,#c94b46,#782c29 58%,#421817);filter:drop-shadow(0 0 10px #ff4a4a80)}.hole.hazard .badge{background:#ff665e;color:white;box-shadow:0 0 12px #ff554bbb}.pop{position:absolute;z-index:10;left:50%;top:36%;transform:translate(-50%,-50%);font-size:clamp(14px,4vw,24px);font-weight:1000;text-shadow:0 3px 8px #000;pointer-events:none;animation:scorePop .52s ease-out forwards}.status{min-height:34px;display:grid;place-items:center;padding:6px 10px;border:1px solid #ffffff14;border-radius:12px;background:#091810e0;color:#aec8b3;text-align:center;font-size:11px;font-weight:800}.status strong{color:#ffd779}.controls{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center}.controls .tools{display:grid;grid-template-columns:repeat(4,1fr)}.hint{color:#91ac97;font-size:9px;font-weight:800}.overlay{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:18px;background:#030a06b8;backdrop-filter:blur(11px)}.overlay.hide{display:none}.modal{width:min(100%,560px);max-height:min(92dvh,720px);overflow:auto;padding:20px;border:1px solid #ffe19938;border-radius:26px;background:linear-gradient(160deg,#213d29,#102319 62%,#0a1811);box-shadow:0 28px 85px #000a,inset 0 1px #ffffff1a}.eyebrow{color:#ffd779;font-size:10px;font-weight:1000;letter-spacing:.18em;text-transform:uppercase}.modal h2{margin:5px 0 8px;font-size:clamp(30px,9vw,48px);line-height:.92;letter-spacing:-.055em}.modal p{margin:8px 0;color:#c7d8ca;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{display:grid;text-align:left;padding:10px 12px;cursor:pointer}.mode span{color:#adc5b2;font-size:10px}.mode.on{border-color:#ffd779;background:linear-gradient(#605d2deb,#2b3a1fef)}.actions{display:grid;grid-template-columns:1.35fr 1fr;gap:8px;margin-top:14px}.modal button{padding:10px 12px;cursor:pointer}.modal button.primary{border-color:#ffd779;background:linear-gradient(#c98228,#8b531d)}.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin:12px 0}.cards div,.result div{padding:10px;border:1px solid #ffffff14;border-radius:14px;background:#ffffff0a}.cards b,.cards span{display:block}.cards b{color:#ffe49b;font-size:12px}.cards span{margin-top:3px;color:#b9cfbe;font-size:10px;line-height:1.35}.result{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:14px 0;text-align:center}.result span{display:block;color:#9bb7a1;font-size:9px;text-transform:uppercase;font-weight:900}.result strong{display:block;font-size:20px}.sr{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}@keyframes scorePop{0%{opacity:0;transform:translate(-50%,-10%) scale(.7)}25%{opacity:1}100%{opacity:0;transform:translate(-50%,-125%) scale(1.15)}}@media(max-width:560px){.game{gap:4px;padding:max(5px,env(safe-area-inset-top)) max(5px,env(safe-area-inset-right)) max(5px,env(safe-area-inset-bottom)) max(5px,env(safe-area-inset-left))}.brand h1{font-size:25px}.brand small{font-size:7px}.hud{gap:3px}.stat{padding:4px 2px}.stat span{font-size:7px}.btn{padding:5px 8px}.field{border-radius:20px;min-height:190px}.workbench{gap:6px;padding:8px;border-radius:23px}.status{font-size:10px;min-height:31px}.controls{grid-template-columns:1fr}.controls .tools{width:100%}.hint{display:none}.modal{padding:17px}.cards{grid-template-columns:1fr 1fr}}@media(max-height:650px) and (orientation:landscape){.game{display:grid;grid-template-columns:minmax(0,1fr) minmax(250px,38vw);grid-template-rows:auto 1fr auto}.top,.hud{grid-column:1/3;width:100%;max-width:none}.top{grid-row:1}.hud{grid-row:3}.field{grid-column:1;grid-row:2;width:100%;height:100%;min-height:0}.status,.controls{grid-column:2;width:100%;margin:0}.status{grid-row:2;align-self:start}.controls{grid-row:2;align-self:end}.workbench{height:100%;width:auto;max-width:100%;max-height:100%}.brand h1{font-size:22px}.controls .tools{grid-template-columns:repeat(2,1fr)}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
    <main class="game" aria-label="Jeu Tape-taupe NOWIS">
      <header class="top"><div class="brand"><small>Atelier mécanique NOWIS</small><h1>Tape-taupe</h1></div><div class="tools"><button class="btn" id="sound" aria-pressed="true" aria-label="Son">🔊</button><button class="btn" id="haptic" aria-pressed="true" aria-label="Vibrations">📳</button></div></header>
      <section class="hud" aria-label="Statistiques"><div class="stat"><span>Score</span><strong id="score">0</strong></div><div class="stat"><span>Record</span><strong id="best">0</strong></div><div class="stat"><span>Série</span><strong id="combo">×1</strong></div><div class="stat"><span>Niveau</span><strong id="level">1</strong></div><div class="stat"><span>Temps</span><strong id="time">--</strong></div><div class="stat"><span>Cœurs</span><strong id="lives">♥♥♥</strong></div></section>
      <section class="field" aria-label="Établi"><div class="workbench" id="workbench" role="grid" aria-label="Neuf trous. Tape les taupes, évite les leurres rouges.">${Array.from({ length: 9 }, (_, index) => `<button class="hole" data-slot="${index}" role="gridcell" aria-label="Trou ${index + 1}, vide"><span class="mole" aria-hidden="true"><span class="snout"></span></span><span class="badge" aria-hidden="true"></span></button>`).join('')}</div></section>
      <div class="status" id="status" aria-live="polite">Choisis un mode pour commencer.</div>
      <footer class="controls"><div class="hint">Tactile : tape la taupe · Clavier : Tab puis Entrée/Espace · P : pause</div><div class="tools"><button class="btn" id="pause">Pause</button><button class="btn" id="replay">Rejouer</button><button class="btn" id="help">Aide</button><button class="btn" id="modes">Modes</button></div></footer>
      <div class="overlay" id="overlay"><section class="modal" id="modal" role="dialog" aria-modal="true"></section></div><div class="sr" id="announcer" aria-live="assertive" aria-atomic="true"></div>
    </main>`;

  const $ = (selector) => doc.querySelector(selector);
  const holes = [...doc.querySelectorAll('.hole')];
  const workbench = $('#workbench');
  const overlay = $('#overlay');
  const modal = $('#modal');
  const status = $('#status');
  const announcer = $('#announcer');
  const audio = createAudio(win);
  const stats = load(win.localStorage, `${STORE}stats`, { games: 0, hits: 0, bestCombo: 0, bestScore: 0 });
  const records = load(win.localStorage, `${STORE}records`, { zen: 0, classic: 0, expert: 0 });
  const settings = load(win.localStorage, `${STORE}settings`, { mode: 'classic', sound: true, haptic: true });

  let mode = MODES[settings.mode] ? settings.mode : 'classic';
  let soundOn = settings.sound !== false;
  let hapticOn = settings.haptic !== false;
  let score = 0, hits = 0, misses = 0, combo = 0, bestCombo = 0, level = 1;
  let lives = MODES[mode].lives, timeLeft = MODES[mode].duration;
  let running = false, paused = false, ended = false, raf = 0, lastFrame = 0, spawnClock = 0, tokenCounter = 0;
  const slots = Array.from({ length: 9 }, () => null);
  audio.setEnabled(soundOn);

  const announce = (message) => { announcer.textContent = ''; win.setTimeout(() => { announcer.textContent = message; }, 10); };
  const persistSettings = () => save(win.localStorage, `${STORE}settings`, { mode, sound: soundOn, haptic: hapticOn });
  const setStatus = (message) => { status.innerHTML = message; };
  const renderLives = () => mode === 'zen' ? '∞' : `${'♥'.repeat(Math.max(0, lives))}${'·'.repeat(Math.max(0, MODES[mode].lives - lives))}`;

  function updateHud() {
    $('#score').textContent = formatScore(score); $('#best').textContent = formatScore(Math.max(records[mode] || 0, score)); $('#combo').textContent = `×${comboMultiplier(combo).toFixed(combo >= 4 ? 2 : 0).replace('.00', '')}`; $('#level').textContent = String(level); $('#time').textContent = `${Math.max(0, Math.ceil(timeLeft))} s`; $('#lives').textContent = renderLives(); $('#pause').textContent = paused ? 'Reprendre' : 'Pause'; $('#sound').textContent = soundOn ? '🔊' : '🔇'; $('#sound').setAttribute('aria-pressed', String(soundOn)); $('#haptic').textContent = hapticOn ? '📳' : '○'; $('#haptic').setAttribute('aria-pressed', String(hapticOn));
  }

  function clearSlot(index) {
    const slot = slots[index]; slots[index] = null;
    const hole = holes[index]; hole.classList.remove('active', 'gold', 'hazard', 'hit'); hole.querySelector('.badge').textContent = ''; hole.setAttribute('aria-label', `Trou ${index + 1}, vide`); return slot;
  }
  function clearBoard() { for (let index = 0; index < 9; index += 1) clearSlot(index); workbench.querySelectorAll('.pop').forEach((node) => node.remove()); }
  const activeCount = () => slots.reduce((sum, slot) => sum + (slot ? 1 : 0), 0);
  const freeSlots = () => slots.reduce((free, slot, index) => { if (!slot) free.push(index); return free; }, []);

  function openSlot(index, kind, now) {
    const visibleMs = visibleFor(mode, level); slots[index] = { kind, token: ++tokenCounter, born: now, expires: now + visibleMs, visibleMs };
    const hole = holes[index]; hole.classList.remove('gold', 'hazard', 'hit'); hole.classList.add('active'); if (kind === 'gold' || kind === 'hazard') hole.classList.add(kind); hole.querySelector('.badge').textContent = KINDS[kind].icon; hole.setAttribute('aria-label', `Trou ${index + 1}, ${KINDS[kind].label}. ${kind === 'hazard' ? 'Ne pas taper.' : 'Tape maintenant.'}`);
  }

  function spawn(now) {
    const capacity = maxActiveFor(mode, level); if (activeCount() >= capacity) return;
    const free = freeSlots(); if (!free.length) return;
    openSlot(free[Math.floor(Math.random() * free.length)], chooseKind(mode, level), now);
    if (level >= 4 && capacity - activeCount() > 0 && Math.random() < Math.min(0.42, 0.12 + level * 0.025)) { const remaining = freeSlots(); if (remaining.length) openSlot(remaining[Math.floor(Math.random() * remaining.length)], chooseKind(mode, level), now + 20); }
  }

  function popScore(index, text, positive = true) {
    const node = doc.createElement('span'); node.className = 'pop'; node.textContent = text; node.style.color = positive ? '#ffe18a' : '#ff8780'; holes[index].appendChild(node); win.setTimeout(() => node.remove(), 560);
  }

  function loseLife(reason) { if (mode === 'zen') return; lives -= 1; if (lives <= 0) { updateHud(); endGame(reason || 'Plus de cœur.'); } }

  function resolveExpired(now) {
    for (let index = 0; index < 9; index += 1) {
      const slot = slots[index]; if (!slot || now < slot.expires) continue; clearSlot(index); if (slot.kind === 'hazard') continue;
      combo = 0; misses += 1; if (MODES[mode].missCostsLife) loseLife('Une taupe s’est échappée.'); audio.miss(); if (running) setStatus('<strong>Trop tard.</strong> Une taupe s’est échappée.');
    }
  }

  function updateLevel() { const next = levelFor(hits); if (next <= level) return; level = next; audio.level(); vibrate(win, [18, 30, 18], hapticOn); setStatus(`<strong>Niveau ${level}.</strong> Les mécanismes accélèrent.`); announce(`Niveau ${level}.`); }

  function strike(index) {
    if (!running || paused || ended) return;
    const slot = slots[index];
    if (!slot) { combo = 0; score = Math.max(0, score - (mode === 'expert' ? 45 : 25)); misses += 1; audio.miss(); vibrate(win, 12, hapticOn); popScore(index, mode === 'expert' ? '−45' : '−25', false); setStatus('<strong>Vide.</strong> Attends qu’une taupe sorte.'); updateHud(); return; }
    clearSlot(index); holes[index].classList.add('hit'); win.setTimeout(() => holes[index].classList.remove('hit'), 90);
    if (slot.kind === 'hazard') { combo = 0; score = Math.max(0, score + KINDS.hazard.base); misses += 1; audio.hazard(); vibrate(win, [45, 25, 55], hapticOn); popScore(index, '−180', false); setStatus('<strong>Leurre rouge.</strong> Il fallait le laisser passer.'); loseLife('Leurre rouge touché.'); updateHud(); return; }
    hits += 1; combo += 1; bestCombo = Math.max(bestCombo, combo); const ratio = Math.max(0, slot.expires - win.performance.now()) / slot.visibleMs; const gained = scoreFor(slot.kind, combo, mode, ratio); score += gained;
    if (slot.kind === 'gold') { timeLeft = Math.min(MODES[mode].duration + 12, timeLeft + 2.5); audio.gold(); vibrate(win, [18, 25, 25], hapticOn); popScore(index, `+${gained} · +2,5 s`); setStatus('<strong>Taupe dorée.</strong> Bonus de temps gagné.'); }
    else { audio.hit(combo); vibrate(win, 18, hapticOn); popScore(index, `+${gained}`); setStatus(`<strong>Bien joué.</strong> Série ${combo} · multiplicateur ×${comboMultiplier(combo).toFixed(2).replace(/\.00$/, '')}.`); }
    updateLevel(); updateHud();
  }

  function endGame(reason = 'Temps écoulé.') {
    if (ended) return; running = false; paused = false; ended = true; win.cancelAnimationFrame(raf); clearBoard();
    const previous = records[mode] || 0; const isRecord = score > previous; records[mode] = Math.max(previous, score); stats.games += 1; stats.hits += hits; stats.bestCombo = Math.max(stats.bestCombo || 0, bestCombo); stats.bestScore = Math.max(stats.bestScore || 0, score); save(win.localStorage, `${STORE}records`, records); save(win.localStorage, `${STORE}stats`, stats); audio.end(); vibrate(win, [24, 35, 24], hapticOn); updateHud();
    overlay.classList.remove('hide'); modal.innerHTML = `<div class="eyebrow">Fin de ronde</div><h2>${isRecord ? 'Nouveau record !' : 'Atelier fermé'}</h2><p>${reason} ${isRecord ? 'Tu viens de battre ton meilleur score.' : 'Encore une ronde et les taupes vont demander une convention collective.'}</p><div class="result"><div><span>Score</span><strong>${formatScore(score)}</strong></div><div><span>Taupes</span><strong>${hits}</strong></div><div><span>Série</span><strong>${bestCombo}</strong></div></div><div class="actions"><button class="primary" id="again">Rejouer</button><button id="changeMode">Changer de mode</button></div>`;
    $('#again').onclick = () => startGame(); $('#changeMode').onclick = () => showModeMenu(); announce(`Partie terminée. Score ${score}. ${hits} taupes touchées.`);
  }

  function frame(now) {
    if (!running || ended) return; if (paused) { lastFrame = now; raf = win.requestAnimationFrame(frame); return; }
    if (!lastFrame) lastFrame = now; const delta = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000)); lastFrame = now; timeLeft -= delta; spawnClock += delta * 1000; resolveExpired(now); if (!running || ended) return;
    const interval = spawnFor(mode, level); if (spawnClock >= interval) { spawnClock %= interval; spawn(now); }
    if (timeLeft <= 0) { timeLeft = 0; updateHud(); endGame('Temps écoulé.'); return; } updateHud(); raf = win.requestAnimationFrame(frame);
  }

  function setPaused(value, auto = false) { if (!running || ended) return; paused = value; lastFrame = 0; updateHud(); setStatus(paused ? (auto ? '<strong>Pause automatique.</strong> Reviens quand tu veux.' : '<strong>Pause.</strong> Les taupes attendent.') : '<strong>Reprise.</strong> Tape les taupes, évite les leurres rouges.'); announce(paused ? 'Jeu en pause.' : 'Jeu repris.'); }

  function startGame() {
    win.cancelAnimationFrame(raf); clearBoard(); score = 0; hits = 0; misses = 0; combo = 0; bestCombo = 0; level = 1; lives = MODES[mode].lives; timeLeft = MODES[mode].duration; spawnClock = spawnFor(mode, 1) * 0.55; lastFrame = 0; ended = false; paused = false; running = true; overlay.classList.add('hide'); updateHud(); setStatus('<strong>Go.</strong> Tape les taupes brunes ou dorées. Évite les rouges.'); announce(`Mode ${MODES[mode].name}. Partie commencée.`); raf = win.requestAnimationFrame(frame); holes[4].focus({ preventScroll: true });
  }

  const renderModeButtons = () => Object.entries(MODES).map(([key, config]) => `<button class="mode ${key === mode ? 'on' : ''}" data-mode="${key}"><strong>${config.name}</strong><span>${config.description}</span></button>`).join('');

  function showModeMenu() {
    running = false; paused = false; ended = false; win.cancelAnimationFrame(raf); clearBoard(); overlay.classList.remove('hide');
    modal.innerHTML = `<div class="eyebrow">Atelier mécanique NOWIS</div><h2>Tape-taupe</h2><p>Tape les taupes dès qu’elles sortent. Plus tu réagis vite, plus tu marques. <strong>★ dorée</strong> donne du temps; le <strong>leurre rouge !</strong> doit être ignoré.</p><div class="modes">${renderModeButtons()}</div><div class="actions"><button class="primary" id="play">Jouer</button><button id="helpFromMenu">Comment jouer</button></div>`;
    modal.querySelectorAll('[data-mode]').forEach((button) => { button.onclick = () => { mode = button.dataset.mode; persistSettings(); showModeMenu(); }; }); $('#play').onclick = () => startGame(); $('#helpFromMenu').onclick = () => showHelp(true);
  }

  function showHelp(fromMenu = false) {
    const wasPlaying = running && !paused; if (wasPlaying) setPaused(true); overlay.classList.remove('hide');
    modal.innerHTML = `<div class="eyebrow">Aide</div><h2>Comment jouer</h2><div class="cards"><div><b>📱 Au doigt</b><span>Tape directement une taupe; chaque trou est une grande cible tactile.</span></div><div><b>⌨️ Au clavier</b><span>Tab sélectionne un trou; Entrée/Espace frappe. P ou Échap met en pause.</span></div><div><b>🔥 Série</b><span>Enchaîne les frappes pour monter jusqu’à ×3,5. Une erreur casse la série.</span></div><div><b>★ Bonus</b><span>La taupe dorée ajoute 2,5 s. Ignore le leurre rouge marqué !.</span></div></div><p>Toutes les 8 frappes, le niveau augmente : cadence, vitesse et doubles apparitions progressent.</p><div class="actions"><button class="primary" id="closeHelp">${fromMenu ? 'Retour aux modes' : 'Reprendre'}</button><button id="restartHelp">Rejouer</button></div>`;
    $('#closeHelp').onclick = () => { overlay.classList.add('hide'); if (fromMenu) showModeMenu(); else if (wasPlaying) setPaused(false); }; $('#restartHelp').onclick = () => startGame();
  }

  holes.forEach((hole, index) => {
    hole.addEventListener('pointerdown', (event) => { if (event.pointerType !== 'mouse' || event.button === 0) { event.preventDefault(); strike(index); } }, { passive: false });
    hole.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); strike(index); } });
  });
  doc.addEventListener('keydown', (event) => { if (event.key.toLowerCase() === 'p' || event.key === 'Escape') { if (!overlay.classList.contains('hide')) return; event.preventDefault(); setPaused(!paused); } });
  $('#pause').onclick = () => setPaused(!paused); $('#replay').onclick = () => startGame(); $('#help').onclick = () => showHelp(false); $('#modes').onclick = () => showModeMenu();
  $('#sound').onclick = () => { soundOn = !soundOn; audio.setEnabled(soundOn); persistSettings(); updateHud(); };
  $('#haptic').onclick = () => { hapticOn = !hapticOn; persistSettings(); updateHud(); };
  doc.addEventListener('visibilitychange', () => { if (doc.hidden && running && !paused && !ended) setPaused(true, true); });
  win.addEventListener('blur', () => { if (running && !paused && !ended) setPaused(true, true); });
  updateHud(); showModeMenu();
}
