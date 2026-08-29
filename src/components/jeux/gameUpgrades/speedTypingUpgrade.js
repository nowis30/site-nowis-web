const STORE = 'nowis:speed-typing:';
const MODES = {
  sprint: { name: 'Sprint', desc: '30 s · phrases courtes · rythme immédiat', duration: 30, accent: 'corail' },
  classic: { name: 'Classique', desc: '60 s · difficulté progressive · recommandé', duration: 60, accent: 'cyan' },
  endurance: { name: 'Endurance', desc: '90 s · phrases complexes · précision récompensée', duration: 90, accent: 'violet' },
};

const PHRASES = [
  [
    "le chat dort près de la fenêtre",
    "un café chaud réveille les idées",
    "la pluie glisse sur le toit",
    "nous avançons un mot à la fois",
    "le soleil éclaire la grande rue",
    "chaque touche compte dans le rythme",
    "la musique accompagne le travail",
    "un bon départ donne confiance",
    "le vent pousse les nuages au loin",
    "la patience rend les gestes précis",
  ],
  [
    "écrire vite demande surtout de rester précis",
    "les bonnes habitudes rendent chaque phrase plus fluide",
    "une courte pause peut améliorer la concentration",
    "le prochain mot arrive avant que le doute s'installe",
    "garder les yeux sur le texte aide à conserver le rythme",
    "la vitesse augmente naturellement quand les erreurs diminuent",
    "un clavier bien maîtrisé devient presque un instrument",
    "la régularité vaut mieux qu'un départ beaucoup trop rapide",
    "les accents français font partie du défi, sans exception",
    "chaque phrase terminée fait progresser le niveau",
  ],
  [
    "au bureau, une réponse claire et rapide évite souvent plusieurs détours.",
    "quand le rythme accélère, la précision reste la meilleure alliée du score.",
    "l'équipe avance mieux lorsqu'elle partage des consignes simples et concrètes.",
    "à force de pratique, les doigts trouvent les bonnes touches sans hésitation.",
    "une phrase complexe mélange accents, apostrophes, virgules et ponctuation.",
    "le défi n'est pas seulement d'aller vite : il faut aussi rester constant.",
    "sur téléphone, une saisie propre vaut davantage qu'une rafale de corrections.",
    "la meilleure performance combine vitesse, précision et calme sous pression.",
    "un record solide se construit avec des mots justes, pas avec des touches au hasard.",
    "plus le niveau monte, plus les phrases exigent attention, mémoire et coordination.",
  ],
  [
    "à 8 h 30, l'équipe vérifie ses priorités, corrige les détails et lance la journée.",
    "dans un bon test de frappe, 95 % de précision vaut mieux qu'une vitesse spectaculaire mais instable.",
    "écrire efficacement, c'est transformer une idée claire en phrase lisible sans casser le rythme.",
    "quand une erreur apparaît, mieux vaut la corriger tout de suite plutôt que d'accélérer dans la mauvaise direction.",
    "la progression devient visible lorsque la vitesse monte pendant que le nombre d'erreurs, lui, continue de baisser.",
    "un excellent niveau de frappe demande de gérer les accents, les chiffres, la ponctuation et les changements de cadence.",
    "sur un petit écran, la lisibilité du texte et la stabilité du clavier sont aussi importantes que le chronomètre.",
    "le vrai défi consiste à maintenir une cadence régulière jusqu'à la dernière seconde, même lorsque les phrases se compliquent.",
  ],
];

