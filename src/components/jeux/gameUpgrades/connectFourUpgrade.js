const STORE = 'nowis:connect-four:';
const ROWS = 6;
const COLS = 7;
const ORDER = [3, 2, 4, 1, 5, 0, 6];
const MODES = {
  relax: { name: 'Détente', desc: 'IA souple · idéale pour apprendre', multiplier: 0.8 },
  classic: { name: 'Classique', desc: 'IA tactique · difficulté progressive', multiplier: 1 },
  expert: { name: 'Expert', desc: 'IA alpha-bêta · lecture profonde', multiplier: 1.4 },
};

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
const makeBoard = () => Array(ROWS * COLS).fill(0);
const indexOf = (row, col) => row * COLS + col;
const validColumns = (board) => ORDER.filter((col) => board[indexOf(0, col)] === 0);

function dropDisc(board, col, player) {
  if (col < 0 || col >= COLS || board[indexOf(0, col)] !== 0) return -1;
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    const index = indexOf(row, col);
    if (board[index] === 0) {
      board[index] = player;
      return row;
    }
  }
  return -1;
}

function winningLine(board, player) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[indexOf(row, col)] !== player) continue;
      for (const [dr, dc] of directions) {
        const line = [];
        for (let step = 0; step < 4; step += 1) {
          const r = row + dr * step;
          const c = col + dc * step;
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[indexOf(r, c)] !== player) break;
          line.push(indexOf(r, c));
        }
        if (line.length === 4) return line;
      }
    }
  }
  return null;
}

function countWindow(values, player) {
  const opponent = player === 2 ? 1 : 2;
  const mine = values.filter((value) => value === player).length;
  const theirs = values.filter((value) => value === opponent).length;
  const empty = 4 - mine - theirs;
  if (mine === 4) return 100000;
  if (mine === 3 && empty === 1) return 120;
  if (mine === 2 && empty === 2) return 18;
  if (theirs === 3 && empty === 1) return -150;
  if (theirs === 2 && empty === 2) return -12;
  return 0;
}

function evaluate(board, player = 2) {
  let score = 0;
  for (let row = 0; row < ROWS; row += 1) {
    if (board[indexOf(row, 3)] === player) score += 8;
  }
  const windows = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col <= COLS - 4; col += 1) {
      windows.push([0, 1, 2, 3].map((offset) => board[indexOf(row, col + offset)]));
    }
  }
  for (let col = 0; col < COLS; col += 1) {
    for (let row = 0; row <= ROWS - 4; row += 1) {
      windows.push([0, 1, 2, 3].map((offset) => board[indexOf(row + offset, col)]));
    }
  }
  for (let row = 0; row <= ROWS - 4; row += 1) {
    for (let col = 0; col <= COLS - 4; col += 1) {
      windows.push([0, 1, 2, 3].map((offset) => board[indexOf(row + offset, col + offset)]));
    }
    for (let col = 3; col < COLS; col += 1) {
      windows.push([0, 1, 2, 3].map((offset) => board[indexOf(row + offset, col - offset)]));
    }
  }
  for (const values of windows) score += countWindow(values, player);
  return score;
}

