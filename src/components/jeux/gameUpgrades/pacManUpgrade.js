/* eslint-disable */
const PAC_DIRS = [
  { x: 0, y: -1, name: 'up' },
  { x: 0, y: 1, name: 'down' },
  { x: -1, y: 0, name: 'left' },
  { x: 1, y: 0, name: 'right' },
];
const PAC_STOP = { x: 0, y: 0, name: 'stop' };
const PAC_COLS = 28;
const PAC_ROWS = 31;
const PAC_TILE = 20;
const PAC_BEST_KEY = 'nowis:pac-man:best';
const PAC_LAYOUT = [
  '1111111111111111111111111111','1333333333113333333333333331','1311113113113113113111113131','1411113113113113113111113141','1333333333333333333333333331','1311113111113111113111113131','1333333113333333311333333331','1111113113111113113111111111','0000013113100000133110000000','1111113113101110133111111111','1333333333300000333333333331','1311113111101110111131113131','1333313333300000333333133331','1111313111110001111133111111','0000313100000000000133100000','1111313101111111100133111111','1333333303333333330333333331','1311113113111113113111113131','1333333113333333311333333331','1111113113111113113111111111','0000013113100000133110000000','1111113113101110133111111111','1333333333333333333333333331','1311113111113111113111113131','1411113333333113333333113141','1333333111113111111133333331','1111113113333333313111111111','1333333333113333113333333331','1311111113113113111111113131','1333333333333333333333333331','1111111111111111111111111111',
];

function pacOpposite(a, b) { return a.x === -b.x && a.y === -b.y; }
function pacDist(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }

