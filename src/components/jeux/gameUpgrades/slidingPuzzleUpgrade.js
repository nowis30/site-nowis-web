const STORE = 'nowis:sliding-puzzle:';

const MODES = {
  easy: { name: 'Détente', size: 3, shuffle: 42, scoreMultiplier: 0.8, targetMoves: 80 },
  classic: { name: 'Classique', size: 4, shuffle: 120, scoreMultiplier: 1, targetMoves: 180 },
  expert: { name: 'Expert', size: 5, shuffle: 240, scoreMultiplier: 1.35, targetMoves: 360 },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const formatNumber = (value) => Math.max(0, Math.round(value)).toLocaleString('fr-CA');
const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
};

function load(storage, key, fallback) {
  try {
    const parsed = JSON.parse(storage.getItem(key) || 'null');
    return parsed && typeof parsed === 'object' ? { ...fallback, ...parsed } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function save(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); } catch { /* persistence is optional */ }
}

function neighbors(index, size) {
  const row = Math.floor(index / size);
  const col = index % size;
  const result = [];
  if (row > 0) result.push(index - size);
  if (row < size - 1) result.push(index + size);
  if (col > 0) result.push(index - 1);
  if (col < size - 1) result.push(index + 1);
  return result;
}

function solvedBoard(size) {
  return Array.from({ length: size * size }, (_, index) => (index + 1) % (size * size));
}

function isSolved(board) {
  return board.every((value, index) => value === (index + 1) % board.length);
}

function shuffledBoard(size, steps, random = Math.random) {
  const board = solvedBoard(size);
  let empty = board.length - 1;
  let previous = -1;
  for (let i = 0; i < steps; i += 1) {
    let candidates = neighbors(empty, size).filter((index) => index !== previous);
    if (!candidates.length) candidates = neighbors(empty, size);
    const next = candidates[Math.floor(random() * candidates.length)];
    previous = empty;
    [board[empty], board[next]] = [board[next], board[empty]];
    empty = next;
  }
  if (isSolved(board)) {
    const next = neighbors(empty, size)[0];
    [board[empty], board[next]] = [board[next], board[empty]];
  }
  return board;
}

function scoreFor(mode, moves, elapsed) {
  const config = MODES[mode];
  const efficiency = clamp(config.targetMoves / Math.max(1, moves), 0.28, 1.45);
  const speed = clamp((config.size * config.size * 18) / Math.max(12, elapsed), 0.35, 1.6);
  return Math.round(1500 * config.scoreMultiplier * efficiency * speed + config.size * 260);
}

function createAudio(win) {
  let context;
  let enabled = true;
  const tone = (frequency, duration = 0.08, type = 'sine', gain = 0.028, delay = 0) => {
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
    move() { tone(280, 0.055, 'triangle', 0.018); },
    blocked() { tone(120, 0.06, 'square', 0.012); },
    win() {
      [392, 523.25, 659.25, 783.99].forEach((frequency, index) => tone(frequency, 0.09, 'triangle', 0.025, index * 0.055));
    },
    setEnabled(value) { enabled = Boolean(value); },
  };
}

function vibrate(win, pattern, enabled) {
  if (!enabled) return;
  try { win.navigator?.vibrate?.(pattern); } catch { /* optional */ }
}