function minimax(board, depth, alpha, beta, maximizing) {
  if (winningLine(board, 2)) return 1000000 + depth;
  if (winningLine(board, 1)) return -1000000 - depth;
  const columns = validColumns(board);
  if (depth === 0 || columns.length === 0) return evaluate(board, 2);
  if (maximizing) {
    let best = -Infinity;
    for (const col of columns) {
      const next = board.slice();
      dropDisc(next, col, 2);
      best = Math.max(best, minimax(next, depth - 1, alpha, beta, false));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  }
  let best = Infinity;
  for (const col of columns) {
    const next = board.slice();
    dropDisc(next, col, 1);
    best = Math.min(best, minimax(next, depth - 1, alpha, beta, true));
    beta = Math.min(beta, best);
    if (alpha >= beta) break;
  }
  return best;
}

function immediateMove(board, player) {
  for (const col of validColumns(board)) {
    const next = board.slice();
    dropDisc(next, col, player);
    if (winningLine(next, player)) return col;
  }
  return -1;
}

function aiDepth(mode, level) {
  if (mode === 'relax') return 0;
  if (mode === 'classic') return level >= 5 ? 4 : 3;
  return level >= 5 ? 5 : 4;
}

function chooseAiMove(board, mode, level, rng = Math.random) {
  const columns = validColumns(board);
  if (!columns.length) return -1;
  const win = immediateMove(board, 2);
  if (win >= 0) return win;
  const block = immediateMove(board, 1);
  if (block >= 0 && (mode !== 'relax' || rng() > 0.25)) return block;
  if (mode === 'relax') {
    const preferred = columns.filter((col) => Math.abs(col - 3) <= 2);
    const pool = preferred.length ? preferred : columns;
    return pool[Math.floor(rng() * pool.length)];
  }
  const depth = aiDepth(mode, level);
  let best = -Infinity;
  let choices = [];
  for (const col of columns) {
    const next = board.slice();
    dropDisc(next, col, 2);
    const score = minimax(next, depth - 1, -Infinity, Infinity, false);
    if (score > best) {
      best = score;
      choices = [col];
    } else if (score === best) {
      choices.push(col);
    }
  }
  return choices[Math.floor(rng() * choices.length)];
}

function makeAudio(win) {
  let ctx = null;
  let enabled = true;
  const tone = (frequency, duration = 0.06, type = 'sine', gain = 0.03, delay = 0) => {
    if (!enabled) return;
    try {
      if (!ctx) ctx = new (win.AudioContext || win.webkitAudioContext)();
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
    } catch {}
  };
  return {
    drop(player) {
      tone(player === 1 ? 420 : 250, 0.05, 'triangle', 0.025);
      tone(player === 1 ? 560 : 320, 0.045, 'sine', 0.018, 0.035);
    },
    win() {
      [523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, 0.1, 'triangle', 0.03, index * 0.07));
    },
    lose() {
      tone(220, 0.12, 'sawtooth', 0.03);
      tone(150, 0.2, 'triangle', 0.025, 0.08);
    },
    draw() {
      tone(330, 0.08, 'sine', 0.02);
      tone(330, 0.08, 'sine', 0.02, 0.1);
    },
    setEnabled(value) {
      enabled = value;
    },
  };
}

function vibrate(win, pattern) {
  try {
    win.navigator?.vibrate?.(pattern);
  } catch {}
}

export function upgradeConnectFour(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisConnectFourPro === 'true') return;
  root.dataset.nowisConnectFourPro = 'true';
  root.lang = 'fr';
  doc.title = 'Puissance 4 NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