export function upgradePacMan(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisPacPro === 'true') return;
  root.dataset.nowisPacPro = 'true'; root.lang = 'fr'; doc.title = 'Pac-Man NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"], script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    :root{color-scheme:dark;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#02030b;color:#fff;overscroll-behavior:none}body{min-height:100dvh;overflow-x:hidden;user-select:none;-webkit-tap-highlight-color:transparent}button{font:inherit}
    .pac-app{min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:8px;padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));background:radial-gradient(circle at 50% 0%,rgba(37,99,235,.15),transparent 35%),#02030b}.pac-head,.pac-hud,.canvas-wrap,.pac-tools,.pac-controls{width:min(100%,620px)}.pac-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.pac-brand small{display:block;color:#67e8f9;font-weight:900;letter-spacing:.18em;font-size:10px;text-transform:uppercase}.pac-brand h1{margin:2px 0 0;color:#fde047;font-size:clamp(22px,6vw,32px);letter-spacing:-.05em;text-shadow:0 0 16px rgba(250,204,21,.28)}
    .pac-head button,.pac-tools button,.dpad button,.pac-card button{min-height:44px;border-radius:13px;border:1px solid rgba(148,163,184,.25);background:#0f172a;color:#e2e8f0;cursor:pointer;font-weight:800}.pac-head button{min-width:44px}.pac-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.pac-stat{padding:6px 4px;border:1px solid rgba(59,130,246,.20);background:rgba(15,23,42,.76);border-radius:11px;text-align:center}.pac-stat span{display:block;color:#94a3b8;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.pac-stat strong{display:block;margin-top:2px;font-size:clamp(14px,4vw,18px);font-variant-numeric:tabular-nums}
    .canvas-wrap{position:relative;display:flex;justify-content:center;border:1px solid rgba(37,99,235,.30);border-radius:20px;background:#000014;padding:6px;box-shadow:0 20px 55px rgba(0,0,0,.55);overflow:hidden}#pacCanvas{display:block;width:min(100%,560px);height:auto;aspect-ratio:28/31;background:#000014;touch-action:none;border-radius:14px}.stage-message{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);z-index:5;padding:7px 12px;border-radius:999px;background:rgba(2,6,23,.9);border:1px solid rgba(250,204,21,.35);color:#fef08a;font-size:12px;font-weight:1000;opacity:0;pointer-events:none;transition:.18s;white-space:nowrap}.stage-message.show{opacity:1}
    .pac-tools{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.pac-tools button{padding:7px 4px;font-size:11px}.pac-tools .primary{color:#cffafe;border-color:rgba(34,211,238,.35);background:rgba(8,145,178,.16)}.pac-controls{display:flex;justify-content:center}.dpad{width:min(100%,220px);display:grid;grid-template-columns:repeat(3,1fr);gap:5px;touch-action:none}.dpad button{aspect-ratio:1.1;font-size:24px;background:linear-gradient(180deg,#1e293b,#0f172a);touch-action:none}.dpad button:active,.dpad button.active{transform:scale(.94);border-color:#22d3ee;color:#67e8f9;background:#164e63}
    .pac-overlay{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.86);backdrop-filter:blur(12px)}.pac-overlay.hidden{display:none}.pac-card{width:min(100%,420px);border:1px solid rgba(59,130,246,.30);border-radius:20px;background:linear-gradient(155deg,#0f172a,#172554);padding:22px;box-shadow:0 30px 80px rgba(0,0,0,.6)}.pac-card small{color:#67e8f9;text-transform:uppercase;letter-spacing:.16em;font-weight:900}.pac-card h2{margin:5px 0 6px;font-size:28px;letter-spacing:-.04em;color:#fde047}.pac-card p{color:#cbd5e1;line-height:1.5}.pac-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}.pac-card button{padding:11px}.pac-card .primary{border-color:#22d3ee;background:#0e7490;color:#fff}@media(min-width:700px){.pac-controls{display:none}}
  `;
  doc.head.appendChild(style);
  doc.body.innerHTML = `
    <main class="pac-app"><header class="pac-head"><div class="pac-brand"><small>Arcade NOWIS</small><h1>Pac-Man</h1></div><button id="pacSound">🔊</button></header>
    <section class="pac-hud"><div class="pac-stat"><span>Score</span><strong id="pacScore">0</strong></div><div class="pac-stat"><span>Record</span><strong id="pacBest">0</strong></div><div class="pac-stat"><span>Niveau</span><strong id="pacLevel">1</strong></div><div class="pac-stat"><span>Vies</span><strong id="pacLives">●●●</strong></div><div class="pac-stat"><span>Pastilles</span><strong id="pacPellets">0</strong></div></section>
    <section class="canvas-wrap"><canvas id="pacCanvas" width="560" height="620"></canvas><div class="stage-message" id="pacMessage">PRÊT !</div></section>
    <section class="pac-tools"><button class="primary" id="pacPause">⏸ Pause</button><button id="pacRestart">↻ Rejouer</button><button id="pacDifficulty">⚡ Normal</button><button id="pacHelp">? Aide</button></section>
    <section class="pac-controls"><div class="dpad"><div></div><button data-dir="up">↑</button><div></div><button data-dir="left">←</button><button data-dir="down">↓</button><button data-dir="right">→</button></div></section></main>
    <div class="pac-overlay" id="pacIntro"><section class="pac-card"><small>Nouvelle version NOWIS</small><h2>Pac-Man amélioré</h2><p>Quatre fantômes ont des comportements différents. Les super-pastilles les rendent mangeables, les fruits donnent des bonus et chaque niveau accélère le jeu.</p><div class="pac-actions"><button class="primary" id="pacStart">Jouer</button><button id="pacStartFast">Mode rapide</button></div></section></div>
    <div class="pac-overlay hidden" id="pacPauseOverlay"><section class="pac-card"><small>Pause</small><h2>Partie en pause</h2><p>Ton score et ton niveau sont conservés.</p><div class="pac-actions"><button class="primary" id="pacResume">Reprendre</button><button id="pacPauseRestart">Recommencer</button></div></section></div>
    <div class="pac-overlay hidden" id="pacResult"><section class="pac-card"><small id="pacResultSmall">Partie terminée</small><h2 id="pacResultTitle">Bien joué !</h2><p id="pacResultText"></p><div class="pac-actions"><button class="primary" id="pacAgain">Rejouer</button><button id="pacCloseResult">Fermer</button></div></section></div>
    <div class="pac-overlay hidden" id="pacHelpOverlay"><section class="pac-card"><small>Comment jouer</small><h2>Maîtrise le labyrinthe</h2><p>Glisse ou utilise les flèches. Une super-pastille rend les fantômes vulnérables. Les fantômes mangés valent 200, 400, 800 puis 1 600 points. Deux fruits apparaissent pendant chaque niveau.</p><div class="pac-actions"><button class="primary" id="pacCloseHelp">Compris</button><button id="pacHelpPlay">Jouer</button></div></section></div>
  `;

  const canvas = doc.getElementById('pacCanvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  const ctx = context;
  const scoreEl = doc.getElementById('pacScore');
  const bestEl = doc.getElementById('pacBest');
  const levelEl = doc.getElementById('pacLevel');
  const livesEl = doc.getElementById('pacLives');
  const pelletsEl = doc.getElementById('pacPellets');
  const messageEl = doc.getElementById('pacMessage');
  const intro = doc.getElementById('pacIntro');
  const pauseOverlay = doc.getElementById('pacPauseOverlay');
  const resultOverlay = doc.getElementById('pacResult');
  const helpOverlay = doc.getElementById('pacHelpOverlay');
  const difficultyBtn = doc.getElementById('pacDifficulty');
  const soundBtn = doc.getElementById('pacSound');

  let map = [];
  let pelletCount = 0;
  let pelletStart = 0;
  let score = 0;
  let best = Number(win.localStorage.getItem(PAC_BEST_KEY) || 0);
  let level = 1;
  let lives = 3;
  let running = false;
  let paused = false;
  let started = false;
  let difficulty = 1;
  let soundOn = true;
  let lastFrame = 0;
  let levelClock = 0;
  let releaseClock = 0;
  let frightenedUntil = 0;
  let frightenedChain = 0;
  let fruitShown1 = false;
  let fruitShown2 = false;
  let fruit = { x: 13.5, y: 17, active: false, value: 500 };
  const pac = { x: 1, y: 29, dir: PAC_STOP, wanted: PAC_STOP, speed: 7.1 };
  const ghosts = [
    { x:13,y:14,dir:PAC_DIRS[3],color:'#fb3b4c',homeX:13,homeY:14,scatterX:26,scatterY:1,mode:'chase',release:0 },
    { x:14,y:14,dir:PAC_DIRS[2],color:'#ff8bd1',homeX:14,homeY:14,scatterX:1,scatterY:1,mode:'chase',release:2.5 },
    { x:13,y:15,dir:PAC_DIRS[0],color:'#55e6ff',homeX:13,homeY:15,scatterX:26,scatterY:29,mode:'chase',release:5 },
    { x:14,y:15,dir:PAC_DIRS[0],color:'#ffad42',homeX:14,homeY:15,scatterX:1,scatterY:29,mode:'chase',release:7.5 },
  ];

  const AudioCtor = win.AudioContext || win.webkitAudioContext;
  let audio = null;
  function tone(freq, duration=.045, volume=.025, type='square') {
    if (!soundOn || !AudioCtor) return;
    try { audio ||= new AudioCtor(); const o=audio.createOscillator(), g=audio.createGain(); o.type=type; o.frequency.value=freq; g.gain.setValueAtTime(volume,audio.currentTime); g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration); o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime+duration); } catch {}
  }
  function vibrate(pattern) { try { win.navigator.vibrate?.(pattern); } catch {} }
  function showMessage(text, ms=700) { messageEl.textContent=text; messageEl.classList.add('show'); win.setTimeout(()=>messageEl.classList.remove('show'),ms); }
  function initMap() { pelletCount=0; map=PAC_LAYOUT.map(line=>line.split('').map(ch=>{const n=Number(ch); if(n===3||n===4)pelletCount++; return n;})); pelletStart=pelletCount; fruit.active=false; fruit.value=500+(level-1)*100; fruitShown1=false; fruitShown2=false; }
  function resetPositions() { pac.x=1;pac.y=29;pac.dir=PAC_STOP;pac.wanted=PAC_STOP; frightenedUntil=0;frightenedChain=0;releaseClock=0; ghosts.forEach((g,i)=>{g.x=g.homeX;g.y=g.homeY;g.dir=i%2?PAC_DIRS[2]:PAC_DIRS[3];g.mode='chase';}); }
  function wall(x,y){const c=Math.round(x),r=Math.round(y);if(r<0||r>=PAC_ROWS)return true;if(c<0||c>=PAC_COLS)return false;return map[r][c]===1;}
  function canMove(entity,dir){return dir.name!=='stop'&&!wall(Math.round(entity.x)+dir.x,Math.round(entity.y)+dir.y)}
  function aligned(v){return Math.abs(v-Math.round(v))<.12}
  function tunnel(entity){if(entity.x<-.5)entity.x=PAC_COLS-.5;if(entity.x>PAC_COLS-.5)entity.x=-.5}
  function setDirection(dir){pac.wanted=dir;started=true;tone(270,.02,.012)}
  function updatePac(dt,now){if(aligned(pac.x)&&aligned(pac.y)){pac.x=Math.round(pac.x);pac.y=Math.round(pac.y);if(canMove(pac,pac.wanted))pac.dir=pac.wanted;if(!canMove(pac,pac.dir))pac.dir=PAC_STOP;}const speed=pac.speed*difficulty*(1+(level-1)*.025);pac.x+=pac.dir.x*speed*dt;pac.y+=pac.dir.y*speed*dt;tunnel(pac);const c=Math.round(pac.x),r=Math.round(pac.y);if(r>=0&&r<PAC_ROWS&&c>=0&&c<PAC_COLS){const value=map[r][c];if(value===3||value===4){map[r][c]=0;pelletCount--;score+=value===4?50:10;tone(value===4?760:580,.03,value===4?.035:.014);if(value===4){frightenedUntil=now+Math.max(3800,7000-level*250);frightenedChain=0;ghosts.forEach(g=>{if(g.mode!=='eyes')g.mode='frightened'});showMessage('SUPER PASTILLE !');vibrate(20);}const eaten=(pelletStart-pelletCount)/pelletStart;if(eaten>.32&&!fruitShown1){fruitShown1=true;fruit.active=true;showMessage('🍒 FRUIT BONUS')}if(eaten>.7&&!fruitShown2){fruitShown2=true;fruit.active=true;showMessage('🍓 FRUIT BONUS')}if(pelletCount<=0)nextLevel();}}
    if(fruit.active&&Math.hypot(pac.x-fruit.x,pac.y-fruit.y)<.72){fruit.active=false;score+=fruit.value;tone(930,.1,.04,'sine');showMessage(`+${fruit.value} FRUIT`);vibrate([12,18,12]);}
    if(score>best){best=score;win.localStorage.setItem(PAC_BEST_KEY,String(best));}
  }
  function ghostTarget(g,index){const scatter=Math.floor(levelClock/7)%4===0;if(scatter)return{x:g.scatterX,y:g.scatterY};if(index===0)return{x:pac.x,y:pac.y};if(index===1)return{x:pac.x+pac.dir.x*4,y:pac.y+pac.dir.y*4};if(index===2){const ahead={x:pac.x+pac.dir.x*2,y:pac.y+pac.dir.y*2},b=ghosts[0];return{x:ahead.x+(ahead.x-b.x),y:ahead.y+(ahead.y-b.y)}}return pacDist(g.x,g.y,pac.x,pac.y)>64?{x:pac.x,y:pac.y}:{x:g.scatterX,y:g.scatterY};}
  function chooseGhostDir(g,index){const all=PAC_DIRS.filter(d=>canMove(g,d));let choices=all.filter(d=>!pacOpposite(d,g.dir));if(!choices.length)choices=all;if(!choices.length)return PAC_STOP;if(g.mode==='frightened')return choices[Math.floor(Math.random()*choices.length)];const target=g.mode==='eyes'?{x:g.homeX,y:g.homeY}:ghostTarget(g,index);return choices.reduce((bestDir,d)=>pacDist(Math.round(g.x)+d.x,Math.round(g.y)+d.y,target.x,target.y)<pacDist(Math.round(g.x)+bestDir.x,Math.round(g.y)+bestDir.y,target.x,target.y)?d:bestDir,choices[0]);}
  function updateGhost(g,index,dt,now){if(releaseClock<g.release)return;if(g.mode==='frightened'&&now>=frightenedUntil)g.mode='chase';if(g.mode==='eyes'&&Math.hypot(g.x-g.homeX,g.y-g.homeY)<.8)g.mode='chase';if(aligned(g.x)&&aligned(g.y)){g.x=Math.round(g.x);g.y=Math.round(g.y);g.dir=chooseGhostDir(g,index);}const base=g.mode==='frightened'?4.1:g.mode==='eyes'?9.5:5.7+level*.08;g.x+=g.dir.x*base*difficulty*dt;g.y+=g.dir.y*base*difficulty*dt;tunnel(g);}
  function collision(now){for(const g of ghosts){if(g.mode==='eyes')continue;if(Math.hypot(g.x-pac.x,g.y-pac.y)>.72)continue;if(g.mode==='frightened'&&now<frightenedUntil){const gain=200*Math.pow(2,frightenedChain);frightenedChain=Math.min(3,frightenedChain+1);score+=gain;g.mode='eyes';tone(1020,.09,.04,'sine');showMessage(`FANTÔME +${gain}`);vibrate([10,16,10]);}else{loseLife();}break;}}
  function loseLife(){lives--;running=false;tone(160,.35,.045,'sawtooth');vibrate([35,45,35]);if(lives<=0){finish();return;}showMessage('AÏE !');win.setTimeout(()=>{resetPositions();running=true;showMessage('PRÊT !',550)},800)}
  function nextLevel(){running=false;level++;score+=500*level;tone(760,.09,.035,'sine');win.setTimeout(()=>tone(980,.12,.035,'sine'),100);showMessage(`NIVEAU ${level} !`,900);win.setTimeout(()=>{initMap();resetPositions();running=true},800)}
  function finish(){running=false;doc.getElementById('pacResultSmall').textContent=score>=best&&score>0?'Nouveau record':'Partie terminée';doc.getElementById('pacResultTitle').textContent=score>=best&&score>0?'Record battu !':'Bien joué !';doc.getElementById('pacResultText').textContent=`Score : ${score.toLocaleString('fr-CA')} · Niveau : ${level} · Record : ${best.toLocaleString('fr-CA')}`;resultOverlay.classList.remove('hidden')}
  function newGame(fast=false){difficulty=fast?1.16:1;difficultyBtn.textContent=fast?'🔥 Rapide':'⚡ Normal';score=0;level=1;lives=3;levelClock=0;started=false;paused=false;running=true;initMap();resetPositions();intro.classList.add('hidden');pauseOverlay.classList.add('hidden');resultOverlay.classList.add('hidden');showMessage('PRÊT !',650);updateHud();}
  function updateHud(){scoreEl.textContent=score.toLocaleString('fr-CA');bestEl.textContent=best.toLocaleString('fr-CA');levelEl.textContent=String(level);livesEl.textContent='●'.repeat(Math.max(0,lives));pelletsEl.textContent=String(pelletCount)}
  function drawMap(now){ctx.fillStyle='#000014';ctx.fillRect(0,0,canvas.width,canvas.height);for(let r=0;r<PAC_ROWS;r++)for(let c=0;c<PAC_COLS;c++){const v=map[r][c],x=c*PAC_TILE,y=r*PAC_TILE;if(v===1){ctx.fillStyle='#061544';ctx.fillRect(x+2,y+2,PAC_TILE-4,PAC_TILE-4);ctx.strokeStyle='#2563eb';ctx.lineWidth=2;ctx.strokeRect(x+4,y+4,PAC_TILE-8,PAC_TILE-8);}else if(v===3||v===4){const pulse=v===4?1+Math.sin(now/120)*.25:1;ctx.fillStyle=v===4?'#fff3b0':'#ffdca8';ctx.beginPath();ctx.arc(x+PAC_TILE/2,y+PAC_TILE/2,(v===4?4.2:2.1)*pulse,0,Math.PI*2);ctx.fill();}}if(fruit.active){ctx.font='18px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(level%2?'🍒':'🍓',fruit.x*PAC_TILE+PAC_TILE/2,fruit.y*PAC_TILE+PAC_TILE/2)}}
  function drawPac(now){const x=pac.x*PAC_TILE+PAC_TILE/2,y=pac.y*PAC_TILE+PAC_TILE/2,r=PAC_TILE*.58,angle=pac.dir.name==='left'?Math.PI:pac.dir.name==='up'?-Math.PI/2:pac.dir.name==='down'?Math.PI/2:0,mouth=.08+.25*(.5+.5*Math.sin(now/55));ctx.fillStyle='#facc15';ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,r,angle+mouth,angle+Math.PI*2-mouth);ctx.closePath();ctx.fill();}
  function drawGhost(g,now){const x=g.x*PAC_TILE+PAC_TILE/2,y=g.y*PAC_TILE+PAC_TILE/2,r=PAC_TILE*.55,flash=g.mode==='frightened'&&frightenedUntil-now<1800&&Math.floor(now/180)%2===0,color=g.mode==='frightened'?(flash?'#fff':'#2563eb'):g.color;if(g.mode!=='eyes'){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,Math.PI,0);ctx.lineTo(x+r,y+r);ctx.lineTo(x+r*.5,y+r*.65);ctx.lineTo(x,y+r);ctx.lineTo(x-r*.5,y+r*.65);ctx.lineTo(x-r,y+r);ctx.closePath();ctx.fill();}const px=g.dir.x*1.8,py=g.dir.y*1.8;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x-r*.33,y-r*.18,r*.24,r*.31,0,0,Math.PI*2);ctx.ellipse(x+r*.33,y-r*.18,r*.24,r*.31,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#172554';ctx.beginPath();ctx.arc(x-r*.33+px,y-r*.18+py,r*.1,0,Math.PI*2);ctx.arc(x+r*.33+px,y-r*.18+py,r*.1,0,Math.PI*2);ctx.fill();}
  function frame(ts){const dt=Math.min(.04,lastFrame?(ts-lastFrame)/1000:0);lastFrame=ts;if(running&&!paused&&started){levelClock+=dt;releaseClock+=dt;updatePac(dt,ts);ghosts.forEach((g,i)=>updateGhost(g,i,dt,ts));collision(ts);}drawMap(ts);drawPac(ts);ghosts.forEach(g=>drawGhost(g,ts));updateHud();win.requestAnimationFrame(frame)}

  const keyDirs={ArrowUp:PAC_DIRS[0],w:PAC_DIRS[0],W:PAC_DIRS[0],ArrowDown:PAC_DIRS[1],s:PAC_DIRS[1],S:PAC_DIRS[1],ArrowLeft:PAC_DIRS[2],a:PAC_DIRS[2],A:PAC_DIRS[2],ArrowRight:PAC_DIRS[3],d:PAC_DIRS[3],D:PAC_DIRS[3]};
  doc.addEventListener('keydown',e=>{const dir=keyDirs[e.key];if(dir){e.preventDefault();setDirection(dir)}});
  let swipeStart=null;canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture?.(e.pointerId);swipeStart={x:e.clientX,y:e.clientY}});canvas.addEventListener('pointerup',e=>{if(!swipeStart)return;const dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y;swipeStart=null;if(Math.hypot(dx,dy)<15)return;setDirection(Math.abs(dx)>Math.abs(dy)?(dx>0?PAC_DIRS[3]:PAC_DIRS[2]):(dy>0?PAC_DIRS[1]:PAC_DIRS[0]))});
  doc.querySelectorAll('[data-dir]').forEach(btn=>{const dir=PAC_DIRS.find(d=>d.name===btn.dataset.dir);btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.classList.add('active');setDirection(dir)});['pointerup','pointercancel','pointerleave'].forEach(type=>btn.addEventListener(type,()=>btn.classList.remove('active')))});
  function togglePause(){if(!running&&lives>0)return;paused=!paused;running=!paused;pauseOverlay.classList.toggle('hidden',!paused);lastFrame=0;}
  doc.getElementById('pacStart').addEventListener('click',()=>newGame(false));doc.getElementById('pacStartFast').addEventListener('click',()=>newGame(true));doc.getElementById('pacPause').addEventListener('click',togglePause);doc.getElementById('pacResume').addEventListener('click',togglePause);doc.getElementById('pacRestart').addEventListener('click',()=>newGame(difficulty>1));doc.getElementById('pacPauseRestart').addEventListener('click',()=>newGame(difficulty>1));doc.getElementById('pacAgain').addEventListener('click',()=>newGame(difficulty>1));doc.getElementById('pacCloseResult').addEventListener('click',()=>resultOverlay.classList.add('hidden'));doc.getElementById('pacHelp').addEventListener('click',()=>{running=false;helpOverlay.classList.remove('hidden')});doc.getElementById('pacCloseHelp').addEventListener('click',()=>{helpOverlay.classList.add('hidden');running=true});doc.getElementById('pacHelpPlay').addEventListener('click',()=>{helpOverlay.classList.add('hidden');if(!started)newGame(false);else running=true});difficultyBtn.addEventListener('click',()=>{difficulty=difficulty>1?1:1.16;difficultyBtn.textContent=difficulty>1?'🔥 Rapide':'⚡ Normal';showMessage(difficulty>1?'MODE RAPIDE':'MODE NORMAL',500)});soundBtn.addEventListener('click',()=>{soundOn=!soundOn;soundBtn.textContent=soundOn?'🔊':'🔇';if(soundOn)tone(520,.05)});
  initMap();resetPositions();updateHud();win.requestAnimationFrame(frame);
}
