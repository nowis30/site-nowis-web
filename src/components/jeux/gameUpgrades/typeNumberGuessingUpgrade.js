const STORE = 'nowis:type-number-guessing:';

const MODES = {
  relax: {
    name: 'Détente',
    desc: 'Plage douce · essais généreux · sans chrono',
    base: 50,
    growth: 1.48,
    extraAttempts: 5,
    multiplier: 0.8,
    time: 0,
  },
  classic: {
    name: 'Classique',
    desc: 'Plage équilibrée · logique et efficacité',
    base: 100,
    growth: 1.68,
    extraAttempts: 2,
    multiplier: 1,
    time: 0,
  },
  chrono: {
    name: 'Chrono',
    desc: '75 secondes · monte les niveaux sans t’arrêter',
    base: 100,
    growth: 1.82,
    extraAttempts: 1,
    multiplier: 1.35,
    time: 75,
  },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
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

function roundNice(value) {
  if (value <= 100) return Math.max(10, Math.round(value / 10) * 10);
  if (value <= 1000) return Math.round(value / 25) * 25;
  return Math.round(value / 100) * 100;
}

function rangeMax(mode, level) {
  const config = MODES[mode];
  return clamp(roundNice(config.base * config.growth ** Math.max(0, level - 1)), config.base, 9999);
}

function attemptLimit(mode, level) {
  const max = rangeMax(mode, level);
  const binaryMinimum = Math.ceil(Math.log2(max));
  return clamp(binaryMinimum + MODES[mode].extraAttempts, 7, 18);
}

function randomTarget(max) {
  return 1 + Math.floor(Math.random() * max);
}

function proximity(diff, span) {
  const ratio = diff / Math.max(1, span);
  if (ratio <= 0.02) return { label: 'Brûlant', icon: '◆', rank: 4 };
  if (ratio <= 0.06) return { label: 'Très chaud', icon: '●', rank: 3 };
  if (ratio <= 0.15) return { label: 'Chaud', icon: '◉', rank: 2 };
  if (ratio <= 0.3) return { label: 'Tiède', icon: '○', rank: 1 };
  return { label: 'Froid', icon: '◇', rank: 0 };
}

function formatTime(value) {
  const seconds = Math.max(0, Math.ceil(value));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function scoreForRound(state) {
  const mode = MODES[state.mode];
  const efficiency = Math.max(0, state.attemptsLeft) * 95;
  const precision = Math.max(0, 260 - state.roundElapsed * 4);
  const streak = Math.min(8, state.streak) * 55;
  return Math.round((420 * state.level + efficiency + precision + streak) * mode.multiplier);
}

export function upgradeTypeNumberGuessing(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisTypeNumberGuessingPro === 'true') return;
  root.dataset.nowisTypeNumberGuessingPro = 'true';
  root.lang = 'fr';
  doc.title = 'Devine le nombre NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#100c0d;color:#fff9e9;font-family:Inter,ui-rounded,system-ui,-apple-system,"Segoe UI",sans-serif}body{min-height:100dvh;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}button,input{font:inherit}.vault{min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:7px;padding:max(7px,env(safe-area-inset-top)) max(7px,env(safe-area-inset-right)) max(9px,env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));background:radial-gradient(circle at 15% -10%,#ad7b2d24,transparent 32%),radial-gradient(circle at 88% 4%,#0f766e26,transparent 28%),linear-gradient(150deg,#100c0d,#1b1012 58%,#101919)}.head,.hud,.machine,.tools,.status{width:min(100%,780px)}.head{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand small{display:block;color:#c6a86a;font-size:9px;font-weight:950;letter-spacing:.18em;text-transform:uppercase}.brand h1{margin:2px 0 0;font-size:clamp(25px,7vw,39px);line-height:.92;letter-spacing:-.055em;color:#fff5d8}.right{display:flex;align-items:center;gap:6px}.chip{padding:7px 10px;border-radius:999px;border:1px solid #c9a66555;background:#181011dd;color:#ead6ac;font-size:10px;font-weight:950}.b,.key,.mode,.modal button{min-height:44px;border:1px solid #efdba024;border-radius:14px;background:linear-gradient(180deg,#26191a,#171011);color:#fff5da;font-weight:900;cursor:pointer;touch-action:manipulation}.b:active,.key:active,.mode:active,.modal button:active{transform:scale(.97)}.b:focus-visible,.key:focus-visible,.mode:focus-visible,.modal button:focus-visible,input:focus-visible{outline:3px solid #61c9bd;outline-offset:2px}.icon{min-width:44px}.hud{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.stat{text-align:center;padding:6px 2px;border:1px solid #f4dca417;border-radius:12px;background:#171112cf}.stat span{display:block;color:#aa9383;font-size:8px;font-weight:950;text-transform:uppercase;white-space:nowrap}.stat strong{display:block;font-size:clamp(14px,4vw,20px);font-variant-numeric:tabular-nums}.machine{position:relative;flex:1;min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:8px;padding:clamp(9px,2.8vw,17px);overflow:hidden;border:1px solid #d6b46c4d;border-radius:25px;background:linear-gradient(145deg,#5c4527,#b18a49 5px,#25191a 7px,#160f10 70%,#0d1817);box-shadow:0 25px 75px #000b,inset 0 1px #f7d99177}.machine:before{content:"";position:absolute;inset:8px;border:1px solid #dcb96d20;border-radius:19px;pointer-events:none}.range{position:relative;z-index:1;padding:10px 12px;border-radius:17px;background:#0d1716d9;border:1px solid #55a89f38}.rangeTop{display:flex;align-items:flex-end;justify-content:space-between;gap:8px}.rangeTop span{color:#8dbbb4;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.rangeTop strong{font-size:clamp(18px,5vw,27px);font-variant-numeric:tabular-nums;color:#e8d3a2}.rail{position:relative;height:11px;margin-top:8px;border-radius:999px;background:#070c0c;border:1px solid #fff1;overflow:hidden}.window{position:absolute;top:1px;bottom:1px;border-radius:999px;background:linear-gradient(90deg,#2d766d,#62c2b5);box-shadow:0 0 18px #53b7a966}.marks{display:flex;justify-content:space-between;margin-top:4px;color:#7e7166;font-size:8px;font-weight:800}.console{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(180px,.85fr);gap:8px;min-height:0}.panel{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:7px;min-height:0;padding:10px;border-radius:19px;border:1px solid #efd9a61f;background:radial-gradient(circle at 50% 0,#bd8f3820,transparent 50%),#160f10d9}.hintIcon{display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;border:1px solid #cfb17150;background:#231919;box-shadow:inset 0 0 0 5px #0e0b0c,0 0 25px #b7862f20;color:#d8ba77;font-size:22px}.hint{min-height:48px;text-align:center}.hint strong{display:block;font-size:clamp(19px,5vw,30px);line-height:1;color:#fff4d5}.hint span{display:block;margin-top:5px;color:#b9a89a;font-size:11px;line-height:1.3}.entry{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;width:min(100%,330px)}.entry input{min-width:0;height:54px;border:1px solid #d5b36a52;border-radius:15px;background:#090808;color:#fff3ce;text-align:center;font-size:clamp(23px,7vw,32px);font-weight:950;font-variant-numeric:tabular-nums;caret-color:#67cbbf}.entry .guess{min-width:92px;padding:0 12px;border-color:#74cfc15e;background:linear-gradient(135deg,#1f6b63,#2e9186);color:white}.keypad{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;width:min(100%,330px)}.key{min-height:43px;font-size:16px}.key.alt{color:#d8bd85;background:#131010}.history{position:relative;z-index:1;min-height:0;overflow:auto;padding:9px;border-radius:19px;border:1px solid #efd9a61f;background:#0d0b0cbd;scrollbar-width:thin}.history h2{margin:0 0 7px;color:#bda476;font-size:9px;text-transform:uppercase;letter-spacing:.13em}.historyList{display:flex;flex-direction:column;gap:5px}.empty{padding:15px 5px;color:#766e68;text-align:center;font-size:11px}.try{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;min-height:36px;padding:5px 7px;border-radius:10px;background:#181112;border:1px solid #fff1}.try b{min-width:42px;color:#fff0c7;font-variant-numeric:tabular-nums}.try span{color:#af9c8c;font-size:9px;font-weight:850}.try em{font-style:normal;color:#7fd5c9;font-size:11px;font-weight:950}.status{min-height:34px;display:flex;align-items:center;justify-content:center;padding:6px 10px;border-radius:12px;border:1px solid #efd9a616;background:#171112c7;color:#bca99b;text-align:center;font-size:11px;font-weight:800}.status strong{color:#e3c37f}.tools{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.tools .b{min-height:39px;padding:4px;font-size:10px}.tools .b[aria-pressed=false]{color:#766b65}.ov{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:18px;background:#090708e8;backdrop-filter:blur(13px)}.ov.hide{display:none}.modal{width:min(100%,500px);max-height:90dvh;overflow:auto;padding:21px;border:1px solid #d3b36b42;border-radius:25px;background:linear-gradient(155deg,#1c1314,#251718 60%,#10201e);box-shadow:0 32px 90px #000c}.eye{color:#c2a364;font-size:9px;font-weight:950;letter-spacing:.17em;text-transform:uppercase}.modal h2{margin:4px 0;font-size:clamp(27px,8vw,38px);line-height:1;color:#fff1ce}.modal p,.modal li{color:#c4b3a5;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{text-align:left;padding:12px}.mode strong,.mode span{display:block}.mode span{margin-top:3px;color:#9d8b80;font-size:11px}.mode.on{border-color:#64c8ba66;background:#16463f44}.acts{display:grid;grid-template-columns:1fr 1fr;gap:7px}.modal button{padding:10px}.primary{border-color:#74d2c45c!important;background:linear-gradient(135deg,#2b8176,#54b8ab)!important;color:white!important}.results{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:14px 0}.results div{text-align:center;padding:9px 3px;border-radius:12px;background:#0d0b0c99}.results span{display:block;color:#907f73;font-size:8px;text-transform:uppercase}.results strong{font-size:18px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@keyframes pulse{50%{transform:scale(1.08);box-shadow:0 0 34px #65cbbc66}}@keyframes nudge{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}.hot .hintIcon{animation:pulse .55s}.badInput{animation:nudge .25s}
@media(max-width:650px){.hud{grid-template-columns:repeat(3,1fr)}.stat:nth-child(n+4){display:none}.brand h1{font-size:28px}.machine{border-radius:19px;padding:8px}.console{grid-template-columns:1fr}.panel{padding:7px}.history{max-height:112px}.hintIcon{width:38px;height:38px}.hint{min-height:38px}.entry input{height:49px}.key{min-height:40px}.tools .b{font-size:9px}.status{font-size:10px}}
@media(max-width:390px){.brand h1{font-size:24px}.chip{padding:6px 8px}.machine{gap:5px}.range{padding:7px 9px}.panel{gap:5px}.keypad{gap:4px}.key{min-height:37px}.history{max-height:92px}.tools .b{font-size:8px}.hud .stat{padding:4px 2px}}
@media(max-height:720px){.status{display:none}.brand h1{font-size:25px}.hud .stat{padding:4px 2px}.tools .b{min-height:34px}.machine{gap:5px}.range{padding:6px 9px}.hintIcon{display:none}.hint{min-height:auto}.panel{gap:4px;padding:6px}.entry input{height:45px}.key{min-height:35px}.history{max-height:105px}}
@media(orientation:landscape) and (max-height:540px){.vault{display:grid;grid-template-columns:220px minmax(360px,1fr) 175px;grid-template-rows:auto auto 1fr auto;column-gap:8px;align-items:start}.head{grid-column:1}.hud{grid-column:1;grid-template-columns:repeat(3,1fr)}.machine{grid-column:2;grid-row:1/5;height:calc(100dvh - 16px)}.status{grid-column:1;display:flex}.tools{grid-column:3;grid-row:1/4;grid-template-columns:1fr}.tools .b{min-height:44px}.right .chip{display:none}.console{grid-template-columns:1fr .8fr}.history{max-height:none}.key{min-height:34px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}}
`;
  doc.head.appendChild(style);

  doc.body.innerHTML = `<main class="vault" aria-label="Devine le nombre NOWIS">
    <header class="head"><div class="brand"><small>Chambre des codes</small><h1>Devine le nombre</h1></div><div class="right"><span class="chip" id="modeChip">Classique</span><button class="b icon" id="pause" aria-label="Mettre en pause">Ⅱ</button></div></header>
    <section class="hud" aria-label="Statistiques"><div class="stat"><span>Score</span><strong id="score">0</strong></div><div class="stat"><span>Record</span><strong id="record">0</strong></div><div class="stat"><span>Niveau</span><strong id="level">1</strong></div><div class="stat"><span>Essais</span><strong id="attempts">0</strong></div><div class="stat"><span>Série</span><strong id="streak">0</strong></div><div class="stat"><span>Temps</span><strong id="time">—</strong></div></section>
    <section class="machine"><div class="range"><div class="rangeTop"><div><span>Zone encore possible</span><strong id="rangeLabel">1 — 100</strong></div><span id="rangeCount">100 nombres</span></div><div class="rail" aria-hidden="true"><i class="window" id="window"></i></div><div class="marks"><span>1</span><span id="maxMark">100</span></div></div>
      <div class="console"><section class="panel" id="panel"><div class="hintIcon" id="hintIcon" aria-hidden="true">?</div><div class="hint" id="hint"><strong>Quel est le code ?</strong><span>Entre un nombre entre 1 et 100.</span></div><div class="entry"><input id="guessInput" inputmode="numeric" autocomplete="off" pattern="[0-9]*" aria-label="Nombre à proposer"><button class="b guess" id="guess">Valider</button></div><div class="keypad" id="keypad" aria-label="Clavier numérique"><button class="key" data-key="1">1</button><button class="key" data-key="2">2</button><button class="key" data-key="3">3</button><button class="key" data-key="4">4</button><button class="key" data-key="5">5</button><button class="key" data-key="6">6</button><button class="key" data-key="7">7</button><button class="key" data-key="8">8</button><button class="key" data-key="9">9</button><button class="key alt" data-key="clear" aria-label="Effacer">C</button><button class="key" data-key="0">0</button><button class="key alt" data-key="back" aria-label="Effacer le dernier chiffre">⌫</button></div></section>
      <aside class="history" aria-label="Historique des essais"><h2>Journal de décryptage</h2><div class="historyList" id="history"><div class="empty">Tes indices apparaîtront ici.</div></div></aside></div></section>
    <div class="status" id="status" aria-live="polite">Trouve le nombre secret avec le moins d’essais possible.</div>
    <nav class="tools" aria-label="Commandes"><button class="b" id="menu">Mode</button><button class="b" id="restart">Rejouer</button><button class="b" id="help">Aide</button><button class="b" id="sound" aria-pressed="true">Son ✓</button><button class="b" id="vibe" aria-pressed="true">Vibre ✓</button></nav><div class="sr" id="announce" aria-live="assertive"></div>
  </main>
  <div class="ov" id="start"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="startTitle"><div class="eye">NOWIS · logique et intuition</div><h2 id="startTitle">Ouvre le coffre</h2><p>Propose un nombre. Le système te dit si le code est plus haut ou plus bas et réduit la zone possible. Enchaîne les niveaux pour battre ton record.</p><div class="modes" id="modes"></div><div class="acts"><button id="how">Comment jouer</button><button class="primary" id="go">Commencer</button></div></section></div>
  <div class="ov hide" id="helpOv"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="helpTitle"><div class="eye">Aide</div><h2 id="helpTitle">Déduis le code</h2><ul><li>Entre un nombre puis touche <strong>Valider</strong>.</li><li>« Plus haut » signifie que le nombre secret est supérieur à ton essai; « Plus bas » signifie l’inverse.</li><li>La jauge montre uniquement la zone qui reste possible.</li><li>Un nombre déjà éliminé ou déjà joué ne coûte aucun essai.</li><li>Clavier : chiffres, Retour arrière, Entrée pour valider, P pour pause.</li></ul><div class="acts"><button id="helpMenu">Changer de mode</button><button class="primary" id="closeHelp">Compris</button></div></section></div>
  <div class="ov hide" id="round"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="roundTitle"><div class="eye">Code trouvé</div><h2 id="roundTitle">Coffre ouvert ✦</h2><div class="results"><div><span>Score</span><strong id="rScore">0</strong></div><div><span>Essais</span><strong id="rAttempts">0</strong></div><div><span>Code</span><strong id="rTarget">0</strong></div></div><p id="roundText"></p><div class="acts"><button id="roundMenu">Menu</button><button class="primary" id="next">Niveau suivant</button></div></section></div>
  <div class="ov hide" id="pauseOv"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="pauseTitle"><div class="eye">Pause</div><h2 id="pauseTitle">Coffre verrouillé</h2><p>Le chrono est arrêté et les indices sont masqués jusqu’à la reprise.</p><div class="acts"><button id="pauseMenu">Menu</button><button class="primary" id="resume">Reprendre</button></div></section></div>`;

  const $ = (id) => doc.getElementById(id);
  const storage = win.localStorage;
  const stats = load(storage, STORE + 'stats', {
    bestScore: 0,
    bestLevel: 1,
    bestStreak: 0,
    games: 0,
    wins: 0,
    guesses: 0,
  });
  const prefs = load(storage, STORE + 'prefs', { mode: 'classic', sound: true, vibe: true });
  if (!MODES[prefs.mode]) prefs.mode = 'classic';

  const state = {
    mode: prefs.mode,
    level: 1,
    score: 0,
    target: 1,
    max: 100,
    low: 1,
    high: 100,
    attemptLimit: 8,
    attemptsLeft: 8,
    guesses: [],
    streak: 0,
    elapsed: 0,
    roundElapsed: 0,
    remaining: MODES[prefs.mode].time,
    paused: false,
    ended: false,
    started: false,
    sound: prefs.sound !== false,
    vibe: prefs.vibe !== false,
    tick: null,
  };

  let audio = null;
  function tone(freq, duration = 0.07, volume = 0.025, type = 'sine') {
    if (!state.sound) return;
    try {
      audio ||= new (win.AudioContext || win.webkitAudioContext)();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.value = freq;
      gain.gain.setValueAtTime(volume, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
    } catch {}
  }
  function buzz(pattern) {
    if (!state.vibe) return;
    try {
      win.navigator.vibrate?.(pattern);
    } catch {}
  }
  function announce(text) {
    $('announce').textContent = '';
    win.setTimeout(() => { $('announce').textContent = text; }, 10);
  }
  function persistPrefs() {
    prefs.mode = state.mode;
    prefs.sound = state.sound;
    prefs.vibe = state.vibe;
    save(storage, STORE + 'prefs', prefs);
  }

  function currentRecord() {
    return Math.max(stats.bestScore || 0, state.score);
  }

  function updateWindow() {
    const total = Math.max(1, state.max);
    const left = ((state.low - 1) / total) * 100;
    const width = ((state.high - state.low + 1) / total) * 100;
    $('window').style.left = `${clamp(left, 0, 100)}%`;
    $('window').style.width = `${clamp(width, 0.7, 100)}%`;
  }

  function hud() {
    $('score').textContent = state.score;
    $('record').textContent = currentRecord();
    $('level').textContent = state.level;
    $('attempts').textContent = `${state.attemptsLeft}/${state.attemptLimit}`;
    $('streak').textContent = state.streak;
    $('time').textContent = MODES[state.mode].time ? formatTime(state.remaining) : formatTime(state.roundElapsed);
    $('modeChip').textContent = MODES[state.mode].name;
    $('rangeLabel').textContent = `${state.low} — ${state.high}`;
    $('rangeCount').textContent = `${Math.max(1, state.high - state.low + 1)} nombres`;
    $('maxMark').textContent = state.max;
    $('sound').textContent = state.sound ? 'Son ✓' : 'Son —';
    $('sound').setAttribute('aria-pressed', String(state.sound));
    $('vibe').textContent = state.vibe ? 'Vibre ✓' : 'Vibre —';
    $('vibe').setAttribute('aria-pressed', String(state.vibe));
    updateWindow();
  }

  function renderHistory() {
    const host = $('history');
    if (!state.guesses.length) {
      host.innerHTML = '<div class="empty">Tes indices apparaîtront ici.</div>';
      return;
    }
    host.innerHTML = state.guesses.slice().reverse().map((item) => {
      const direction = item.direction === 'up' ? 'Plus haut' : 'Plus bas';
      const arrow = item.direction === 'up' ? '↑' : '↓';
      return `<div class="try"><b>${item.value}</b><span>${item.proximity}</span><em>${arrow} ${direction}</em></div>`;
    }).join('');
  }

  function setHint(title, detail, icon = '?', hot = false) {
    $('hint').innerHTML = `<strong>${title}</strong><span>${detail}</span>`;
    $('hintIcon').textContent = icon;
    $('panel').classList.toggle('hot', hot);
  }

  function status(text) {
    $('status').innerHTML = text;
  }

  function timer() {
    if (state.tick) return;
    state.tick = win.setInterval(() => {
      if (!state.started || state.paused || state.ended || !$('start').classList.contains('hide') || !$('round').classList.contains('hide')) return;
      state.roundElapsed += 1;
      state.elapsed += 1;
      if (MODES[state.mode].time) {
        state.remaining = Math.max(0, state.remaining - 1);
        if (state.remaining > 0 && state.remaining <= 10) tone(410, 0.035, 0.012, 'square');
        if (!state.remaining) finishRun('Temps écoulé');
      }
      hud();
    }, 1000);
  }

  function setupRound(keepRun = true) {
    if (!keepRun) {
      state.level = 1;
      state.score = 0;
      state.streak = 0;
      state.elapsed = 0;
      state.remaining = MODES[state.mode].time;
    }
    state.max = rangeMax(state.mode, state.level);
    state.low = 1;
    state.high = state.max;
    state.target = randomTarget(state.max);
    state.attemptLimit = attemptLimit(state.mode, state.level);
    state.attemptsLeft = state.attemptLimit;
    state.guesses = [];
    state.roundElapsed = 0;
    state.paused = false;
    state.ended = false;
    state.started = true;
    $('guessInput').value = '';
    $('round').classList.add('hide');
    $('pauseOv').classList.add('hide');
    $('pause').textContent = 'Ⅱ';
    $('pause').setAttribute('aria-label', 'Mettre en pause');
    setHint('Quel est le code ?', `Entre un nombre entre 1 et ${state.max}.`);
    status(`Niveau <strong>${state.level}</strong> · ${state.attemptLimit} essais pour ouvrir le coffre.`);
    renderHistory();
    hud();
    timer();
    win.setTimeout(() => $('guessInput')?.focus(), 20);
  }

  function invalidInput(message) {
    const input = $('guessInput');
    input.classList.remove('badInput');
    void input.offsetWidth;
    input.classList.add('badInput');
    tone(150, 0.06, 0.018, 'square');
    buzz(20);
    status(message);
    announce(message.replace(/<[^>]+>/g, ''));
  }

  function parseGuess() {
    const raw = $('guessInput').value.replace(/\D/g, '').slice(0, 4);
    $('guessInput').value = raw;
    return raw ? Number(raw) : NaN;
  }

  function submitGuess() {
    if (!state.started || state.paused || state.ended || !$('round').classList.contains('hide')) return;
    const value = parseGuess();
    if (!Number.isInteger(value)) {
      invalidInput('Entre d’abord un <strong>nombre</strong>.');
      return;
    }
    if (value < 1 || value > state.max) {
      invalidInput(`Le code est compris entre <strong>1 et ${state.max}</strong>.`);
      return;
    }
    if (value < state.low || value > state.high) {
      invalidInput(`Ce nombre est déjà exclu. Reste entre <strong>${state.low} et ${state.high}</strong>.`);
      return;
    }
    if (state.guesses.some((guess) => guess.value === value)) {
      invalidInput('<strong>Déjà essayé.</strong> Cet essai ne compte pas.');
      return;
    }

    state.attemptsLeft -= 1;
    stats.guesses += 1;
    $('guessInput').value = '';

    if (value === state.target) {
      state.streak += 1;
      const gain = scoreForRound(state);
      state.score += gain;
      stats.wins += 1;
      stats.bestScore = Math.max(stats.bestScore || 0, state.score);
      stats.bestLevel = Math.max(stats.bestLevel || 1, state.level);
      stats.bestStreak = Math.max(stats.bestStreak || 0, state.streak);
      save(storage, STORE + 'stats', stats);
      hud();
      setHint('Code trouvé !', `${value} ouvre le coffre. +${gain} points.`, '✦', true);
      status(`Parfait : <strong>${value}</strong> était le nombre secret.`);
      tone(620, 0.11, 0.035, 'triangle');
      win.setTimeout(() => tone(820, 0.11, 0.03, 'triangle'), 85);
      win.setTimeout(() => tone(1040, 0.12, 0.022, 'sine'), 165);
      buzz([24, 35, 24, 35, 48]);
      announce(`Code trouvé : ${value}. Gain ${gain} points.`);
      win.setTimeout(roundWon, 320);
      return;
    }

    const direction = value < state.target ? 'up' : 'down';
    if (direction === 'up') state.low = Math.max(state.low, value + 1);
    else state.high = Math.min(state.high, value - 1);
    const prox = proximity(Math.abs(value - state.target), state.max);
    state.guesses.push({ value, direction, proximity: prox.label });
    renderHistory();
    hud();
    const wording = direction === 'up' ? 'Plus haut ↑' : 'Plus bas ↓';
    setHint(wording, `${prox.label} · zone restante : ${state.low} à ${state.high}.`, prox.icon, prox.rank >= 3);
    status(`<strong>${wording}</strong> · ${state.attemptsLeft} essai${state.attemptsLeft === 1 ? '' : 's'} restant${state.attemptsLeft === 1 ? '' : 's'}.`);
    tone(direction === 'up' ? 520 : 260, 0.055, 0.022, 'triangle');
    buzz(prox.rank >= 3 ? [12, 20, 12] : 12);
    announce(`${wording}. ${prox.label}. ${state.attemptsLeft} essais restants.`);

    if (state.attemptsLeft <= 0) {
      state.streak = 0;
      win.setTimeout(() => finishRun('Plus d’essais'), 260);
      return;
    }
    win.setTimeout(() => $('guessInput')?.focus(), 20);
  }

  function roundWon() {
    if (state.ended) return;
    const used = state.attemptLimit - state.attemptsLeft;
    $('rScore').textContent = state.score;
    $('rAttempts').textContent = used;
    $('rTarget').textContent = state.target;
    $('roundTitle').textContent = 'Coffre ouvert ✦';
    const nextMax = rangeMax(state.mode, state.level + 1);
    $('roundText').textContent = MODES[state.mode].time
      ? `Série ×${state.streak}. +8 secondes au prochain niveau. Prochaine plage : 1 à ${nextMax}.`
      : `Série ×${state.streak}. Prochaine plage : 1 à ${nextMax}.`;
    $('next').textContent = 'Niveau suivant';
    delete $('next').dataset.replay;
    $('round').classList.remove('hide');
  }

  function finishRun(reason) {
    if (state.ended) return;
    state.ended = true;
    state.started = false;
    stats.bestScore = Math.max(stats.bestScore || 0, state.score);
    stats.bestLevel = Math.max(stats.bestLevel || 1, state.level);
    stats.bestStreak = Math.max(stats.bestStreak || 0, state.streak);
    save(storage, STORE + 'stats', stats);
    $('rScore').textContent = state.score;
    $('rAttempts').textContent = state.attemptLimit - state.attemptsLeft;
    $('rTarget').textContent = state.target;
    $('roundTitle').textContent = reason;
    $('roundText').textContent = `Le code était ${state.target}. Record : ${stats.bestScore} · meilleur niveau : ${stats.bestLevel}.`;
    $('next').textContent = 'Rejouer';
    $('next').dataset.replay = '1';
    $('round').classList.remove('hide');
    setHint('Coffre verrouillé', `Le code était ${state.target}.`, '×');
    tone(135, 0.2, 0.035, 'sawtooth');
    buzz([55, 55, 55]);
    announce(`${reason}. Le code était ${state.target}. Score ${state.score}.`);
  }

  function renderModes() {
    $('modes').innerHTML = Object.entries(MODES).map(([key, mode]) => `<button class="mode${state.mode === key ? ' on' : ''}" data-mode="${key}"><strong>${mode.name}</strong><span>${mode.desc}</span></button>`).join('');
    $('modes').querySelectorAll('.mode').forEach((node) => node.addEventListener('click', () => {
      state.mode = node.dataset.mode;
      state.remaining = MODES[state.mode].time;
      persistPrefs();
      renderModes();
      hud();
      tone(430, 0.05, 0.02, 'triangle');
    }));
  }

  function openMenu() {
    state.paused = false;
    state.started = false;
    ['pauseOv', 'round', 'helpOv'].forEach((id) => $(id).classList.add('hide'));
    $('start').classList.remove('hide');
    renderModes();
  }

  function startGame() {
    stats.games += 1;
    save(storage, STORE + 'stats', stats);
    persistPrefs();
    $('start').classList.add('hide');
    $('helpOv').classList.add('hide');
    setupRound(false);
  }

  function pause(force) {
    if (!state.started || state.ended || !$('start').classList.contains('hide') || !$('round').classList.contains('hide')) return;
    const next = typeof force === 'boolean' ? force : !state.paused;
    state.paused = next;
    $('pauseOv').classList.toggle('hide', !next);
    $('pause').textContent = next ? '▶' : 'Ⅱ';
    $('pause').setAttribute('aria-label', next ? 'Reprendre le jeu' : 'Mettre en pause');
    announce(next ? 'Jeu en pause.' : 'Jeu repris.');
    if (!next) win.setTimeout(() => $('guessInput')?.focus(), 20);
  }

  function appendDigit(digit) {
    if (!state.started || state.paused || state.ended) return;
    const input = $('guessInput');
    const maxLength = String(state.max).length;
    input.value = (input.value.replace(/\D/g, '') + digit).slice(0, maxLength);
    tone(330 + Number(digit) * 12, 0.025, 0.008, 'sine');
  }

  $('guessInput').addEventListener('input', () => {
    const maxLength = String(state.max).length;
    $('guessInput').value = $('guessInput').value.replace(/\D/g, '').slice(0, maxLength);
  });
  $('guess').addEventListener('click', submitGuess);
  $('keypad').querySelectorAll('[data-key]').forEach((button) => button.addEventListener('click', () => {
    const key = button.dataset.key;
    if (key === 'clear') $('guessInput').value = '';
    else if (key === 'back') $('guessInput').value = $('guessInput').value.slice(0, -1);
    else appendDigit(key);
  }));
  $('pause').addEventListener('click', () => pause());
  $('resume').addEventListener('click', () => pause(false));
  $('menu').addEventListener('click', openMenu);
  $('pauseMenu').addEventListener('click', openMenu);
  $('roundMenu').addEventListener('click', openMenu);
  $('restart').addEventListener('click', () => {
    if (!$('start').classList.contains('hide')) return startGame();
    state.streak = 0;
    setupRound(false);
  });
  $('go').addEventListener('click', startGame);
  $('next').addEventListener('click', () => {
    if ($('next').dataset.replay === '1') {
      startGame();
      return;
    }
    state.level += 1;
    if (MODES[state.mode].time) state.remaining = Math.min(90, state.remaining + 8);
    setupRound(true);
  });
  $('help').addEventListener('click', () => {
    if (state.started) pause(true);
    $('pauseOv').classList.add('hide');
    $('helpOv').classList.remove('hide');
  });
  $('how').addEventListener('click', () => {
    $('start').classList.add('hide');
    $('helpOv').classList.remove('hide');
  });
  $('closeHelp').addEventListener('click', () => {
    $('helpOv').classList.add('hide');
    if (state.started) pause(false);
    else $('start').classList.remove('hide');
  });
  $('helpMenu').addEventListener('click', openMenu);
  $('sound').addEventListener('click', () => {
    state.sound = !state.sound;
    persistPrefs();
    hud();
    if (state.sound) tone(600, 0.05, 0.025, 'triangle');
  });
  $('vibe').addEventListener('click', () => {
    state.vibe = !state.vibe;
    persistPrefs();
    hud();
    if (state.vibe) buzz(20);
  });

  doc.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key.toLowerCase() === 'p') {
      event.preventDefault();
      pause();
      return;
    }
    if (!state.started || state.paused || state.ended || !$('round').classList.contains('hide')) return;
    if (/^[0-9]$/.test(event.key) && doc.activeElement !== $('guessInput')) {
      event.preventDefault();
      appendDigit(event.key);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      submitGuess();
    } else if (event.key === 'Backspace' && doc.activeElement !== $('guessInput')) {
      event.preventDefault();
      $('guessInput').value = $('guessInput').value.slice(0, -1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      pause(true);
    }
  });

  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden && state.started && !state.paused && !state.ended) pause(true);
  });

  renderModes();
  hud();
  timer();
}