*{box-sizing:border-box}html,body{margin:0;width:100%;min-height:100%;background:#090d16;color:#f7f3e8;font-family:Inter,ui-rounded,system-ui,-apple-system,"Segoe UI",sans-serif}body{min-height:100dvh;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}button{font:inherit}.console{min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:7px;padding:max(7px,env(safe-area-inset-top)) max(7px,env(safe-area-inset-right)) max(9px,env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));background:radial-gradient(circle at 8% 0,#25d6c51d,transparent 30%),radial-gradient(circle at 93% 4%,#e7a63819,transparent 31%),linear-gradient(145deg,#080b12,#111725 55%,#0a0e18)}.top,.hud,.stage,.status,.controls{width:min(100%,780px)}.top{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand small{display:block;color:#98a7b9;font-size:9px;font-weight:950;letter-spacing:.17em;text-transform:uppercase}.brand h1{margin:2px 0 0;font-size:clamp(25px,7vw,40px);line-height:.92;letter-spacing:-.055em;color:#f4ead2;text-shadow:0 2px 20px #000}.topTools{display:flex;align-items:center;gap:6px}.badge{padding:7px 10px;border:1px solid #b9cad026;border-radius:999px;background:#101823da;color:#d7e4e8;font-size:10px;font-weight:950}.btn,.mode,.modal button,.column{min-height:44px;border:1px solid #c7d3d726;border-radius:14px;background:linear-gradient(180deg,#1a2430,#0f151f);color:#f4eee0;font-weight:900;cursor:pointer;touch-action:manipulation}.btn:active,.mode:active,.modal button:active{transform:scale(.97)}.btn:focus-visible,.mode:focus-visible,.modal button:focus-visible,.column:focus-visible{outline:3px solid #72f3df;outline-offset:2px}.icon{min-width:44px}.hud{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.stat{text-align:center;padding:6px 3px;border:1px solid #c7d3d716;border-radius:12px;background:#0d141ed1;box-shadow:inset 0 1px #fff1}.stat span{display:block;color:#8796a8;font-size:8px;font-weight:950;text-transform:uppercase;white-space:nowrap}.stat strong{display:block;color:#fff3d7;font-size:clamp(14px,4vw,20px);font-variant-numeric:tabular-nums}.stage{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:9px;border-radius:27px;border:1px solid #93a3aa3c;background:linear-gradient(145deg,#202a32,#0f141e 65%);box-shadow:0 28px 80px #000b,inset 0 1px #fff2}.stage:before{content:"";position:absolute;inset:6px;border-radius:21px;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0 44px,#ffffff08 45px),repeating-linear-gradient(0deg,transparent 0 44px,#ffffff06 45px);opacity:.35}.boardShell{position:relative;width:min(100%,700px,calc((100dvh - 245px) * 1.167));aspect-ratio:7/6;padding:clamp(7px,1.6vw,14px);border-radius:clamp(18px,4vw,32px);background:linear-gradient(150deg,#263848,#152534 45%,#0e1824);border:1px solid #8fded34f;box-shadow:0 18px 50px #0009,inset 0 1px #bff8ec29,inset 0 -10px 30px #0007;isolation:isolate}.boardShell:before{content:"";position:absolute;inset:3px;border-radius:inherit;border:1px dashed #d0b3722d;pointer-events:none}.cells{position:absolute;inset:clamp(7px,1.6vw,14px);display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(6,1fr);gap:clamp(3px,1vw,8px);pointer-events:none}.slot{position:relative;border-radius:50%;background:radial-gradient(circle at 42% 38%,#050911 0 47%,#283643 50% 55%,#070b11 59%);box-shadow:inset 0 4px 10px #000b,0 1px #ffffff13}.disc{position:absolute;inset:8%;border-radius:50%;transform:scale(.96);box-shadow:inset 0 3px 7px #fff5,inset 0 -6px 12px #0006,0 5px 11px #0008}.disc.human{background:radial-gradient(circle at 35% 28%,#d7fff7,#4ce2ce 22%,#13a693 68%,#075e58);border:2px solid #a6fff0}.disc.ai{background:radial-gradient(circle at 35% 28%,#fff0bb,#f0b54b 22%,#d77b2d 68%,#7f391e);border:2px solid #ffe09a}.disc.last{animation:drop .3s cubic-bezier(.16,.8,.25,1.2)}.slot.win .disc{filter:brightness(1.25) drop-shadow(0 0 13px #fff3a8);animation:pulse .65s ease-in-out infinite alternate}.columns{position:absolute;inset:clamp(7px,1.6vw,14px);display:grid;grid-template-columns:repeat(7,1fr);z-index:5}.column{min-width:0;height:100%;padding:0;border:0;border-radius:12px;background:transparent;color:transparent}.column:hover,.column[data-selected=true]{background:linear-gradient(#72f3df15,#72f3df08)}.column:disabled{cursor:default}.selector{position:absolute;z-index:6;top:-18px;width:calc((100% - clamp(14px,3.2vw,28px))/7);height:14px;border-radius:999px;background:#58ead8;box-shadow:0 0 18px #43e6d1;opacity:.85;pointer-events:none;transition:left .12s ease}.turnLamp{position:absolute;right:13px;top:11px;width:11px;height:11px;border-radius:50%;background:#58ead8;box-shadow:0 0 16px #58ead8}.turnLamp.ai{background:#efab46;box-shadow:0 0 16px #efab46}.status{min-height:36px;display:flex;align-items:center;justify-content:center;padding:6px 11px;border:1px solid #c5d0d516;border-radius:12px;background:#0d141ed1;color:#aab8c4;text-align:center;font-size:11px;font-weight:800}.status strong{color:#ffe0a1}.controls{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.controls .btn{min-height:42px;padding:5px;font-size:10px}.controls .btn[aria-pressed=false]{color:#6f7b87}.ov{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:18px;background:#050810e8;backdrop-filter:blur(13px)}.ov.hide{display:none}.modal{width:min(100%,510px);max-height:90dvh;overflow:auto;padding:21px;border:1px solid #9ab0b73d;border-radius:26px;background:linear-gradient(155deg,#121b25,#182534 62%,#261d15);box-shadow:0 32px 90px #000d}.eyebrow{color:#66dfd0;font-size:9px;font-weight:950;letter-spacing:.17em;text-transform:uppercase}.modal h2{margin:4px 0;font-size:clamp(27px,8vw,39px);line-height:1;color:#f8eed8}.modal p,.modal li{color:#b4c0c8;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{text-align:left;padding:12px}.mode strong,.mode span{display:block}.mode span{margin-top:3px;color:#8e9da9;font-size:11px}.mode.on{border-color:#71e4d15c;background:#1e766b35}.acts{display:grid;grid-template-columns:1fr 1fr;gap:7px}.modal button{padding:10px}.primary{border-color:#79e8d653!important;background:linear-gradient(135deg,#176d64,#2eaa98)!important;color:#fff!important}.results{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:14px 0}.results div{text-align:center;padding:9px 3px;border-radius:12px;background:#091019d1}.results span{display:block;color:#82909d;font-size:8px;text-transform:uppercase}.results strong{font-size:18px}.legend{display:flex;gap:7px;flex-wrap:wrap;margin:11px 0}.legend span{padding:6px 9px;border:1px solid #fff1;border-radius:999px;background:#0b131c;color:#aebbc4;font-size:10px}.dot{display:inline-block;width:9px;height:9px;margin-right:4px;border-radius:50%;vertical-align:-1px}.dot.human{background:#3edbc6}.dot.ai{background:#e9a344}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}@keyframes drop{0%{transform:translateY(-55%) scale(.9);opacity:.35}100%{transform:translateY(0) scale(.96);opacity:1}}@keyframes pulse{from{transform:scale(.92)}to{transform:scale(1)}}@media(max-width:620px){.hud{grid-template-columns:repeat(3,1fr)}.stat:nth-child(n+4){display:none}.brand h1{font-size:28px}.stage{padding:6px;border-radius:20px}.boardShell{width:min(100%,calc((100dvh - 255px)*1.167));padding:7px}.cells,.columns{inset:7px}.controls{gap:4px}.controls .btn{padding:3px;font-size:9px}}@media(max-height:650px){.console{gap:4px}.brand h1{font-size:24px}.brand small{font-size:8px}.hud .stat{padding:3px}.status{min-height:30px}.boardShell{width:min(100%,calc((100dvh - 205px)*1.167));}.controls .btn{min-height:38px}}@media(orientation:landscape) and (max-height:520px){.console{display:grid;grid-template-columns:minmax(210px,.75fr) minmax(330px,1.25fr);grid-template-rows:auto auto 1fr auto;column-gap:8px}.top,.hud,.status,.controls,.stage{width:100%}.stage{grid-column:2;grid-row:1/5}.boardShell{width:min(100%,calc(90dvh*1.167));}.hud{grid-template-columns:repeat(3,1fr)}.stat:nth-child(n+4){display:none}.controls{grid-template-columns:repeat(2,1fr)}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `<main class="console"><header class="top"><div class="brand"><small>Console stratégique NOWIS</small><h1>Puissance 4</h1></div><div class="topTools"><span class="badge" id="modeBadge">Classique</span><button class="btn icon" id="helpTop" aria-label="Ouvrir l’aide">?</button></div></header><section class="hud"><div class="stat"><span>Score</span><strong id="score">0</strong></div><div class="stat"><span>Record</span><strong id="best">0</strong></div><div class="stat"><span>Niveau</span><strong id="level">1</strong></div><div class="stat"><span>Victoires</span><strong id="wins">0</strong></div><div class="stat"><span>Série</span><strong id="streak">×0</strong></div><div class="stat"><span>Manche</span><strong id="round">1</strong></div></section><section class="stage"><div class="boardShell" id="boardShell" role="group" aria-label="Grille de Puissance 4, 7 colonnes et 6 rangées"><div class="turnLamp" id="turnLamp" aria-hidden="true"></div><div class="selector" id="selector" aria-hidden="true"></div><div class="cells" id="cells" aria-hidden="true"></div><div class="columns" id="columns"></div></div></section><div class="status" id="status">Aligne <strong>4 jetons</strong> avant la console.</div><nav class="controls"><button class="btn" id="pause">⏸ Pause</button><button class="btn" id="restart">↻ Rejouer</button><button class="btn" id="sound" aria-pressed="true">🔊 Son</button><button class="btn" id="vibe" aria-pressed="true">📳 Vibration</button></nav><div class="sr" id="live" aria-live="assertive"></div></main><div class="ov" id="menu"><section class="modal"><div class="eyebrow">Remake NOWIS</div><h2>Prends le contrôle</h2><p>Dépose tes jetons turquoise et crée une ligne de quatre avant l’ordinateur. La difficulté monte avec tes victoires.</p><div class="modes" id="modes"></div><div class="acts"><button id="rules">Aide</button><button class="primary" id="start">Commencer</button></div></section></div><div class="ov hide" id="help"><section class="modal"><div class="eyebrow">Guide rapide</div><h2>Comment jouer</h2><ul><li>Touche une colonne : le jeton tombe dans la case libre la plus basse.</li><li>Aligne 4 jetons horizontalement, verticalement ou en diagonale.</li><li>L’IA devient plus profonde à mesure que ton niveau augmente.</li><li><strong>Clavier :</strong> ← → pour choisir une colonne, Entrée ou Espace pour jouer, P pour la pause.</li></ul><div class="legend"><span><i class="dot human"></i>Toi</span><span><i class="dot ai"></i>Console</span></div><div class="acts"><button class="primary" id="closeHelp">Compris</button><button id="backMenu">Modes</button></div></section></div><div class="ov hide" id="pauseOv"><section class="modal"><div class="eyebrow">Console suspendue</div><h2>Pause</h2><p>La grille est masquée pendant la pause.</p><div class="acts"><button class="primary" id="resume">Reprendre</button><button id="pauseMenu">Menu</button></div></section></div><div class="ov hide" id="result"><section class="modal"><div class="eyebrow">Fin de manche</div><h2 id="resultTitle">Victoire</h2><p id="resultText"></p><div class="results"><div><span>Score</span><strong id="resultScore">0</strong></div><div><span>Série</span><strong id="resultStreak">×0</strong></div><div><span>Niveau</span><strong id="resultLevel">1</strong></div></div><div class="acts"><button class="primary" id="nextRound">Manche suivante</button><button id="resultMenu">Menu</button></div></section></div>`;

  const $ = (id) => doc.getElementById(id);
  const els = {
    cells: $('cells'), columns: $('columns'), board: $('boardShell'), selector: $('selector'),
    status: $('status'), live: $('live'), score: $('score'), best: $('best'), level: $('level'),
    wins: $('wins'), streak: $('streak'), round: $('round'), badge: $('modeBadge'), lamp: $('turnLamp'),
    menu: $('menu'), modes: $('modes'), help: $('help'), pauseOv: $('pauseOv'), result: $('result'),
    resultTitle: $('resultTitle'), resultText: $('resultText'), resultScore: $('resultScore'),
    resultStreak: $('resultStreak'), resultLevel: $('resultLevel'), sound: $('sound'), vibe: $('vibe'),
  };

  const defaults = { best: 0, wins: 0, games: 0, streak: 0, maxLevel: 1 };
  const records = {};
  Object.keys(MODES).forEach((key) => {
    records[key] = load(win.localStorage, `${STORE}${key}`, defaults);
  });

  let mode = 'classic';
  let board = makeBoard();
  let score = 0;
  let sessionWins = 0;
  let streak = 0;
  let round = 1;
  let level = 1;
  let moves = 0;
  let turn = 1;
  let active = false;
  let paused = false;
  let thinking = false;
  let selectedCol = 3;
  let lastIndex = -1;
  let winning = [];
  let soundOn = true;
  let vibeOn = true;
  let aiToken = 0;
  let helpPausedGame = false;
  const audio = makeAudio(win);

  function renderModes() {
    els.modes.innerHTML = Object.entries(MODES).map(([key, config]) => `<button class="mode${key === mode ? ' on' : ''}" data-mode="${key}"><strong>${config.name}</strong><span>${config.desc}</span></button>`).join('');
    els.modes.querySelectorAll('.mode').forEach((button) => button.addEventListener('click', () => {
      mode = button.dataset.mode;
      renderModes();
    }));
  }

  function updateSelector() {
    const innerPercent = 100 / COLS;
    els.selector.style.left = `calc(${selectedCol * innerPercent}% + 7px)`;
    els.columns.querySelectorAll('.column').forEach((button, col) => {
      button.dataset.selected = String(col === selectedCol);
    });
  }

  function renderBoard() {
    els.cells.innerHTML = board.map((value, index) => {
      const classes = ['slot'];
      if (winning.includes(index)) classes.push('win');
      let disc = '';
      if (value) {
        const discClasses = ['disc', value === 1 ? 'human' : 'ai'];
        if (index === lastIndex) discClasses.push('last');
        disc = `<span class="${discClasses.join(' ')}"></span>`;
      }
      return `<div class="${classes.join(' ')}">${disc}</div>`;
    }).join('');
    els.columns.querySelectorAll('.column').forEach((button, col) => {
      const spaces = board.filter((_, index) => index % COLS === col).filter((value) => value === 0).length;
      button.disabled = !active || paused || thinking || spaces === 0;
      button.setAttribute('aria-label', `Colonne ${col + 1}, ${spaces} place${spaces === 1 ? '' : 's'} libre${spaces === 1 ? '' : 's'}`);
    });
    updateSelector();
  }

  function updateHud() {
    els.score.textContent = Math.round(score).toLocaleString('fr-CA');
    els.best.textContent = Math.max(records[mode].best, score).toLocaleString('fr-CA');
    els.level.textContent = String(level);
    els.wins.textContent = String(sessionWins);
    els.streak.textContent = `×${streak}`;
    els.round.textContent = String(round);
    els.badge.textContent = MODES[mode].name;
    els.lamp.classList.toggle('ai', turn === 2);
  }

  function announce(message) {
    els.live.textContent = '';
    win.setTimeout(() => {
      els.live.textContent = message;
    }, 10);
  }

  function setStatus(message) {
    els.status.innerHTML = message;
  }

  function saveRecord() {
    const current = records[mode];
    records[mode] = {
      ...current,
      best: Math.max(current.best, Math.round(score)),
      maxLevel: Math.max(current.maxLevel, level),
    };
    save(win.localStorage, `${STORE}${mode}`, records[mode]);
  }

  function finish(outcome) {
    active = false;
    thinking = false;
    aiToken += 1;
    const record = records[mode];
    record.games += 1;
    if (outcome === 'win') {
      sessionWins += 1;
      streak += 1;
      level = 1 + Math.floor(sessionWins / 2);
      const bonus = Math.round((900 + level * 180 + Math.max(0, 30 - moves) * 18) * MODES[mode].multiplier);
      score += bonus;
      record.wins += 1;
      record.streak = Math.max(record.streak, streak);
      els.resultTitle.textContent = 'Connexion réussie !';
      els.resultText.textContent = `Quatre jetons alignés. Bonus de ${bonus.toLocaleString('fr-CA')} points.`;
      audio.win();
      if (vibeOn) vibrate(win, [30, 35, 30]);
    } else if (outcome === 'draw') {
      score += Math.round(220 * MODES[mode].multiplier);
      els.resultTitle.textContent = 'Égalité';
      els.resultText.textContent = 'La grille est pleine. Aucun signal n’a pris le dessus.';
      audio.draw();
      if (vibeOn) vibrate(win, 20);
    } else {
      streak = 0;
      els.resultTitle.textContent = 'La console gagne';
      els.resultText.textContent = 'Analyse la ligne gagnante et reprends le contrôle à la prochaine manche.';
      audio.lose();
      if (vibeOn) vibrate(win, [70, 40, 70]);
    }
    record.best = Math.max(record.best, Math.round(score));
    record.maxLevel = Math.max(record.maxLevel, level);
    save(win.localStorage, `${STORE}${mode}`, record);
    updateHud();
    renderBoard();
    els.resultScore.textContent = Math.round(score).toLocaleString('fr-CA');
    els.resultStreak.textContent = `×${streak}`;
    els.resultLevel.textContent = String(level);
    win.setTimeout(() => els.result.classList.remove('hide'), 320);
  }

  function resolveAfterMove(player) {
    const line = winningLine(board, player);
    if (line) {
      winning = line;
      renderBoard();
      finish(player === 1 ? 'win' : 'lose');
      return true;
    }
    if (!validColumns(board).length) {
      finish('draw');
      return true;
    }
    return false;
  }

  function runAi() {
    if (!active || paused || turn !== 2) return;
    thinking = true;
    setStatus('La console <strong>analyse</strong> la grille…');
    renderBoard();
    const token = ++aiToken;
    win.setTimeout(() => {
      if (!active || paused || token !== aiToken) return;
      const col = chooseAiMove(board, mode, level);
      thinking = false;
      if (col < 0) {
        finish('draw');
        return;
      }
      selectedCol = col;
      const row = dropDisc(board, col, 2);
      lastIndex = indexOf(row, col);
      moves += 1;
      audio.drop(2);
      if (vibeOn) vibrate(win, 10);
      if (resolveAfterMove(2)) return;
      turn = 1;
      setStatus('À toi : choisis une <strong>colonne</strong>.');
      announce(`La console a joué dans la colonne ${col + 1}. À toi.`);
      updateHud();
      renderBoard();
    }, mode === 'expert' ? 180 : 130);
  }

  function playColumn(col) {
    if (!active || paused || thinking || turn !== 1) return;
    selectedCol = col;
    const row = dropDisc(board, col, 1);
    if (row < 0) {
      setStatus('Cette colonne est <strong>pleine</strong>.');
      announce('Colonne pleine.');
      if (vibeOn) vibrate(win, 35);
      renderBoard();
      return;
    }
    lastIndex = indexOf(row, col);
    moves += 1;
    audio.drop(1);
    if (vibeOn) vibrate(win, 8);
    if (resolveAfterMove(1)) return;
    turn = 2;
    updateHud();
    renderBoard();
    runAi();
  }

  function beginRound() {
    aiToken += 1;
    board = makeBoard();
    moves = 0;
    winning = [];
    lastIndex = -1;
    selectedCol = 3;
    active = true;
    paused = false;
    thinking = false;
    turn = round % 2 === 0 ? 2 : 1;
    els.result.classList.add('hide');
    els.pauseOv.classList.add('hide');
    setStatus(turn === 1 ? 'À toi : choisis une <strong>colonne</strong>.' : 'La console <strong>ouvre</strong> cette manche…');
    updateHud();
    renderBoard();
    announce(turn === 1 ? 'Nouvelle manche. À toi de jouer.' : 'Nouvelle manche. La console commence.');
    if (turn === 2) runAi();
  }

  function startSession() {
    score = 0;
    sessionWins = 0;
    streak = 0;
    round = 1;
    level = 1;
    els.menu.classList.add('hide');
    els.help.classList.add('hide');
    beginRound();
  }

  function nextRound() {
    round += 1;
    beginRound();
  }

  function restartRound() {
    if (!active && els.result.classList.contains('hide')) return;
    score = Math.max(0, score - 100);
    announce('Manche recommencée. Pénalité de 100 points.');
    beginRound();
  }

  function setPaused(value) {
    if (!active || Boolean(value) === paused) return;
    paused = Boolean(value);
    aiToken += 1;
    els.pauseOv.classList.toggle('hide', !paused);
    if (paused) {
      thinking = false;
      announce('Jeu en pause.');
    } else {
      announce('Jeu repris.');
      if (turn === 2) runAi();
    }
    renderBoard();
  }

  els.columns.innerHTML = Array.from({ length: COLS }, (_, col) => `<button class="column" data-col="${col}" aria-label="Colonne ${col + 1}"></button>`).join('');
  els.columns.querySelectorAll('.column').forEach((button) => {
    button.addEventListener('pointerenter', () => {
      selectedCol = Number(button.dataset.col);
      updateSelector();
    });
    button.addEventListener('focus', () => {
      selectedCol = Number(button.dataset.col);
      updateSelector();
    });
    button.addEventListener('click', () => playColumn(Number(button.dataset.col)));
  });

  function openHelp() {
    helpPausedGame = active && !paused;
    if (helpPausedGame) {
      paused = true;
      thinking = false;
      aiToken += 1;
      renderBoard();
    }
    els.help.classList.remove('hide');
  }

  function closeHelp(resumeGame) {
    els.help.classList.add('hide');
    if (resumeGame && helpPausedGame && active) {
      paused = false;
      helpPausedGame = false;
      renderBoard();
      announce('Jeu repris.');
      if (turn === 2) runAi();
    } else {
      helpPausedGame = false;
    }
  }

  $('start').addEventListener('click', startSession);
  $('rules').addEventListener('click', openHelp);
  $('helpTop').addEventListener('click', openHelp);
  $('closeHelp').addEventListener('click', () => closeHelp(true));
  $('backMenu').addEventListener('click', () => {
    closeHelp(false);
    els.menu.classList.remove('hide');
    if (active) {
      active = false;
      paused = false;
      aiToken += 1;
    }
  });
  $('pause').addEventListener('click', () => setPaused(true));
  $('resume').addEventListener('click', () => setPaused(false));
  $('pauseMenu').addEventListener('click', () => {
    paused = false;
    active = false;
    aiToken += 1;
    els.pauseOv.classList.add('hide');
    els.menu.classList.remove('hide');
    renderModes();
    renderBoard();
  });
  $('restart').addEventListener('click', restartRound);
  $('nextRound').addEventListener('click', nextRound);
  $('resultMenu').addEventListener('click', () => {
    els.result.classList.add('hide');
    els.menu.classList.remove('hide');
    renderModes();
  });
  els.sound.addEventListener('click', () => {
    soundOn = !soundOn;
    audio.setEnabled(soundOn);
    els.sound.setAttribute('aria-pressed', String(soundOn));
    els.sound.textContent = soundOn ? '🔊 Son' : '🔇 Son';
  });
  els.vibe.addEventListener('click', () => {
    vibeOn = !vibeOn;
    els.vibe.setAttribute('aria-pressed', String(vibeOn));
    els.vibe.textContent = vibeOn ? '📳 Vibration' : '⛔ Vibration';
  });

  doc.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'p') {
      event.preventDefault();
      setPaused(!paused);
      return;
    }
    if (!active || paused || thinking || turn !== 1) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      selectedCol = (selectedCol + COLS - 1) % COLS;
      updateSelector();
      els.columns.children[selectedCol]?.focus();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      selectedCol = (selectedCol + 1) % COLS;
      updateSelector();
      els.columns.children[selectedCol]?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      playColumn(selectedCol);
    }
  });

  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden && active && !paused) setPaused(true);
  });
  win.addEventListener('blur', () => {
    if (active && !paused) setPaused(true);
  });

  renderModes();
  renderBoard();
  updateHud();
  saveRecord();
}
