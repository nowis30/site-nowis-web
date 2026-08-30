const STORE = 'nowis:typing-challenge:';

const MODES = {
  precision: {
    name: 'Précision',
    desc: '120 s · rythme posé · priorité aux erreurs évitées',
    duration: 120,
    phraseTarget: 3,
    scoreMult: 0.9,
    levelStep: 4,
  },
  classic: {
    name: 'Classique',
    desc: '90 s · difficulté progressive · recommandé',
    duration: 90,
    phraseTarget: 4,
    scoreMult: 1,
    levelStep: 4,
  },
  expert: {
    name: 'Expert',
    desc: '70 s · ponctuation, chiffres et cadence soutenue',
    duration: 70,
    phraseTarget: 5,
    scoreMult: 1.28,
    levelStep: 3,
  },
};

const TRANSMISSIONS = [
  [
    'Le signal est clair et la liaison reste stable.',
    'Chaque touche précise renforce la transmission.',
    'Un bon rythme commence par une frappe régulière.',
    'La prochaine consigne arrive dans quelques secondes.',
    'Le calme aide les doigts à garder le bon tempo.',
    'La mission avance une phrase à la fois.',
    'Le message traverse le réseau sans détour.',
    'Une frappe propre vaut mieux qu’une course désordonnée.',
    'Le tableau de bord confirme la bonne réception.',
    'Le poste de contrôle reste attentif au moindre détail.',
  ],
  [
    'À mesure que le niveau monte, la précision devient encore plus importante.',
    'Une cadence constante permet de corriger moins et de terminer plus vite.',
    'Les accents français comptent : é, è, à, ç et ô doivent rester exacts.',
    'Le centre de transmission compare chaque caractère avant de valider le message.',
    'Garder les yeux sur la consigne aide à maintenir une vitesse stable.',
    'Une petite erreur casse la série, mais la prochaine phrase peut la relancer.',
    'Sur téléphone, le clavier natif reste le moyen le plus fiable pour écrire vite.',
    'Le score récompense la vitesse, la précision et les longues séries sans faute.',
    'Chaque transmission terminée ajoute de l’expérience au niveau en cours.',
    'Un nouveau record demande autant de constance que de rapidité.',
  ],
  [
    'À 8 h 45, l’équipe ouvre le canal 3, vérifie le signal et confirme : « liaison prête ».',
    'Objectif : conserver au moins 96 % de précision pendant toute la séquence.',
    'Le message n° 27 doit être transmis avant 14 h 30, sans oublier l’apostrophe ni le point final.',
    'Quand la cadence accélère, relire le prochain groupe de mots évite les corrections inutiles.',
    'Une bonne transmission combine 3 qualités : attention, régularité et vitesse.',
    'Le terminal affiche « reçu à 100 % » seulement lorsque chaque caractère correspond exactement.',
    'Sur un écran compact, les boutons restent grands, le texte lisible et la zone de saisie stable.',
    'Mission 42 : saisir la phrase complète, respecter les accents, puis confirmer la dernière ponctuation.',
    'Le meilleur score n’est pas seulement rapide ; il reste propre du premier au dernier caractère.',
    'À partir du niveau 6, les consignes mélangent chiffres, guillemets, accents et changements de cadence.',
  ],
  [
    'Rapport 07-B — À 16 h 05, la balise nord signale 98 % de puissance ; maintenir le canal jusqu’à nouvel ordre.',
    'Message prioritaire : « équipe prête, secteur sécurisé, départ prévu à 09 h 15 ». Confirmer après saisie complète.',
    'Séquence 314 : noter 12,5 km, 3 balises actives et 1 liaison secondaire, puis fermer le rapport correctement.',
    'Le défi expert exige une lecture rapide, mais aucune vitesse ne compense une ponctuation oubliée ou un accent perdu.',
    'Transmission finale — garder 97 % de précision, dépasser le rythme précédent et terminer avant la dernière seconde.',
    'Au poste C-4, l’opérateur reçoit : « priorité élevée ; réponse attendue avant 18 h 20 ». Chaque symbole compte.',
    'Contrôle qualité : 24 messages reçus, 23 validés, 1 à reprendre ; l’objectif suivant est de terminer sans correction.',
    'Le canal longue portée reste ouvert pendant 60 s : saisir exactement les données, y compris « n° », %, : et ;.',
  ],
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const fmt = (value) => Math.max(0, Math.round(value)).toLocaleString('fr-CA');
const formatTime = (seconds) => {
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
const quoteFold = (value) => String(value || '').replace(/[‘’']/g, "'").replace(/[“”\"]/g, '"');
const stageForLevel = (level, mode) => {
  if (mode === 'expert') return clamp(1 + Math.floor((level - 1) / 2), 1, 3);
  return clamp(Math.floor((level - 1) / 2), 0, 3);
};
const scoreFor = ({ chars, seconds, errors, combo, mode, level }) => {
  const speed = chars / Math.max(1.8, seconds);
  const accuracy = chars / Math.max(1, chars + errors);
  const clean = errors === 0 ? 1.24 : 1;
  const comboMult = 1 + Math.min(0.8, Math.max(0, combo - 1) * 0.08);
  const levelMult = 1 + Math.min(0.7, (level - 1) * 0.05);
  return Math.max(10, Math.round((chars * 7 + speed * 35) * accuracy * clean * comboMult * levelMult * MODES[mode].scoreMult));
};
const metrics = ({ correctChars, errors, elapsedSeconds }) => {
  const elapsedMinutes = Math.max(1 / 60, elapsedSeconds / 60);
  const accuracy = correctChars / Math.max(1, correctChars + errors);
  return {
    wpm: Math.round((correctChars / 5) / elapsedMinutes),
    cpm: Math.round(correctChars / elapsedMinutes),
    accuracy: Math.round(accuracy * 100),
  };
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
    key() { tone(330, 0.025, 'square', 0.008); },
    error() { tone(128, 0.11, 'sawtooth', 0.025); },
    phrase(combo) {
      tone(520 + Math.min(220, combo * 18), 0.055, 'triangle', 0.021);
      tone(760 + Math.min(180, combo * 12), 0.07, 'sine', 0.016, 0.045);
    },
    level() { [392, 494, 659].forEach((frequency, i) => tone(frequency, 0.08, 'triangle', 0.022, i * 0.055)); },
    end() { [659, 523, 392].forEach((frequency, i) => tone(frequency, 0.1, 'triangle', 0.022, i * 0.065)); },
    set(value) { enabled = value; },
  };
}

const buzz = (win, pattern, enabled) => {
  if (!enabled) return;
  try { win.navigator?.vibrate?.(pattern); }
  catch { /* vibration non disponible */ }
};

function safeText(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

export function upgradeTypingChallenge(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisTypingChallengePro === 'true') return;
  root.dataset.nowisTypingChallengePro = 'true';
  root.lang = 'fr';
  doc.title = 'Défi de frappe NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#07131a;color:#f7f3e8;font-family:Inter,ui-rounded,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{min-height:100dvh;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}button,textarea{font:inherit}.app{min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:7px;padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(9px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));background:radial-gradient(circle at 8% 7%,#e17d4530,transparent 23%),radial-gradient(circle at 92% 10%,#67b8b82a,transparent 27%),linear-gradient(155deg,#06131a,#0c2328 56%,#101b1d)}.top,.hud,.console,.meter,.tools{width:min(100%,800px)}.top{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand small{display:block;color:#e7a76f;font-size:9px;font-weight:1000;letter-spacing:.18em;text-transform:uppercase}.brand h1{margin:2px 0 0;font-size:clamp(25px,7vw,41px);line-height:.94;letter-spacing:-.052em;color:#f3ead7;text-shadow:0 2px #0008}.topRight{display:flex;align-items:center;gap:5px}.chip,.btn,.mode,.modal button{min-height:44px;border:1px solid #9dd2c73c;border-radius:13px;background:#0c2026e8;color:#eef7f3;font-weight:900}.chip{display:flex;align-items:center;padding:0 10px;color:#a9d9d0;font-size:10px}.btn,.mode,.modal button{cursor:pointer;touch-action:manipulation}.btn{padding:7px 10px}.btn:active,.mode:active,.modal button:active{transform:scale(.97)}.btn:focus-visible,.mode:focus-visible,.modal button:focus-visible,.type:focus-visible{outline:3px solid #f2b277;outline-offset:2px}.hud{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.stat{text-align:center;padding:6px 3px;border:1px solid #dbe8df18;border-radius:11px;background:#07181dc7;box-shadow:inset 0 1px #fff1}.stat span{display:block;color:#7fa09f;font-size:8px;font-weight:950;text-transform:uppercase}.stat strong{display:block;color:#fff3dc;font-size:clamp(14px,4vw,20px);font-variant-numeric:tabular-nums}.console{position:relative;flex:1;min-height:260px;display:flex;flex-direction:column;gap:10px;padding:clamp(13px,3.5vw,21px);overflow:hidden;border:1px solid #8fbdb235;border-radius:25px;background:linear-gradient(160deg,#0e282d,#07171d 58%,#101e20);box-shadow:0 28px 80px #000a,inset 0 1px #fff1}.console:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 88% 13%,#e1815140 0 3px,transparent 4px),radial-gradient(circle at 92% 13%,#75c0b850 0 3px,transparent 4px),repeating-linear-gradient(90deg,transparent 0 79px,#9dc8c80c 80px 81px),repeating-linear-gradient(0deg,transparent 0 31px,#9dc8c809 32px 33px)}.signal{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:9px}.signalLabel{color:#86b9b5;font-size:9px;font-weight:1000;letter-spacing:.15em;text-transform:uppercase}.signalState{display:flex;align-items:center;gap:6px;color:#eeb37f;font-size:10px;font-weight:900}.lamp{width:9px;height:9px;border-radius:50%;background:#65c7aa;box-shadow:0 0 12px #65c7aa}.paper{position:relative;z-index:1;flex:1;min-height:126px;display:flex;align-items:center;padding:clamp(14px,4vw,24px);border-radius:18px;border:1px solid #7c8b804d;background:linear-gradient(178deg,#f1ead8,#ddd5c2);box-shadow:0 15px 34px #0007,inset 0 1px #fff;color:#2c3330;font-family:Georgia,"Times New Roman",serif;font-size:clamp(18px,4.7vw,29px);line-height:1.5;font-weight:750;white-space:pre-wrap;overflow-wrap:anywhere}.char{border-radius:3px}.char.done{color:#2d776d;background:#72b8a924}.char.current{color:#17221f;background:#e6a26970;box-shadow:inset 0 -2px #bd6f3c}.char.pending{color:#5b625d}.typingZone{position:relative;z-index:1}.type{width:100%;min-height:62px;max-height:112px;resize:none;border:1px solid #81bdb554;border-radius:15px;background:#06161cf2;color:#f8f3e5;padding:12px 13px;font-size:16px;font-weight:760;line-height:1.35;caret-color:#efaa70;box-shadow:inset 0 2px 8px #0008}.type::placeholder{color:#607c7c}.type.error{border-color:#df725e;box-shadow:0 0 0 3px #df725e20,inset 0 2px 8px #0008}.type:disabled{opacity:.58}.micro{min-height:20px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:5px;color:#769494;font-size:9px;font-weight:850}.micro strong{color:#e9aa73}.meter{display:flex;align-items:center;gap:8px}.track{height:8px;flex:1;overflow:hidden;border-radius:999px;background:#ffffff12}.fill{height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#5fbaa8,#e1a268);transition:width .18s ease}.meterText{min-width:94px;text-align:right;color:#8eb0ad;font-size:9px;font-weight:900}.tools{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.tools .btn{padding:7px 4px;font-size:10px}.tools .btn[aria-pressed=false]{color:#66807e}.ov{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:18px;background:#041016eb;backdrop-filter:blur(13px)}.ov.hide{display:none}.modal{width:min(100%,510px);max-height:91dvh;overflow:auto;padding:21px;border:1px solid #8db9ae3a;border-radius:25px;background:linear-gradient(150deg,#0d262b,#122c2d 62%,#171e1d);box-shadow:0 34px 100px #000d}.ey{color:#e2a16a;font-size:9px;font-weight:950;letter-spacing:.18em;text-transform:uppercase}.modal h2{margin:5px 0;font-size:clamp(28px,8vw,40px);line-height:1;letter-spacing:-.04em;color:#f3ead7}.modal p,.modal li{color:#adbfba;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{text-align:left;padding:12px}.mode strong,.mode span{display:block}.mode span{margin-top:3px;color:#829a96;font-size:11px}.mode.on{border-color:#e4aa7770;background:#d4834c16}.acts{display:grid;grid-template-columns:1fr 1fr;gap:7px}.modal button{padding:10px}.primary{color:#10201d!important;border-color:#f0bb8b!important;background:linear-gradient(135deg,#f0b47e,#8cc7ba)!important}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0}.cards div{text-align:center;padding:9px 4px;border-radius:11px;border:1px solid #ffffff12;background:#081a1dcc}.cards span{display:block;color:#78918d;font-size:8px;text-transform:uppercase}.cards strong{display:block;color:#f0dec7;font-size:17px}.record{margin:10px 0;padding:9px;border-radius:11px;border:1px solid #e3a56c35;background:#d7894a0d;color:#efb984;font-size:11px;font-weight:850}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.shake{animation:shake .16s ease}.success{animation:success .28s ease}@keyframes shake{25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}@keyframes success{50%{box-shadow:0 0 0 4px #72c4b331,0 18px 35px #0007}}@media(max-width:600px){.hud{grid-template-columns:repeat(3,1fr)}.stat:nth-child(n+4){display:none}.brand h1{font-size:27px}.paper{font-size:clamp(17px,5vw,23px);min-height:140px}.type{min-height:58px}.console{min-height:270px}}@media(max-height:700px){.app{gap:4px}.brand small{display:none}.brand h1{font-size:24px}.stat{padding:4px 3px}.console{min-height:190px;padding:10px;gap:7px}.paper{min-height:88px;font-size:17px;padding:11px}.type{min-height:49px;max-height:62px}.tools .btn{min-height:39px}.meter{display:none}}@media(orientation:landscape) and (max-height:560px){.app{display:grid;grid-template-columns:minmax(230px,.75fr) minmax(390px,1.35fr);grid-template-rows:auto auto 1fr auto;column-gap:8px}.top,.hud,.meter,.tools,.console{width:100%}.console{grid-column:2;grid-row:1/5;height:calc(100dvh - 16px)}.hud{grid-template-columns:repeat(3,1fr)}.paper{font-size:16px;min-height:100px}.tools{align-self:end}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `<main class="app"><header class="top"><div class="brand"><small>Centre de transmission NOWIS</small><h1>Défi de frappe</h1></div><div class="topRight"><span class="chip" id="modeChip">Classique</span><button class="btn" id="helpTop" aria-label="Ouvrir l’aide">?</button></div></header><section class="hud" aria-label="Statistiques"><div class="stat"><span>Score</span><strong id="score">0</strong></div><div class="stat"><span>Temps</span><strong id="time">1:30</strong></div><div class="stat"><span>MPM</span><strong id="wpm">0</strong></div><div class="stat"><span>Précision</span><strong id="accuracy">100%</strong></div><div class="stat"><span>Série</span><strong id="combo">0</strong></div><div class="stat"><span>Niveau</span><strong id="level">1</strong></div></section><section class="console" aria-label="Zone de transmission"><div class="signal"><span class="signalLabel">Message en cours</span><span class="signalState"><i class="lamp"></i><span id="signalText">Canal prêt</span></span></div><div class="paper" id="paper" aria-live="polite"></div><div class="typingZone"><textarea class="type" id="type" rows="2" inputmode="text" enterkeyhint="done" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" aria-label="Saisir exactement le message affiché" placeholder="Commence à écrire ici…"></textarea><div class="micro"><span id="hint">Les erreurs sont refusées immédiatement.</span><strong id="phraseStat">0 message</strong></div></div></section><div class="meter"><div class="track"><div class="fill" id="fill"></div></div><span class="meterText" id="meterText">0 % du message</span></div><footer class="tools"><button class="btn" id="pause">Pause</button><button class="btn" id="replay">Rejouer</button><button class="btn" id="sound" aria-pressed="true">Son ✓</button><button class="btn" id="vibration" aria-pressed="true">Vibration ✓</button></footer></main><div class="ov" id="overlay"><section class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"></section></div><div class="sr" id="live" aria-live="polite"></div>`;

  const $ = (id) => doc.getElementById(id);
  const audio = sound(win);
  const state = {
    mode: 'classic',
    active: false,
    paused: false,
    ended: false,
    composing: false,
    score: 0,
    combo: 0,
    maxCombo: 0,
    level: 1,
    completed: 0,
    correctChars: 0,
    errors: 0,
    typed: '',
    target: '',
    targetStage: 0,
    phraseStartedAt: 0,
    startedAt: 0,
    pausedAt: 0,
    pausedTotal: 0,
    remaining: MODES.classic.duration,
    sound: true,
    vibration: true,
    used: new Set(),
    raf: 0,
  };

  const storageKey = () => `${STORE}${state.mode}`;
  const loadStats = () => read(win.localStorage, storageKey(), {
    bestScore: 0, bestWpm: 0, bestAccuracy: 0, bestLevel: 0, games: 0,
  });

  function elapsed(now = win.performance.now()) {
    if (!state.startedAt) return 0;
    const pauseExtra = state.paused && state.pausedAt ? now - state.pausedAt : 0;
    return Math.max(0, (now - state.startedAt - state.pausedTotal - pauseExtra) / 1000);
  }

  function currentMetrics() {
    return metrics({ correctChars: state.correctChars, errors: state.errors, elapsedSeconds: elapsed() });
  }

  function updateHud() {
    const m = currentMetrics();
    $('score').textContent = fmt(state.score);
    $('time').textContent = formatTime(state.remaining);
    $('wpm').textContent = String(m.wpm);
    $('accuracy').textContent = `${m.accuracy}%`;
    $('combo').textContent = String(state.combo);
    $('level').textContent = String(state.level);
    $('phraseStat').textContent = `${state.completed} message${state.completed === 1 ? '' : 's'}`;
    $('modeChip').textContent = MODES[state.mode].name;
  }

  function renderTarget() {
    const target = state.target;
    const typedLength = state.typed.length;
    $('paper').innerHTML = [...target].map((char, index) => {
      const klass = index < typedLength ? 'done' : index === typedLength ? 'current' : 'pending';
      const shown = char === ' ' ? '&nbsp;' : safeText(char);
      return `<span class="char ${klass}">${shown}</span>`;
    }).join('');
    const progress = target.length ? Math.round((typedLength / target.length) * 100) : 0;
    $('fill').style.width = `${progress}%`;
    $('meterText').textContent = `${progress} % du message`;
  }

  function pickTarget() {
    const stage = stageForLevel(state.level, state.mode);
    state.targetStage = stage;
    const pool = TRANSMISSIONS[stage];
    let choices = pool.filter((phrase) => !state.used.has(phrase));
    if (!choices.length) {
      pool.forEach((phrase) => state.used.delete(phrase));
      choices = pool.slice();
    }
    state.target = choices[Math.floor(Math.random() * choices.length)];
    state.used.add(state.target);
    state.typed = '';
    state.phraseStartedAt = win.performance.now();
    $('type').value = '';
    $('signalText').textContent = `Canal ${stage + 1} · ${state.target.length} caractères`;
    $('hint').textContent = stage >= 2 ? 'Accents, chiffres et ponctuation doivent être exacts.' : 'Les erreurs sont refusées immédiatement.';
    renderTarget();
  }

  function announce(message) {
    $('live').textContent = '';
    win.setTimeout(() => { $('live').textContent = message; }, 20);
  }

  function finishPhrase() {
    const now = win.performance.now();
    const seconds = Math.max(0.5, (now - state.phraseStartedAt) / 1000);
    const chars = state.target.length;
    const phraseErrorsBefore = Number($('type').dataset.errors || 0);
    const gained = scoreFor({ chars, seconds, errors: phraseErrorsBefore, combo: state.combo + 1, mode: state.mode, level: state.level });
    state.score += gained;
    state.correctChars += chars;
    state.completed += 1;
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    $('type').dataset.errors = '0';
    audio.phrase(state.combo);
    buzz(win, state.combo >= 4 ? [18, 25, 18] : 18, state.vibration);
    $('paper').classList.remove('success');
    void $('paper').offsetWidth;
    $('paper').classList.add('success');
    const previousLevel = state.level;
    state.level = 1 + Math.floor(state.completed / MODES[state.mode].levelStep);
    if (state.level > previousLevel) {
      audio.level();
      announce(`Niveau ${state.level}. La difficulté augmente.`);
    } else {
      announce(`Message validé. ${gained} points.`);
    }
    updateHud();
    win.setTimeout(() => {
      if (!state.active || state.paused || state.ended) return;
      pickTarget();
      $('type').focus({ preventScroll: true });
    }, 260);
  }

  function registerError() {
    state.errors += 1;
    state.combo = 0;
    const localErrors = Number($('type').dataset.errors || 0) + 1;
    $('type').dataset.errors = String(localErrors);
    audio.error();
    buzz(win, 28, state.vibration);
    $('type').classList.remove('error');
    void $('type').offsetWidth;
    $('type').classList.add('error');
    announce('Caractère incorrect. La série revient à zéro.');
    updateHud();
  }

  function handleInput() {
    if (!state.active || state.paused || state.ended || state.composing) return;
    const input = $('type');
    const value = quoteFold(input.value);
    const target = quoteFold(state.target);
    if (value === state.typed) return;
    if (target.startsWith(value)) {
      const grew = value.length > state.typed.length;
      state.typed = value;
      input.value = value;
      if (grew) audio.key();
      renderTarget();
      if (value === target) finishPhrase();
      return;
    }
    registerError();
    input.value = state.typed;
    try { input.setSelectionRange(state.typed.length, state.typed.length); } catch { /* non critique */ }
  }

  function endGame() {
    if (state.ended) return;
    state.active = false;
    state.ended = true;
    win.cancelAnimationFrame(state.raf);
    $('type').disabled = true;
    audio.end();
    buzz(win, [28, 45, 28], state.vibration);
    const m = currentMetrics();
    const stats = loadStats();
    const next = {
      bestScore: Math.max(stats.bestScore || 0, state.score),
      bestWpm: Math.max(stats.bestWpm || 0, m.wpm),
      bestAccuracy: Math.max(stats.bestAccuracy || 0, m.accuracy),
      bestLevel: Math.max(stats.bestLevel || 0, state.level),
      games: (stats.games || 0) + 1,
    };
    save(win.localStorage, storageKey(), next);
    showResults(m, next, state.score > (stats.bestScore || 0));
  }

  function tick(now) {
    if (!state.active || state.ended) return;
    if (!state.paused) {
      state.remaining = Math.max(0, MODES[state.mode].duration - elapsed(now));
      updateHud();
      if (state.remaining <= 0) {
        endGame();
        return;
      }
    }
    state.raf = win.requestAnimationFrame(tick);
  }

  function reset(mode = state.mode) {
    win.cancelAnimationFrame(state.raf);
    state.mode = mode;
    state.active = true;
    state.paused = false;
    state.ended = false;
    state.score = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.level = 1;
    state.completed = 0;
    state.correctChars = 0;
    state.errors = 0;
    state.typed = '';
    state.startedAt = win.performance.now();
    state.pausedAt = 0;
    state.pausedTotal = 0;
    state.remaining = MODES[mode].duration;
    state.used.clear();
    $('type').disabled = false;
    $('type').dataset.errors = '0';
    $('type').classList.remove('error');
    $('overlay').classList.add('hide');
    $('pause').textContent = 'Pause';
    pickTarget();
    updateHud();
    state.raf = win.requestAnimationFrame(tick);
    win.setTimeout(() => $('type').focus({ preventScroll: true }), 60);
  }

  function setPaused(value, reason = '') {
    if (!state.active || state.ended || state.paused === value) return;
    const now = win.performance.now();
    if (value) {
      state.paused = true;
      state.pausedAt = now;
      $('type').disabled = true;
      $('pause').textContent = 'Reprendre';
      if (reason) announce(reason);
    } else {
      state.paused = false;
      if (state.pausedAt) state.pausedTotal += now - state.pausedAt;
      state.pausedAt = 0;
      $('type').disabled = false;
      $('pause').textContent = 'Pause';
      win.setTimeout(() => $('type').focus({ preventScroll: true }), 40);
    }
    updateHud();
  }

  function showStart() {
    state.active = false;
    win.cancelAnimationFrame(state.raf);
    const stats = loadStats();
    $('modal').innerHTML = `<div class="ey">Centre de transmission</div><h2 id="modalTitle">Défi de frappe</h2><p>Recopie chaque message exactement. Une mauvaise touche est refusée immédiatement et casse la série : tu gardes donc toujours le contrôle, même sur mobile.</p><div class="modes">${Object.entries(MODES).map(([key, mode]) => `<button class="mode ${key === state.mode ? 'on' : ''}" data-mode="${key}"><strong>${mode.name}</strong><span>${mode.desc}</span></button>`).join('')}</div><div class="record">Record ${MODES[state.mode].name} : ${fmt(stats.bestScore || 0)} pts · ${fmt(stats.bestWpm || 0)} MPM · ${fmt(stats.bestAccuracy || 0)} % précision</div><div class="acts"><button id="helpModal">Aide</button><button class="primary" id="start">Démarrer</button></div>`;
    $('overlay').classList.remove('hide');
    $('modal').querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        state.mode = button.dataset.mode;
        showStart();
      });
    });
    $('start').addEventListener('click', () => reset(state.mode));
    $('helpModal').addEventListener('click', showHelp);
  }

  function showHelp() {
    const shouldResume = state.active && !state.paused;
    if (shouldResume) setPaused(true, 'Partie en pause pendant l’aide.');
    $('modal').innerHTML = `<div class="ey">Mode d’emploi</div><h2 id="modalTitle">Transmission propre</h2><ul><li>Recopie le texte dans la zone de saisie. Les accents, espaces et signes de ponctuation comptent.</li><li>Une touche incorrecte est refusée immédiatement : elle ajoute une erreur et remet ta série à zéro.</li><li>Les messages deviennent plus longs et plus complexes avec les niveaux.</li><li>Le score combine longueur, vitesse, précision, niveau et série. Une phrase sans faute donne un bonus.</li><li>Sur téléphone, le jeu utilise le clavier natif. Le collage est bloqué pour préserver les records.</li><li>Clavier : écris normalement, <b>P</b> ou <b>Échap</b> met en pause.</li></ul><div class="acts"><button id="backModes">Modes</button><button class="primary" id="closeHelp">${shouldResume ? 'Reprendre' : 'Fermer'}</button></div>`;
    $('overlay').classList.remove('hide');
    $('backModes').addEventListener('click', showStart);
    $('closeHelp').addEventListener('click', () => {
      $('overlay').classList.add('hide');
      if (shouldResume) setPaused(false);
    });
  }

  function showPause() {
    $('modal').innerHTML = `<div class="ey">Canal suspendu</div><h2 id="modalTitle">Pause</h2><p>Le chronomètre est arrêté. Ton message reste prêt à reprendre au même caractère.</p><div class="acts"><button id="quitModes">Changer de mode</button><button class="primary" id="resume">Reprendre</button></div>`;
    $('overlay').classList.remove('hide');
    $('quitModes').addEventListener('click', showStart);
    $('resume').addEventListener('click', () => { $('overlay').classList.add('hide'); setPaused(false); });
  }

  function showResults(m, stats, isRecord) {
    $('modal').innerHTML = `<div class="ey">Transmission terminée</div><h2 id="modalTitle">${isRecord ? 'Nouveau record !' : 'Canal fermé'}</h2><div class="cards"><div><span>Score</span><strong>${fmt(state.score)}</strong></div><div><span>MPM</span><strong>${fmt(m.wpm)}</strong></div><div><span>Précision</span><strong>${fmt(m.accuracy)}%</strong></div><div><span>Niveau</span><strong>${state.level}</strong></div></div><p>${state.completed} message${state.completed === 1 ? '' : 's'} transmis · série max ${state.maxCombo} · ${state.errors} erreur${state.errors === 1 ? '' : 's'}.</p><div class="record">Meilleurs ${MODES[state.mode].name} : ${fmt(stats.bestScore)} pts · ${fmt(stats.bestWpm)} MPM · ${fmt(stats.bestAccuracy)} % · niveau ${fmt(stats.bestLevel)}</div><div class="acts"><button id="modes">Modes</button><button class="primary" id="again">Rejouer</button></div>`;
    $('overlay').classList.remove('hide');
    $('modes').addEventListener('click', showStart);
    $('again').addEventListener('click', () => reset(state.mode));
  }

  $('type').addEventListener('compositionstart', () => { state.composing = true; });
  $('type').addEventListener('compositionend', () => { state.composing = false; handleInput(); });
  $('type').addEventListener('input', handleInput);
  $('type').addEventListener('paste', (event) => {
    if (!state.active || state.paused) return;
    event.preventDefault();
    registerError();
    announce('Collage désactivé pour préserver un record équitable.');
  });
  $('type').addEventListener('drop', (event) => event.preventDefault());
  $('pause').addEventListener('click', () => {
    if (!state.active || state.ended) return;
    if (state.paused) { $('overlay').classList.add('hide'); setPaused(false); }
    else { setPaused(true); showPause(); }
  });
  $('replay').addEventListener('click', () => {
    if (!state.active && !state.ended) return;
    reset(state.mode);
  });
  $('helpTop').addEventListener('click', showHelp);
  $('sound').addEventListener('click', () => {
    state.sound = !state.sound;
    audio.set(state.sound);
    $('sound').setAttribute('aria-pressed', String(state.sound));
    $('sound').textContent = `Son ${state.sound ? '✓' : '×'}`;
  });
  $('vibration').addEventListener('click', () => {
    state.vibration = !state.vibration;
    $('vibration').setAttribute('aria-pressed', String(state.vibration));
    $('vibration').textContent = `Vibration ${state.vibration ? '✓' : '×'}`;
  });

  doc.addEventListener('keydown', (event) => {
    if ((event.key === 'p' || event.key === 'P' || event.key === 'Escape') && state.active && !state.ended) {
      event.preventDefault();
      if (state.paused) { $('overlay').classList.add('hide'); setPaused(false); }
      else { setPaused(true); showPause(); }
    }
  });
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden && state.active && !state.paused && !state.ended) {
      setPaused(true, 'Partie mise en pause automatiquement.');
      showPause();
    }
  });
  win.addEventListener('pagehide', () => {
    if (state.raf) win.cancelAnimationFrame(state.raf);
  });

  updateHud();
  showStart();
}

export const __typingChallengeTest = {
  MODES,
  TRANSMISSIONS,
  quoteFold,
  stageForLevel,
  scoreFor,
  metrics,
};
