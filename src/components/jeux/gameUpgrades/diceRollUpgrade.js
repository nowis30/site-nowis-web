const STORE = 'nowis:dice-forge:';
const SIDE_STEPS = [6, 8, 10, 12, 20];
const MODES = {
  free: { name: 'Atelier libre', desc: 'Configure 1 à 5 dés et explore les combinaisons.', duration: 0, lives: 0, attempts: 0, mult: 0.7 },
  classic: { name: 'Défi', desc: 'Atteins la cible en 3 lancers · 3 vies.', duration: 0, lives: 3, attempts: 3, mult: 1 },
  rush: { name: 'Rush 75 s', desc: 'Cibles en rafale · 2 lancers par cible.', duration: 75, lives: 0, attempts: 2, mult: 1.35 },
};

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

function difficultyFor(mode, level) {
  if (mode === 'free') return null;
  const stage = Math.max(0, level - 1);
  const dice = Math.min(5, 2 + Math.floor(stage / 4));
  const sideIndex = Math.min(SIDE_STEPS.length - 1, Math.floor(stage / 3));
  const sides = SIDE_STEPS[sideIndex];
  const attempts = mode === 'rush' ? 2 : level >= 9 ? 2 : 3;
  return { dice, sides, attempts };
}

function rollValues(win, count, sides) {
  return Array.from({ length: count }, () => 1 + randomInt(win, sides));
}

function makeTarget(win, count, sides) {
  return rollValues(win, count, sides).reduce((sum, value) => sum + value, 0);
}

function classify(values) {
  if (!values.length) return { label: 'Prêt', bonus: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const counts = new Map();
  sorted.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  const groups = [...counts.values()].sort((a, b) => b - a);
  const unique = [...counts.keys()].sort((a, b) => a - b);
  const straight = unique.length >= 4 && unique.every((value, index) => index === 0 || value === unique[index - 1] + 1);
  if (groups[0] === values.length && values.length >= 3) return { label: 'Tous identiques !', bonus: 420 + values.length * 80 };
  if (straight) return { label: 'Suite !', bonus: 260 + unique.length * 45 };
  if (groups[0] >= 4) return { label: 'Carré !', bonus: 330 };
  if (groups[0] === 3 && groups[1] === 2) return { label: 'Full !', bonus: 300 };
  if (groups[0] === 3) return { label: 'Brelan', bonus: 190 };
  if (groups[0] === 2 && groups[1] === 2) return { label: 'Deux paires', bonus: 140 };
  if (groups[0] === 2) return { label: 'Paire', bonus: 70 };
  return { label: 'Lancer simple', bonus: 15 };
}

function scoring(values, combo, mode, level) {
  const total = values.reduce((sum, value) => sum + value, 0);
  const category = classify(values);
  const chain = 1 + Math.min(1.6, Math.max(0, combo - 1) * 0.12);
  const levelBoost = 1 + Math.min(1.2, Math.max(0, level - 1) * 0.06);
  return {
    total,
    category,
    points: Math.round((total * 3 + category.bonus) * chain * MODES[mode].mult * levelBoost),
  };
}

function sound(win) {
  let ctx;
  let enabled = true;
  const tone = (frequency, duration = 0.07, type = 'triangle', gain = 0.024, delay = 0) => {
    if (!enabled) return;
    try {
      ctx ??= new (win.AudioContext || win.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const at = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, at);
      vol.gain.setValueAtTime(gain, at);
      vol.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      osc.connect(vol).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + duration);
    } catch { /* WebAudio non disponible */ }
  };
  return {
    roll() { [180, 240, 310].forEach((frequency, index) => tone(frequency, 0.045, 'square', 0.012, index * 0.028)); },
    hold() { tone(520, 0.05, 'sine', 0.018); },
    hit(combo) { tone(500 + Math.min(320, combo * 24), 0.08, 'triangle', 0.03); tone(760, 0.1, 'sine', 0.02, 0.05); },
    miss() { tone(150, 0.14, 'sawtooth', 0.026); },
    level() { [440, 554, 659, 880].forEach((frequency, index) => tone(frequency, 0.08, 'triangle', 0.024, index * 0.045)); },
    end() { [659, 523, 392].forEach((frequency, index) => tone(frequency, 0.11, 'triangle', 0.024, index * 0.07)); },
    set(value) { enabled = value; },
  };
}

