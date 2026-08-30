const STORE = 'nowis:typing-rain:';
const MODES = {
  relax: { name: 'Détente', desc: '90 s · chute douce · 6 vies · accents tolérés', duration: 90, lives: 6, spawn: 1350, speed: 26, max: 4, mult: 0.85 },
  classic: { name: 'Classique', desc: '75 s · rythme progressif · 5 vies', duration: 75, lives: 5, spawn: 1120, speed: 34, max: 6, mult: 1 },
  expert: { name: 'Expert', desc: '60 s · mots rapides · 4 vies', duration: 60, lives: 4, spawn: 900, speed: 43, max: 8, mult: 1.3 },
};

const WORDS = [
  ['chat','route','livre','table','pluie','soleil','arbre','porte','salon','radio','photo','piano','lampe','jardin','village','maison','sourire','minute','clavier','nuage','école','été','café','forêt','vélo','étoile','rivière','fenêtre','musique','voyage'],
  ['atelier','horizon','message','couleur','mémoire','vitesse','précision','énergie','histoire','lumière','projet','équipe','création','aventure','partage','équilibre','réponse','écran','réseau','idée','numérique','qualité','contrôle','progression','confiance','mouvement','objectif','découverte','attention','harmonie'],
  ['intelligence','coordination','accessibilité','performance','imagination','concentration','expérience','navigation','interaction','technologie','organisation','amélioration','communauté','responsable','créativité','stratégie','développement','adaptation','communication','architecture','personnalisation','environnement','enthousiasme','mécanique','trajectoire','synchronisation','transformation','collaboration','extraordinaire','inspiration'],
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const fold = (value) => String(value || '').toLocaleLowerCase('fr-CA').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const levelFor = (caught) => 1 + Math.floor(caught / 10);
const spawnFor = (mode, level) => Math.max(mode === 'expert' ? 390 : mode === 'classic' ? 480 : 620, MODES[mode].spawn - (level - 1) * (mode === 'expert' ? 54 : 62));
const speedFor = (mode, level) => Math.min(MODES[mode].speed * 2.05, MODES[mode].speed + (level - 1) * (mode === 'expert' ? 3.4 : 2.8));
const maxFor = (mode, level) => Math.min(10, MODES[mode].max + Math.floor((level - 1) / 3));
const scoreFor = (length, combo, mode, level) => Math.round((length * 9 + 12) * (1 + Math.min(1.5, Math.floor(Math.max(0, combo - 1) / 4) * 0.18)) * MODES[mode].mult * (1 + Math.min(0.75, (level - 1) * 0.055)));
const fmt = (value) => Math.max(0, Math.round(value)).toLocaleString('fr-CA');
const load = (storage, key, fallback) => { try { return { ...fallback, ...(JSON.parse(storage.getItem(key) || 'null') || {}) }; } catch { return { ...fallback }; } };
const save = (storage, key, value) => { try { storage.setItem(key, JSON.stringify(value)); } catch { /* stockage privé ou indisponible */ } };

function sound(win) {
  let ctx;
  let enabled = true;
  const tone = (frequency, duration = 0.06, type = 'triangle', gain = 0.022, delay = 0) => {
    if (!enabled) return;
    try {
      ctx ??= new (win.AudioContext || win.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const when = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, when);
      vol.gain.setValueAtTime(gain, when);
      vol.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      osc.connect(vol).connect(ctx.destination);
      osc.start(when);
      osc.stop(when + duration);
    } catch { /* WebAudio non disponible */ }
  };
  return {
    hit(combo) { tone(390 + Math.min(320, combo * 17), 0.05); tone(590 + Math.min(300, combo * 12), 0.06, 'sine', 0.014, 0.028); },
    miss() { tone(145, 0.13, 'sawtooth', 0.026); },
    level() { [440, 554, 659].forEach((f, i) => tone(f, 0.08, 'triangle', 0.024, i * 0.05)); },
    end() { [523, 659, 784].forEach((f, i) => tone(f, 0.1, 'triangle', 0.025, i * 0.065)); },
    set(value) { enabled = value; },
  };
}

const buzz = (win, pattern, enabled) => {
  if (!enabled) return;
  try { win.navigator?.vibrate?.(pattern); } catch { /* vibration non disponible */ }
};

function safeText(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

export function upgradeTyping(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisTypingRainPro === 'true') return;
  root.dataset.nowisTypingRainPro = 'true';
  root.lang = 'fr';
  doc.title = 'Pluie de mots NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#0d1010;color:#f5eedc;font-family:Inter,ui-rounded,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{min-height:100dvh;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}button,input{font:inherit}.app{min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:7px;padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(9px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));background:radial-gradient(circle at 9% 0%,#c8904930,transparent 27%),radial-gradient(circle at 92% 12%,#4f8f881e,transparent 28%),linear-gradient(150deg,#0c1010,#171816 54%,#13110e)}.top,.hud,.press,.entry,.tools{width:min(100%,860px)}.top{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand small{display:block;color:#b99c68;font-size:9px;font-weight:950;letter-spacing:.18em;text-transform:uppercase}.brand h1{margin:2px 0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(25px,7vw,40px);line-height:.94;letter-spacing:-.045em;color:#f1e5c7;text-shadow:0 2px #0008}.topTools{display:flex;gap:5px;align-items:center}.badge,.btn,.mode,.modal button{min-height:44px;border:1px solid #c5aa7450;border-radius:13px;background:#171713e8;color:#f3e8cb;font-weight:900}.badge{display:flex;align-items:center;padding:0 10px;font-size:10px;color:#d8c18f}.btn,.mode,.modal button{cursor:pointer;touch-action:manipulation}.btn{padding:7px 10px}.btn:active,.mode:active,.modal button:active{transform:scale(.97)}.btn:focus-visible,.mode:focus-visible,.modal button:focus-visible,.type:focus-visible{outline:3px solid #80c9bd;outline-offset:2px}.hud{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.stat{text-align:center;padding:6px 3px;border:1px solid #d2bd8a22;border-radius:11px;background:#111412dd;box-shadow:inset 0 1px #fff1}.stat span{display:block;color:#938b78;font-size:8px;font-weight:950;text-transform:uppercase}.stat strong{display:block;color:#fff2d2;font-size:clamp(14px,4vw,20px);font-variant-numeric:tabular-nums}.press{position:relative;flex:1;min-height:245px;overflow:hidden;border:1px solid #ad936650;border-radius:24px;background:linear-gradient(180deg,#1a201e,#111513 74%,#221713 74%,#130c09 100%);box-shadow:0 28px 78px #000c,inset 0 1px #fff2}.press:before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0 79px,#d6bd8330 80px 81px),linear-gradient(180deg,#0000 0 73%,#c35f5030 73% 74%,#0000 74%)}.press:after{content:"ZONE D'IMPRESSION";position:absolute;left:0;right:0;bottom:3px;text-align:center;color:#c7837255;font-size:9px;font-weight:1000;letter-spacing:.24em}.paper{position:absolute;inset:0;z-index:2}.word{position:absolute;left:0;top:0;max-width:calc(100% - 12px);padding:7px 10px;border:1px solid #dac48b4c;border-radius:8px;background:linear-gradient(#f2e7c9,#d8c89f);color:#27241d;box-shadow:0 6px 15px #0007,0 1px #fff inset;font-family:Georgia,"Times New Roman",serif;font-size:clamp(15px,3.8vw,20px);font-weight:800;line-height:1;white-space:nowrap;transform:translate3d(var(--x),var(--y),0);will-change:transform}.word .matched{color:#27685f;text-decoration:underline 2px #55a092;text-underline-offset:2px}.word.target{border-color:#80c9bd;box-shadow:0 0 0 3px #67a89c35,0 8px 18px #0008}.word.danger{border-color:#c96257;background:linear-gradient(#f1d7be,#dcae8f)}.word.out{opacity:0;transform:translate3d(var(--x),var(--y),0) scale(1.18);transition:.15s}.entry{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:center}.inputWrap{position:relative}.type{width:100%;min-height:54px;border:1px solid #bfa46d55;border-radius:14px;background:#0e1210;color:#f9edcf;padding:11px 13px;font-size:16px;font-weight:800;caret-color:#87d2c5;box-shadow:inset 0 2px 8px #0008}.type::placeholder{color:#746f62}.type.bad{border-color:#c96257;box-shadow:0 0 0 3px #c9625720}.type:disabled{opacity:.56}.entryState{min-width:108px;text-align:center;padding:0 8px;color:#9e9380;font-size:9px;font-weight:850}.entryState b{display:block;color:#d5bd87;font-size:11px}.tools{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.tools .btn{font-size:10px;padding:7px 4px}.ov{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:18px;background:#090b0ae9;backdrop-filter:blur(12px)}.ov.hide{display:none}.modal{width:min(100%,525px);max-height:91dvh;overflow:auto;padding:21px;border:1px solid #b89a664c;border-radius:24px;background:linear-gradient(150deg,#1a1b17,#272016 62%,#161713);box-shadow:0 34px 100px #000d}.ey{color:#a99671;font-size:9px;font-weight:950;letter-spacing:.18em;text-transform:uppercase}.modal h2{margin:5px 0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(28px,8vw,40px);line-height:1;color:#f3e4be}.modal p,.modal li{color:#b8af9d;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{text-align:left;padding:12px}.mode strong,.mode span{display:block}.mode span{margin-top:3px;color:#918a7a;font-size:11px}.mode.on{border-color:#7dc6ba;background:#345e5844}.acts{display:grid;grid-template-columns:1fr 1fr;gap:7px}.modal button{padding:10px}.primary{color:#10201d!important;border-color:#8bd3c6!important;background:linear-gradient(135deg,#9fd8c8,#d7c392)!important}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0}.cards div{text-align:center;padding:9px 4px;border-radius:11px;border:1px solid #fff1;background:#10120f}.cards span{display:block;color:#8e8879;font-size:8px;text-transform:uppercase}.cards strong{display:block;color:#f0dfba;font-size:17px}.record{margin:10px 0;padding:9px;border-radius:11px;border:1px solid #c6aa6e38;background:#bc984c0e;color:#d6bd84;font-size:11px;font-weight:850}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@media(max-width:620px){.hud{grid-template-columns:repeat(3,1fr)}.stat:nth-child(n+4){display:none}.brand h1{font-size:27px}.entry{grid-template-columns:1fr}.entryState{display:none}.word{font-size:16px}.press{min-height:230px}}@media(max-height:680px){.app{gap:4px}.brand small{display:none}.brand h1{font-size:24px}.stat{padding:4px 3px}.press{min-height:150px}.type{min-height:48px}.tools .btn{min-height:40px}.word{padding:6px 9px}}@media(orientation:landscape) and (max-height:560px){.app{display:grid;grid-template-columns:minmax(235px,.72fr) minmax(390px,1.3fr);grid-template-rows:auto auto 1fr auto;column-gap:8px}.top,.hud,.entry,.tools,.press{width:100%}.press{grid-column:2;grid-row:1/5;height:calc(100dvh - 16px)}.hud{grid-template-columns:repeat(3,1fr)}.hud .stat:nth-child(n+4){display:none}.entry{align-self:end}.tools{align-self:end}.word{font-size:15px}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.word{will-change:auto}}
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `<main class="app"><header class="top"><div class="brand"><small>Atelier typographique NOWIS</small><h1>Pluie de mots</h1></div><div class="topTools"><span class="badge" id="modeBadge">Classique</span><button class="btn" id="helpTop" aria-label="Ouvrir l’aide">?</button></div></header><section class="hud"><div class="stat"><span>Score</span><strong id="score">0</strong></div><div class="stat"><span>Record</span><strong id="record">0</strong></div><div class="stat"><span>Temps</span><strong id="time">75</strong></div><div class="stat"><span>Niveau</span><strong id="level">1</strong></div><div class="stat"><span>Série</span><strong id="combo">0</strong></div><div class="stat"><span>Vies</span><strong id="lives">♥♥♥♥♥</strong></div></section><section class="press" id="press" aria-label="Zone de chute des mots"><div class="paper" id="paper"></div></section><section class="entry"><div class="inputWrap"><label class="sr" for="typingInput">Tape le mot visé</label><input id="typingInput" class="type" type="text" inputmode="text" enterkeyhint="done" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" maxlength="32" placeholder="Tape un mot avant qu’il atteigne la ligne rouge…"></div><div class="entryState" id="entryState"><b>Prêt</b>Accents tolérés</div></section><section class="tools"><button class="btn" id="pause">Pause</button><button class="btn" id="replay">Rejouer</button><button class="btn" id="sound" aria-pressed="true">Son ✓</button><button class="btn" id="haptic" aria-pressed="true">Vibre ✓</button></section></main><div class="ov" id="overlay"><div class="modal" id="modal" role="dialog" aria-modal="true"></div></div><div class="sr" id="announce" aria-live="assertive"></div>`;

  const $ = (selector) => doc.querySelector(selector);
  const press = $('#press');
  const paper = $('#paper');
  const input = $('#typingInput');
  const overlay = $('#overlay');
  const modal = $('#modal');
  const audio = sound(win);
  const settings = load(win.localStorage, STORE + 'settings', { mode: 'classic', sound: true, haptic: true });
  let mode = MODES[settings.mode] ? settings.mode : 'classic';
  let records = load(win.localStorage, STORE + 'records', { relax: 0, classic: 0, expert: 0 });
  let stats = load(win.localStorage, STORE + 'stats', { games: 0, words: 0, bestCombo: 0, bestLevel: 1 });
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
  let time = MODES[mode].duration;
  let words = [];
  let activeId = null;
  let nextId = 1;
  let last = 0;
  let spawnClock = 0;
  let raf = 0;
  let lastWord = '';
  audio.set(soundOn);

  const persistSettings = () => save(win.localStorage, STORE + 'settings', { mode, sound: soundOn, haptic: hapticOn });
  const announce = (text) => { $('#announce').textContent = ''; win.setTimeout(() => { $('#announce').textContent = text; }, 20); };
  const hud = () => {
    $('#score').textContent = fmt(score);
    $('#record').textContent = fmt(Math.max(records[mode] || 0, score));
    $('#time').textContent = Math.max(0, Math.ceil(time));
    $('#level').textContent = level;
    $('#combo').textContent = combo ? `×${combo}` : '0';
    $('#lives').textContent = '♥'.repeat(Math.max(0, lives)) || '—';
    $('#modeBadge').textContent = MODES[mode].name;
    $('#pause').textContent = paused ? 'Reprendre' : 'Pause';
    $('#sound').textContent = soundOn ? 'Son ✓' : 'Son —';
    $('#haptic').textContent = hapticOn ? 'Vibre ✓' : 'Vibre —';
    $('#sound').setAttribute('aria-pressed', String(soundOn));
    $('#haptic').setAttribute('aria-pressed', String(hapticOn));
  };
  const setEntry = (title, sub = 'Accents tolérés') => { $('#entryState').innerHTML = `<b>${safeText(title)}</b>${safeText(sub)}`; };
  const clearWords = () => { words.forEach((word) => word.el.remove()); words = []; paper.innerHTML = ''; activeId = null; };

  function wordPool() {
    if (level <= 2) return WORDS[0];
    if (level <= 5) return [...WORDS[0], ...WORDS[1]];
    if (level <= 8) return WORDS[1];
    return [...WORDS[1], ...WORDS[2]];
  }

  function chooseWord() {
    const pool = wordPool();
    let value = pool[Math.floor(Math.random() * pool.length)];
    for (let attempts = 0; attempts < 7 && (value === lastWord || words.some((word) => word.text === value)); attempts += 1) {
      value = pool[Math.floor(Math.random() * pool.length)];
    }
    lastWord = value;
    return value;
  }

  function spawnWord() {
    if (!running || paused || words.length >= maxFor(mode, level)) return;
    const text = chooseWord();
    const el = doc.createElement('div');
    el.className = 'word';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = text;
    paper.appendChild(el);
    const box = el.getBoundingClientRect();
    const stage = press.getBoundingClientRect();
    const maxX = Math.max(6, stage.width - box.width - 10);
    let x = 6 + Math.random() * Math.max(1, maxX - 6);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const conflict = words.some((word) => word.y < 58 && Math.abs(word.x - x) < Math.max(72, box.width * 0.75));
      if (!conflict) break;
      x = 6 + Math.random() * Math.max(1, maxX - 6);
    }
    const speed = speedFor(mode, level) * (0.86 + Math.random() * 0.26);
    const item = { id: nextId++, text, folded: fold(text), x, y: -box.height - 4, speed, height: box.height, el, dead: false };
    el.style.setProperty('--x', `${item.x}px`);
    el.style.setProperty('--y', `${item.y}px`);
    words.push(item);
  }

  function refreshMatch() {
    const typed = fold(input.value.trim());
    words.forEach((word) => { word.el.classList.remove('target'); word.el.textContent = word.text; });
    activeId = null;
    input.classList.remove('bad');
    if (!typed) { setEntry(running ? 'Tape un mot' : 'Prêt'); return; }
    const candidates = words.filter((word) => !word.dead && word.folded.startsWith(typed)).sort((a, b) => b.y - a.y);
    const target = candidates[0];
    if (!target) {
      input.classList.add('bad');
      setEntry('Aucun mot', 'Efface quelques lettres');
      return;
    }
    activeId = target.id;
    target.el.classList.add('target');
    const count = Math.min(input.value.trim().length, target.text.length);
    target.el.innerHTML = `<span class="matched">${safeText(target.text.slice(0, count))}</span>${safeText(target.text.slice(count))}`;
    setEntry(target.text, `${Math.max(0, target.folded.length - typed.length)} lettre${target.folded.length - typed.length === 1 ? '' : 's'}`);
    if (typed === target.folded) capture(target);
  }

  function capture(word) {
    if (!running || paused || word.dead) return;
    word.dead = true;
    caught += 1;
    combo += 1;
    bestCombo = Math.max(bestCombo, combo);
    const points = scoreFor(word.text.length, combo, mode, level);
    score += points;
    word.el.classList.add('out');
    win.setTimeout(() => word.el.remove(), 160);
    words = words.filter((item) => item.id !== word.id);
    input.value = '';
    activeId = null;
    audio.hit(combo);
    buzz(win, 12, hapticOn);
    const previousLevel = level;
    level = levelFor(caught);
    if (level > previousLevel) {
      audio.level();
      buzz(win, [18, 25, 18], hapticOn);
      announce(`Niveau ${level}`);
    }
    hud();
    setEntry(`+${fmt(points)}`, `${word.text} imprimé`);
  }

  function missWord(word) {
    if (word.dead) return;
    word.dead = true;
    word.el.remove();
    words = words.filter((item) => item.id !== word.id);
    combo = 0;
    lives -= 1;
    if (activeId === word.id) {
      input.value = '';
      activeId = null;
    }
    audio.miss();
    buzz(win, [28, 25, 28], hapticOn);
    announce(`${word.text} perdu. ${Math.max(0, lives)} vie${lives === 1 ? '' : 's'}.`);
    setEntry('Mot perdu', word.text);
    hud();
    if (lives <= 0) finish('plus de vies');
  }

  function finish(reason = 'temps écoulé') {
    if (ended) return;
    ended = true;
    running = false;
    paused = false;
    win.cancelAnimationFrame(raf);
    input.disabled = true;
    clearWords();
    const oldRecord = records[mode] || 0;
    records[mode] = Math.max(oldRecord, score);
    stats.games += 1;
    stats.words += caught;
    stats.bestCombo = Math.max(stats.bestCombo || 0, bestCombo);
    stats.bestLevel = Math.max(stats.bestLevel || 1, level);
    save(win.localStorage, STORE + 'records', records);
    save(win.localStorage, STORE + 'stats', stats);
    audio.end();
    buzz(win, [24, 42, 24], hapticOn);
    hud();
    overlay.classList.remove('hide');
    modal.innerHTML = `<div class="ey">Fin · ${safeText(MODES[mode].name)}</div><h2>${fmt(score)} points</h2><p>${safeText(reason)}. Tu as imprimé <b>${caught}</b> mot${caught === 1 ? '' : 's'}.</p><div class="cards"><div><span>Record</span><strong>${fmt(records[mode])}</strong></div><div><span>Niveau</span><strong>${level}</strong></div><div><span>Série</span><strong>${bestCombo}</strong></div><div><span>Mots</span><strong>${caught}</strong></div></div>${score > oldRecord && score > 0 ? '<div class="record">Nouveau record de l’atelier ✦</div>' : ''}<div class="acts"><button id="menuEnd">Modes</button><button class="primary" id="again">Rejouer</button></div>`;
    $('#again').onclick = () => start();
    $('#menuEnd').onclick = () => showMenu();
  }

  function frame(now) {
    if (!running) return;
    if (paused) { last = now; raf = win.requestAnimationFrame(frame); return; }
    if (!last) last = now;
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    time -= delta;
    spawnClock += delta * 1000;
    const interval = spawnFor(mode, level);
    if (spawnClock >= interval) {
      spawnClock %= interval;
      spawnWord();
    }
    const stageHeight = press.clientHeight;
    const danger = stageHeight * 0.70;
    const missed = [];
    words.forEach((word) => {
      if (word.dead) return;
      word.y += word.speed * delta;
      word.el.style.setProperty('--y', `${word.y}px`);
      word.el.classList.toggle('danger', word.y + word.height >= danger);
      if (word.y + word.height >= stageHeight - 10) missed.push(word);
    });
    missed.forEach(missWord);
    if (!running) return;
    if (time <= 0) { time = 0; hud(); finish('temps écoulé'); return; }
    hud();
    raf = win.requestAnimationFrame(frame);
  }

  function start() {
    win.cancelAnimationFrame(raf);
    clearWords();
    overlay.classList.add('hide');
    score = 0;
    caught = 0;
    combo = 0;
    bestCombo = 0;
    level = 1;
    lives = MODES[mode].lives;
    time = MODES[mode].duration;
    ended = false;
    paused = false;
    running = true;
    last = 0;
    spawnClock = Math.max(0, MODES[mode].spawn - 420);
    input.disabled = false;
    input.value = '';
    input.classList.remove('bad');
    persistSettings();
    hud();
    setEntry('Tape un mot');
    spawnWord();
    raf = win.requestAnimationFrame(frame);
    win.setTimeout(() => input.focus({ preventScroll: true }), 30);
  }

  function togglePause(force) {
    if (!running || ended) return;
    const next = typeof force === 'boolean' ? force : !paused;
    if (next === paused) return;
    paused = next;
    last = 0;
    input.disabled = paused;
    hud();
    if (paused) {
      overlay.classList.remove('hide');
      modal.innerHTML = `<div class="ey">Atelier suspendu</div><h2>Pause</h2><p>Les mots sont figés. Reprends quand tu veux.</p><div class="acts"><button id="pauseMenu">Modes</button><button class="primary" id="resume">Reprendre</button></div>`;
      $('#resume').onclick = () => { overlay.classList.add('hide'); paused = false; input.disabled = false; last = 0; hud(); input.focus({ preventScroll: true }); };
      $('#pauseMenu').onclick = () => { running = false; paused = false; win.cancelAnimationFrame(raf); clearWords(); showMenu(); };
    } else {
      overlay.classList.add('hide');
      input.disabled = false;
      input.focus({ preventScroll: true });
    }
  }

  function showHelp() {
    const wasPlaying = running && !paused;
    if (wasPlaying) paused = true;
    input.disabled = true;
    overlay.classList.remove('hide');
    modal.innerHTML = `<div class="ey">Aide</div><h2>Imprime les mots avant la ligne rouge</h2><p>Commence à taper : le jeu cible automatiquement le mot correspondant le plus proche du bas. Le mot disparaît dès qu’il est écrit au complet.</p><ul><li><b>Les accents sont tolérés</b> : « ecole » valide « école ».</li><li>Une longue série augmente le multiplicateur de score.</li><li>Tous les 10 mots, le niveau monte : chute plus rapide et davantage de mots.</li><li>Un mot qui atteint le bas coûte une vie. La série revient à zéro.</li><li>Sur mobile, touche le champ de saisie; le clavier reste le contrôle principal.</li></ul><p><b>Clavier :</b> tape directement · Échap/P = pause.</p><div class="acts"><button id="helpMenu">Modes</button><button class="primary" id="closeHelp">${wasPlaying ? 'Reprendre' : 'Compris'}</button></div>`;
    $('#closeHelp').onclick = () => {
      overlay.classList.add('hide');
      if (wasPlaying) { paused = false; last = 0; }
      input.disabled = !running;
      hud();
      if (running) input.focus({ preventScroll: true });
    };
    $('#helpMenu').onclick = () => { running = false; paused = false; win.cancelAnimationFrame(raf); clearWords(); showMenu(); };
  }

  function showMenu() {
    running = false;
    paused = false;
    ended = false;
    win.cancelAnimationFrame(raf);
    clearWords();
    input.disabled = true;
    overlay.classList.remove('hide');
    modal.innerHTML = `<div class="ey">Atelier typographique NOWIS</div><h2>Pluie de mots</h2><p>Des mots tombent de la presse. Tape-les avant qu’ils atteignent la zone d’impression.</p><div class="modes">${Object.entries(MODES).map(([key, value]) => `<button class="mode ${key === mode ? 'on' : ''}" data-mode="${key}"><strong>${safeText(value.name)}</strong><span>${safeText(value.desc)}</span></button>`).join('')}</div><div class="record">Record ${safeText(MODES[mode].name)} : <b>${fmt(records[mode] || 0)}</b> · ${fmt(stats.words || 0)} mots imprimés au total</div><div class="acts"><button id="menuHelp">Aide</button><button class="primary" id="play">Jouer</button></div>`;
    modal.querySelectorAll('[data-mode]').forEach((button) => {
      button.onclick = () => {
        mode = button.dataset.mode;
        persistSettings();
        hud();
        showMenu();
      };
    });
    $('#menuHelp').onclick = () => showHelp();
    $('#play').onclick = () => start();
    hud();
  }

  input.addEventListener('input', refreshMatch);
  input.addEventListener('paste', (event) => event.preventDefault());
  input.addEventListener('drop', (event) => event.preventDefault());
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const typed = fold(input.value.trim());
      const target = words.filter((word) => !word.dead && word.folded === typed).sort((a, b) => b.y - a.y)[0];
      if (target) capture(target);
    }
  });
  $('#pause').onclick = () => togglePause();
  $('#replay').onclick = () => start();
  $('#helpTop').onclick = () => showHelp();
  $('#sound').onclick = () => { soundOn = !soundOn; audio.set(soundOn); persistSettings(); hud(); };
  $('#haptic').onclick = () => { hapticOn = !hapticOn; persistSettings(); hud(); if (hapticOn) buzz(win, 12, true); };

  doc.addEventListener('keydown', (event) => {
    if ((event.key === 'p' || event.key === 'P' || event.key === 'Escape') && running) {
      event.preventDefault();
      togglePause();
      return;
    }
    if (running && !paused && !event.metaKey && !event.ctrlKey && !event.altKey && doc.activeElement !== input && event.key.length === 1) {
      input.focus({ preventScroll: true });
    }
  });
  doc.addEventListener('visibilitychange', () => { if (doc.hidden && running && !paused) togglePause(true); });
  win.addEventListener('blur', () => { if (running && !paused) togglePause(true); });
  win.addEventListener('beforeunload', () => win.cancelAnimationFrame(raf));

  hud();
  showMenu();
}

export const __typingLogic = { fold, levelFor, spawnFor, speedFor, maxFor, scoreFor, MODES, WORDS };