export function upgradeSlidingPuzzle(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisSlidingPuzzlePro === 'true') return;
  root.dataset.nowisSlidingPuzzlePro = 'true';
  root.lang = 'fr';
  doc.title = 'Puzzle coulissant — Atelier mosaïque NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#070707;color:#fff7e6;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}body{height:100dvh;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}button{font:inherit;color:inherit}.game{position:relative;width:100%;height:100dvh;overflow:hidden;display:flex;flex-direction:column;gap:7px;padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(9px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));background:radial-gradient(circle at 16% 6%,#f1b86b20,transparent 28%),radial-gradient(circle at 88% 15%,#4eb8aa22,transparent 27%),linear-gradient(155deg,#11100e,#1b1712 50%,#080807)}.game:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.2;background-image:linear-gradient(90deg,#ffffff05 1px,transparent 1px),linear-gradient(#ffffff04 1px,transparent 1px);background-size:34px 34px}.top,.hud,.stage,.footer{position:relative;z-index:2;width:min(100%,860px);margin-inline:auto}.top{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:8px}.brand small{display:block;color:#e3b769;font-size:9px;font-weight:950;letter-spacing:.18em;text-transform:uppercase}.brand h1{margin:1px 0;font-size:clamp(21px,6vw,36px);line-height:.94;letter-spacing:-.05em;text-shadow:0 5px 18px #000}.tools{display:flex;gap:5px}.btn,.mode,.modal button{min-height:44px;border:1px solid #ead29e35;border-radius:14px;background:linear-gradient(#342c22,#19150f);font-weight:900;box-shadow:inset 0 1px #ffffff17,0 8px 22px #0007}.btn{min-width:44px;padding:8px 10px;cursor:pointer;touch-action:manipulation}.btn:focus-visible,.mode:focus-visible,.modal button:focus-visible,.tile:focus-visible{outline:3px solid #fff0aa;outline-offset:3px}.hud{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}.stat{text-align:center;min-width:0;padding:5px 3px;border:1px solid #ffffff11;border-radius:12px;background:linear-gradient(#251f18e8,#15110de8);box-shadow:inset 0 1px #ffffff0e}.stat span{display:block;color:#a99b86;font-size:8px;font-weight:950;text-transform:uppercase}.stat strong{display:block;overflow:hidden;text-overflow:ellipsis;font-size:clamp(14px,4vw,20px);line-height:1.08}.stage{flex:1;min-height:210px;display:grid;place-items:center;overflow:hidden;border:1px solid #e8c68824;border-radius:28px;background:radial-gradient(circle at 50% 35%,#e7b56312,transparent 35%),linear-gradient(165deg,#17130f,#0d0b09);box-shadow:0 24px 70px #000a,inset 0 1px #ffffff13;user-select:none;touch-action:none}.board-wrap{position:relative;width:min(92vw,74vh,620px);max-width:94%;max-height:94%;aspect-ratio:1;padding:clamp(9px,2vw,16px);border-radius:25px;background:linear-gradient(145deg,#4b3b27,#21190f 65%,#0d0b08);box-shadow:inset 0 3px #ffffff1b,inset 0 -12px 24px #0008,0 22px 52px #000a}.board{width:100%;height:100%;display:grid;gap:clamp(4px,1vw,8px);padding:clamp(4px,1vw,8px);border:1px solid #d9b67328;border-radius:18px;background:linear-gradient(145deg,#151b19,#0a0d0c);box-shadow:inset 0 10px 30px #000c}.tile{position:relative;min-width:0;min-height:0;border:1px solid #ffffff28;border-radius:clamp(9px,2vw,15px);cursor:pointer;touch-action:manipulation;background:linear-gradient(145deg,#f0d7a2 0%,#cb9d55 53%,#8e5f2c 100%);color:#241709;font-size:clamp(18px,8vw,42px);font-weight:1000;letter-spacing:-.06em;text-shadow:0 1px #fff8;box-shadow:inset 0 3px #ffffff58,inset 0 -8px 12px #63390b55,0 7px 14px #0008;transition:transform .12s ease,filter .12s ease,box-shadow .12s ease}.tile:before{content:"";position:absolute;inset:10%;border-radius:inherit;border:1px solid #fff5;box-shadow:inset 0 0 0 1px #5a340d22}.tile:active{transform:scale(.965)}.tile.movable{filter:saturate(1.12) brightness(1.05);box-shadow:inset 0 3px #ffffff70,inset 0 -8px 12px #63390b55,0 0 0 2px #57c9b858,0 7px 14px #0008}.tile.empty{visibility:hidden;pointer-events:none}.tile.correct:not(.empty){background:linear-gradient(145deg,#d7e3b5,#8fb27c 56%,#4d7254);color:#142319}.status{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:4;max-width:92%;padding:7px 11px;border:1px solid #ffffff13;border-radius:999px;background:#080706ce;color:#cfc0a5;font-size:10px;font-weight:850;text-align:center;backdrop-filter:blur(10px);pointer-events:none}.footer{min-height:34px;display:flex;align-items:center;justify-content:space-between;gap:8px;color:#8c806e;font-size:9px;font-weight:850}.footer strong{color:#d9c395}.overlay{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:18px;background:#060504d4;backdrop-filter:blur(13px)}.overlay.hide{display:none}.modal{width:min(100%,560px);max-height:min(92dvh,730px);overflow:auto;padding:20px;border:1px solid #e1c28734;border-radius:26px;background:linear-gradient(160deg,#2a2116,#17120d 62%,#0e0b08);box-shadow:0 28px 85px #000c,inset 0 1px #ffffff17}.eyebrow{color:#dfb66d;font-size:10px;font-weight:1000;letter-spacing:.18em;text-transform:uppercase}.modal h2{margin:5px 0 8px;font-size:clamp(29px,9vw,48px);line-height:.93;letter-spacing:-.055em}.modal p{margin:8px 0;color:#cfc1aa;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{display:grid;text-align:left;padding:10px 12px;cursor:pointer;touch-action:manipulation}.mode span{color:#9d907d;font-size:10px}.mode.on{border-color:#72cbbb7a;background:linear-gradient(#22443d,#142a26)}.actions{display:grid;grid-template-columns:1.35fr 1fr;gap:8px;margin-top:14px}.modal button{padding:10px 12px;cursor:pointer;touch-action:manipulation}.modal button.primary{border-color:#77cdbd66;background:linear-gradient(#286f63,#17483f)}.help-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}.help-card{padding:10px;border:1px solid #ffffff12;border-radius:15px;background:#ffffff06}.help-card b{display:block;color:#f7deb1;font-size:12px}.help-card span{color:#9f9482;font-size:10px}.win-score{font-size:clamp(36px,13vw,68px);font-weight:1000;color:#f2ca7c;letter-spacing:-.06em}.win-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:12px 0}.win-meta div{padding:8px;border-radius:13px;background:#ffffff07;text-align:center}.win-meta small{display:block;color:#948875}.win-meta b{display:block;font-size:17px}.confetti{position:fixed;inset:0;pointer-events:none;z-index:49;overflow:hidden}.confetti i{position:absolute;top:-10%;width:8px;height:16px;border-radius:4px;background:var(--c);animation:fall 1.7s linear forwards}.paused .board-wrap{filter:blur(3px) brightness(.55)}@keyframes fall{to{transform:translate(var(--x),115vh) rotate(760deg)}}@media (prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}.confetti{display:none}}@media (max-width:540px){.game{gap:5px}.top{min-height:42px}.brand h1{font-size:clamp(19px,6.2vw,28px)}.btn{min-height:44px;padding:7px 9px}.hud{gap:3px}.stat{padding:4px 2px}.stat span{font-size:7px}.stage{border-radius:20px}.board-wrap{width:min(96vw,67vh);padding:8px;border-radius:20px}.board{gap:4px;padding:4px}.footer{font-size:8px}}@media (orientation:landscape) and (max-height:520px){.game{display:grid;grid-template-columns:minmax(190px,270px) 1fr;grid-template-rows:auto 1fr auto;gap:5px}.top{grid-column:1}.hud{grid-column:1;grid-row:2;align-content:start;grid-template-columns:1fr 1fr}.hud .stat:last-child{grid-column:1/-1}.stage{grid-column:2;grid-row:1/4;min-height:0}.board-wrap{width:min(74vh,520px);height:min(92vh,520px)}.footer{grid-column:1;grid-row:3;display:block}.footer span:last-child{display:none}.brand h1{font-size:24px}}`;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
    <main class="game" id="game">
      <header class="top">
        <div class="brand"><small>Atelier mosaïque NOWIS</small><h1>Puzzle coulissant</h1></div>
        <div class="tools">
          <button class="btn" id="help" aria-label="Aide">?</button>
          <button class="btn" id="sound" aria-label="Activer ou désactiver le son">🔊</button>
          <button class="btn" id="pause" aria-label="Pause">Ⅱ</button>
        </div>
      </header>
      <section class="hud" aria-label="Statistiques de la partie">
        <div class="stat"><span>Mode</span><strong id="modeStat">—</strong></div>
        <div class="stat"><span>Coups</span><strong id="movesStat">0</strong></div>
        <div class="stat"><span>Temps</span><strong id="timeStat">0:00</strong></div>
        <div class="stat"><span>Placées</span><strong id="placedStat">0</strong></div>
        <div class="stat"><span>Record</span><strong id="recordStat">—</strong></div>
      </section>
      <section class="stage" id="stage" aria-label="Plateau du puzzle">
        <div class="board-wrap"><div class="board" id="board" role="grid" aria-label="Puzzle coulissant"></div></div>
        <div class="status" id="status" aria-live="polite">Choisis un mode pour commencer.</div>
      </section>
      <footer class="footer"><span><strong>Tactile :</strong> touche ou glisse une tuile vers l'espace vide.</span><span><strong>Clavier :</strong> flèches · P/Échap pause</span></footer>
    </main>
    <div class="overlay" id="startOverlay">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="startTitle">
        <div class="eyebrow">Dernier atelier · 37/37</div><h2 id="startTitle">Remets la mosaïque en ordre.</h2>
        <p>Déplace les tuiles dans l'espace vide. Chaque mélange est généré par des coups légaux : le puzzle est toujours solvable.</p>
        <div class="modes" id="modes"></div>
        <div class="actions"><button class="primary" id="start">Jouer</button><button id="openHelp">Comment jouer</button></div>
      </section>
    </div>
    <div class="overlay hide" id="helpOverlay">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="helpTitle">
        <div class="eyebrow">Aide</div><h2 id="helpTitle">Une case vide, un seul passage.</h2>
        <div class="help-grid"><div class="help-card"><b>Au doigt</b><span>Touche une tuile voisine ou glisse-la vers la case vide.</span></div><div class="help-card"><b>Au clavier</b><span>Les flèches déplacent une tuile vers le vide.</span></div><div class="help-card"><b>Objectif</b><span>Range 1 → N avec la case vide en dernier.</span></div><div class="help-card"><b>Score</b><span>Moins de coups et moins de temps = meilleur score.</span></div></div>
        <div class="actions"><button class="primary" id="closeHelp">Compris</button><button id="restartHelp">Recommencer</button></div>
      </section>
    </div>
    <div class="overlay hide" id="pauseOverlay">
      <section class="modal" role="dialog" aria-modal="true"><div class="eyebrow">Pause</div><h2>La mosaïque attend.</h2><p>Le chronomètre est arrêté.</p><div class="actions"><button class="primary" id="resume">Reprendre</button><button id="restartPause">Recommencer</button></div></section>
    </div>
    <div class="overlay hide" id="winOverlay">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="winTitle"><div class="eyebrow">Mosaïque terminée</div><h2 id="winTitle">Impeccable.</h2><div class="win-score" id="winScore">0</div><div class="win-meta"><div><small>Coups</small><b id="winMoves">0</b></div><div><small>Temps</small><b id="winTime">0:00</b></div><div><small>Record</small><b id="winRecord">—</b></div></div><div class="actions"><button class="primary" id="replay">Rejouer</button><button id="changeMode">Changer de mode</button></div></section>
    </div>
    <div class="confetti" id="confetti" aria-hidden="true"></div>`;

  const storage = win.localStorage;
  const defaults = { mode: 'classic', sound: true, vibration: true, records: {} };
  const settings = load(storage, `${STORE}settings`, defaults);
  if (!MODES[settings.mode]) settings.mode = 'classic';
  const audio = createAudio(win);
  audio.setEnabled(settings.sound !== false);

  const els = Object.fromEntries([
    'game','board','stage','status','modeStat','movesStat','timeStat','placedStat','recordStat','sound','pause','help','startOverlay','helpOverlay','pauseOverlay','winOverlay','modes','start','openHelp','closeHelp','restartHelp','resume','restartPause','replay','changeMode','winScore','winMoves','winTime','winRecord','confetti',
  ].map((id) => [id, doc.getElementById(id)]));

  let mode = settings.mode;
  let board = [];
  let moves = 0;
  let elapsed = 0;
  let running = false;
  let paused = false;
  let won = false;
  let timerId = 0;
  let lastTick = 0;
  let pointerStart = null;

  const recordFor = () => settings.records?.[mode] || null;
  const config = () => MODES[mode];
  const emptyIndex = () => board.indexOf(0);

  function persist() {
    settings.mode = mode;
    save(storage, `${STORE}settings`, settings);
  }

  function renderModes() {
    els.modes.innerHTML = Object.entries(MODES).map(([key, value]) => `<button class="mode ${key === mode ? 'on' : ''}" data-mode="${key}"><b>${value.name}</b><span>${value.size}×${value.size} · mélange ${value.shuffle} coups</span></button>`).join('');
  }

  function placedCount() {
    return board.reduce((count, value, index) => count + (value !== 0 && value === (index + 1) % board.length ? 1 : 0), 0);
  }

  function renderHud() {
    els.modeStat.textContent = config().name;
    els.movesStat.textContent = String(moves);
    els.timeStat.textContent = formatTime(elapsed);
    els.placedStat.textContent = `${placedCount()}/${board.length - 1}`;
    const record = recordFor();
    els.recordStat.textContent = record ? formatNumber(record.score) : '—';
    els.sound.textContent = settings.sound === false ? '🔇' : '🔊';
  }

  function renderBoard() {
    const size = config().size;
    els.board.style.gridTemplateColumns = `repeat(${size},1fr)`;
    els.board.style.gridTemplateRows = `repeat(${size},1fr)`;
    const empty = emptyIndex();
    els.board.innerHTML = board.map((value, index) => {
      if (value === 0) return '<button class="tile empty" tabindex="-1" aria-hidden="true"></button>';
      const movable = neighbors(empty, size).includes(index);
      const correct = value === (index + 1) % board.length;
      const row = Math.floor(index / size) + 1;
      const col = index % size + 1;
      return `<button class="tile ${movable ? 'movable' : ''} ${correct ? 'correct' : ''}" data-index="${index}" role="gridcell" aria-rowindex="${row}" aria-colindex="${col}" aria-label="Tuile ${value}${movable ? ', déplaçable' : ''}">${value}</button>`;
    }).join('');
    renderHud();
  }

  function announce(message) { els.status.textContent = message; }

  function stopTimer() {
    if (timerId) win.cancelAnimationFrame(timerId);
    timerId = 0;
  }

  function tick(now) {
    if (!running || paused || won) return;
    if (!lastTick) lastTick = now;
    const delta = Math.min(0.25, (now - lastTick) / 1000);
    lastTick = now;
    elapsed += delta;
    els.timeStat.textContent = formatTime(elapsed);
    timerId = win.requestAnimationFrame(tick);
  }

  function startTimer() {
    stopTimer();
    lastTick = 0;
    timerId = win.requestAnimationFrame(tick);
  }

  function fireConfetti() {
    if (win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#f2c66f','#75cbbb','#f0e0bd','#d27a62'];
    els.confetti.innerHTML = Array.from({ length: 34 }, (_, index) => `<i style="left:${(index * 31) % 100}%;--x:${(index % 2 ? 1 : -1) * (20 + (index * 13) % 120)}px;--c:${colors[index % colors.length]};animation-delay:${(index % 8) * 0.035}s"></i>`).join('');
    win.setTimeout(() => { els.confetti.innerHTML = ''; }, 2100);
  }

  function finish() {
    if (won) return;
    won = true;
    running = false;
    stopTimer();
    const score = scoreFor(mode, moves, elapsed);
    const current = recordFor();
    const isRecord = !current || score > current.score || (score === current.score && moves < current.moves);
    if (isRecord) {
      settings.records ||= {};
      settings.records[mode] = { score, moves, time: Math.round(elapsed) };
      persist();
    }
    audio.win();
    vibrate(win, [35, 45, 35, 45, 70], settings.vibration !== false);
    fireConfetti();
    els.winScore.textContent = `${formatNumber(score)} pts`;
    els.winMoves.textContent = String(moves);
    els.winTime.textContent = formatTime(elapsed);
    els.winRecord.textContent = isRecord ? 'Nouveau !' : formatNumber(recordFor()?.score || score);
    els.winOverlay.classList.remove('hide');
    announce(`Puzzle terminé en ${moves} coups et ${formatTime(elapsed)}. Score ${formatNumber(score)}.`);
    renderHud();
  }

  function moveTile(index, quietBlocked = false) {
    if (!running || paused || won) return false;
    const empty = emptyIndex();
    if (!neighbors(empty, config().size).includes(index)) {
      if (!quietBlocked) audio.blocked();
      return false;
    }
    [board[empty], board[index]] = [board[index], board[empty]];
    moves += 1;
    audio.move();
    vibrate(win, 8, settings.vibration !== false);
    renderBoard();
    announce(`Coup ${moves}. ${placedCount()} tuiles bien placées.`);
    if (isSolved(board)) finish();
    return true;
  }

  function moveByArrow(key) {
    if (!running || paused || won) return;
    const size = config().size;
    const empty = emptyIndex();
    const row = Math.floor(empty / size);
    const col = empty % size;
    let tile = -1;
    if (key === 'ArrowUp' && row < size - 1) tile = empty + size;
    if (key === 'ArrowDown' && row > 0) tile = empty - size;
    if (key === 'ArrowLeft' && col < size - 1) tile = empty + 1;
    if (key === 'ArrowRight' && col > 0) tile = empty - 1;
    if (tile >= 0) moveTile(tile);
  }

  function newGame() {
    board = shuffledBoard(config().size, config().shuffle);
    moves = 0;
    elapsed = 0;
    won = false;
    paused = false;
    running = true;
    els.game.classList.remove('paused');
    els.pauseOverlay.classList.add('hide');
    els.winOverlay.classList.add('hide');
    els.startOverlay.classList.add('hide');
    els.helpOverlay.classList.add('hide');
    renderBoard();
    announce(`Partie ${config().name}. Range les tuiles de 1 à ${board.length - 1}.`);
    startTimer();
    win.setTimeout(() => els.board.querySelector('.movable')?.focus({ preventScroll: true }), 0);
  }

  function setPaused(value, showOverlay = true) {
    if (!running || won) return;
    paused = Boolean(value);
    els.game.classList.toggle('paused', paused);
    if (paused) {
      stopTimer();
      if (showOverlay) els.pauseOverlay.classList.remove('hide');
      announce('Partie en pause.');
    } else {
      els.pauseOverlay.classList.add('hide');
      announce('Partie reprise.');
      startTimer();
    }
  }

  function openHelp() {
    if (running && !paused && !won) setPaused(true, false);
    els.helpOverlay.classList.remove('hide');
  }

  function closeHelp() {
    els.helpOverlay.classList.add('hide');
    if (running && paused && !won) setPaused(false, false);
  }

  els.modes.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mode]');
    if (!button || !MODES[button.dataset.mode]) return;
    mode = button.dataset.mode;
    persist();
    renderModes();
    renderHud();
  });
  els.start.addEventListener('click', newGame);
  els.replay.addEventListener('click', newGame);
  els.restartHelp.addEventListener('click', newGame);
  els.restartPause.addEventListener('click', newGame);
  els.resume.addEventListener('click', () => setPaused(false));
  els.pause.addEventListener('click', () => setPaused(!paused));
  els.help.addEventListener('click', openHelp);
  els.openHelp.addEventListener('click', openHelp);
  els.closeHelp.addEventListener('click', closeHelp);
  els.changeMode.addEventListener('click', () => {
    els.winOverlay.classList.add('hide');
    els.startOverlay.classList.remove('hide');
    renderModes();
  });
  els.sound.addEventListener('click', () => {
    settings.sound = settings.sound === false;
    audio.setEnabled(settings.sound);
    persist();
    renderHud();
    if (settings.sound) audio.move();
  });
  els.board.addEventListener('click', (event) => {
    const tile = event.target.closest('[data-index]');
    if (tile) moveTile(Number(tile.dataset.index));
  });

  els.stage.addEventListener('pointerdown', (event) => {
    if (!running || paused || won) return;
    const tile = event.target.closest?.('[data-index]');
    pointerStart = { x: event.clientX, y: event.clientY, index: tile ? Number(tile.dataset.index) : -1, id: event.pointerId };
    try { els.stage.setPointerCapture(event.pointerId); } catch { /* optional */ }
  });
  els.stage.addEventListener('pointerup', (event) => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const start = pointerStart;
    pointerStart = null;
    if (start.index < 0 || !running || paused || won) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 18) return;
    const size = config().size;
    const empty = emptyIndex();
    const tileRow = Math.floor(start.index / size);
    const tileCol = start.index % size;
    const emptyRow = Math.floor(empty / size);
    const emptyCol = empty % size;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const towardEmpty = horizontal
      ? (emptyRow === tileRow && Math.sign(dx) === Math.sign(emptyCol - tileCol))
      : (emptyCol === tileCol && Math.sign(dy) === Math.sign(emptyRow - tileRow));
    if (towardEmpty) moveTile(start.index, true);
  });
  els.stage.addEventListener('pointercancel', () => { pointerStart = null; });

  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
      event.preventDefault();
      if (!els.helpOverlay.classList.contains('hide')) return closeHelp();
      if (running && !won) setPaused(!paused);
      return;
    }
    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      moveByArrow(event.key);
    }
  });
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden && running && !paused && !won) setPaused(true);
  });
  win.addEventListener('blur', () => {
    if (running && !paused && !won) setPaused(true);
  });

  renderModes();
  board = solvedBoard(MODES[mode].size);
  renderBoard();
  renderHud();
}

export const __slidingPuzzleTest = { MODES, neighbors, solvedBoard, isSolved, shuffledBoard, scoreFor };