const buzz = (win, pattern, enabled) => {
  if (!enabled) return;
  try { win.navigator?.vibrate?.(pattern); }
  catch { /* vibration non disponible */ }
};

export function upgradeDiceRollSimulator(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisDiceForge === 'true') return;
  root.dataset.nowisDiceForge = 'true';
  root.lang = 'fr';
  doc.title = 'Atelier des dés NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#120f0d;color:#f7edd8;font-family:Inter,ui-rounded,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{min-height:100dvh;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}button{font:inherit}.app{min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:7px;padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(9px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));background:radial-gradient(circle at 13% -6%,#d89f4d28,transparent 31%),radial-gradient(circle at 88% 8%,#2da59a22,transparent 27%),linear-gradient(145deg,#120f0d,#201713 48%,#101816)}.top,.hud,.table,.controls,.tools{width:min(100%,880px)}.top{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand small{display:block;color:#bea36f;font-size:9px;font-weight:950;letter-spacing:.18em;text-transform:uppercase}.brand h1{margin:2px 0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(26px,7vw,42px);line-height:.93;letter-spacing:-.045em;color:#f4dfb7;text-shadow:0 3px #0008}.topTools{display:flex;align-items:center;gap:5px}.badge,.btn,.modal button{min-height:44px;border:1px solid #cfad6b44;border-radius:13px;background:#1c1714e8;color:#f5e9d0;font-weight:900}.badge{display:flex;align-items:center;padding:0 10px;font-size:10px;color:#d5bf90}.btn,.modal button{cursor:pointer;touch-action:manipulation}.btn{padding:7px 10px}.btn:active,.modal button:active,.die:active{transform:scale(.97)}.btn:focus-visible,.modal button:focus-visible,.die:focus-visible{outline:3px solid #72d5c8;outline-offset:2px}.hud{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.stat{text-align:center;padding:6px 3px;border:1px solid #d6b47220;border-radius:11px;background:#15110fdd;box-shadow:inset 0 1px #fff1}.stat span{display:block;color:#9c8c73;font-size:8px;font-weight:950;text-transform:uppercase}.stat strong{display:block;color:#fff0ce;font-size:clamp(14px,4vw,20px);font-variant-numeric:tabular-nums}.table{position:relative;flex:1;min-height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;overflow:hidden;border:1px solid #bb985b4a;border-radius:27px;background:radial-gradient(circle at 50% 48%,#145f5848,transparent 45%),linear-gradient(155deg,#173c37,#102925 58%,#172019);box-shadow:0 28px 82px #000c,inset 0 1px #fff2}.table:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,#d3ae6710 1px,transparent 1px),linear-gradient(#d3ae6710 1px,transparent 1px);background-size:38px 38px;mask-image:linear-gradient(to bottom,#0008,transparent)}.target{position:relative;z-index:2;min-height:74px;display:grid;place-items:center;text-align:center;padding:8px 18px;border:1px solid #e4bd6a48;border-radius:18px;background:#11110dd9;box-shadow:0 10px 30px #0008}.target small{color:#9e8a69;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.14em}.target strong{display:block;color:#ffd98b;font-family:Georgia,"Times New Roman",serif;font-size:clamp(32px,9vw,52px);line-height:.9}.target em{display:block;color:#8fcfc6;font-size:10px;font-style:normal;font-weight:850;margin-top:4px}.dice{position:relative;z-index:3;display:grid;grid-template-columns:repeat(5,minmax(58px,96px));justify-content:center;gap:9px;width:min(96%,590px)}.die{position:relative;aspect-ratio:1;border:1px solid #ead7ac88;border-radius:20px;background:linear-gradient(145deg,#fff7e5,#d7c6a2);color:#271e18;box-shadow:0 15px 24px #0008,inset 5px 5px 10px #fff9,inset -5px -5px 10px #92795755;display:grid;place-items:center;cursor:pointer;touch-action:manipulation;transition:transform .16s,border-color .16s,filter .16s}.die .value{font-family:Georgia,"Times New Roman",serif;font-size:clamp(28px,8vw,48px);font-weight:1000;line-height:1}.die .kind{position:absolute;right:7px;bottom:5px;color:#79634d;font-size:8px;font-weight:950}.die.held{border-color:#73d7ca;filter:saturate(.8);box-shadow:0 0 0 4px #5dcbc044,0 15px 24px #0008,inset 5px 5px 10px #fff9}.die.held:before{content:"GARDÉ";position:absolute;top:5px;left:5px;padding:2px 5px;border-radius:999px;background:#17655d;color:#dffaf4;font-size:7px;font-weight:1000;letter-spacing:.08em}.die.rolling{animation:tumble .42s cubic-bezier(.2,.8,.2,1)}@keyframes tumble{0%{transform:rotate(-8deg) scale(.88)}35%{transform:rotate(8deg) translateY(-9px)}70%{transform:rotate(-5deg) translateY(3px)}100%{transform:none}}.message{position:relative;z-index:3;min-height:42px;text-align:center;color:#bdb098;font-size:12px;font-weight:800}.message b{display:block;color:#f0d18f;font-size:14px}.controls{display:grid;grid-template-columns:minmax(0,1.8fr) repeat(2,minmax(90px,.6fr));gap:6px}.roll{min-height:58px;border-color:#8cd8cb!important;background:linear-gradient(135deg,#87d7c8,#dbc080)!important;color:#14241f!important;font-size:16px}.mini{display:flex;align-items:center;justify-content:center;gap:4px}.mini span{min-width:30px;text-align:center;font-size:11px}.tools{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.tools .btn{font-size:10px;padding:7px 4px}.ov{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:18px;background:#090806e9;backdrop-filter:blur(12px)}.ov.hide{display:none}.modal{width:min(100%,540px);max-height:91dvh;overflow:auto;padding:21px;border:1px solid #c4a15f50;border-radius:24px;background:linear-gradient(150deg,#1b1714,#2a1d16 62%,#121816);box-shadow:0 34px 100px #000d}.ey{color:#b09a73;font-size:9px;font-weight:950;letter-spacing:.18em;text-transform:uppercase}.modal h2{margin:5px 0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(28px,8vw,40px);line-height:1;color:#f4dfb8}.modal p,.modal li{color:#bcb09c;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{min-height:58px;text-align:left;padding:11px 12px}.mode strong,.mode span{display:block}.mode span{margin-top:3px;color:#938777;font-size:11px}.mode.on{border-color:#76d0c4;background:#285d5740}.acts{display:grid;grid-template-columns:1fr 1fr;gap:7px}.modal button{padding:10px}.primary{color:#10201d!important;border-color:#87d7ca!important;background:linear-gradient(135deg,#9fe0d2,#e1c37c)!important}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0}.cards div{text-align:center;padding:9px 4px;border-radius:11px;border:1px solid #fff1;background:#11100e}.cards span{display:block;color:#8f8577;font-size:8px;text-transform:uppercase}.cards strong{display:block;color:#efd69f;font-size:17px}.record{margin:10px 0;padding:9px;border-radius:11px;border:1px solid #c6a35f38;background:#bc984c0e;color:#d8bd87;font-size:11px;font-weight:850}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@media(max-width:620px){.hud{grid-template-columns:repeat(3,1fr)}.stat:nth-child(n+4){display:none}.brand h1{font-size:27px}.table{min-height:280px}.dice{grid-template-columns:repeat(3,minmax(62px,92px));max-width:330px}.controls{grid-template-columns:1fr 1fr}.roll{grid-column:1/-1}.tools{grid-template-columns:repeat(4,1fr)}}@media(max-width:360px){.dice{gap:6px;grid-template-columns:repeat(3,minmax(56px,78px))}.die{border-radius:16px}.controls{gap:4px}.btn{padding:6px}.brand small{display:none}}@media(max-height:680px){.app{gap:4px}.brand small{display:none}.brand h1{font-size:24px}.stat{padding:4px 3px}.table{min-height:205px}.target{min-height:58px}.target strong{font-size:34px}.die{max-width:78px}.roll{min-height:50px}.tools .btn{min-height:40px}}@media(orientation:landscape) and (max-height:560px){.app{display:grid;grid-template-columns:minmax(255px,.72fr) minmax(420px,1.35fr);grid-template-rows:auto auto 1fr auto;column-gap:8px}.top,.hud,.controls,.tools,.table{width:100%}.table{grid-column:2;grid-row:1/5;height:calc(100dvh - 16px);min-height:0}.hud{grid-template-columns:repeat(3,1fr)}.hud .stat:nth-child(n+4){display:none}.controls{align-self:end}.tools{align-self:end}.dice{grid-template-columns:repeat(5,minmax(54px,76px))}.target{min-height:54px}.target strong{font-size:30px}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `<main class="app"><header class="top"><div class="brand"><small>Maison de jeu NOWIS</small><h1>Atelier des dés</h1></div><div class="topTools"><span class="badge" id="modeBadge">Défi</span><button class="btn" id="helpTop" aria-label="Ouvrir l’aide">?</button></div></header><section class="hud" aria-label="Statistiques"><div class="stat"><span>Score</span><strong id="score">0</strong></div><div class="stat"><span>Record</span><strong id="best">0</strong></div><div class="stat"><span>Niveau</span><strong id="level">1</strong></div><div class="stat"><span>Série</span><strong id="combo">0</strong></div><div class="stat"><span>Essais</span><strong id="attempts">—</strong></div><div class="stat"><span>Temps/Vies</span><strong id="status">♥♥♥</strong></div></section><section class="table" aria-label="Table de lancer"><div class="target" id="target"><div><small>Cible</small><strong id="targetValue">—</strong><em id="targetMeta">Lance les dés</em></div></div><div class="dice" id="dice" role="group" aria-label="Dés"></div><div class="message" id="message" aria-live="polite"><b>Prêt à lancer ?</b>Touche un dé après le lancer pour le garder.</div></section><section class="controls"><button class="btn roll" id="roll">🎲 Lancer les dés</button><button class="btn mini" id="diceCycle" aria-label="Changer le nombre de dés"><span id="diceCount">2 dés</span> ↻</button><button class="btn mini" id="sideNext" aria-label="Changer le nombre de faces"><span id="sideCount">D6</span> ↻</button></section><section class="tools"><button class="btn" id="pause">Pause</button><button class="btn" id="restart">Rejouer</button><button class="btn" id="sound">Son : oui</button><button class="btn" id="vibration">Vibre : oui</button></section><div class="sr" id="announce" aria-live="assertive"></div></main><div class="ov" id="overlay"><div class="modal" id="modal"></div></div>`;

  const $ = (selector) => doc.querySelector(selector);
  const overlay = $('#overlay');
  const modal = $('#modal');
  const diceBox = $('#dice');
  const rollButton = $('#roll');
  const audio = sound(win);
  const storage = win.localStorage;
  let mode = 'classic';
  let running = false;
  let paused = false;
  let rolling = false;
  let score = 0;
  let level = 1;
  let combo = 0;
  let successes = 0;
  let lives = 3;
  let timeLeft = 0;
  let attemptsLeft = 3;
  let diceCount = 2;
  let sides = 6;
  let values = [1, 1];
  let held = [false, false];
  let target = null;
  let lastTick = 0;
  let raf = 0;
  let soundOn = true;
  let vibrationOn = true;
  let stats = load(storage, `${STORE}stats`, {});

  function modeStats(key = mode) {
    return stats[key] || { bestScore: 0, bestLevel: 1, bestCombo: 0, games: 0 };
  }

  function storeStats() {
    const previous = modeStats();
    stats[mode] = {
      bestScore: Math.max(previous.bestScore || 0, score),
      bestLevel: Math.max(previous.bestLevel || 1, level),
      bestCombo: Math.max(previous.bestCombo || 0, combo),
      games: previous.games || 0,
    };
    save(storage, `${STORE}stats`, stats);
  }

  function renderDice(animate = false) {
    diceBox.innerHTML = values.map((value, index) => `<button class="die${held[index] ? ' held' : ''}${animate && !held[index] ? ' rolling' : ''}" data-index="${index}" aria-label="Dé ${index + 1} : ${value}, D${sides}${held[index] ? ', gardé' : ''}" aria-pressed="${held[index] ? 'true' : 'false'}"><span class="value">${value}</span><span class="kind">D${sides}</span></button>`).join('');
  }

  function setMessage(title, text = '') {
    $('#message').innerHTML = `<b>${title}</b>${text}`;
  }

  function hud() {
    const current = modeStats();
    $('#score').textContent = fmt(score);
    $('#best').textContent = fmt(Math.max(current.bestScore || 0, score));
    $('#level').textContent = String(level);
    $('#combo').textContent = String(combo);
    $('#attempts').textContent = mode === 'free' ? '∞' : String(attemptsLeft);
    $('#status').textContent = mode === 'rush' ? `${Math.ceil(timeLeft)} s` : mode === 'classic' ? `${'♥'.repeat(Math.max(0, lives))}${'·'.repeat(Math.max(0, 3 - lives))}` : 'Libre';
    $('#modeBadge').textContent = MODES[mode].name;
    $('#diceCount').textContent = `${diceCount} dé${diceCount > 1 ? 's' : ''}`;
    $('#sideCount').textContent = `D${sides}`;
    $('#diceCycle').disabled = running && mode !== 'free';
    $('#sideNext').disabled = running && mode !== 'free';
    $('#pause').textContent = paused ? 'Reprendre' : 'Pause';
    $('#sound').textContent = `Son : ${soundOn ? 'oui' : 'non'}`;
    $('#vibration').textContent = `Vibre : ${vibrationOn ? 'oui' : 'non'}`;
    rollButton.disabled = !running || paused || rolling;
    if (mode === 'free') {
      $('#targetValue').textContent = '∞';
      $('#targetMeta').textContent = 'Libre · touche les dés pour les garder';
    } else {
      $('#targetValue').textContent = target == null ? '—' : String(target);
      $('#targetMeta').textContent = `${diceCount}D${sides} · ${attemptsLeft} lancer${attemptsLeft > 1 ? 's' : ''}`;
    }
  }

  function applyDifficulty() {
    const difficulty = difficultyFor(mode, level);
    if (!difficulty) return;
    diceCount = difficulty.dice;
    sides = difficulty.sides;
    attemptsLeft = difficulty.attempts;
    values = Array(diceCount).fill(1);
    held = Array(diceCount).fill(false);
    target = makeTarget(win, diceCount, sides);
    renderDice();
  }

  function nextTarget() {
    const difficulty = difficultyFor(mode, level);
    attemptsLeft = difficulty ? difficulty.attempts : 0;
    held = Array(diceCount).fill(false);
    values = Array(diceCount).fill(1);
    target = makeTarget(win, diceCount, sides);
    renderDice();
    hud();
  }

  function finish(reason) {
    if (!running) return;
    running = false;
    paused = false;
    win.cancelAnimationFrame(raf);
    audio.end();
    buzz(win, [35, 55, 35], vibrationOn);
    const previous = modeStats();
    stats[mode] = {
      bestScore: Math.max(previous.bestScore || 0, score),
      bestLevel: Math.max(previous.bestLevel || 1, level),
      bestCombo: Math.max(previous.bestCombo || 0, combo),
      games: (previous.games || 0) + 1,
    };
    save(storage, `${STORE}stats`, stats);
    hud();
    overlay.classList.remove('hide');
    modal.innerHTML = `<div class="ey">Partie terminée</div><h2>${reason}</h2><div class="cards"><div><span>Score</span><strong>${fmt(score)}</strong></div><div><span>Niveau</span><strong>${level}</strong></div><div><span>Cibles</span><strong>${successes}</strong></div><div><span>Série</span><strong>${modeStats().bestCombo}</strong></div></div><div class="record">Record ${MODES[mode].name} : ${fmt(modeStats().bestScore)} points · niveau ${modeStats().bestLevel}</div><div class="acts"><button id="menu">Changer de mode</button><button class="primary" id="again">Rejouer</button></div>`;
    $('#menu').onclick = showMenu;
    $('#again').onclick = () => start(mode);
  }

  function completeTarget(result) {
    successes += 1;
    combo += 1;
    const bonus = Math.round((220 + attemptsLeft * 70 + level * 28) * MODES[mode].mult * (1 + Math.min(1.2, combo * 0.08)));
    score += result.points + bonus;
    const oldLevel = level;
    level = 1 + Math.floor(successes / 3);
    audio.hit(combo);
    buzz(win, combo >= 4 ? [18, 20, 18] : 20, vibrationOn);
    setMessage('Cible atteinte !', `+${fmt(result.points + bonus)} · série ${combo}`);
    $('#announce').textContent = `Cible ${target} atteinte. Série ${combo}.`;
    storeStats();
    if (level !== oldLevel) {
      audio.level();
      applyDifficulty();
      setMessage(`Niveau ${level}`, `Nouveau défi : ${diceCount}D${sides}`);
    } else {
      nextTarget();
    }
  }

  function failTarget(result) {
    combo = 0;
    audio.miss();
    buzz(win, 42, vibrationOn);
    if (mode === 'classic') {
      lives -= 1;
      if (lives <= 0) {
        finish('Plus de vies');
        return;
      }
      setMessage('Cible manquée', `Total ${result.total} · il reste ${lives} vie${lives > 1 ? 's' : ''}.`);
    } else if (mode === 'rush') {
      timeLeft = Math.max(0, timeLeft - 3);
      setMessage('Cible manquée', `Total ${result.total} · pénalité de 3 secondes.`);
    }
    nextTarget();
  }

  function resolveRoll() {
    const result = scoring(values, combo, mode, level);
    if (mode === 'free') {
      score += result.points;
      combo = result.category.bonus >= 140 ? combo + 1 : 0;
      level = 1 + Math.floor(score / 1800);
      setMessage(result.category.label, `Total ${result.total} · +${fmt(result.points)} points`);
      storeStats();
      $('#announce').textContent = `${result.category.label}. Total ${result.total}.`;
      hud();
      return;
    }
    if (result.total === target) {
      completeTarget(result);
      return;
    }
    attemptsLeft -= 1;
    if (attemptsLeft <= 0) {
      failTarget(result);
      return;
    }
    const difference = target - result.total;
    const direction = difference > 0 ? `Il manque ${difference}` : `Dépasse de ${Math.abs(difference)}`;
    setMessage(direction, `${attemptsLeft} lancer${attemptsLeft > 1 ? 's' : ''} restant${attemptsLeft > 1 ? 's' : ''} · garde les bons dés.`);
    $('#announce').textContent = `Total ${result.total}. ${direction}.`;
    hud();
  }

  function roll() {
    if (!running || paused || rolling) return;
    if (held.every(Boolean)) {
      setMessage('Tous les dés sont gardés', 'Libère au moins un dé pour relancer.');
      return;
    }
    rolling = true;
    audio.roll();
    values = values.map((value, index) => held[index] ? value : 1 + randomInt(win, sides));
    renderDice(true);
    hud();
    win.setTimeout(() => {
      rolling = false;
      renderDice();
      resolveRoll();
      hud();
    }, win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 40 : 430);
  }

  function toggleHold(index) {
    if (!running || paused || rolling || index < 0 || index >= held.length) return;
    held[index] = !held[index];
    audio.hold();
    buzz(win, 9, vibrationOn);
    renderDice();
    $('#announce').textContent = `Dé ${index + 1} ${held[index] ? 'gardé' : 'libéré'}.`;
  }

  function tick(now) {
    if (!running || paused || mode !== 'rush') return;
    if (!lastTick) lastTick = now;
    const delta = Math.min(0.1, (now - lastTick) / 1000);
    lastTick = now;
    timeLeft -= delta;
    if (timeLeft <= 0) {
      timeLeft = 0;
      hud();
      finish('Temps écoulé');
      return;
    }
    hud();
    raf = win.requestAnimationFrame(tick);
  }

  function start(selectedMode) {
    mode = selectedMode;
    running = true;
    paused = false;
    rolling = false;
    score = 0;
    level = 1;
    combo = 0;
    successes = 0;
    lives = MODES[mode].lives;
    timeLeft = MODES[mode].duration;
    lastTick = 0;
    if (mode === 'free') {
      diceCount = clamp(diceCount, 1, 5);
      sides = SIDE_STEPS.includes(sides) ? sides : 6;
      attemptsLeft = 0;
      target = null;
      values = Array(diceCount).fill(1);
      held = Array(diceCount).fill(false);
      renderDice();
    } else {
      applyDifficulty();
    }
    overlay.classList.add('hide');
    setMessage('Prêt à lancer ?', mode === 'free' ? 'Crée tes combinaisons et bats ton record.' : 'Touche un dé après le lancer pour le garder.');
    hud();
    if (mode === 'rush') raf = win.requestAnimationFrame(tick);
  }

  function showMenu() {
    running = false;
    paused = false;
    rolling = false;
    win.cancelAnimationFrame(raf);
    overlay.classList.remove('hide');
    modal.innerHTML = `<div class="ey">Atelier des dés</div><h2>Choisis ta table</h2><p>Lance, garde certains dés et construis le meilleur total. Les modes Défi et Rush deviennent plus exigeants avec les niveaux.</p><div class="modes">${Object.entries(MODES).map(([key, item]) => `<button class="mode${key === mode ? ' on' : ''}" data-mode="${key}"><strong>${item.name}</strong><span>${item.desc}</span></button>`).join('')}</div><div class="record">Records · Libre ${fmt(modeStats('free').bestScore)} · Défi ${fmt(modeStats('classic').bestScore)} · Rush ${fmt(modeStats('rush').bestScore)}</div><div class="acts"><button id="helpMenu">Comment jouer</button><button class="primary" id="play">Jouer</button></div>`;
    modal.querySelectorAll('[data-mode]').forEach((button) => {
      button.onclick = () => {
        mode = button.dataset.mode;
        showMenu();
      };
    });
    $('#helpMenu').onclick = () => showHelp(false);
    $('#play').onclick = () => start(mode);
  }

  function showHelp(wasPlaying = running && !paused) {
    if (wasPlaying) {
      paused = true;
      lastTick = 0;
      win.cancelAnimationFrame(raf);
    }
    overlay.classList.remove('hide');
    modal.innerHTML = `<div class="ey">Aide</div><h2>Lance, garde, ajuste</h2><ul><li><b>Touche un dé</b> pour le garder avant le lancer suivant.</li><li><b>Défi :</b> atteins la cible avant de manquer de lancers. Trois échecs terminent la partie.</li><li><b>Rush :</b> 75 secondes, deux lancers par cible. Une cible manquée retire 3 secondes.</li><li><b>Atelier libre :</b> choisis 1 à 5 dés et D6, D8, D10, D12 ou D20. Paires, suites, brelans et autres combinaisons donnent des bonus.</li><li>Toutes les 3 cibles réussies, le niveau augmente et introduit plus de dés ou davantage de faces.</li></ul><p><b>Clavier :</b> Espace/Entrée = lancer · 1 à 5 = garder/libérer un dé · P/Échap = pause.</p><div class="acts"><button id="helpMenuBack">Modes</button><button class="primary" id="closeHelp">${wasPlaying ? 'Reprendre' : 'Compris'}</button></div>`;
    $('#helpMenuBack').onclick = showMenu;
    $('#closeHelp').onclick = () => {
      if (!wasPlaying) { showMenu(); return; }
      overlay.classList.add('hide');
      paused = false;
      lastTick = 0;
      hud();
      if (mode === 'rush') raf = win.requestAnimationFrame(tick);
    };
  }

  function togglePause(auto = false) {
    if (!running || rolling) return;
    paused = !paused;
    lastTick = 0;
    if (paused) {
      win.cancelAnimationFrame(raf);
      setMessage(auto ? 'Pause automatique' : 'En pause', 'Reprends quand tu es prêt.');
    } else if (mode === 'rush') {
      raf = win.requestAnimationFrame(tick);
    }
    hud();
  }

  diceBox.addEventListener('click', (event) => {
    const button = event.target.closest('[data-index]');
    if (!button) return;
    toggleHold(Number(button.dataset.index));
  });
  rollButton.onclick = roll;
  $('#diceCycle').onclick = () => {
    if (mode !== 'free' || !running) return;
    diceCount = diceCount >= 5 ? 1 : diceCount + 1;
    values = Array(diceCount).fill(1);
    held = Array(diceCount).fill(false);
    renderDice();
    hud();
  };
  $('#sideNext').onclick = () => {
    if (mode !== 'free' || !running) return;
    const index = SIDE_STEPS.indexOf(sides);
    sides = SIDE_STEPS[(index + 1) % SIDE_STEPS.length];
    values = Array(diceCount).fill(1);
    held = Array(diceCount).fill(false);
    renderDice();
    hud();
  };
  $('#pause').onclick = () => togglePause(false);
  $('#restart').onclick = () => start(mode);
  $('#helpTop').onclick = () => showHelp(running && !paused);
  $('#sound').onclick = () => { soundOn = !soundOn; audio.set(soundOn); hud(); };
  $('#vibration').onclick = () => { vibrationOn = !vibrationOn; hud(); };
  doc.addEventListener('keydown', (event) => {
    if ((event.key === 'p' || event.key === 'P' || event.key === 'Escape') && running) {
      event.preventDefault();
      togglePause(false);
      return;
    }
    if (!running || paused || rolling) return;
    const tag = event.target?.tagName;
    if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      roll();
      return;
    }
    if (/^[1-5]$/.test(event.key)) {
      event.preventDefault();
      toggleHold(Number(event.key) - 1);
    }
  });
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden && running && !paused && !rolling) togglePause(true);
  });

  renderDice();
  hud();
  showMenu();
}
