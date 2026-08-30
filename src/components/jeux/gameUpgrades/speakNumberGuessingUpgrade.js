const STORE = 'nowis:speak-number-guessing:';

const MODES = {
  relax: { name: 'Détente', desc: 'Sans chrono · davantage d’essais · idéal pour apprivoiser le micro', duration: 0, baseMax: 50, step: 35, attemptExtra: 3, scoreMult: 0.82 },
  classic: { name: 'Classique', desc: '90 s · difficulté progressive · recommandé', duration: 90, baseMax: 100, step: 90, attemptExtra: 2, scoreMult: 1 },
  expert: { name: 'Expert', desc: '70 s · grandes plages · moins d’essais', duration: 70, baseMax: 250, step: 180, attemptExtra: 1, scoreMult: 1.34 },
};

const SMALL = {
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6,
  sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13,
  quatorze: 14, quinze: 15, seize: 16, 'dix-sept': 17, 'dix-huit': 18, 'dix-neuf': 19,
};
const TENS = { vingt: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60 };
const NUMBER_WORDS = new Set([...Object.keys(SMALL), ...Object.keys(TENS), 'cent', 'cents', 'mille', 'milles', 'et']);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const fmt = (value) => Math.max(0, Math.round(value)).toLocaleString('fr-CA');
const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '∞';
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};
const read = (storage, key, fallback) => {
  try { return { ...fallback, ...(JSON.parse(storage.getItem(key) || 'null') || {}) }; }
  catch { return { ...fallback }; }
};
const save = (storage, key, value) => {
  try { storage.setItem(key, JSON.stringify(value)); }
  catch { /* stockage privé ou indisponible */ }
};
const stripAccents = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function normalizeSpeech(value) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/quatre[ -]?vingts?/g, 'quatre vingt')
    .replace(/dix[ -]?sept/g, 'dix-sept')
    .replace(/dix[ -]?huit/g, 'dix-huit')
    .replace(/dix[ -]?neuf/g, 'dix-neuf')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseUnder100(tokens) {
  const words = tokens.filter((token) => token !== 'et');
  if (!words.length) return 0;
  let total = 0;
  let index = 0;
  while (index < words.length) {
    const word = words[index];
    if (word === 'quatre' && words[index + 1] === 'vingt') {
      total += 80;
      index += 2;
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(TENS, word)) {
      total += TENS[word];
      index += 1;
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(SMALL, word)) {
      total += SMALL[word];
      index += 1;
      continue;
    }
    return null;
  }
  return total <= 99 ? total : null;
}

function parseUnder1000(tokens) {
  const centIndex = tokens.findIndex((token) => token === 'cent' || token === 'cents');
  if (centIndex < 0) return parseUnder100(tokens);
  const leftTokens = tokens.slice(0, centIndex).filter((token) => token !== 'et');
  const rightTokens = tokens.slice(centIndex + 1);
  const hundreds = leftTokens.length ? parseUnder100(leftTokens) : 1;
  const right = rightTokens.length ? parseUnder100(rightTokens) : 0;
  if (hundreds === null || right === null || hundreds < 1 || hundreds > 9) return null;
  return hundreds * 100 + right;
}

function parseFrenchNumber(value) {
  const normalized = normalizeSpeech(value);
  if (!normalized) return null;
  const digitMatch = normalized.match(/(?:^|\s)(\d{1,4})(?:\s|$)/);
  if (digitMatch) {
    const numeric = Number(digitMatch[1]);
    return numeric >= 0 && numeric <= 9999 ? numeric : null;
  }
  const rawTokens = normalized.split(/[\s-]+/).filter(Boolean);
  const tokens = rawTokens.filter((token) => NUMBER_WORDS.has(token));
  if (!tokens.length) return null;
  const milleIndex = tokens.findIndex((token) => token === 'mille' || token === 'milles');
  if (milleIndex < 0) return parseUnder1000(tokens);
  const leftTokens = tokens.slice(0, milleIndex).filter((token) => token !== 'et');
  const rightTokens = tokens.slice(milleIndex + 1);
  const thousands = leftTokens.length ? parseUnder1000(leftTokens) : 1;
  const right = rightTokens.length ? parseUnder1000(rightTokens) : 0;
  if (thousands === null || right === null || thousands < 1 || thousands > 9) return null;
  const result = thousands * 1000 + right;
  return result <= 9999 ? result : null;
}

