type Direction = { x: number; y: number; name: 'up' | 'down' | 'left' | 'right' | 'stop' };
type GhostMode = 'chase' | 'scatter' | 'frightened' | 'eyes';
type Ghost = {
  x: number;
  y: number;
  dir: Direction;
  color: string;
  name: string;
  homeX: number;
  homeY: number;
  scatterX: number;
  scatterY: number;
  mode: GhostMode;
  releaseAt: number;
};

type PacMap = number[][];

const DIRS: Direction[] = [
  { x: 0, y: -1, name: 'up' },
  { x: 0, y: 1, name: 'down' },
  { x: -1, y: 0, name: 'left' },
  { x: 1, y: 0, name: 'right' },
];
const STOP: Direction = { x: 0, y: 0, name: 'stop' };
const COLS = 28;
const ROWS = 31;
const TILE = 20;
const BEST_KEY = 'nowis:pac-man:best';
const LAYOUT = [
  '1111111111111111111111111111',
  '1333333333113333333333333331',
  '1311113113113113113111113131',
  '1411113113113113113111113141',
  '1333333333333333333333333331',
  '1311113111113111113111113131',
  '1333333113333333311333333331',
  '1111113113111113113111111111',
  '0000013113100000133110000000',
  '1111113113101110133111111111',
  '1333333333300000333333333331',
  '1311113111101110111131113131',
  '1333313333300000333333133331',
  '1111313111110001111133111111',
  '0000313100000000000133100000',
  '1111313101111111100133111111',
  '1333333303333333330333333331',
  '1311113113111113113111113131',
  '1333333113333333311333333331',
  '1111113113111113113111111111',
  '0000013113100000133110000000',
  '1111113113101110133111111111',
  '1333333333333333333333333331',
  '1311113111113111113111113131',
  '1411113333333113333333113141',
  '1333333111113111111133333331',
  '1111113113333333313111111111',
  '1333333333113333113333333331',
  '1311111113113113111111113131',
  '1333333333333333333333333331',
  '1111111111111111111111111111',
];

function opposite(a: Direction, b: Direction) {
  return a.x === -b.x && a.y === -b.y;
}