const read = (storage, key, fallback) => {
  try {
    return { ...fallback, ...(JSON.parse(storage.getItem(key) || 'null') || {}) };
  } catch {
    return { ...fallback };
  }
};
const save = (storage, key, value) => {
  try { storage.setItem(key, JSON.stringify(value)); } catch {}
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const formatTime = (value) => String(Math.max(0, Math.ceil(value))).padStart(2, '0');

export function upgradeSpeedTyping(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisSpeedTypingPro === 'true') return;
  root.dataset.nowisSpeedTypingPro = 'true';
  root.lang = 'fr';
  doc.title = 'Vitesse de frappe NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#08091c;color:#f8fbff;font-family:Inter,ui-rounded,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{min-height:100dvh;overflow:hidden;-webkit-tap-highlight-color:transparent}button,input{font:inherit}.app{min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:8px;padding:max(9px,env(safe-area-inset-top)) max(9px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(9px,env(safe-area-inset-left));background:radial-gradient(circle at 10% 0%,#ff6b8b2b,transparent 26%),radial-gradient(circle at 92% 14%,#35d9ff24,transparent 27%),radial-gradient(circle at 52% 100%,#9b6cff22,transparent 34%),linear-gradient(155deg,#07091d 0%,#11143b 52%,#17102f 100%)}.top,.hud,.stage,.progressWrap,.tools{width:min(100%,720px)}.top{display:flex;align-items:center;justify-content:space-between;gap:9px}.brand small{display:block;color:#ffd66b;font-size:9px;font-weight:1000;letter-spacing:.19em;text-transform:uppercase}.brand h1{margin:2px 0 0;font-size:clamp(27px,7vw,43px);line-height:.95;letter-spacing:-.055em;background:linear-gradient(92deg,#ffffff,#78e8ff 42%,#c5a3ff 68%,#ff7f9c);-webkit-background-clip:text;color:transparent}.topRight{display:flex;align-items:center;gap:6px}.chip{padding:7px 10px;border-radius:999px;border:1px solid #7be7ff42;background:#11183fe6;color:#a9efff;font-size:10px;font-weight:950}.btn,.mode,.modal button{border:1px solid #ffffff20;background:#14183de8;color:#f7f8ff;cursor:pointer}.btn,.mode,.modal button{min-height:44px;border-radius:14px;font-weight:900;touch-action:manipulation}.btn:active,.mode:active,.modal button:active{transform:scale(.97)}.btn:focus-visible,.mode:focus-visible,.modal button:focus-visible,.typeInput:focus-visible{outline:3px solid #ffe487;outline-offset:2px}.icon{min-width:44px}.hud{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}.stat{min-width:0;text-align:center;padding:7px 3px;border-radius:13px;background:#101432c9;border:1px solid #ffffff14;box-shadow:inset 0 1px #ffffff0a}.stat span{display:block;color:#9aa6ce;font-size:8px;font-weight:950;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stat strong{display:block;margin-top:1px;font-size:clamp(14px,4vw,21px);font-variant-numeric:tabular-nums}.stage{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:12px;padding:clamp(14px,4vw,25px);border:1px solid #ffffff1e;border-radius:28px;background:linear-gradient(145deg,#ffffff0c,#0d1030d9 45%,#18113be6);box-shadow:0 30px 90px #0009,inset 0 1px #ffffff12;overflow:hidden}.stage:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 0 9%,#6feaff0a 10%,transparent 11% 89%,#ff7e9a0a 90%,transparent 91%),repeating-linear-gradient(0deg,transparent 0 31px,#ffffff05 32px 33px);mask-image:linear-gradient(to bottom,transparent,#000 18%,#000 85%,transparent)}.promptLabel{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:8px;color:#8feaff;font-size:10px;font-weight:950;letter-spacing:.13em;text-transform:uppercase}.levelBadge{color:#10132e;background:linear-gradient(135deg,#82edff,#d0b0ff);padding:5px 8px;border-radius:999px;letter-spacing:.06em}.target{position:relative;z-index:1;min-height:118px;display:flex;align-items:center;padding:clamp(12px,3vw,20px);border-radius:20px;background:#080b22d6;border:1px solid #ffffff18;box-shadow:inset 0 0 34px #0007;font-size:clamp(20px,5.2vw,34px);line-height:1.46;font-weight:780;letter-spacing:.005em;white-space:pre-wrap;overflow-wrap:anywhere}.char{color:#aab2d3;border-radius:4px;transition:color .08s ease,background .08s ease}.char.ok{color:#adffcf}.char.bad{color:#fff;background:#ff5f7e55;text-decoration:underline 2px #ff839a}.char.current{color:#fff;background:#31d8ff30;box-shadow:inset 0 -2px #59e2ff}.typingZone{position:relative;z-index:1}.typeInput{width:100%;min-height:58px;border:1px solid #63dfff52;border-radius:17px;background:#0a0e2bf0;color:#fff;padding:12px 14px;font-size:16px;font-weight:750;caret-color:#ffe487;box-shadow:inset 0 1px #ffffff0c,0 12px 28px #0005}.typeInput::placeholder{color:#6e779f}.typeInput.wrong{border-color:#ff718e88;box-shadow:0 0 0 3px #ff718e13,inset 0 1px #ffffff0c}.micro{min-height:22px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;color:#8e9ac4;font-size:10px;font-weight:800}.micro strong{color:#ffd76d}.kbdHint{white-space:nowrap}.progressWrap{display:flex;align-items:center;gap:8px}.progressTrack{height:8px;flex:1;border-radius:999px;background:#ffffff10;overflow:hidden}.progressBar{height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#45ddff,#a57cff 55%,#ff7694);transition:width .2s ease}.progressText{min-width:88px;text-align:right;color:#9facd2;font-size:9px;font-weight:900}.tools{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.tools .btn{padding:8px 4px;font-size:10px}.tools .btn[aria-pressed=false]{color:#707ba3}.pulse{animation:pulse .28s ease}.stage.good{box-shadow:0 30px 90px #0009,0 0 34px #6dffc32a,inset 0 1px #ffffff12}.ov{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:18px;background:#05071bea;backdrop-filter:blur(15px)}.ov.hide{display:none}.modal{width:min(100%,470px);max-height:92dvh;overflow:auto;padding:22px;border-radius:28px;border:1px solid #ffffff20;background:linear-gradient(155deg,#12163b,#17113b 56%,#2b1434);box-shadow:0 36px 110px #000c}.eyebrow{color:#75e6ff;font-size:9px;font-weight:1000;letter-spacing:.19em;text-transform:uppercase}.modal h2{margin:4px 0;font-size:clamp(28px,8vw,40px);line-height:1;letter-spacing:-.045em}.modal p,.modal li{color:#bec6e6;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{text-align:left;padding:12px}.mode strong,.mode span{display:block}.mode span{margin-top:3px;color:#949fc7;font-size:11px}.mode.on{border-color:#69e5ff70;background:#59ddff11}.acts{display:grid;grid-template-columns:1fr 1fr;gap:7px}.modal button{padding:11px}.primary{color:#0b1027!important;border-color:#aeefff!important;background:linear-gradient(135deg,#72e8ff,#b89aff 57%,#ff8ba3)!important}.results{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:13px 0}.results div{text-align:center;padding:9px 3px;border-radius:12px;background:#090d29a8;border:1px solid #ffffff12}.results span{display:block;color:#8994bd;font-size:8px;text-transform:uppercase}.results strong{display:block;font-size:18px}.record{margin:10px 0;padding:10px;border-radius:13px;background:#ffe17b10;border:1px solid #ffe17b33;color:#ffe89c;font-size:12px;font-weight:850}.pauseCard{text-align:center}.pauseCard h2{font-size:35px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@keyframes pulse{0%{transform:scale(.99)}55%{transform:scale(1.012)}100%{transform:scale(1)}}@media(max-width:520px){.hud{grid-template-columns:repeat(3,1fr)}.stat:nth-child(4),.stat:nth-child(5),.stat:nth-child(6){padding-top:5px;padding-bottom:5px}.target{min-height:128px;font-size:clamp(19px,5.5vw,27px)}.stage{padding:14px}.micro{font-size:9px}}@media(max-height:720px){.app{gap:5px}.brand h1{font-size:28px}.stage{padding:12px;gap:8px}.target{min-height:94px;font-size:clamp(17px,4.6vw,25px)}.typeInput{min-height:50px}.tools .btn{min-height:39px}.progressWrap{display:none}}@media(orientation:landscape) and (max-height:560px){.app{display:grid;grid-template-columns:minmax(230px,.82fr) minmax(380px,1.45fr);grid-template-rows:auto auto 1fr auto;column-gap:9px}.top,.hud,.progressWrap,.tools,.stage{width:100%}.stage{grid-column:2;grid-row:1/5;height:calc(100dvh - 18px)}.hud{grid-template-columns:repeat(3,1fr)}.progressWrap{align-self:end}.target{min-height:90px;font-size:clamp(17px,3.8vw,25px)}.tools{align-self:end}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `<main class="app"><header class="top"><div class="brand"><small>Studio de frappe NOWIS</small><h1>Vitesse de frappe</h1></div><div class="topRight"><span class="chip" id="modeChip">Classique</span><button class="btn icon" id="helpTop" aria-label="Ouvrir l’aide">?</button></div></header><section class="hud"><div class="stat"><span>Score</span><strong id="score">0</strong></div><div class="stat"><span>Record</span><strong id="best">0</strong></div><div class="stat"><span>Temps</span><strong id="time">60</strong></div><div class="stat"><span>MPM</span><strong id="wpm">0</strong></div><div class="stat"><span>Précision</span><strong id="accuracy">100%</strong></div><div class="stat"><span>Série</span><strong id="combo">0</strong></div></section><section class="stage" id="stage"><div class="promptLabel"><span>Texte à recopier</span><span class="levelBadge" id="levelBadge">Niveau 1</span></div><div class="target" id="target" aria-live="polite"></div><div class="typingZone"><label class="sr" for="typeInput">Recopier le texte affiché</label><input id="typeInput" class="typeInput" type="text" inputmode="text" enterkeyhint="done" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Touchez ici et commencez à écrire…" aria-describedby="typingHelp"><div class="micro" id="typingHelp"><span id="status">Le chrono démarre à la première touche.</span><span class="kbdHint">Échap = pause</span></div></div></section><div class="progressWrap"><div class="progressTrack" aria-hidden="true"><div class="progressBar" id="progressBar"></div></div><span class="progressText" id="progressText">0 / 3 vers niv. 2</span></div><nav class="tools"><button class="btn" id="pause">⏸ Pause</button><button class="btn" id="restart">↻ Rejouer</button><button class="btn" id="sound" aria-pressed="true">🔊 Son</button><button class="btn" id="vibe" aria-pressed="true">📳 Vibration</button></nav><div class="sr" id="live" aria-live="assertive"></div></main><div class="ov" id="menu"><section class="modal"><div class="eyebrow">Remake NOWIS</div><h2>Prêt à taper?</h2><p>Recopie les phrases le plus proprement possible. La vitesse compte, mais une excellente précision fait grimper le score beaucoup plus vite.</p><div class="modes" id="modes"></div><div class="acts"><button id="rules">Règles</button><button class="primary" id="start">Commencer</button></div></section></div><div class="ov hide" id="help"><section class="modal"><div class="eyebrow">Guide rapide</div><h2>Comment jouer</h2><ul><li>Recopie exactement la phrase affichée, accents et ponctuation compris.</li><li>Le chronomètre démarre seulement à votre première touche.</li><li>Une phrase sans faute augmente la <strong>série</strong> et donne un bonus.</li><li>Toutes les 3 phrases, le niveau monte et le texte devient plus complexe.</li><li><strong>MPM</strong> signifie mots par minute, calculés sur une base standard de 5 caractères.</li><li>Sur mobile, touchez le champ de saisie pour afficher le clavier. Échap met en pause avec un clavier physique.</li></ul><div class="acts"><button class="primary" id="closeHelp">Compris</button><button id="helpRestart">Rejouer</button></div></section></div><div class="ov hide" id="pauseOv"><section class="modal pauseCard"><div class="eyebrow">Chrono arrêté</div><h2>Pause</h2><p>Votre série et votre temps sont conservés.</p><div class="acts"><button class="primary" id="resume">Continuer</button><button id="pauseRestart">Rejouer</button></div></section></div><div class="ov hide" id="result"><section class="modal"><div class="eyebrow">Session terminée</div><h2 id="resultTitle">Bien joué!</h2><p id="resultCopy">Votre précision donne le ton de la prochaine tentative.</p><div class="results"><div><span>MPM</span><strong id="resultWpm">0</strong></div><div><span>Précision</span><strong id="resultAccuracy">0%</strong></div><div><span>Score</span><strong id="resultScore">0</strong></div><div><span>Phrases</span><strong id="resultPhrases">0</strong></div></div><div class="record" id="recordText">Record personnel conservé.</div><div class="acts"><button id="changeMode">Changer mode</button><button class="primary" id="again">Rejouer</button></div></section></div>`;

  const $ = (id) => doc.getElementById(id);
  const els = {
    menu: $('menu'), modes: $('modes'), start: $('start'), rules: $('rules'), help: $('help'), helpTop: $('helpTop'), closeHelp: $('closeHelp'), helpRestart: $('helpRestart'),
    pauseOv: $('pauseOv'), resume: $('resume'), pauseRestart: $('pauseRestart'), result: $('result'), resultTitle: $('resultTitle'), resultCopy: $('resultCopy'), resultWpm: $('resultWpm'), resultAccuracy: $('resultAccuracy'), resultScore: $('resultScore'), resultPhrases: $('resultPhrases'), recordText: $('recordText'), changeMode: $('changeMode'), again: $('again'),
    modeChip: $('modeChip'), score: $('score'), best: $('best'), time: $('time'), wpm: $('wpm'), accuracy: $('accuracy'), combo: $('combo'), levelBadge: $('levelBadge'), target: $('target'), input: $('typeInput'), stage: $('stage'), status: $('status'), progressBar: $('progressBar'), progressText: $('progressText'), pause: $('pause'), restart: $('restart'), sound: $('sound'), vibe: $('vibe'), live: $('live'),
  };

  let settings = read(win.localStorage, STORE + 'settings', { sound: true, vibe: true, mode: 'classic' });
  let records = read(win.localStorage, STORE + 'records', {
    sprint: { score: 0, wpm: 0, accuracy: 0 },
    classic: { score: 0, wpm: 0, accuracy: 0 },
    endurance: { score: 0, wpm: 0, accuracy: 0 },
    sessions: 0,
    maxCombo: 0,
  });
  let selectedMode = MODES[settings.mode] ? settings.mode : 'classic';
  let target = '';
  let currentInput = '';
  let previousInput = '';
  let previousPhrase = '';
  let active = false;
  let paused = false;
  let started = false;
  let timeLeft = MODES[selectedMode].duration;
  let lastTick = Date.now();
  let elapsed = 0;
  let score = 0;
  let completedPhrases = 0;
  let completedChars = 0;
  let totalKeys = 0;
  let correctKeys = 0;
  let phraseErrors = 0;
  let combo = 0;
  let level = 1;
  let audioCtx = null;

  const sound = (kind) => {
    if (!settings.sound) return;
    try {
      audioCtx ||= new (win.AudioContext || win.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;
      const map = kind === 'good' ? [620, 840, 0.09] : kind === 'bad' ? [180, 120, 0.07] : [410, 520, 0.05];
      oscillator.type = kind === 'bad' ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(map[0], now);
      oscillator.frequency.exponentialRampToValueAtTime(map[1], now + map[2]);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(kind === 'good' ? 0.055 : 0.025, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + map[2]);
      oscillator.connect(gain); gain.connect(audioCtx.destination); oscillator.start(now); oscillator.stop(now + map[2] + 0.01);
    } catch {}
  };
  const vibrate = (pattern) => {
    if (settings.vibe && win.navigator?.vibrate) {
      try { win.navigator.vibrate(pattern); } catch {}
    }
  };

  const matchingPrefixLength = (value, phrase) => {
    let index = 0;
    while (index < value.length && index < phrase.length && value[index] === phrase[index]) index += 1;
    return index;
  };

  const currentAccuracy = () => totalKeys ? Math.round((correctKeys / totalKeys) * 100) : 100;
  const currentWpm = () => {
    if (!started || elapsed <= 0) return 0;
    const effectiveChars = completedChars + matchingPrefixLength(currentInput, target);
    return Math.max(0, Math.round((effectiveChars / 5) / (elapsed / 60)));
  };

  const phraseTier = () => {
    const modeBonus = selectedMode === 'endurance' ? 1 : selectedMode === 'sprint' ? -1 : 0;
    return clamp(Math.floor((level - 1) / 2) + modeBonus, 0, PHRASES.length - 1);
  };
  const pickPhrase = () => {
    const pool = PHRASES[phraseTier()];
    let candidate = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && candidate === previousPhrase) candidate = pool[(pool.indexOf(candidate) + 1) % pool.length];
    previousPhrase = candidate;
    return candidate;
  };

  const renderTarget = () => {
    els.target.textContent = '';
    const prefix = matchingPrefixLength(currentInput, target);
    for (let i = 0; i < target.length; i += 1) {
      const span = doc.createElement('span');
      span.className = 'char';
      span.textContent = target[i];
      if (i < prefix) span.classList.add('ok');
      else if (i < currentInput.length) span.classList.add('bad');
      else if (i === currentInput.length) span.classList.add('current');
      els.target.appendChild(span);
    }
  };

  const updateHud = () => {
    const acc = currentAccuracy();
    const mpm = currentWpm();
    const best = records[selectedMode] || { score: 0, wpm: 0, accuracy: 0 };
    els.score.textContent = String(score);
    els.best.textContent = String(best.score || 0);
    els.time.textContent = formatTime(timeLeft);
    els.wpm.textContent = String(mpm);
    els.accuracy.textContent = `${acc}%`;
    els.combo.textContent = String(combo);
    els.levelBadge.textContent = `Niveau ${level}`;
    const within = completedPhrases % 3;
    els.progressBar.style.width = `${(within / 3) * 100}%`;
    els.progressText.textContent = `${within} / 3 vers niv. ${level + 1}`;
  };

  const setStatus = (message, announce = false) => {
    els.status.textContent = message;
    if (announce) els.live.textContent = message;
  };

  const preparePhrase = () => {
    target = pickPhrase();
    currentInput = '';
    previousInput = '';
    phraseErrors = 0;
    els.input.value = '';
    els.input.maxLength = target.length;
    els.input.classList.remove('wrong');
    renderTarget();
  };

  const renderModes = () => {
    els.modes.innerHTML = Object.entries(MODES).map(([key, mode]) => `<button class="mode${key === selectedMode ? ' on' : ''}" data-mode="${key}"><strong>${mode.name}${key === 'classic' ? ' · conseillé' : ''}</strong><span>${mode.desc}</span></button>`).join('');
    els.modes.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
      selectedMode = button.dataset.mode;
      settings.mode = selectedMode;
      save(win.localStorage, STORE + 'settings', settings);
      timeLeft = MODES[selectedMode].duration;
      renderModes();
      updateHud();
    }));
  };

  const focusInput = () => win.setTimeout(() => {
    try { els.input.focus({ preventScroll: true }); } catch { els.input.focus(); }
  }, 30);

  const startGame = () => {
    const mode = MODES[selectedMode];
    active = true; paused = false; started = false; timeLeft = mode.duration; lastTick = Date.now(); elapsed = 0;
    score = 0; completedPhrases = 0; completedChars = 0; totalKeys = 0; correctKeys = 0; phraseErrors = 0; combo = 0; level = 1;
    els.menu.classList.add('hide'); els.help.classList.add('hide'); els.pauseOv.classList.add('hide'); els.result.classList.add('hide');
    els.modeChip.textContent = mode.name;
    preparePhrase(); updateHud();
    setStatus('Le chrono démarre à la première touche.');
    focusInput();
  };

  const finishGame = () => {
    if (!active) return;
    active = false; paused = false;
    els.input.blur();
    const mpm = currentWpm();
    const accuracy = currentAccuracy();
    const old = records[selectedMode] || { score: 0, wpm: 0, accuracy: 0 };
    const scoreRecord = score > (old.score || 0);
    const wpmRecord = mpm > (old.wpm || 0);
    records[selectedMode] = {
      score: Math.max(old.score || 0, score),
      wpm: Math.max(old.wpm || 0, mpm),
      accuracy: Math.max(old.accuracy || 0, accuracy),
    };
    records.sessions = (records.sessions || 0) + 1;
    records.maxCombo = Math.max(records.maxCombo || 0, combo);
    save(win.localStorage, STORE + 'records', records);
    updateHud();
    els.resultWpm.textContent = String(mpm);
    els.resultAccuracy.textContent = `${accuracy}%`;
    els.resultScore.textContent = String(score);
    els.resultPhrases.textContent = String(completedPhrases);
    els.resultTitle.textContent = accuracy >= 98 ? 'Précision remarquable!' : mpm >= 50 ? 'Très bon rythme!' : 'Session terminée!';
    els.resultCopy.textContent = accuracy >= 95 ? 'Votre vitesse repose sur une base solide.' : 'Quelques corrections de moins feront grimper le prochain score.';
    els.recordText.textContent = scoreRecord || wpmRecord ? `Nouveau record${scoreRecord && wpmRecord ? ' de score et de vitesse' : scoreRecord ? ' de score' : ' de vitesse'}!` : `Record : ${records[selectedMode].score} points · ${records[selectedMode].wpm} MPM.`;
    els.result.classList.remove('hide');
    sound('good'); vibrate([25, 35, 25]);
  };

  const completePhrase = () => {
    completedChars += target.length;
    completedPhrases += 1;
    if (phraseErrors === 0) combo += 1; else combo = 0;
    level = 1 + Math.floor(completedPhrases / 3);
    const precisionBonus = Math.max(0, 110 - phraseErrors * 18);
    score += target.length * 4 + precisionBonus + combo * 25 + level * 12;
    records.maxCombo = Math.max(records.maxCombo || 0, combo);
    els.stage.classList.remove('good', 'pulse');
    void els.stage.offsetWidth;
    els.stage.classList.add('good', 'pulse');
    win.setTimeout(() => els.stage.classList.remove('good'), 280);
    setStatus(phraseErrors === 0 ? `Phrase parfaite · série ${combo}!` : `Phrase terminée · ${phraseErrors} erreur${phraseErrors > 1 ? 's' : ''}.`, true);
    sound('good'); vibrate(18);
    preparePhrase(); updateHud(); focusInput();
  };

  const handleInput = () => {
    if (!active || paused) return;
    const value = els.input.value;
    if (!started && value.length > 0) {
      started = true;
      lastTick = Date.now();
      setStatus('Chrono lancé · gardez le rythme.');
    }
    if (value.length > previousInput.length) {
      const added = value.slice(previousInput.length);
      for (let i = 0; i < added.length; i += 1) {
        const position = previousInput.length + i;
        totalKeys += 1;
        if (added[i] === target[position]) correctKeys += 1;
        else { phraseErrors += 1; sound('bad'); }
      }
    }
    currentInput = value;
    previousInput = value;
    const correct = target.startsWith(value);
    els.input.classList.toggle('wrong', !correct);
    if (!correct) setStatus('Une touche diffère du texte : corrigez-la pour continuer.');
    else if (started) setStatus('Bon rythme · la précision reste prioritaire.');
    renderTarget(); updateHud();
    if (value === target) completePhrase();
  };

  const setPaused = (value) => {
    if (!active || paused === value) return;
    paused = value;
    lastTick = Date.now();
    if (paused) {
      els.pauseOv.classList.remove('hide');
      els.input.blur();
    } else {
      els.pauseOv.classList.add('hide');
      focusInput();
    }
  };

  const showHelp = () => {
    if (active && !paused) setPaused(true);
    els.help.classList.remove('hide');
  };
  const closeHelp = () => {
    els.help.classList.add('hide');
    if (active && paused) setPaused(false);
  };

  els.input.addEventListener('input', handleInput);
  els.input.addEventListener('paste', (event) => { event.preventDefault(); setStatus('Le collage est désactivé pour garder le défi équitable.', true); vibrate(20); });
  els.input.addEventListener('drop', (event) => event.preventDefault());
  els.stage.addEventListener('pointerdown', (event) => { if (active && !paused && event.target !== els.input) focusInput(); });
  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && active) { event.preventDefault(); setPaused(!paused); }
  });
  win.addEventListener('blur', () => { if (active && started && !paused) setPaused(true); });
  doc.addEventListener('visibilitychange', () => { if (doc.hidden && active && started && !paused) setPaused(true); });

  els.start.addEventListener('click', startGame);
  els.rules.addEventListener('click', showHelp);
  els.helpTop.addEventListener('click', showHelp);
  els.closeHelp.addEventListener('click', closeHelp);
  els.helpRestart.addEventListener('click', startGame);
  els.pause.addEventListener('click', () => setPaused(true));
  els.resume.addEventListener('click', () => setPaused(false));
  els.pauseRestart.addEventListener('click', startGame);
  els.restart.addEventListener('click', startGame);
  els.again.addEventListener('click', startGame);
  els.changeMode.addEventListener('click', () => { els.result.classList.add('hide'); els.menu.classList.remove('hide'); renderModes(); });
  els.sound.addEventListener('click', () => {
    settings.sound = !settings.sound; save(win.localStorage, STORE + 'settings', settings);
    els.sound.setAttribute('aria-pressed', String(settings.sound)); els.sound.textContent = settings.sound ? '🔊 Son' : '🔇 Son'; if (settings.sound) sound('tap');
  });
  els.vibe.addEventListener('click', () => {
    settings.vibe = !settings.vibe; save(win.localStorage, STORE + 'settings', settings);
    els.vibe.setAttribute('aria-pressed', String(settings.vibe)); els.vibe.textContent = settings.vibe ? '📳 Vibration' : '📵 Vibration'; if (settings.vibe) vibrate(15);
  });

  win.setInterval(() => {
    const now = Date.now();
    if (active && started && !paused) {
      const delta = Math.max(0, (now - lastTick) / 1000);
      elapsed += delta;
      timeLeft = Math.max(0, timeLeft - delta);
      updateHud();
      if (timeLeft <= 0) finishGame();
    }
    lastTick = now;
  }, 180);

  els.sound.setAttribute('aria-pressed', String(settings.sound));
  els.sound.textContent = settings.sound ? '🔊 Son' : '🔇 Son';
  els.vibe.setAttribute('aria-pressed', String(settings.vibe));
  els.vibe.textContent = settings.vibe ? '📳 Vibration' : '📵 Vibration';
  renderModes(); updateHud(); preparePhrase();
}
