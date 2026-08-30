const STORE = 'nowis:simon-says:';

const MODES = {
  zen: {
    name: 'Détente',
    description: 'Rythme doux · erreurs sans élimination',
    lives: Infinity,
    startLength: 2,
    basePace: 760,
    minPace: 380,
    paceStep: 18,
    scoreMultiplier: 0.85,
  },
  classic: {
    name: 'Classique',
    description: '3 cœurs · vitesse progressive',
    lives: 3,
    startLength: 3,
    basePace: 650,
    minPace: 310,
    paceStep: 21,
    scoreMultiplier: 1,
  },
  expert: {
    name: 'Expert',
    description: '2 cœurs · séquences rapides',
    lives: 2,
    startLength: 4,
    basePace: 540,
    minPace: 250,
    paceStep: 24,
    scoreMultiplier: 1.3,
  },
};

const PADS = [
  { id: 0, name: 'Cyan', key: '1', tone: 261.63 },
  { id: 1, name: 'Rose', key: '2', tone: 329.63 },
  { id: 2, name: 'Or', key: '3', tone: 392.0 },
  { id: 3, name: 'Vert', key: '4', tone: 523.25 },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const levelFor = (round) => 1 + Math.floor(Math.max(0, round - 1) / 4);
const paceFor = (mode, round) => Math.max(
  MODES[mode].minPace,
  MODES[mode].basePace - Math.max(0, round - 1) * MODES[mode].paceStep,
);
const comboMultiplier = (combo) => 1 + Math.min(1.25, Math.floor(Math.max(0, combo) / 5) * 0.15);
const scoreFor = (mode, round, combo) => Math.round(
  92 * MODES[mode].scoreMultiplier * (1 + Math.min(round, 24) * 0.045) * comboMultiplier(combo),
);
const roundBonusFor = (mode, round) => Math.round(55 * round * MODES[mode].scoreMultiplier);
const penaltyFor = (mode, round) => Math.round(95 * MODES[mode].scoreMultiplier + Math.min(round, 20) * 8);
const formatScore = (value) => Math.max(0, Math.round(value)).toLocaleString('fr-CA');

function load(storage, key, fallback) {
  try {
    const value = JSON.parse(storage.getItem(key) || 'null');
    return value && typeof value === 'object' ? { ...fallback, ...value } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function save(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); } catch { /* local persistence is optional */ }
}

function createAudio(win) {
  let context;
  let enabled = true;
  const tone = (frequency, duration = 0.12, type = 'sine', gain = 0.035, delay = 0) => {
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
    pad(index) { tone(PADS[index].tone, 0.16, 'triangle', 0.032); },
    good() {
      [523.25, 659.25, 783.99].forEach((frequency, index) => tone(frequency, 0.075, 'triangle', 0.024, index * 0.045));
    },
    bad() { tone(125, 0.22, 'sawtooth', 0.032); tone(82, 0.25, 'square', 0.016, 0.04); },
    level() {
      [392, 523.25, 659.25, 783.99].forEach((frequency, index) => tone(frequency, 0.075, 'triangle', 0.02, index * 0.035));
    },
    end() {
      [392, 329.63, 261.63].forEach((frequency, index) => tone(frequency, 0.13, 'triangle', 0.022, index * 0.08));
    },
    setEnabled(value) { enabled = Boolean(value); },
  };
}

function vibrate(win, pattern, enabled) {
  if (!enabled) return;
  try { win.navigator?.vibrate?.(pattern); } catch { /* optional */ }
}

export function upgradeSimonSays(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisSimonSaysPro === 'true') return;
  root.dataset.nowisSimonSaysPro = 'true';
  root.lang = 'fr';
  doc.title = 'Simon — Mémoire lumineuse NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#03070d;color:#f7fbff;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}body{height:100dvh;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}button{font:inherit;color:inherit}.game{position:relative;width:100%;height:100dvh;display:flex;flex-direction:column;gap:6px;padding:max(7px,env(safe-area-inset-top)) max(7px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));overflow:hidden;background:radial-gradient(circle at 18% 0%,#32d9ff26,transparent 27%),radial-gradient(circle at 87% 15%,#f5579926,transparent 29%),linear-gradient(155deg,#050b14,#091423 48%,#03070d)}.game:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.17;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff06 1px,transparent 1px);background-size:28px 28px}.top,.hud,.stage,.status,.footer{position:relative;z-index:2;width:min(100%,820px);margin-inline:auto}.top{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px}.brand small{display:block;color:#55e3ff;font-size:9px;font-weight:950;letter-spacing:.18em;text-transform:uppercase}.brand h1{margin:1px 0;font-size:clamp(22px,6.6vw,38px);line-height:.95;letter-spacing:-.055em;text-shadow:0 4px 18px #000}.tools{display:flex;gap:5px;align-items:center}.btn,.mode,.modal button{min-height:44px;border:1px solid #9feaff2f;border-radius:14px;background:linear-gradient(#17334a,#0a1928);color:#f7fbff;font-weight:900;box-shadow:inset 0 1px #ffffff1b,0 8px 22px #00000048}.btn{min-width:44px;padding:7px 10px;cursor:pointer;touch-action:manipulation}.btn:focus-visible,.mode:focus-visible,.modal button:focus-visible,.pad:focus-visible{outline:3px solid #fff1a8;outline-offset:3px}.hud{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}.stat{min-width:0;text-align:center;padding:5px 3px;border:1px solid #ffffff12;border-radius:12px;background:linear-gradient(#11283be9,#091521e8);box-shadow:inset 0 1px #ffffff0e}.stat span{display:block;color:#87a9bd;font-size:8px;font-weight:950;text-transform:uppercase}.stat strong{display:block;overflow:hidden;text-overflow:ellipsis;font-size:clamp(14px,4vw,20px);line-height:1.1}.stage{flex:1;min-height:220px;display:grid;place-items:center;overflow:hidden;border:1px solid #82dcff2d;border-radius:28px;background:radial-gradient(circle at 50% 48%,#2e6d8b21,transparent 38%),linear-gradient(#07111df5,#030811fb);box-shadow:0 24px 70px #0009,inset 0 1px #ffffff17;user-select:none}.console{position:relative;width:min(94%,590px);height:min(96%,590px);aspect-ratio:1;padding:clamp(10px,2.4vw,18px);border-radius:50%;background:radial-gradient(circle,#172737 0 25%,#0b1723 26% 61%,#243648 62% 64%,#07111b 65%);box-shadow:inset 0 3px #ffffff22,inset 0 -15px 28px #0009,0 25px 55px #000a,0 0 55px #3bcdf21b}.board{position:relative;width:100%;height:100%;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:clamp(9px,2vw,16px);padding:2%;border-radius:50%;overflow:hidden}.pad{position:relative;min-width:44px;min-height:44px;border:0;cursor:pointer;touch-action:manipulation;transition:transform .09s ease,filter .09s ease,box-shadow .09s ease;box-shadow:inset 0 4px #ffffff21,inset 0 -10px 18px #0004,0 10px 24px #0007}.pad:disabled{cursor:default}.pad:active:not(:disabled){transform:scale(.975)}.pad:before{content:"";position:absolute;inset:10%;border-radius:inherit;border:1px solid #ffffff25;opacity:.65}.pad span{position:absolute;font-size:clamp(11px,3.4vw,15px);font-weight:1000;letter-spacing:.08em;text-transform:uppercase;text-shadow:0 2px 8px #000a;opacity:.8}.pad.cyan{border-radius:100% 18% 18% 18%;background:linear-gradient(145deg,#37def3,#087b9d 68%,#04536d)}.pad.rose{border-radius:18% 100% 18% 18%;background:linear-gradient(215deg,#ff6c9d,#a5265e 68%,#711744)}.pad.gold{border-radius:18% 18% 18% 100%;background:linear-gradient(35deg,#ffd360,#b87913 68%,#76500b)}.pad.green{border-radius:18% 18% 100% 18%;background:linear-gradient(325deg,#62e99b,#1d8d59 68%,#0d5d3a)}.pad.cyan span,.pad.rose span{bottom:12%}.pad.gold span,.pad.green span{top:12%}.pad.cyan span,.pad.gold span{right:12%}.pad.rose span,.pad.green span{left:12%}.pad.lit{filter:brightness(1.85) saturate(1.25);transform:scale(.968);box-shadow:inset 0 3px #ffffff91,inset 0 -8px 15px #0002,0 0 28px currentColor,0 8px 18px #0006}.pad.cyan.lit{color:#55efff}.pad.rose.lit{color:#ff70aa}.pad.gold.lit{color:#ffe07b}.pad.green.lit{color:#69f0a3}.core{position:absolute;z-index:5;left:50%;top:50%;width:34%;aspect-ratio:1;transform:translate(-50%,-50%);display:grid;place-items:center;border:2px solid #91e8ff39;border-radius:50%;background:radial-gradient(circle at 42% 35%,#253d50,#0a1520 63%,#03080c);box-shadow:inset 0 2px #ffffff1c,0 10px 28px #000b,0 0 22px #27d8ff1a;pointer-events:none}.core div{text-align:center}.core b{display:block;color:#dbf8ff;font-size:clamp(20px,6vw,40px);line-height:.9;letter-spacing:-.06em}.core small{display:block;margin-top:5px;color:#6ddff5;font-size:clamp(7px,2vw,10px);font-weight:1000;letter-spacing:.13em;text-transform:uppercase}.core.pulse{animation:corePulse .38s ease-out}.status{min-height:36px;display:flex;align-items:center;justify-content:center;gap:7px;padding:6px 10px;border:1px solid #ffffff12;border-radius:12px;background:#06101ae8;color:#9eb9c9;text-align:center;font-size:11px;font-weight:850}.status strong{color:#fff1a8}.dot{width:7px;height:7px;border-radius:50%;background:#536978;box-shadow:0 0 0 4px #ffffff07}.dot.listen{background:#56e4ff;box-shadow:0 0 13px #56e4ff}.dot.play{background:#ffcf5d;box-shadow:0 0 13px #ffcf5d}.dot.bad{background:#ff6b85;box-shadow:0 0 13px #ff6b85}.footer{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:38px;color:#7897aa;font-size:9px;font-weight:800}.progress{flex:1;max-width:360px;height:6px;border-radius:99px;background:#ffffff0c;overflow:hidden}.progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,#46dff7,#ffd15f);border-radius:99px;transition:width .15s ease}.overlay{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:18px;background:#01050ac9;backdrop-filter:blur(12px)}.overlay.hide{display:none}.modal{width:min(100%,560px);max-height:min(92dvh,720px);overflow:auto;padding:20px;border:1px solid #9be9ff35;border-radius:26px;background:linear-gradient(160deg,#122b3e,#091724 62%,#06101a);box-shadow:0 28px 85px #000b,inset 0 1px #ffffff17}.eyebrow{color:#61e1f7;font-size:10px;font-weight:1000;letter-spacing:.18em;text-transform:uppercase}.modal h2{margin:5px 0 8px;font-size:clamp(29px,9vw,47px);line-height:.93;letter-spacing:-.055em}.modal p{margin:8px 0;color:#bad0dc;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{display:grid;text-align:left;padding:10px 12px;cursor:pointer;touch-action:manipulation}.mode span{color:#8ca9ba;font-size:10px}.mode.on{border-color:#ffe48675;background:linear-gradient(#30442f,#152d2d)}.actions{display:grid;grid-template-columns:1.35fr 1fr;gap:8px;margin-top:14px}.modal button{padding:10px 12px;cursor:pointer;touch-action:manipulation}.modal button.primary{border-color:#76eaff66;background:linear-gradient(#16748c,#0e526c)}.help-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:12px 0}.help-grid div,.result-grid div{padding:10px;border:1px solid #ffffff12;border-radius:14px;background:#ffffff08}.help-grid b,.help-grid span{display:block}.help-grid b{color:#fff0ac;font-size:12px}.help-grid span{color:#9fb9c8;font-size:10px;line-height:1.4}.result-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:12px 0}.result-grid div{text-align:center}.result-grid span{display:block;color:#8eaabc;font-size:9px;text-transform:uppercase}.result-grid b{display:block;margin-top:3px;font-size:20px}.sr{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}@keyframes corePulse{0%{transform:translate(-50%,-50%) scale(1)}45%{transform:translate(-50%,-50%) scale(1.06);box-shadow:inset 0 2px #ffffff1c,0 10px 28px #000b,0 0 42px #6eeaff80}100%{transform:translate(-50%,-50%) scale(1)}}
    @media(max-width:520px){.game{gap:5px}.tools{gap:3px}.btn{padding:6px 8px}.hud{gap:3px}.stat{padding:4px 2px}.stage{border-radius:22px}.console{width:min(96%,520px);height:min(98%,520px)}.footer{font-size:8px}.brand h1{font-size:24px}.brand small{font-size:8px}}
    @media(orientation:landscape) and (max-height:590px){.game{gap:3px;padding-top:max(4px,env(safe-area-inset-top));padding-bottom:max(4px,env(safe-area-inset-bottom))}.top{min-height:40px}.brand h1{font-size:21px}.brand small{display:none}.btn{min-height:40px;min-width:40px;padding:4px 7px}.hud{position:absolute;left:max(7px,env(safe-area-inset-left));top:52px;width:min(190px,27vw);display:grid;grid-template-columns:1fr 1fr;z-index:4}.hud .stat:last-child{grid-column:1/-1}.stage{width:min(70vw,720px);margin-left:auto;margin-right:0;min-height:0}.console{height:100%;width:auto;max-width:100%;aspect-ratio:1}.status,.footer{width:min(70vw,720px);margin-left:auto;margin-right:0}.status{min-height:30px;padding:3px 8px}.footer{min-height:28px}.pad span{font-size:9px}}
    @media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
    <main class="game" aria-label="Simon, jeu de mémoire lumineuse">
      <header class="top">
        <div class="brand"><small>Console mémoire NOWIS</small><h1>Simon</h1></div>
        <div class="tools" aria-label="Réglages du jeu">
          <button class="btn" id="soundBtn" type="button" aria-pressed="true" aria-label="Son activé">🔊</button>
          <button class="btn" id="vibeBtn" type="button" aria-pressed="true" aria-label="Vibrations activées">📳</button>
          <button class="btn" id="helpBtn" type="button" aria-label="Aide">?</button>
          <button class="btn" id="pauseBtn" type="button" aria-label="Mettre en pause">Ⅱ</button>
        </div>
      </header>
      <section class="hud" aria-label="Statistiques de la partie">
        <div class="stat"><span>Score</span><strong id="score">0</strong></div>
        <div class="stat"><span>Record</span><strong id="record">0</strong></div>
        <div class="stat"><span>Manche</span><strong id="round">0</strong></div>
        <div class="stat"><span>Niveau</span><strong id="level">1</strong></div>
        <div class="stat"><span>Vies</span><strong id="lives">♥♥♥</strong></div>
      </section>
      <section class="stage" aria-label="Console de jeu">
        <div class="console">
          <div class="board" role="group" aria-label="Quatre touches lumineuses">
            <button class="pad cyan" type="button" data-pad="0" aria-label="Cyan, touche 1"><span>1 · Cyan</span></button>
            <button class="pad rose" type="button" data-pad="1" aria-label="Rose, touche 2"><span>2 · Rose</span></button>
            <button class="pad gold" type="button" data-pad="2" aria-label="Or, touche 3"><span>3 · Or</span></button>
            <button class="pad green" type="button" data-pad="3" aria-label="Vert, touche 4"><span>4 · Vert</span></button>
          </div>
          <div class="core" id="core" aria-hidden="true"><div><b>NOWIS</b><small id="coreText">MÉMOIRE</small></div></div>
        </div>
      </section>
      <div class="status" id="status"><i class="dot" id="statusDot"></i><span>Choisis un mode pour commencer.</span></div>
      <footer class="footer"><span id="paceText">Séquence prête</span><div class="progress" aria-hidden="true"><i id="progress"></i></div><span>1–4 · P pause</span></footer>
      <div class="sr" id="live" aria-live="polite"></div>
    </main>

    <div class="overlay" id="startOverlay">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="startTitle">
        <div class="eyebrow">Défi mémoire</div><h2 id="startTitle">Répète la lumière</h2>
        <p>Observe la séquence, puis reproduis-la dans le même ordre. Chaque manche ajoute un signal et accélère légèrement la console.</p>
        <div class="modes" id="modes"></div>
        <div class="actions"><button class="primary" id="startBtn" type="button">Commencer</button><button id="startHelpBtn" type="button">Comment jouer</button></div>
      </section>
    </div>

    <div class="overlay hide" id="helpOverlay">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="helpTitle">
        <div class="eyebrow">Aide</div><h2 id="helpTitle">Mémorise. Répète.</h2>
        <p>La console joue une séquence. Attends le message <strong>À toi</strong>, puis touche les couleurs dans le même ordre.</p>
        <div class="help-grid">
          <div><b>📱 Téléphone</b><span>Touche directement les quatre grandes zones. Aucun défilement n’est nécessaire.</span></div>
          <div><b>⌨️ Clavier</b><span>Touches 1 à 4 pour les couleurs. P ou Échap pour la pause.</span></div>
          <div><b>🔥 Série</b><span>Les bonnes réponses consécutives augmentent le multiplicateur de score.</span></div>
          <div><b>💡 Erreur</b><span>La séquence est rejouée. En Classique et Expert, une vie est perdue.</span></div>
        </div>
        <div class="actions"><button class="primary" id="closeHelpBtn" type="button">Compris</button><button id="helpRestartBtn" type="button">Recommencer</button></div>
      </section>
    </div>

    <div class="overlay hide" id="pauseOverlay">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="pauseTitle">
        <div class="eyebrow">Pause</div><h2 id="pauseTitle">Console suspendue</h2><p>La séquence reprendra depuis le début si elle était en train d’être jouée.</p>
        <div class="actions"><button class="primary" id="resumeBtn" type="button">Reprendre</button><button id="pauseRestartBtn" type="button">Recommencer</button></div>
      </section>
    </div>

    <div class="overlay hide" id="endOverlay">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="endTitle">
        <div class="eyebrow">Partie terminée</div><h2 id="endTitle">Belle mémoire.</h2><p id="endCopy">Ton score est enregistré sur cet appareil.</p>
        <div class="result-grid"><div><span>Score</span><b id="endScore">0</b></div><div><span>Record</span><b id="endRecord">0</b></div><div><span>Manche</span><b id="endRound">0</b></div></div>
        <div class="actions"><button class="primary" id="replayBtn" type="button">Rejouer</button><button id="changeModeBtn" type="button">Changer de mode</button></div>
      </section>
    </div>
  `;

  const $ = (selector) => doc.querySelector(selector);
  const $$ = (selector) => [...doc.querySelectorAll(selector)];
  const pads = $$('.pad');
  const audio = createAudio(win);
  const records = load(win.localStorage, `${STORE}records`, { zen: 0, classic: 0, expert: 0 });
  const bestRounds = load(win.localStorage, `${STORE}rounds`, { zen: 0, classic: 0, expert: 0 });
  const settings = load(win.localStorage, `${STORE}settings`, { sound: true, vibration: true, mode: 'classic' });
  if (!MODES[settings.mode]) settings.mode = 'classic';

  const state = {
    mode: settings.mode,
    started: false,
    paused: false,
    phase: 'idle',
    round: 0,
    sequence: [],
    inputIndex: 0,
    lives: MODES[settings.mode].lives,
    score: 0,
    combo: 0,
    sound: settings.sound !== false,
    vibration: settings.vibration !== false,
    timers: new Set(),
    token: 0,
    pausedByHelp: false,
  };

  const setOverlay = (id, visible) => $(id).classList.toggle('hide', !visible);
  const announce = (text) => { $('#live').textContent = ''; win.setTimeout(() => { $('#live').textContent = text; }, 20); };
  const setStatus = (text, kind = '') => {
    $('#status').querySelector('span').innerHTML = text;
    $('#statusDot').className = `dot ${kind}`.trim();
  };
  const saveSettings = () => save(win.localStorage, `${STORE}settings`, { sound: state.sound, vibration: state.vibration, mode: state.mode });

  function cancelTimeline() {
    state.token += 1;
    state.timers.forEach((timer) => win.clearTimeout(timer));
    state.timers.clear();
  }

  function schedule(fn, delay) {
    const token = state.token;
    const timer = win.setTimeout(() => {
      state.timers.delete(timer);
      if (token !== state.token || state.paused || state.phase === 'over') return;
      fn();
    }, delay);
    state.timers.add(timer);
    return timer;
  }

  function renderModes() {
    $('#modes').innerHTML = Object.entries(MODES).map(([key, mode]) => `
      <button class="mode ${state.mode === key ? 'on' : ''}" type="button" data-mode="${key}">
        <b>${mode.name}</b><span>${mode.description}</span>
      </button>`).join('');
    $$('.mode').forEach((button) => button.addEventListener('click', () => {
      state.mode = button.dataset.mode;
      state.lives = MODES[state.mode].lives;
      saveSettings();
      renderModes();
      renderHud();
    }));
  }

  function renderHud() {
    $('#score').textContent = formatScore(state.score);
    $('#record').textContent = formatScore(Math.max(records[state.mode] || 0, state.score));
    $('#round').textContent = String(state.round);
    $('#level').textContent = String(levelFor(state.round || 1));
    $('#lives').textContent = Number.isFinite(state.lives) ? `${'♥'.repeat(Math.max(0, state.lives))}${'♡'.repeat(Math.max(0, MODES[state.mode].lives - state.lives))}` : '∞';
    $('#coreText').textContent = state.started ? `NIV. ${levelFor(state.round || 1)}` : 'MÉMOIRE';
    const pace = paceFor(state.mode, Math.max(1, state.round));
    $('#paceText').textContent = state.started ? `${state.sequence.length} signal${state.sequence.length > 1 ? 's' : ''} · ${pace} ms` : MODES[state.mode].name;
    const progress = state.sequence.length ? (state.phase === 'input' ? state.inputIndex / state.sequence.length : 0) : 0;
    $('#progress').style.width = `${clamp(progress * 100, 0, 100)}%`;
  }

  function setPadsEnabled(enabled) {
    pads.forEach((pad) => { pad.disabled = !enabled; });
  }

  function flash(index, source = 'game') {
    const pad = pads[index];
    if (!pad) return;
    pad.classList.add('lit');
    $('#core').classList.remove('pulse');
    void $('#core').offsetWidth;
    $('#core').classList.add('pulse');
    audio.pad(index);
    if (source === 'player') vibrate(win, 12, state.vibration);
    win.setTimeout(() => pad.classList.remove('lit'), source === 'game' ? 210 : 130);
  }

  function playSequence() {
    if (!state.started || state.phase === 'over') return;
    cancelTimeline();
    state.phase = 'show';
    state.inputIndex = 0;
    setPadsEnabled(false);
    renderHud();
    setStatus('<strong>Observe</strong> la séquence…', 'play');
    announce(`Manche ${state.round}. Observe une séquence de ${state.sequence.length} signaux.`);
    const pace = paceFor(state.mode, state.round);
    const startDelay = 430;
    state.sequence.forEach((padIndex, index) => {
      schedule(() => flash(padIndex, 'game'), startDelay + index * pace);
    });
    schedule(() => {
      state.phase = 'input';
      state.inputIndex = 0;
      setPadsEnabled(true);
      setStatus('<strong>À toi.</strong> Reproduis la séquence.', 'listen');
      renderHud();
      announce('À toi. Reproduis la séquence.');
      pads[0]?.focus({ preventScroll: true });
    }, startDelay + state.sequence.length * pace + 120);
  }

  function nextRound() {
    if (!state.started || state.paused || state.phase === 'over') return;
    const previousLevel = levelFor(Math.max(1, state.round));
    state.round += 1;
    const newLevel = levelFor(state.round);
    if (state.round === 1) {
      state.sequence = Array.from({ length: MODES[state.mode].startLength }, () => Math.floor(Math.random() * PADS.length));
    } else {
      state.sequence.push(Math.floor(Math.random() * PADS.length));
    }
    state.inputIndex = 0;
    renderHud();
    if (newLevel > previousLevel) {
      audio.level();
      announce(`Niveau ${newLevel}. La console accélère.`);
      setStatus(`<strong>Niveau ${newLevel}.</strong> La console accélère.`, 'play');
      schedule(playSequence, 700);
    } else {
      playSequence();
    }
  }

  function endGame() {
    cancelTimeline();
    state.phase = 'over';
    state.paused = false;
    setPadsEnabled(false);
    const wasRecord = state.score > (records[state.mode] || 0);
    records[state.mode] = Math.max(records[state.mode] || 0, state.score);
    bestRounds[state.mode] = Math.max(bestRounds[state.mode] || 0, state.round);
    save(win.localStorage, `${STORE}records`, records);
    save(win.localStorage, `${STORE}rounds`, bestRounds);
    renderHud();
    audio.end();
    vibrate(win, [25, 35, 70], state.vibration);
    $('#endScore').textContent = formatScore(state.score);
    $('#endRecord').textContent = formatScore(records[state.mode]);
    $('#endRound').textContent = String(state.round);
    $('#endCopy').textContent = wasRecord ? 'Nouveau sommet enregistré sur cet appareil.' : `Meilleure manche : ${bestRounds[state.mode] || state.round}.`;
    setOverlay('#endOverlay', true);
    setStatus('Partie terminée. <strong>Prêt pour une revanche?</strong>', 'bad');
    announce(`Partie terminée. Score ${state.score}. Manche ${state.round}.`);
    $('#replayBtn').focus({ preventScroll: true });
  }

  function handlePad(index) {
    if (!state.started || state.paused || state.phase !== 'input') return;
    flash(index, 'player');
    const expected = state.sequence[state.inputIndex];
    if (index === expected) {
      state.combo += 1;
      state.score += scoreFor(state.mode, state.round, state.combo);
      state.inputIndex += 1;
      renderHud();
      if (state.inputIndex >= state.sequence.length) {
        state.phase = 'advance';
        setPadsEnabled(false);
        state.score += roundBonusFor(state.mode, state.round);
        renderHud();
        audio.good();
        vibrate(win, [12, 18, 12], state.vibration);
        setStatus(`<strong>Parfait.</strong> Manche ${state.round} réussie.`, 'listen');
        announce(`Manche ${state.round} réussie.`);
        schedule(nextRound, 760);
      }
      return;
    }

    state.combo = 0;
    state.score = Math.max(0, state.score - penaltyFor(state.mode, state.round));
    if (Number.isFinite(state.lives)) state.lives = Math.max(0, state.lives - 1);
    setPadsEnabled(false);
    audio.bad();
    vibrate(win, [45, 28, 80], state.vibration);
    renderHud();
    if (state.lives <= 0) {
      endGame();
      return;
    }
    state.phase = 'retry';
    setStatus(`<strong>Oups.</strong> C’était ${PADS[expected].name}. On rejoue la séquence.`, 'bad');
    announce(`Erreur. La bonne couleur était ${PADS[expected].name}. La séquence va être rejouée.`);
    schedule(playSequence, 950);
  }

  function startGame() {
    cancelTimeline();
    state.started = true;
    state.paused = false;
    state.phase = 'idle';
    state.round = 0;
    state.sequence = [];
    state.inputIndex = 0;
    state.lives = MODES[state.mode].lives;
    state.score = 0;
    state.combo = 0;
    setOverlay('#startOverlay', false);
    setOverlay('#helpOverlay', false);
    setOverlay('#pauseOverlay', false);
    setOverlay('#endOverlay', false);
    setPadsEnabled(false);
    saveSettings();
    renderHud();
    setStatus('Initialisation de la console…', 'play');
    schedule(nextRound, 480);
  }

  function pauseGame(showPanel = true) {
    if (!state.started || state.phase === 'over' || state.paused) return false;
    state.paused = true;
    cancelTimeline();
    setPadsEnabled(false);
    if (showPanel) setOverlay('#pauseOverlay', true);
    setStatus('<strong>Pause.</strong> La console est suspendue.', '');
    announce('Jeu en pause.');
    return true;
  }

  function resumeGame() {
    if (!state.started || state.phase === 'over' || !state.paused) return;
    state.paused = false;
    setOverlay('#pauseOverlay', false);
    if (state.phase === 'show' || state.phase === 'retry') {
      playSequence();
    } else if (state.phase === 'advance') {
      nextRound();
    } else if (state.phase === 'input') {
      setPadsEnabled(true);
      setStatus('<strong>À toi.</strong> Reproduis la séquence.', 'listen');
    } else {
      nextRound();
    }
    renderHud();
    announce('Jeu repris.');
  }

  function togglePause() {
    if (!state.started || state.phase === 'over') return;
    if (state.paused) resumeGame();
    else pauseGame(true);
  }

  function openHelp() {
    state.pausedByHelp = pauseGame(false);
    setOverlay('#pauseOverlay', false);
    setOverlay('#helpOverlay', true);
    $('#closeHelpBtn').focus({ preventScroll: true });
  }

  function closeHelp() {
    setOverlay('#helpOverlay', false);
    if (state.pausedByHelp) {
      state.pausedByHelp = false;
      resumeGame();
    } else if (!state.started) {
      setOverlay('#startOverlay', true);
      $('#startBtn').focus({ preventScroll: true });
    }
  }

  pads.forEach((pad, index) => pad.addEventListener('click', () => handlePad(index)));
  $('#startBtn').addEventListener('click', startGame);
  $('#replayBtn').addEventListener('click', startGame);
  $('#pauseRestartBtn').addEventListener('click', startGame);
  $('#helpRestartBtn').addEventListener('click', startGame);
  $('#changeModeBtn').addEventListener('click', () => {
    cancelTimeline();
    state.started = false;
    state.phase = 'idle';
    setOverlay('#endOverlay', false);
    setOverlay('#startOverlay', true);
    renderModes();
    renderHud();
  });
  $('#pauseBtn').addEventListener('click', togglePause);
  $('#resumeBtn').addEventListener('click', resumeGame);
  $('#helpBtn').addEventListener('click', openHelp);
  $('#startHelpBtn').addEventListener('click', () => { setOverlay('#startOverlay', false); openHelp(); });
  $('#closeHelpBtn').addEventListener('click', closeHelp);
  $('#soundBtn').addEventListener('click', () => {
    state.sound = !state.sound;
    audio.setEnabled(state.sound);
    $('#soundBtn').textContent = state.sound ? '🔊' : '🔇';
    $('#soundBtn').setAttribute('aria-pressed', String(state.sound));
    $('#soundBtn').setAttribute('aria-label', state.sound ? 'Son activé' : 'Son désactivé');
    if (state.sound) audio.good();
    saveSettings();
  });
  $('#vibeBtn').addEventListener('click', () => {
    state.vibration = !state.vibration;
    $('#vibeBtn').textContent = state.vibration ? '📳' : '📴';
    $('#vibeBtn').setAttribute('aria-pressed', String(state.vibration));
    $('#vibeBtn').setAttribute('aria-label', state.vibration ? 'Vibrations activées' : 'Vibrations désactivées');
    vibrate(win, 18, state.vibration);
    saveSettings();
  });

  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!$('#helpOverlay').classList.contains('hide')) closeHelp();
      else togglePause();
      return;
    }
    if (event.key.toLowerCase() === 'p') {
      event.preventDefault();
      togglePause();
      return;
    }
    if (event.target instanceof win.HTMLButtonElement || event.target instanceof win.HTMLInputElement) return;
    const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, q: 0, e: 1, a: 2, d: 3 };
    const index = keyMap[event.key.toLowerCase()];
    if (index !== undefined) {
      event.preventDefault();
      handlePad(index);
    }
  });

  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden && state.started && !state.paused && state.phase !== 'over') pauseGame(true);
  });
  win.addEventListener('blur', () => {
    if (state.started && !state.paused && state.phase !== 'over') pauseGame(true);
  });

  audio.setEnabled(state.sound);
  $('#soundBtn').textContent = state.sound ? '🔊' : '🔇';
  $('#soundBtn').setAttribute('aria-pressed', String(state.sound));
  $('#soundBtn').setAttribute('aria-label', state.sound ? 'Son activé' : 'Son désactivé');
  $('#vibeBtn').textContent = state.vibration ? '📳' : '📴';
  $('#vibeBtn').setAttribute('aria-pressed', String(state.vibration));
  $('#vibeBtn').setAttribute('aria-label', state.vibration ? 'Vibrations activées' : 'Vibrations désactivées');
  renderModes();
  renderHud();
  setPadsEnabled(false);
}