function dist(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function upgradePacMan(doc: Document, win: Window) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisPacPro === 'true') return;
  root.dataset.nowisPacPro = 'true';
  root.lang = 'fr';
  doc.title = 'Pac-Man NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"], script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    :root { color-scheme:dark; font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif; }
    * { box-sizing:border-box; }
    html,body { margin:0; min-height:100%; background:#02030b; color:#fff; overscroll-behavior:none; }
    body { min-height:100dvh; overflow-x:hidden; user-select:none; -webkit-tap-highlight-color:transparent; }
    button { font:inherit; }
    .pac-app { min-height:100dvh; display:flex; flex-direction:column; align-items:center; gap:8px; padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left)); background:radial-gradient(circle at 50% 0%,rgba(37,99,235,.15),transparent 35%),#02030b; }
    .pac-head,.pac-hud,.canvas-wrap,.pac-tools,.pac-controls { width:min(100%,620px); }
    .pac-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .pac-brand small { display:block; color:#67e8f9; font-weight:900; letter-spacing:.18em; font-size:10px; text-transform:uppercase; }
    .pac-brand h1 { margin:2px 0 0; color:#fde047; font-size:clamp(22px,6vw,32px); letter-spacing:-.05em; text-shadow:0 0 16px rgba(250,204,21,.28); }
    .pac-head button,.pac-tools button,.dpad button,.result button { min-height:44px; border-radius:13px; border:1px solid rgba(148,163,184,.25); background:#0f172a; color:#e2e8f0; cursor:pointer; font-weight:800; }
    .pac-head button { min-width:44px; }
    .pac-hud { display:grid; grid-template-columns:repeat(5,1fr); gap:5px; }
    .pac-stat { padding:6px 4px; border:1px solid rgba(59,130,246,.20); background:rgba(15,23,42,.76); border-radius:11px; text-align:center; }
    .pac-stat span { display:block; color:#94a3b8; font-size:9px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
    .pac-stat strong { display:block; margin-top:2px; font-size:clamp(14px,4vw,18px); font-variant-numeric:tabular-nums; }
    .canvas-wrap { position:relative; display:flex; justify-content:center; border:1px solid rgba(37,99,235,.30); border-radius:20px; background:#000014; padding:6px; box-shadow:0 20px 55px rgba(0,0,0,.55); overflow:hidden; }
    #pacCanvas { display:block; width:min(100%,560px); height:auto; aspect-ratio:28/31; background:#000014; touch-action:none; border-radius:14px; }
    .stage-message { position:absolute; inset:auto 50% 48%; transform:translate(50%,50%); z-index:5; padding:7px 12px; border-radius:999px; background:rgba(2,6,23,.88); border:1px solid rgba(250,204,21,.35); color:#fef08a; font-size:12px; font-weight:1000; opacity:0; pointer-events:none; transition:.18s ease; white-space:nowrap; }
    .stage-message.show { opacity:1; }
    .pac-tools { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; }
    .pac-tools button { padding:7px 4px; font-size:11px; }
    .pac-tools .primary { color:#cffafe; border-color:rgba(34,211,238,.35); background:rgba(8,145,178,.16); }
    .pac-controls { display:flex; justify-content:center; }
    .dpad { width:min(100%,220px); display:grid; grid-template-columns:repeat(3,1fr); gap:5px; touch-action:none; }
    .dpad button { aspect-ratio:1.1; font-size:24px; background:linear-gradient(180deg,#1e293b,#0f172a); touch-action:none; }
    .dpad button:active,.dpad button.active { transform:scale(.94); border-color:#22d3ee; color:#67e8f9; background:#164e63; }
    .overlay { position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:18px; background:rgba(2,6,23,.86); backdrop-filter:blur(12px); }
    .overlay.hidden { display:none; }
    .result { width:min(100%,420px); border:1px solid rgba(59,130,246,.30); border-radius:20px; background:linear-gradient(155deg,#0f172a,#172554); padding:22px; box-shadow:0 30px 80px rgba(0,0,0,.6); }
    .result small { color:#67e8f9; text-transform:uppercase; letter-spacing:.16em; font-weight:900; }
    .result h2 { margin:5px 0 6px; font-size:28px; letter-spacing:-.04em; color:#fde047; }
    .result p { color:#cbd5e1; line-height:1.5; }
    .result-actions { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:16px; }
    .result button { padding:11px; }
    .result button.primary { border-color:#22d3ee; background:#0e7490; color:white; }
    @media (min-width:700px) { .pac-app { gap:10px; } .pac-controls { display:none; } }
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
    <main class="pac-app">
      <header class="pac-head">
        <div class="pac-brand"><small>Arcade NOWIS</small><h1>Pac-Man</h1></div>
        <button id="pacSound" type="button" aria-label="Son">🔊</button>
      </header>
      <section class="pac-hud">
        <div class="pac-stat"><span>Score</span><strong id="pacScore">0</strong></div>
        <div class="pac-stat"><span>Record</span><strong id="pacBest">0</strong></div>
        <div class="pac-stat"><span>Niveau</span><strong id="pacLevel">1</strong></div>
        <div class="pac-stat"><span>Vies</span><strong id="pacLives">3</strong></div>
        <div class="pac-stat"><span>Pastilles</span><strong id="pacPellets">0</strong></div>
      </section>
      <section class="canvas-wrap">
        <canvas id="pacCanvas" width="560" height="620" aria-label="Labyrinthe Pac-Man"></canvas>
        <div class="stage-message" id="pacMessage">PRÊT !</div>
      </section>
      <section class="pac-tools">
        <button class="primary" id="pacPause">⏸ Pause</button>
        <button id="pacRestart">↻ Rejouer</button>
        <button id="pacDifficulty">⚡ Normal</button>
        <button id="pacHelp">? Aide</button>
      </section>
      <section class="pac-controls" aria-label="Commandes tactiles">
        <div class="dpad">
          <div></div><button data-dir="up">↑</button><div></div>
          <button data-dir="left">←</button><button data-dir="down">↓</button><button data-dir="right">→</button>
        </div>
      </section>
    </main>
    <div class="overlay" id="pacIntro"><section class="result"><small>Nouvelle version NOWIS</small><h2>Pac-Man amélioré</h2><p>Quatre fantômes ont maintenant des comportements différents. Mange une super-pastille pour les rendre vulnérables, enchaîne les fantômes pour multiplier les points et attrape les fruits bonus.</p><div class="result-actions"><button class="primary" id="pacStart">Jouer</button><button id="pacStartHard">Mode rapide</button></div></section></div>
    <div class="overlay hidden" id="pacPauseOverlay"><section class="result"><small>Pause</small><h2>Partie en pause</h2><p>Ton niveau et ton score sont conservés.</p><div class="result-actions"><button class="primary" id="pacResume">Reprendre</button><button id="pacPauseRestart">Recommencer</button></div></section></div>
    <div class="overlay hidden" id="pacResult"><section class="result"><small id="pacResultSmall">Partie terminée</small><h2 id="pacResultTitle">Bien joué !</h2><p id="pacResultText"></p><div class="result-actions"><button class="primary" id="pacAgain">Rejouer</button><button id="pacCloseResult">Voir le labyrinthe</button></div></section></div>
    <div class="overlay hidden" id="pacHelpOverlay"><section class="result"><small>Comment jouer</small><h2>Maîtrise le labyrinthe</h2><p>Glisse sur le labyrinthe ou utilise les flèches. Les grosses pastilles rendent les fantômes bleus et mangeables pendant quelques secondes. Les fantômes rapportent 200, 400, 800 puis 1 600 points dans une même super-pastille. Un fruit apparaît deux fois par niveau.</p><div class="result-actions"><button class="primary" id="pacCloseHelp">Compris</button><button id="pacHelpStart">Jouer</button></div></section></div>
  `;

  const canvas = doc.getElementById('pacCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const scoreEl = doc.getElementById('pacScore')!;
  const bestEl = doc.getElementById('pacBest')!;
  const levelEl = doc.getElementById('pacLevel')!;
  const livesEl = doc.getElementById('pacLives')!;
  const pelletsEl = doc.getElementById('pacPellets')!;
  const messageEl = doc.getElementById('pacMessage')!;
  const intro = doc.getElementById('pacIntro')!;
  const pauseOverlay = doc.getElementById('pacPauseOverlay')!;
  const resultOverlay = doc.getElementById('pacResult')!;
  const helpOverlay = doc.getElementById('pacHelpOverlay')!;
  const resultTitle = doc.getElementById('pacResultTitle')!;
  const resultText = doc.getElementById('pacResultText')!;
  const resultSmall = doc.getElementById('pacResultSmall')!;
  const soundBtn = doc.getElementById('pacSound') as HTMLButtonElement;
  const difficultyBtn = doc.getElementById('pacDifficulty') as HTMLButtonElement;

  let map: PacMap = [];
  let pellets = 0;
  let pelletsAtStart = 0;
  let score = 0;
  let best = Number(win.localStorage.getItem(BEST_KEY) || 0);
  let level = 1;
  let lives = 3;
  let running = false;
  let paused = false;
  let started = false;
  let last = 0;
  let frightenedUntil = 0;
  let frightenedChain = 0;
  let ghostClock = 0;
  let gameClock = 0;
  let difficulty = 1;
  let soundOn = true;
  let fruit: { x: number; y: number; active: boolean; value: number } = { x: 13.5, y: 17, active: false, value: 500 };
  let fruitStages = new Set<number>();

  const pac = { x: 1, y: 29, dir: STOP, wanted: STOP, speed: 7.2 };
  const ghosts: Ghost[] = [
    { x: 13, y: 14, dir: DIRS[3], color: '#fb3b4c', name: 'Blinky', homeX: 13, homeY: 14, scatterX: 26, scatterY: 1, mode: 'chase', releaseAt: 0 },
    { x: 14, y: 14, dir: DIRS[2], color: '#ff8bd1', name: 'Pinky', homeX: 14, homeY: 14, scatterX: 1, scatterY: 1, mode: 'chase', releaseAt: 2.5 },
    { x: 13, y: 15, dir: DIRS[0], color: '#55e6ff', name: 'Inky', homeX: 13, homeY: 15, scatterX: 26, scatterY: 29, mode: 'chase', releaseAt: 5 },
    { x: 14, y: 15, dir: DIRS[0], color: '#ffad42', name: 'Clyde', homeX: 14, homeY: 15, scatterX: 1, scatterY: 29, mode: 'chase', releaseAt: 7.5 },
  ];

  type AudioWin = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  const AudioCtor = (win as AudioWin).AudioContext || (win as AudioWin).webkitAudioContext;
  let audio: AudioContext | null = null;
  function tone(freq: number, duration = .05, volume = .028, type: OscillatorType = 'square') {
    if (!soundOn || !AudioCtor) return;
    try {
      audio ??= new AudioCtor();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + duration);
      osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime + duration);
    } catch { /* optional */ }
  }
  function vibrate(pattern: number | number[]) { try { win.navigator.vibrate?.(pattern); } catch { /* optional */ } }

  function showMessage(text: string, ms = 850) {
    messageEl.textContent = text; messageEl.classList.add('show');
    win.setTimeout(() => messageEl.classList.remove('show'), ms);
  }

  function initMap() {
    pellets = 0;
    map = LAYOUT.map((line) => line.split('').map((char) => {
      const value = Number(char);
      if (value === 3 || value === 4) pellets += 1;
      return value;
    }));
    pelletsAtStart = pellets;
    fruit.active = false;
    fruit.value = 500 + (level - 1) * 100;
    fruitStages = new Set();
  }

  function resetPositions() {
    pac.x = 1; pac.y = 29; pac.dir = STOP; pac.wanted = STOP;
    ghosts.forEach((ghost, index) => {
      ghost.x = ghost.homeX; ghost.y = ghost.homeY; ghost.dir = index % 2 ? DIRS[2] : DIRS[3]; ghost.mode = 'chase';
    });
    frightenedUntil = 0; frightenedChain = 0; ghostClock = 0;
  }

  function isWall(x: number, y: number) {
    const col = Math.round(x); const row = Math.round(y);
    if (row < 0 || row >= ROWS) return true;
    if (col < 0 || col >= COLS) return false;
    return map[row][col] === 1;
  }

  function canMove(x: number, y: number, dir: Direction) {
    if (dir.name === 'stop') return false;
    return !isWall(Math.round(x) + dir.x, Math.round(y) + dir.y);
  }

  function aligned(value: number) { return Math.abs(value - Math.round(value)) < .12; }
  function normalizeTunnel(entity: { x: number }) {
    if (entity.x < -.5) entity.x = COLS - .5;
    if (entity.x > COLS - .5) entity.x = -.5;
  }

  function setWanted(dir: Direction) {
    pac.wanted = dir;
    if (!started) started = true;
    tone(270, .025, .012);
  }

  function movePac(delta: number, now: number) {
    if (aligned(pac.x) && aligned(pac.y)) {
      pac.x = Math.round(pac.x); pac.y = Math.round(pac.y);
      if (canMove(pac.x, pac.y, pac.wanted)) pac.dir = pac.wanted;
      if (!canMove(pac.x, pac.y, pac.dir)) pac.dir = STOP;
    }
    pac.x += pac.dir.x * pac.speed * difficulty * (1 + (level - 1) * .025) * delta;
    pac.y += pac.dir.y * pac.speed * difficulty * (1 + (level - 1) * .025) * delta;
    normalizeTunnel(pac);

    const col = Math.round(pac.x); const row = Math.round(pac.y);
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      const value = map[row][col];
      if (value === 3 || value === 4) {
        score += value === 4 ? 50 : 10;
        pellets -= 1;
        map[row][col] = 0;
        tone(value === 4 ? 780 : 620, .035, value === 4 ? .04 : .018);
        if (value === 4) {
          frightenedUntil = now + Math.max(3800, 7000 - level * 250);
          frightenedChain = 0;
          ghosts.forEach((ghost) => { if (ghost.mode !== 'eyes') ghost.mode = 'frightened'; });
          vibrate(25); showMessage('SUPER PASTILLE !', 650);
        }
        const eaten = pelletsAtStart - pellets;
        const pct = eaten / pelletsAtStart;
        if (pct >= .32 && !fruitStages.has(1)) { fruitStages.add(1); fruit.active = true; showMessage('🍒 Fruit bonus !'); }
        if (pct >= .70 && !fruitStages.has(2)) { fruitStages.add(2); fruit.active = true; showMessage('🍓 Nouveau fruit !'); }
        if (pellets <= 0) nextLevel();
      }
    }

    if (fruit.active && Math.hypot(pac.x - fruit.x, pac.y - fruit.y) < .7) {
      fruit.active = false; score += fruit.value; tone(920, .12, .045, 'sine'); vibrate([15,20,15]); showMessage(`+${fruit.value} FRUIT`, 700);
    }
    if (score > best) { best = score; win.localStorage.setItem(BEST_KEY, String(best)); }
  }

  function targetFor(ghost: Ghost, index: number) {
    if (ghost.mode === 'eyes') return { x: ghost.homeX, y: ghost.homeY };
    const phaseScatter = Math.floor(gameClock / 7) % 4 === 0;
    if (phaseScatter) return { x: ghost.scatterX, y: ghost.scatterY };
    if (index === 0) return { x: pac.x, y: pac.y };
    if (index === 1) return { x: pac.x + pac.dir.x * 4, y: pac.y + pac.dir.y * 4 };
    if (index === 2) {
      const aheadX = pac.x + pac.dir.x * 2; const aheadY = pac.y + pac.dir.y * 2;
      const blinky = ghosts[0];
      return { x: aheadX + (aheadX - blinky.x), y: aheadY + (aheadY - blinky.y) };
    }
    return dist(ghost.x, ghost.y, pac.x, pac.y) > 64 ? { x: pac.x, y: pac.y } : { x: ghost.scatterX, y: ghost.scatterY };
  }

  function chooseGhostDir(ghost: Ghost, index: number) {
    const valid = DIRS.filter((dir) => canMove(ghost.x, ghost.y, dir) && (!opposite(dir, ghost.dir) || DIRS.filter((d) => canMove(ghost.x, ghost.y, d)).length === 1));
    if (!valid.length) return STOP;
    if (ghost.mode === 'frightened') return valid[Math.floor(Math.random() * valid.length)];
    const target = targetFor(ghost, index);
    return valid.reduce((bestDir, dir) => {
      const bx = Math.round(ghost.x) + bestDir.x; const by = Math.round(ghost.y) + bestDir.y;
      const dx = Math.round(ghost.x) + dir.x; const dy = Math.round(ghost.y) + dir.y;
      return dist(dx, dy, target.x, target.y) < dist(bx, by, target.x, target.y) ? dir : bestDir;
    }, valid[0]);
  }

  function moveGhost(ghost: Ghost, index: number, delta: number, now: number) {
    if (ghostClock < ghost.releaseAt) return;
    if (ghost.mode === 'frightened' && now >= frightenedUntil) ghost.mode = 'chase';
    if (ghost.mode === 'eyes' && Math.hypot(ghost.x - ghost.homeX, ghost.y - ghost.homeY) < .8) ghost.mode = 'chase';
    if (aligned(ghost.x) && aligned(ghost.y)) {
      ghost.x = Math.round(ghost.x); ghost.y = Math.round(ghost.y);
      ghost.dir = chooseGhostDir(ghost, index);
    }
    const base = ghost.mode === 'frightened' ? 4.1 : ghost.mode === 'eyes' ? 9.8 : 5.7 + level * .08;
    ghost.x += ghost.dir.x * base * difficulty * delta;
    ghost.y += ghost.dir.y * base * difficulty * delta;
    normalizeTunnel(ghost);
  }

  function collide(now: number) {
    for (const ghost of ghosts) {
      if (ghost.mode === 'eyes') continue;
      if (Math.hypot(ghost.x - pac.x, ghost.y - pac.y) >= .72) continue;
      if (ghost.mode === 'frightened' && now < frightenedUntil) {
        const gain = 200 * Math.pow(2, frightenedChain);
        frightenedChain = Math.min(3, frightenedChain + 1);
        score += gain; ghost.mode = 'eyes'; tone(1040, .1, .045, 'sine'); vibrate([10,18,10]); showMessage(`FANTÔME +${gain}`, 650);
      } else {
        loseLife();
      }
      break;
    }
  }

  function loseLife() {
    lives -= 1; running = false; tone(170, .45, .05, 'sawtooth'); vibrate([45,60,45]);
    if (lives <= 0) {
      finish(); return;
    }
    showMessage('AÏE !', 800);
    win.setTimeout(() => { resetPositions(); running = true; showMessage('PRÊT !', 600); }, 850);
  }

  function nextLevel() {
    running = false; level += 1; score += 500 * level; tone(760,.1,.04,'sine'); win.setTimeout(() => tone(980,.14,.04,'sine'),120); vibrate([15,25,15,25,25]);
    showMessage(`NIVEAU ${level} !`, 1100);
    win.setTimeout(() => { initMap(); resetPositions(); running = true; }, 950);
  }

  function finish() {
    running = false; paused = false;
    resultSmall.textContent = score >= best && score > 0 ? 'Nouveau record' : 'Partie terminée';
    resultTitle.textContent = score >= best && score > 0 ? 'Record battu !' : 'Bien joué !';
    resultText.textContent = `Score : ${score.toLocaleString('fr-CA')} · Niveau : ${level} · Record : ${best.toLocaleString('fr-CA')}`;
    resultOverlay.classList.remove('hidden');
  }

  function newGame(fast = false) {
    difficulty = fast ? 1.16 : 1;
    difficultyBtn.textContent = fast ? '🔥 Rapide' : '⚡ Normal';
    score = 0; level = 1; lives = 3; gameClock = 0; started = false; paused = false; running = true;
    initMap(); resetPositions(); intro.classList.add('hidden'); resultOverlay.classList.add('hidden'); pauseOverlay.classList.add('hidden');
    showMessage('PRÊT !', 750); updateHud();
  }

  function restartCurrent() { newGame(difficulty > 1); }

  function updateHud() {
    scoreEl.textContent = score.toLocaleString('fr-CA'); bestEl.textContent = best.toLocaleString('fr-CA'); levelEl.textContent = String(level); livesEl.textContent = '●'.repeat(Math.max(0,lives)); pelletsEl.textContent = String(pellets);
  }

  function drawWall(x: number, y: number) {
    ctx.fillStyle = '#061544'; ctx.fillRect(x+2,y+2,TILE-4,TILE-4);
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2; ctx.strokeRect(x+4,y+4,TILE-8,TILE-8);
  }

  function drawMap(now: number) {
    ctx.fillStyle = '#000014'; ctx.fillRect(0,0,canvas.width,canvas.height);
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      const v=map[r][c], x=c*TILE, y=r*TILE;
      if (v===1) drawWall(x,y);
      if (v===3 || v===4) {
        const pulse = v===4 ? 1 + Math.sin(now/120)*.25 : 1;
        ctx.fillStyle = v===4 ? '#fff3b0' : '#ffdca8'; ctx.beginPath(); ctx.arc(x+TILE/2,y+TILE/2,(v===4?4.2:2.1)*pulse,0,Math.PI*2); ctx.fill();
      }
    }
    if (fruit.active) {
      const x=fruit.x*TILE+TILE/2, y=fruit.y*TILE+TILE/2;
      ctx.font='18px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(level%2?'🍒':'🍓',x,y);
    }
  }

  function drawPac(now: number) {
    const x=pac.x*TILE+TILE/2, y=pac.y*TILE+TILE/2, radius=TILE*.58;
    const angle = pac.dir.name==='right'?0:pac.dir.name==='left'?Math.PI:pac.dir.name==='up'?-Math.PI/2:pac.dir.name==='down'?Math.PI/2:0;
    const mouth=.08+.26*(.5+.5*Math.sin(now/55));
    ctx.fillStyle='#facc15';ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,radius,angle+mouth,angle+Math.PI*2-mouth);ctx.closePath();ctx.fill();
  }

  function drawGhost(ghost: Ghost, now: number) {
    const x=ghost.x*TILE+TILE/2,y=ghost.y*TILE+TILE/2,r=TILE*.55;
    const flashing=ghost.mode==='frightened' && frightenedUntil-now<1800 && Math.floor(now/180)%2===0;
    const color=ghost.mode==='frightened'?(flashing?'#f8fafc':'#2563eb'):ghost.mode==='eyes'?'rgba(0,0,0,0)':ghost.color;
    if (ghost.mode!=='eyes') {
      ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,Math.PI,0);ctx.lineTo(x+r,y+r);ctx.lineTo(x+r*.5,y+r*.65);ctx.lineTo(x,y+r);ctx.lineTo(x-r*.5,y+r*.65);ctx.lineTo(x-r,y+r);ctx.closePath();ctx.fill();
    }
    const pupilX=ghost.dir.x*1.8,pupilY=ghost.dir.y*1.8;
    ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x-r*.33,y-r*.18,r*.24,r*.31,0,0,Math.PI*2);ctx.ellipse(x+r*.33,y-r*.18,r*.24,r*.31,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#172554';ctx.beginPath();ctx.arc(x-r*.33+pupilX,y-r*.18+pupilY,r*.1,0,Math.PI*2);ctx.arc(x+r*.33+pupilX,y-r*.18+pupilY,r*.1,0,Math.PI*2);ctx.fill();
  }

  function frame(ts: number) {
    const delta = Math.min(.04, last ? (ts-last)/1000 : 0); last=ts;
    if (running && !paused && started) {
      gameClock += delta; ghostClock += delta; movePac(delta,ts); ghosts.forEach((g,i)=>moveGhost(g,i,delta,ts)); collide(ts);
    }
    drawMap(ts); drawPac(ts); ghosts.forEach((g)=>drawGhost(g,ts)); updateHud();
    win.requestAnimationFrame(frame);
  }

  const keyDirs: Record<string,Direction> = { ArrowUp:DIRS[0], w:DIRS[0], W:DIRS[0], ArrowDown:DIRS[1], s:DIRS[1], S:DIRS[1], ArrowLeft:DIRS[2], a:DIRS[2], A:DIRS[2], ArrowRight:DIRS[3], d:DIRS[3], D:DIRS[3] };
  doc.addEventListener('keydown',(event)=>{ const dir=keyDirs[event.key]; if(dir){event.preventDefault();setWanted(dir);} if(event.key==='p'||event.key==='P') togglePause(); });

  let swipeStart:{x:number;y:number}|null=null;
  canvas.addEventListener('pointerdown',(event)=>{event.preventDefault();canvas.setPointerCapture?.(event.pointerId);swipeStart={x:event.clientX,y:event.clientY};});
  canvas.addEventListener('pointerup',(event)=>{if(!swipeStart)return;event.preventDefault();const dx=event.clientX-swipeStart.x,dy=event.clientY-swipeStart.y;swipeStart=null;if(Math.hypot(dx,dy)<15)return;setWanted(Math.abs(dx)>Math.abs(dy)?(dx>0?DIRS[3]:DIRS[2]):(dy>0?DIRS[1]:DIRS[0]));});
  doc.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach((button)=>{
    const dir=DIRS.find((d)=>d.name===button.dataset.dir)!;
    const press=(event:PointerEvent)=>{event.preventDefault();button.classList.add('active');setWanted(dir);};
    button.addEventListener('pointerdown',press);button.addEventListener('pointerup',()=>button.classList.remove('active'));button.addEventListener('pointercancel',()=>button.classList.remove('active'));
  });

  function togglePause(){ if(!running&&lives>0)return; paused=!paused; if(paused){running=false;pauseOverlay.classList.remove('hidden');}else{running=true;pauseOverlay.classList.add('hidden');last=0;} }
  doc.getElementById('pacPause')?.addEventListener('click',togglePause);
  doc.getElementById('pacResume')?.addEventListener('click',togglePause);
  doc.getElementById('pacRestart')?.addEventListener('click',restartCurrent);
  doc.getElementById('pacPauseRestart')?.addEventListener('click',restartCurrent);
  doc.getElementById('pacStart')?.addEventListener('click',()=>newGame(false));
  doc.getElementById('pacStartHard')?.addEventListener('click',()=>newGame(true));
  doc.getElementById('pacAgain')?.addEventListener('click',restartCurrent);
  doc.getElementById('pacCloseResult')?.addEventListener('click',()=>resultOverlay.classList.add('hidden'));
  doc.getElementById('pacHelp')?.addEventListener('click',()=>{running=false;helpOverlay.classList.remove('hidden');});
  const closeHelp=()=>{helpOverlay.classList.add('hidden');if(lives>0)running=true;};
  doc.getElementById('pacCloseHelp')?.addEventListener('click',closeHelp);
  doc.getElementById('pacHelpStart')?.addEventListener('click',()=>{helpOverlay.classList.add('hidden');if(!started)newGame(false);else running=true;});
  difficultyBtn.addEventListener('click',()=>{difficulty=difficulty>1?1:1.16;difficultyBtn.textContent=difficulty>1?'🔥 Rapide':'⚡ Normal';showMessage(difficulty>1?'MODE RAPIDE':'MODE NORMAL',650);});
  soundBtn.addEventListener('click',()=>{soundOn=!soundOn;soundBtn.textContent=soundOn?'🔊':'🔇';if(soundOn)tone(520,.06);});

  initMap(); resetPositions(); updateHud(); win.requestAnimationFrame(frame);
}