const rangeFor = (mode, level) => {
  const config = MODES[mode];
  const growth = Math.round(config.step * Math.pow(Math.max(0, level - 1), 1.16));
  return { min: 1, max: clamp(config.baseMax + growth, config.baseMax, 9999) };
};
const attemptsFor = (range, mode) => {
  const width = Math.max(1, range.max - range.min + 1);
  return Math.ceil(Math.log2(width)) + MODES[mode].attemptExtra;
};
const scoreForWin = ({ level, attemptsLeft, totalAttempts, elapsed, mode }) => {
  const efficiency = attemptsLeft / Math.max(1, totalAttempts);
  const speed = MODES[mode].duration ? clamp(1 - elapsed / MODES[mode].duration, 0, 1) : 0.35;
  const base = 420 + level * 115;
  return Math.round(base * (1 + efficiency * 0.8 + speed * 0.35) * MODES[mode].scoreMult);
};

function sound(win) {
  let ctx;
  let enabled = true;
  const tone = (frequency, duration = 0.06, type = 'triangle', gain = 0.022, delay = 0) => {
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
    tap() { tone(340, 0.03, 'square', 0.008); },
    low() { tone(225, 0.08, 'triangle', 0.018); },
    high() { tone(430, 0.08, 'triangle', 0.018); },
    win() { [440, 587, 740].forEach((frequency, index) => tone(frequency, 0.11, 'triangle', 0.025, index * 0.07)); },
    fail() { [260, 205, 160].forEach((frequency, index) => tone(frequency, 0.1, 'sawtooth', 0.018, index * 0.06)); },
    set(value) { enabled = value; },
  };
}
const buzz = (win, pattern, enabled) => {
  if (!enabled) return;
  try { win.navigator?.vibrate?.(pattern); }
  catch { /* vibration non disponible */ }
};
function safeText(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

export function upgradeSpeakNumberGuessing(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisSpeakNumberPro === 'true') return;
  root.dataset.nowisSpeakNumberPro = 'true';
  root.lang = 'fr';
  doc.title = 'Devine le nombre à voix haute · NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#071116;color:#f8f1df;font-family:Inter,ui-rounded,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{min-height:100dvh;overflow:auto;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}button,input{font:inherit}.app{min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:8px;padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));background:radial-gradient(circle at 15% 5%,#c2764a2b,transparent 23%),radial-gradient(circle at 90% 14%,#48bcc626,transparent 28%),linear-gradient(155deg,#061016,#0b2025 55%,#0d171a)}.top,.hud,.station,.controls,.modes{width:min(100%,820px)}.top{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand small{display:block;color:#d99868;font-size:9px;font-weight:1000;letter-spacing:.18em;text-transform:uppercase}.brand h1{margin:2px 0 0;font-size:clamp(23px,6.5vw,39px);line-height:.95;letter-spacing:-.05em;color:#f5ead3}.topRight{display:flex;gap:5px;align-items:center}.btn,.mode,.mic,.submit,.modal button{min-height:44px;border:1px solid #9ad3d03d;border-radius:13px;background:#0d252be8;color:#eff8f3;font-weight:900;cursor:pointer;touch-action:manipulation}.btn{padding:7px 10px}.btn:active,.mode:active,.mic:active,.submit:active,.modal button:active{transform:scale(.97)}button:focus-visible,input:focus-visible{outline:3px solid #f0ad78;outline-offset:2px}.hud{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.stat{padding:6px 3px;text-align:center;border:1px solid #d5e6df18;border-radius:11px;background:#07171cc9;box-shadow:inset 0 1px #fff1}.stat span{display:block;color:#789b9c;font-size:8px;font-weight:950;text-transform:uppercase}.stat strong{display:block;color:#fff0d7;font-size:clamp(13px,4vw,19px);font-variant-numeric:tabular-nums}.station{position:relative;flex:1;min-height:330px;display:flex;flex-direction:column;gap:10px;padding:clamp(13px,3.7vw,22px);overflow:hidden;border:1px solid #9fc8bd32;border-radius:25px;background:linear-gradient(160deg,#10272d,#07161c 59%,#101b1e);box-shadow:0 28px 80px #0009,inset 0 1px #fff1}.station:before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0 79px,#afd4d40b 80px 81px),repeating-linear-gradient(0deg,transparent 0 31px,#afd4d408 32px 33px)}.radioHead{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:10px}.radioLabel{font-size:9px;font-weight:1000;letter-spacing:.15em;text-transform:uppercase;color:#84b9b7}.lamps{display:flex;gap:8px}.lamp{width:9px;height:9px;border-radius:50%;background:#4fc0b6;box-shadow:0 0 12px #4fc0b6}.lamp.amber{background:#d88754;box-shadow:0 0 12px #d88754}.dial{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:10px;padding:12px;border:1px solid #a0b9ad30;border-radius:18px;background:linear-gradient(180deg,#142b2d,#0b1c21);box-shadow:inset 0 4px 12px #0008}.bound{min-width:0;text-align:center}.bound span{display:block;color:#769a98;font-size:9px;font-weight:950;text-transform:uppercase}.bound strong{display:block;color:#f4e5c7;font-size:clamp(21px,6vw,37px);font-variant-numeric:tabular-nums}.needle{width:56px;height:56px;border:6px solid #bb7952;border-radius:50%;display:grid;place-items:center;color:#f7e8cc;background:#08161b;box-shadow:0 0 0 4px #0b2329,0 0 22px #bd7a4431;font-size:21px;font-weight:1000}.message{position:relative;z-index:1;min-height:84px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;text-align:center;padding:12px;border-radius:18px;border:1px solid #766d5940;background:linear-gradient(178deg,#efe5cf,#dcd0b6);color:#283431;box-shadow:0 13px 30px #0006,inset 0 1px #fff}.message small{font-size:9px;font-weight:1000;letter-spacing:.14em;text-transform:uppercase;color:#7c6b55}.message strong{font-family:Georgia,"Times New Roman",serif;font-size:clamp(20px,5.5vw,32px)}.message p{margin:0;color:#5b625b;font-size:12px;font-weight:700}.wave{position:relative;z-index:1;height:34px;display:flex;align-items:center;justify-content:center;gap:4px;overflow:hidden}.wave i{display:block;width:4px;height:10px;border-radius:5px;background:#56bcb9;box-shadow:0 0 8px #56bcb955}.wave.live i{animation:pulse .7s ease-in-out infinite alternate}.wave i:nth-child(2n){height:18px;animation-delay:.1s}.wave i:nth-child(3n){height:28px;animation-delay:.2s}.wave i:nth-child(5n){height:22px;animation-delay:.3s}@keyframes pulse{to{transform:scaleY(.45);opacity:.55}}.micRow{position:relative;z-index:1;display:grid;grid-template-columns:minmax(150px,1.2fr) minmax(120px,.8fr);gap:8px}.mic{min-height:58px;padding:8px 12px;background:linear-gradient(180deg,#1b6c6b,#124948);font-size:14px;box-shadow:inset 0 1px #fff2}.mic.listening{background:linear-gradient(180deg,#b96d49,#793f2e);animation:micGlow 1s ease-in-out infinite alternate}.mic[disabled]{opacity:.52;cursor:not-allowed}@keyframes micGlow{to{box-shadow:0 0 20px #d8865270,inset 0 1px #fff3}}.heard{min-width:0;display:flex;flex-direction:column;justify-content:center;padding:7px 10px;border:1px solid #8db9b433;border-radius:14px;background:#07171cd1}.heard span{color:#759796;font-size:8px;font-weight:950;text-transform:uppercase}.heard strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#d8ebe4;font-size:12px}.manual{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) 110px;gap:8px}.numberInput{min-height:48px;width:100%;border:1px solid #8dbab449;border-radius:13px;background:#07191edc;color:#fff2da;padding:9px 12px;font-size:20px;font-weight:950;text-align:center;font-variant-numeric:tabular-nums}.numberInput::placeholder{color:#587879}.submit{background:#724a32;color:#fff0d6}.tip{position:relative;z-index:1;margin:0;text-align:center;color:#789b9b;font-size:10px;font-weight:700}.modes{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.mode{padding:7px 5px;font-size:10px}.mode.active{border-color:#e4a16f;background:#593c2bdd;color:#fff0db;box-shadow:inset 0 0 0 1px #e4a16f55}.controls{display:flex;gap:5px;justify-content:center}.controls .btn{flex:1;max-width:180px}.sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.overlay{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:18px;background:#02090dcc;backdrop-filter:blur(8px)}.overlay.hidden{display:none}.modal{width:min(100%,520px);max-height:85dvh;overflow:auto;padding:20px;border:1px solid #a8cdc43e;border-radius:22px;background:#0e2227;color:#f6ecda;box-shadow:0 30px 90px #000c}.modal h2{margin:0 0 8px;font-size:25px}.modal p,.modal li{color:#b4cbc5;line-height:1.5;font-size:13px}.modal ul{padding-left:19px}.modal button{width:100%;margin-top:8px}.result{font-size:clamp(38px,12vw,70px);font-weight:1000;color:#f0b07d;text-align:center}.paused .station{filter:saturate(.4) brightness(.72)}@media(max-width:560px){.hud{grid-template-columns:repeat(3,1fr)}.station{min-height:360px}.dial{grid-template-columns:1fr 52px 1fr}.needle{width:50px;height:50px}.micRow{grid-template-columns:1fr}.heard{min-height:44px}.modes{position:sticky;bottom:0}.brand h1{max-width:230px}.topRight .btn{padding:6px 8px}}@media(max-height:670px) and (orientation:landscape){.app{gap:5px}.station{min-height:260px;padding:10px;gap:7px}.message{min-height:62px}.wave{height:24px}.mic{min-height:48px}.hud .stat{padding:3px}.brand h1{font-size:24px}.modes{max-width:620px}.tip{display:none}}@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
    <main class="app" aria-labelledby="gameTitle">
      <header class="top">
        <div class="brand"><small>Station vocale NOWIS</small><h1 id="gameTitle">Devine le nombre</h1></div>
        <div class="topRight">
          <button class="btn" id="soundBtn" type="button" aria-pressed="true" title="Activer ou couper les sons">🔊</button>
          <button class="btn" id="vibeBtn" type="button" aria-pressed="true" title="Activer ou couper les vibrations">📳</button>
          <button class="btn" id="helpBtn" type="button">Aide</button>
        </div>
      </header>
      <section class="hud" aria-label="Statistiques de la partie">
        <div class="stat"><span>Score</span><strong id="score">0</strong></div>
        <div class="stat"><span>Record</span><strong id="record">0</strong></div>
        <div class="stat"><span>Niveau</span><strong id="level">1</strong></div>
        <div class="stat"><span>Essais</span><strong id="tries">0</strong></div>
        <div class="stat"><span>Série</span><strong id="streak">0</strong></div>
        <div class="stat"><span>Temps</span><strong id="time">∞</strong></div>
      </section>
      <section class="station" aria-label="Poste de devinette vocale">
        <div class="radioHead"><span class="radioLabel">Fréquence secrète</span><span class="lamps" aria-hidden="true"><i class="lamp"></i><i class="lamp amber"></i></span></div>
        <div class="dial" aria-label="Intervalle possible">
          <div class="bound"><span>Minimum</span><strong id="low">1</strong></div>
          <div class="needle" aria-hidden="true">?</div>
          <div class="bound"><span>Maximum</span><strong id="high">100</strong></div>
        </div>
        <div class="message" aria-live="polite" aria-atomic="true">
          <small id="messageLabel">Mission</small>
          <strong id="message">Dis un nombre entre 1 et 100.</strong>
          <p id="detail">Tu peux aussi l’écrire si le micro n’est pas disponible.</p>
        </div>
        <div class="wave" id="wave" aria-hidden="true">${'<i></i>'.repeat(15)}</div>
        <div class="micRow">
          <button class="mic" id="micBtn" type="button">🎙️ Parler</button>
          <div class="heard"><span>Dernière écoute</span><strong id="heard">—</strong></div>
        </div>
        <form class="manual" id="guessForm" autocomplete="off">
          <label class="sr" for="numberInput">Entrer un nombre manuellement</label>
          <input class="numberInput" id="numberInput" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="Ou écris le nombre" aria-describedby="manualTip">
          <button class="submit" type="submit">Valider</button>
        </form>
        <p class="tip" id="manualTip">Le micro reste facultatif : la saisie tactile fonctionne toujours.</p>
      </section>
      <nav class="modes" aria-label="Choisir la difficulté">
        ${Object.entries(MODES).map(([key, mode]) => `<button type="button" class="mode" data-mode="${key}" title="${safeText(mode.desc)}">${safeText(mode.name)}</button>`).join('')}
      </nav>
      <div class="controls">
        <button class="btn" id="pauseBtn" type="button">⏸ Pause</button>
        <button class="btn" id="replayBtn" type="button">↻ Rejouer</button>
      </div>
      <div class="sr" id="announce" aria-live="assertive" aria-atomic="true"></div>
    </main>
    <div class="overlay hidden" id="helpOverlay" role="dialog" aria-modal="true" aria-labelledby="helpTitle">
      <div class="modal">
        <h2 id="helpTitle">Comment jouer</h2>
        <p>Trouve la fréquence secrète. Appuie sur <strong>Parler</strong> puis dis ton nombre en français, ou saisis-le manuellement.</p>
        <ul>
          <li>« Plus haut » ou « Plus bas » réduit l’intervalle après chaque essai valide.</li>
          <li>Un nombre déjà éliminé ou répété ne consomme pas d’essai.</li>
          <li>Chaque victoire augmente la difficulté et bonifie le score.</li>
          <li>Le micro dépend du navigateur et de son autorisation. La saisie manuelle reste toujours disponible.</li>
          <li>Raccourcis : <strong>P</strong> ou <strong>Échap</strong> pour la pause, <strong>Entrée</strong> pour valider la saisie.</li>
        </ul>
        <button type="button" id="closeHelp">Reprendre</button>
      </div>
    </div>
    <div class="overlay hidden" id="endOverlay" role="dialog" aria-modal="true" aria-labelledby="endTitle">
      <div class="modal">
        <h2 id="endTitle">Fin de transmission</h2>
        <div class="result" id="finalScore">0</div>
        <p id="finalText"></p>
        <button type="button" id="againBtn">Nouvelle partie</button>
      </div>
    </div>
  `;

  const $ = (selector) => doc.querySelector(selector);
  const app = $('.app');
  const storage = win.localStorage;
  const audio = sound(win);
  const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
  const settings = read(storage, `${STORE}settings`, { sound: true, vibration: true, mode: 'classic' });
  if (!MODES[settings.mode]) settings.mode = 'classic';
  audio.set(Boolean(settings.sound));

  const state = {
    mode: settings.mode, score: 0, level: 1, streak: 0, target: 1,
    range: { min: 1, max: 100 }, low: 1, high: 100, totalAttempts: 0, attemptsLeft: 0,
    guesses: new Set(), active: true, paused: false, ended: false, listening: false, transitioning: false,
    remaining: Number.POSITIVE_INFINITY, endsAt: 0, levelStartedAt: Date.now(), recognition: null, resumeAfterHelp: false,
  };

  const recordsFor = (mode) => read(storage, `${STORE}record:${mode}`, { score: 0, bestLevel: 1, wins: 0, games: 0 });
  function setMessage(title, detail = '', label = 'Mission') {
    $('#messageLabel').textContent = label;
    $('#message').textContent = title;
    $('#detail').textContent = detail;
  }
  function announce(message) {
    const node = $('#announce');
    node.textContent = '';
    win.setTimeout(() => { node.textContent = message; }, 15);
  }
  function persistSettings() {
    save(storage, `${STORE}settings`, { sound: Boolean(settings.sound), vibration: Boolean(settings.vibration), mode: state.mode });
  }
  function updateRecord(isWin = false) {
    const record = recordsFor(state.mode);
    record.score = Math.max(record.score, state.score);
    record.bestLevel = Math.max(record.bestLevel, state.level);
    if (isWin) record.wins += 1;
    save(storage, `${STORE}record:${state.mode}`, record);
  }
  function render() {
    const record = recordsFor(state.mode);
    $('#score').textContent = fmt(state.score);
    $('#record').textContent = fmt(record.score);
    $('#level').textContent = String(state.level);
    $('#tries').textContent = `${state.attemptsLeft}/${state.totalAttempts}`;
    $('#streak').textContent = String(state.streak);
    $('#time').textContent = formatTime(state.remaining);
    $('#low').textContent = fmt(state.low);
    $('#high').textContent = fmt(state.high);
    $('#pauseBtn').textContent = state.paused ? '▶ Reprendre' : '⏸ Pause';
    $('#micBtn').textContent = state.listening ? '🟠 J’écoute…' : '🎙️ Parler';
    $('#micBtn').classList.toggle('listening', state.listening);
    $('#wave').classList.toggle('live', state.listening);
    $('#micBtn').disabled = state.paused || state.ended;
    $('#numberInput').disabled = state.paused || state.ended;
    $('.submit').disabled = state.paused || state.ended;
    app.classList.toggle('paused', state.paused);
    doc.querySelectorAll('.mode').forEach((button) => {
      const selected = button.dataset.mode === state.mode;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('#soundBtn').textContent = settings.sound ? '🔊' : '🔇';
    $('#soundBtn').setAttribute('aria-pressed', String(Boolean(settings.sound)));
    $('#vibeBtn').textContent = settings.vibration ? '📳' : '📴';
    $('#vibeBtn').setAttribute('aria-pressed', String(Boolean(settings.vibration)));
  }
  function stopListening() {
    if (!state.recognition) return;
    try { state.recognition.abort(); }
    catch { /* session déjà arrêtée */ }
    state.listening = false;
    render();
  }
  function startLevel() {
    state.range = rangeFor(state.mode, state.level);
    state.low = state.range.min;
    state.high = state.range.max;
    state.totalAttempts = attemptsFor(state.range, state.mode);
    state.attemptsLeft = state.totalAttempts;
    state.guesses = new Set();
    state.target = Math.floor(Math.random() * (state.range.max - state.range.min + 1)) + state.range.min;
    state.levelStartedAt = Date.now();
    $('#heard').textContent = '—';
    $('#numberInput').value = '';
    setMessage(`Dis un nombre entre ${fmt(state.low)} et ${fmt(state.high)}.`, 'Écoute les indices pour resserrer la fréquence.');
    render();
  }
  function resetGame() {
    stopListening();
    state.score = 0;
    state.level = 1;
    state.streak = 0;
    state.active = true;
    state.paused = false;
    state.ended = false;
    state.transitioning = false;
    const duration = MODES[state.mode].duration;
    state.remaining = duration || Number.POSITIVE_INFINITY;
    state.endsAt = duration ? Date.now() + duration * 1000 : 0;
    $('#endOverlay').classList.add('hidden');
    startLevel();
    persistSettings();
  }
  function finish(reason) {
    if (state.ended) return;
    stopListening();
    state.ended = true;
    state.transitioning = false;
    state.active = false;
    state.paused = false;
    const record = recordsFor(state.mode);
    record.score = Math.max(record.score, state.score);
    record.bestLevel = Math.max(record.bestLevel, state.level);
    record.games += 1;
    save(storage, `${STORE}record:${state.mode}`, record);
    audio.fail();
    buzz(win, [35, 35, 55], settings.vibration);
    $('#finalScore').textContent = `${fmt(state.score)} pts`;
    $('#finalText').textContent = `${reason} Niveau atteint : ${state.level}. Record : ${fmt(record.score)}.`;
    $('#endOverlay').classList.remove('hidden');
    $('#againBtn').focus();
    render();
  }
  function winLevel() {
    const elapsed = Math.max(0.1, (Date.now() - state.levelStartedAt) / 1000);
    const earned = scoreForWin({ level: state.level, attemptsLeft: state.attemptsLeft, totalAttempts: state.totalAttempts, elapsed, mode: state.mode });
    state.score += earned;
    state.streak += 1;
    updateRecord(true);
    audio.win();
    buzz(win, [25, 30, 45], settings.vibration);
    setMessage(`Exact ! C’était ${fmt(state.target)}.`, `+${fmt(earned)} points · prochaine fréquence en préparation`, 'Fréquence trouvée');
    announce(`Bravo. Le nombre était ${state.target}. Vous gagnez ${earned} points.`);
    state.active = false;
    state.transitioning = true;
    render();
    win.setTimeout(() => {
      if (state.ended) return;
      state.transitioning = false;
      state.level += 1;
      state.active = true;
      startLevel();
      announce(`Niveau ${state.level}. Nouveau nombre entre ${state.low} et ${state.high}.`);
    }, 780);
  }
  function submitGuess(value, source = 'manuel') {
    if (!state.active || state.paused || state.ended) return;
    const numeric = Number(value);
    if (!Number.isInteger(numeric)) {
      setMessage('Je n’ai pas compris ce nombre.', 'Essaie de nouveau ou écris-le dans la case.', 'Signal incomplet');
      announce('Nombre non compris. Réessayez.');
      return;
    }
    if (numeric < state.range.min || numeric > state.range.max) {
      setMessage(`Reste entre ${fmt(state.range.min)} et ${fmt(state.range.max)}.`, 'Cet essai ne compte pas.', 'Hors fréquence');
      announce('Nombre hors de la plage. L’essai ne compte pas.');
      return;
    }
    if (numeric < state.low || numeric > state.high || state.guesses.has(numeric)) {
      setMessage(`${fmt(numeric)} est déjà éliminé.`, `Zone encore possible : ${fmt(state.low)} à ${fmt(state.high)}. Aucun essai perdu.`, 'Déjà vérifié');
      announce('Nombre déjà éliminé. Aucun essai perdu.');
      return;
    }
    state.guesses.add(numeric);
    state.attemptsLeft -= 1;
    audio.tap();
    if (numeric === state.target) {
      winLevel();
      return;
    }
    if (numeric < state.target) {
      state.low = Math.max(state.low, numeric + 1);
      audio.high();
      setMessage('Plus haut ↑', `${fmt(numeric)} est trop petit · essaie entre ${fmt(state.low)} et ${fmt(state.high)}.`, source === 'vocal' ? 'Voix reconnue' : 'Essai');
      announce(`${numeric} est trop petit. Plus haut.`);
    } else {
      state.high = Math.min(state.high, numeric - 1);
      audio.low();
      setMessage('Plus bas ↓', `${fmt(numeric)} est trop grand · essaie entre ${fmt(state.low)} et ${fmt(state.high)}.`, source === 'vocal' ? 'Voix reconnue' : 'Essai');
      announce(`${numeric} est trop grand. Plus bas.`);
    }
    buzz(win, 18, settings.vibration);
    render();
    if (state.attemptsLeft <= 0) {
      state.streak = 0;
      win.setTimeout(() => finish(`Plus d’essais. La fréquence secrète était ${fmt(state.target)}.`), 420);
    }
  }
  function startListening() {
    if (state.paused || state.ended || state.listening) return;
    if (!SpeechRecognition) {
      setMessage('Micro vocal non pris en charge ici.', 'Utilise la saisie numérique juste en dessous : le jeu reste entièrement jouable.', 'Mode manuel');
      announce('Reconnaissance vocale indisponible. Utilisez la saisie manuelle.');
      $('#numberInput').focus();
      return;
    }
    stopListening();
    const recognition = new SpeechRecognition();
    state.recognition = recognition;
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.onstart = () => {
      state.listening = true;
      setMessage('Je t’écoute…', `Dis un nombre entre ${fmt(state.low)} et ${fmt(state.high)}.`, 'Micro ouvert');
      render();
    };
    recognition.onresult = (event) => {
      const alternatives = [];
      const result = event.results?.[0];
      if (result) {
        for (let index = 0; index < result.length; index += 1) alternatives.push(result[index].transcript);
      }
      const transcript = alternatives[0] || '';
      let parsed = null;
      for (const alternative of alternatives) {
        const candidate = parseFrenchNumber(alternative);
        if (candidate !== null) {
          parsed = candidate;
          break;
        }
      }
      $('#heard').textContent = transcript || '—';
      state.listening = false;
      render();
      if (parsed === null) {
        setMessage('Je n’ai pas reconnu de nombre.', 'Parle un peu plus lentement ou utilise la saisie manuelle.', 'À réessayer');
        announce('Aucun nombre reconnu. Réessayez.');
        return;
      }
      submitGuess(parsed, 'vocal');
    };
    recognition.onerror = (event) => {
      state.listening = false;
      const denied = event.error === 'not-allowed' || event.error === 'service-not-allowed';
      const noSpeech = event.error === 'no-speech';
      if (denied) setMessage('Accès au micro refusé.', 'Autorise le micro dans le navigateur ou continue avec la saisie manuelle.', 'Micro bloqué');
      else if (noSpeech) setMessage('Je n’ai rien entendu.', 'Appuie sur Parler et dis clairement un nombre.', 'Silence');
      else if (event.error !== 'aborted') setMessage('Le micro a décroché.', 'La saisie manuelle reste disponible. Tu peux aussi réessayer.', 'Signal perdu');
      render();
    };
    recognition.onend = () => {
      state.listening = false;
      render();
    };
    try { recognition.start(); }
    catch {
      state.listening = false;
      setMessage('Impossible d’ouvrir le micro maintenant.', 'Réessaie dans un instant ou saisis le nombre manuellement.', 'Micro occupé');
      render();
    }
  }
  function setPaused(value) {
    if (state.ended || state.paused === value) return;
    if (value) {
      if (Number.isFinite(state.remaining)) state.remaining = Math.max(0, (state.endsAt - Date.now()) / 1000);
      state.paused = true;
      state.active = false;
      stopListening();
      setMessage('Transmission en pause.', 'Reprends quand tu es prêt.', 'Pause');
      announce('Jeu en pause.');
    } else {
      state.paused = false;
      state.active = !state.transitioning;
      if (Number.isFinite(state.remaining)) state.endsAt = Date.now() + state.remaining * 1000;
      setMessage(`Dis un nombre entre ${fmt(state.low)} et ${fmt(state.high)}.`, 'La fréquence secrète t’attend.', 'Reprise');
      announce('Partie reprise.');
    }
    render();
  }
  function openHelp() {
    state.resumeAfterHelp = !state.paused && !state.ended;
    if (state.resumeAfterHelp) setPaused(true);
    $('#helpOverlay').classList.remove('hidden');
    $('#closeHelp').focus();
  }
  function closeHelp() {
    $('#helpOverlay').classList.add('hidden');
    if (state.resumeAfterHelp && !state.ended) setPaused(false);
    state.resumeAfterHelp = false;
    $('#helpBtn').focus();
  }

  $('#micBtn').addEventListener('click', startListening);
  $('#guessForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = $('#numberInput');
    const raw = input.value.trim();
    if (!raw) return;
    submitGuess(Number(raw), 'manuel');
    input.value = '';
  });
  $('#numberInput').addEventListener('input', (event) => {
    const clean = event.target.value.replace(/\D/g, '').slice(0, 4);
    if (event.target.value !== clean) event.target.value = clean;
  });
  $('#pauseBtn').addEventListener('click', () => setPaused(!state.paused));
  $('#replayBtn').addEventListener('click', resetGame);
  $('#againBtn').addEventListener('click', resetGame);
  $('#helpBtn').addEventListener('click', openHelp);
  $('#closeHelp').addEventListener('click', closeHelp);
  $('#helpOverlay').addEventListener('click', (event) => { if (event.target === $('#helpOverlay')) closeHelp(); });
  $('#soundBtn').addEventListener('click', () => {
    settings.sound = !settings.sound;
    audio.set(settings.sound);
    persistSettings();
    render();
  });
  $('#vibeBtn').addEventListener('click', () => {
    settings.vibration = !settings.vibration;
    persistSettings();
    if (settings.vibration) buzz(win, 25, true);
    render();
  });
  doc.querySelectorAll('.mode').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.mode;
      if (!MODES[next] || next === state.mode) return;
      state.mode = next;
      resetGame();
      announce(`Mode ${MODES[next].name}.`);
    });
  });
  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || (event.key.toLowerCase() === 'p' && doc.activeElement !== $('#numberInput'))) {
      event.preventDefault();
      if (!$('#helpOverlay').classList.contains('hidden')) closeHelp();
      else setPaused(!state.paused);
    }
  });
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden && !state.paused && !state.ended) setPaused(true);
  });

  const timer = win.setInterval(() => {
    if (state.ended || state.paused || !MODES[state.mode].duration) return;
    state.remaining = Math.max(0, (state.endsAt - Date.now()) / 1000);
    $('#time').textContent = formatTime(state.remaining);
    if (state.remaining <= 0) finish(`Temps écoulé. La fréquence secrète était ${fmt(state.target)}.`);
  }, 180);
  win.addEventListener('pagehide', () => {
    stopListening();
    win.clearInterval(timer);
  }, { once: true });

  resetGame();
}
