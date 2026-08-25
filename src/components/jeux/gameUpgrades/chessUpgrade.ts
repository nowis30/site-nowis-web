type Color = 'w' | 'b';
type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
type Piece = { type: PieceType; color: Color };
type Square = { r: number; c: number };
type Board = Array<Array<Piece | null>>;
type Castling = { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };
type Move = { from: Square; to: Square; promotion?: PieceType; enPassant?: Square; castle?: 'K' | 'Q'; captured?: Piece | null };
type GameState = { board: Board; turn: Color; castling: Castling; enPassant: Square | null; halfmove: number; fullmove: number };
type Snapshot = { state: GameState; moveText: string };
type AiLevel = 1 | 2 | 3;

const SYMBOLS: Record<Color, Record<PieceType, string>> = {
  w: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
  b: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
};
const VALUES: Record<PieceType, number> = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };
const FILES = 'abcdefgh';

function initialBoard(): Board {
  const back: PieceType[] = ['R','N','B','Q','K','B','N','R'];
  return [
    back.map((type) => ({ type, color:'b' as Color })),
    Array.from({ length:8 }, () => ({ type:'P' as PieceType, color:'b' as Color })),
    ...Array.from({ length:4 }, () => Array<Piece | null>(8).fill(null)),
    Array.from({ length:8 }, () => ({ type:'P' as PieceType, color:'w' as Color })),
    back.map((type) => ({ type, color:'w' as Color })),
  ];
}
function newState(): GameState { return { board:initialBoard(), turn:'w', castling:{wK:true,wQ:true,bK:true,bQ:true}, enPassant:null, halfmove:0, fullmove:1 }; }
function cloneBoard(board:Board):Board { return board.map((row)=>row.map((piece)=>piece?{...piece}:null)); }
function cloneState(state:GameState):GameState { return { board:cloneBoard(state.board), turn:state.turn, castling:{...state.castling}, enPassant:state.enPassant?{...state.enPassant}:null, halfmove:state.halfmove, fullmove:state.fullmove }; }
function inside(r:number,c:number){return r>=0&&r<8&&c>=0&&c<8;}
function other(color:Color):Color{return color==='w'?'b':'w';}
function sameSquare(a:Square,b:Square){return a.r===b.r&&a.c===b.c;}
function squareName(s:Square){return `${FILES[s.c]}${8-s.r}`;}

function kingSquare(state:GameState,color:Color):Square|null {
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=state.board[r][c];if(p?.type==='K'&&p.color===color)return{r,c};}
  return null;
}

function attacked(state:GameState, target:Square, by:Color):boolean {
  const pawnDir=by==='w'?-1:1;
  for(const dc of[-1,1]){const r=target.r-pawnDir,c=target.c-dc;if(inside(r,c)){const p=state.board[r][c];if(p?.color===by&&p.type==='P')return true;}}
  for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){const r=target.r+dr,c=target.c+dc;if(inside(r,c)){const p=state.board[r][c];if(p?.color===by&&p.type==='N')return true;}}
  for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){let r=target.r+dr,c=target.c+dc;while(inside(r,c)){const p=state.board[r][c];if(p){if(p.color===by&&(p.type==='R'||p.type==='Q'))return true;break;}r+=dr;c+=dc;}}
  for(const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]){let r=target.r+dr,c=target.c+dc;while(inside(r,c)){const p=state.board[r][c];if(p){if(p.color===by&&(p.type==='B'||p.type==='Q'))return true;break;}r+=dr;c+=dc;}}
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const r=target.r+dr,c=target.c+dc;if(inside(r,c)){const p=state.board[r][c];if(p?.color===by&&p.type==='K')return true;}}
  return false;
}
function inCheck(state:GameState,color:Color){const king=kingSquare(state,color);return king?attacked(state,king,other(color)):true;}

function pseudoMoves(state:GameState, from:Square):Move[] {
  const piece=state.board[from.r][from.c];if(!piece)return[];
  const moves:Move[]=[];
  const add=(r:number,c:number,extra:Partial<Move>={})=>{if(!inside(r,c))return;const target=state.board[r][c];if(!target||target.color!==piece.color)moves.push({from:{...from},to:{r,c},captured:target,...extra});};
  const slide=(dr:number,dc:number)=>{let r=from.r+dr,c=from.c+dc;while(inside(r,c)){const target=state.board[r][c];if(!target)moves.push({from:{...from},to:{r,c},captured:null});else{if(target.color!==piece.color)moves.push({from:{...from},to:{r,c},captured:target});break;}r+=dr;c+=dc;}};
  if(piece.type==='R'||piece.type==='Q'){slide(-1,0);slide(1,0);slide(0,-1);slide(0,1);}
  if(piece.type==='B'||piece.type==='Q'){slide(-1,-1);slide(-1,1);slide(1,-1);slide(1,1);}
  if(piece.type==='N')for(const[dr,dc]of[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])add(from.r+dr,from.c+dc);
  if(piece.type==='K'){
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc)add(from.r+dr,from.c+dc);
    const row=piece.color==='w'?7:0;
    const enemy=other(piece.color);
    if(from.r===row&&from.c===4&&!inCheck(state,piece.color)){
      const kingRight=piece.color==='w'?state.castling.wK:state.castling.bK;
      const queenRight=piece.color==='w'?state.castling.wQ:state.castling.bQ;
      if(kingRight&&!state.board[row][5]&&!state.board[row][6]&&state.board[row][7]?.type==='R'&&state.board[row][7]?.color===piece.color&&!attacked(state,{r:row,c:5},enemy)&&!attacked(state,{r:row,c:6},enemy))moves.push({from:{...from},to:{r:row,c:6},castle:'K'});
      if(queenRight&&!state.board[row][1]&&!state.board[row][2]&&!state.board[row][3]&&state.board[row][0]?.type==='R'&&state.board[row][0]?.color===piece.color&&!attacked(state,{r:row,c:3},enemy)&&!attacked(state,{r:row,c:2},enemy))moves.push({from:{...from},to:{r:row,c:2},castle:'Q'});
    }
  }
  if(piece.type==='P'){
    const dir=piece.color==='w'?-1:1,start=piece.color==='w'?6:1,promo=piece.color==='w'?0:7;
    const one=from.r+dir;
    if(inside(one,from.c)&&!state.board[one][from.c]){
      if(one===promo)for(const promotion of['Q','R','B','N']as PieceType[])moves.push({from:{...from},to:{r:one,c:from.c},promotion});
      else moves.push({from:{...from},to:{r:one,c:from.c}});
      const two=from.r+2*dir;if(from.r===start&&!state.board[two][from.c])moves.push({from:{...from},to:{r:two,c:from.c}});
    }
    for(const dc of[-1,1]){const r=from.r+dir,c=from.c+dc;if(!inside(r,c))continue;const target=state.board[r][c];if(target&&target.color!==piece.color){if(r===promo)for(const promotion of['Q','R','B','N']as PieceType[])moves.push({from:{...from},to:{r,c},promotion,captured:target});else moves.push({from:{...from},to:{r,c},captured:target});}else if(state.enPassant&&state.enPassant.r===r&&state.enPassant.c===c){moves.push({from:{...from},to:{r,c},enPassant:{r:from.r,c},captured:{type:'P',color:other(piece.color)}});}}
  }
  return moves;
}

function applyMove(state:GameState, move:Move):GameState {
  const next=cloneState(state);const piece=next.board[move.from.r][move.from.c];if(!piece)return next;
  const target=next.board[move.to.r][move.to.c];
  next.board[move.from.r][move.from.c]=null;
  next.board[move.to.r][move.to.c]=move.promotion?{type:move.promotion,color:piece.color}:piece;
  if(move.enPassant)next.board[move.enPassant.r][move.enPassant.c]=null;
  if(move.castle){const row=move.from.r;if(move.castle==='K'){next.board[row][5]=next.board[row][7];next.board[row][7]=null;}else{next.board[row][3]=next.board[row][0];next.board[row][0]=null;}}
  if(piece.type==='K'){if(piece.color==='w'){next.castling.wK=false;next.castling.wQ=false;}else{next.castling.bK=false;next.castling.bQ=false;}}
  if(piece.type==='R'){
    if(piece.color==='w'&&move.from.r===7&&move.from.c===0)next.castling.wQ=false;if(piece.color==='w'&&move.from.r===7&&move.from.c===7)next.castling.wK=false;
    if(piece.color==='b'&&move.from.r===0&&move.from.c===0)next.castling.bQ=false;if(piece.color==='b'&&move.from.r===0&&move.from.c===7)next.castling.bK=false;
  }
  if(target?.type==='R'){
    if(target.color==='w'&&move.to.r===7&&move.to.c===0)next.castling.wQ=false;if(target.color==='w'&&move.to.r===7&&move.to.c===7)next.castling.wK=false;
    if(target.color==='b'&&move.to.r===0&&move.to.c===0)next.castling.bQ=false;if(target.color==='b'&&move.to.r===0&&move.to.c===7)next.castling.bK=false;
  }
  next.enPassant=null;
  if(piece.type==='P'&&Math.abs(move.to.r-move.from.r)===2)next.enPassant={r:(move.to.r+move.from.r)/2,c:move.from.c};
  next.halfmove=(piece.type==='P'||target||move.enPassant)?0:next.halfmove+1;
  if(state.turn==='b')next.fullmove+=1;
  next.turn=other(state.turn);
  return next;
}

function legalMoves(state:GameState,color:Color=state.turn):Move[] {
  const effective=color===state.turn?state:{...state,turn:color};
  const moves:Move[]=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=effective.board[r][c];if(!p||p.color!==color)continue;for(const move of pseudoMoves(effective,{r,c})){const next=applyMove(effective,move);if(!inCheck(next,color))moves.push(move);}}
  return moves;
}

function materialEval(state:GameState):number {
  let score=0;
  const center=[[3,3],[3,4],[4,3],[4,4]];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=state.board[r][c];if(!p)continue;let value=VALUES[p.type];if(p.type==='P')value+=(p.color==='w'?(6-r):(r-1))*7;if((p.type==='N'||p.type==='B')&&center.some(([rr,cc])=>Math.abs(r-rr)<=1&&Math.abs(c-cc)<=1))value+=18;score+=(p.color==='w'?1:-1)*value;}
  return score;
}
function terminalScore(state:GameState):number|null {const moves=legalMoves(state);if(moves.length)return null;if(inCheck(state,state.turn))return state.turn==='w'?-999999:999999;return 0;}
function search(state:GameState,depth:number,alpha:number,beta:number):number {
  const terminal=terminalScore(state);if(terminal!==null)return terminal;
  if(depth<=0)return materialEval(state);
  const moves=legalMoves(state);
  if(state.turn==='w'){let best=-Infinity;for(const move of moves){best=Math.max(best,search(applyMove(state,move),depth-1,alpha,beta));alpha=Math.max(alpha,best);if(beta<=alpha)break;}return best;}
  let best=Infinity;for(const move of moves){best=Math.min(best,search(applyMove(state,move),depth-1,alpha,beta));beta=Math.min(beta,best);if(beta<=alpha)break;}return best;
}
function aiMove(state:GameState,level:AiLevel):Move|null {
  const moves=legalMoves(state);if(!moves.length)return null;if(level===1)return moves[Math.floor(Math.random()*moves.length)];
  const depth=level===2?2:3;let best=Infinity,bestMoves:Move[]=[];
  for(const move of moves){const next=applyMove(state,move);const score=search(next,depth-1,-Infinity,Infinity)+(Math.random()-.5)*(level===2?18:3);if(score<best-1){best=score;bestMoves=[move];}else if(Math.abs(score-best)<1)bestMoves.push(move);}
  return bestMoves[Math.floor(Math.random()*bestMoves.length)]??moves[0];
}
function notation(before:GameState,move:Move,after:GameState):string {
  const piece=before.board[move.from.r][move.from.c];if(!piece)return'';if(move.castle)return move.castle==='K'?'O-O':'O-O-O';
  const capture=Boolean(move.captured||move.enPassant);const prefix=piece.type==='P'?(capture?FILES[move.from.c]:''):piece.type;const check=inCheck(after,after.turn);const mate=check&&legalMoves(after).length===0;return `${prefix}${capture?'x':''}${squareName(move.to)}${move.promotion?`=${move.promotion}`:''}${mate?'#':check?'+':''}`;
}

export function upgradeChess(doc:Document,win:Window){
  const root=doc.documentElement;if(!root||root.dataset.nowisChessPro==='true')return;root.dataset.nowisChessPro='true';root.lang='fr';doc.title='Échecs NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((n)=>n.remove());
  const style=doc.createElement('style');style.textContent=`
    :root{color-scheme:dark;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;--bg:#07111f;--panel:#101b2d;--line:rgba(148,163,184,.24);--light:#dce7d2;--dark:#638266;}
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#050b14;color:#f8fafc}body{min-height:100dvh;overflow-x:hidden;-webkit-tap-highlight-color:transparent}button{font:inherit}
    .chess-app{min-height:100dvh;padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));display:flex;flex-direction:column;align-items:center;gap:8px;background:radial-gradient(circle at 20% 0%,rgba(16,185,129,.12),transparent 30%),radial-gradient(circle at 90% 10%,rgba(59,130,246,.12),transparent 28%),#050b14}
    .top,.hud,.layout,.tools{width:min(100%,920px)}.top{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand small{display:block;color:#6ee7b7;font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.brand h1{margin:2px 0 0;font-size:clamp(22px,6vw,32px);letter-spacing:-.04em}.top-actions{display:flex;gap:5px}.top button,.tools button,.mode-card button,.result button{min-height:42px;border:1px solid var(--line);border-radius:12px;background:#0f172a;color:#e2e8f0;font-weight:800;cursor:pointer}.top button{min-width:42px;padding:0 10px}
    .hud{display:grid;grid-template-columns:1.25fr repeat(3,1fr);gap:5px}.stat{padding:7px;border:1px solid var(--line);border-radius:11px;background:rgba(15,23,42,.78);text-align:center}.stat span{display:block;color:#94a3b8;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.stat strong{display:block;margin-top:2px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .layout{display:grid;gap:8px;grid-template-columns:minmax(0,1fr)}.board-shell{position:relative;margin:auto;width:min(96vw,650px);padding:6px;border:1px solid rgba(110,231,183,.22);border-radius:18px;background:#111827;box-shadow:0 24px 70px rgba(0,0,0,.55)}
    .board{display:grid;grid-template-columns:repeat(8,1fr);width:100%;aspect-ratio:1;border-radius:12px;overflow:hidden;touch-action:manipulation}.sq{position:relative;border:0;padding:0;display:flex;align-items:center;justify-content:center;font-family:"Arial Unicode MS","Segoe UI Symbol",serif;font-size:clamp(28px,10vw,64px);line-height:1;cursor:pointer;text-shadow:0 2px 2px rgba(0,0,0,.18)}.sq.light{background:#e6ecd9}.sq.dark{background:#648265}.sq.white-piece{color:#fff;filter:drop-shadow(0 1px 1px #111)}.sq.black-piece{color:#111827}.sq.last::before{content:"";position:absolute;inset:0;background:rgba(250,204,21,.27)}.sq.selected::after{content:"";position:absolute;inset:5%;border:4px solid #22d3ee;border-radius:12%;z-index:2}.sq.target::after{content:"";position:absolute;width:24%;height:24%;border-radius:50%;background:rgba(15,23,42,.38);z-index:2}.sq.capture::after{content:"";position:absolute;inset:8%;border:5px solid rgba(239,68,68,.55);border-radius:50%;z-index:2}.sq.check{box-shadow:inset 0 0 0 5px #ef4444;background:#fca5a5}.coord{position:absolute;font-family:system-ui;font-size:9px;font-weight:900;opacity:.58;z-index:3}.coord.file{right:3px;bottom:2px}.coord.rank{left:3px;top:2px}
    .side{display:grid;gap:7px}.panel{border:1px solid var(--line);border-radius:14px;background:rgba(15,23,42,.78);padding:10px}.panel h2{margin:0 0 7px;font-size:12px;color:#a7f3d0;text-transform:uppercase;letter-spacing:.12em}.history{max-height:140px;overflow:auto;display:grid;grid-template-columns:32px 1fr 1fr;gap:3px 7px;font-size:11px;color:#cbd5e1}.history strong{color:#64748b}.captured{min-height:26px;font-size:20px;letter-spacing:2px}.tools{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.tools button{padding:7px 4px;font-size:11px}.tools .primary{border-color:rgba(34,211,238,.35);background:rgba(8,145,178,.16);color:#cffafe}
    .overlay{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.86);backdrop-filter:blur(12px)}.overlay.hidden{display:none}.mode-card,.result{width:min(100%,440px);border:1px solid rgba(110,231,183,.25);border-radius:20px;background:linear-gradient(155deg,#0f172a,#172033);padding:22px;box-shadow:0 30px 80px rgba(0,0,0,.62)}.mode-card small,.result small{color:#6ee7b7;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.mode-card h2,.result h2{margin:5px 0 7px;font-size:28px;letter-spacing:-.04em}.mode-card p,.result p{color:#cbd5e1;line-height:1.5}.mode-list{display:grid;gap:7px}.mode-list button{padding:12px;text-align:left}.mode-list button strong{display:block}.mode-list button span{display:block;color:#94a3b8;font-size:11px;margin-top:2px}.mode-list .recommended{border-color:#34d399;background:rgba(16,185,129,.12)}.result-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:14px}.result button{padding:11px}.result .primary{background:#047857;border-color:#34d399}.promotion{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:14px}.promotion button{font-size:36px;min-height:64px}
    @media(min-width:760px){.layout{grid-template-columns:minmax(0,650px) minmax(180px,1fr);align-items:start}.side{position:sticky;top:8px}.history{max-height:360px}.tools{max-width:650px;margin-right:auto}}
  `;doc.head.appendChild(style);
  doc.body.innerHTML=`
    <main class="chess-app"><header class="top"><div class="brand"><small>Arcade NOWIS</small><h1>Échecs</h1></div><div class="top-actions"><button id="flipBtn" title="Retourner l’échiquier">↕</button><button id="soundBtn" title="Son">🔊</button></div></header>
    <section class="hud"><div class="stat"><span>Au tour</span><strong id="turnValue">Blancs</strong></div><div class="stat"><span>Mode</span><strong id="modeValue">Ami</strong></div><div class="stat"><span>Coups</span><strong id="moveValue">0</strong></div><div class="stat"><span>État</span><strong id="stateValue">En jeu</strong></div></section>
    <section class="layout"><div class="board-shell"><div class="board" id="chessBoard"></div></div><aside class="side"><div class="panel"><h2>Pièces capturées</h2><div class="captured" id="capturedWhite"></div><div class="captured" id="capturedBlack"></div></div><div class="panel"><h2>Historique</h2><div class="history" id="history"></div></div></aside></section>
    <section class="tools"><button class="primary" id="hintBtn">💡 Indice</button><button id="undoBtn">↶ Annuler</button><button id="newBtn">↻ Nouvelle</button><button id="modeBtn">⚙ Mode</button></section></main>
    <div class="overlay" id="modeOverlay"><section class="mode-card"><small>Échecs NOWIS</small><h2>Choisis une partie</h2><p>Le moteur valide maintenant correctement l’échec, le roque, la prise en passant et les promotions. Sur mobile, touche une pièce puis sa destination.</p><div class="mode-list"><button class="recommended" data-mode="ai2"><strong>🤖 IA normale</strong><span>Bon compromis pour une partie rapide.</span></button><button data-mode="ai1"><strong>🙂 IA facile</strong><span>Joue des coups légaux mais fait des erreurs.</span></button><button data-mode="ai3"><strong>🧠 IA difficile</strong><span>Analyse plus profondément les positions.</span></button><button data-mode="friend"><strong>👥 Deux joueurs</strong><span>Jouez à tour de rôle sur le même écran.</span></button></div></section></div>
    <div class="overlay hidden" id="resultOverlay"><section class="result"><small id="resultSmall">Partie terminée</small><h2 id="resultTitle">Échec et mat</h2><p id="resultText"></p><div class="result-actions"><button class="primary" id="againBtn">Rejouer</button><button id="resultModeBtn">Changer de mode</button></div></section></div>
    <div class="overlay hidden" id="promotionOverlay"><section class="result"><small>Promotion</small><h2>Choisis une pièce</h2><div class="promotion" id="promotionChoices"></div></section></div>
  `;
  const boardEl=doc.getElementById('chessBoard')!;const turnEl=doc.getElementById('turnValue')!;const modeEl=doc.getElementById('modeValue')!;const moveEl=doc.getElementById('moveValue')!;const statusEl=doc.getElementById('stateValue')!;const historyEl=doc.getElementById('history')!;const capturedWhite=doc.getElementById('capturedWhite')!;const capturedBlack=doc.getElementById('capturedBlack')!;const modeOverlay=doc.getElementById('modeOverlay')!;const resultOverlay=doc.getElementById('resultOverlay')!;const resultSmall=doc.getElementById('resultSmall')!;const resultTitle=doc.getElementById('resultTitle')!;const resultText=doc.getElementById('resultText')!;const promotionOverlay=doc.getElementById('promotionOverlay')!;const promotionChoices=doc.getElementById('promotionChoices')!;const soundBtn=doc.getElementById('soundBtn') as HTMLButtonElement;
  let state=newState();let selected:Square|null=null;let available:Move[]=[];let lastMove:Move|null=null;let history:Snapshot[]=[];let texts:string[]=[];let mode:'friend'|'ai'='ai';let aiLevel:AiLevel=2;let flipped=false;let thinking=false;let soundOn=true;let pendingPromotions:Move[]=[];
  type AudioWin=Window&typeof globalThis&{webkitAudioContext?:typeof AudioContext};const AudioCtor=(win as AudioWin).AudioContext||(win as AudioWin).webkitAudioContext;let audio:AudioContext|null=null;
  function tone(freq:number,duration=.055){if(!soundOn||!AudioCtor)return;try{audio??=new AudioCtor();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.028,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
  function saveSnapshot(moveText:string){history.push({state:cloneState(state),moveText});}
  function currentOutcome(){const moves=legalMoves(state);const check=inCheck(state,state.turn);if(!moves.length)return check?{type:'mate' as const,winner:other(state.turn)}:{type:'stalemate' as const};if(state.halfmove>=100)return{type:'draw50' as const};return null;}
  function updateStatus(){const check=inCheck(state,state.turn);turnEl.textContent=state.turn==='w'?'Blancs':'Noirs';moveEl.textContent=String(texts.length);statusEl.textContent=check?'Échec':'En jeu';modeEl.textContent=mode==='friend'?'2 joueurs':`IA ${aiLevel===1?'facile':aiLevel===2?'normale':'difficile'}`;}
  function capturedPieces(){const counts={w:{P:8,N:2,B:2,R:2,Q:1},b:{P:8,N:2,B:2,R:2,Q:1}} as Record<Color,Record<Exclude<PieceType,'K'>,number>>;for(const row of state.board)for(const p of row)if(p&&p.type!=='K')counts[p.color][p.type as Exclude<PieceType,'K'>]-=1;const order=['Q','R','B','N','P']as Exclude<PieceType,'K'>[];capturedWhite.textContent=order.map(t=>SYMBOLS.w[t].repeat(counts.w[t])).join('');capturedBlack.textContent=order.map(t=>SYMBOLS.b[t].repeat(counts.b[t])).join('');}
  function renderHistory(){historyEl.innerHTML='';for(let i=0;i<texts.length;i+=2){const no=doc.createElement('strong');no.textContent=`${Math.floor(i/2)+1}.`;const w=doc.createElement('span');w.textContent=texts[i]||'';const b=doc.createElement('span');b.textContent=texts[i+1]||'';historyEl.append(no,w,b);}historyEl.scrollTop=historyEl.scrollHeight;}
  function render(){boardEl.innerHTML='';const rows=flipped?[0,1,2,3,4,5,6,7]:[7,6,5,4,3,2,1,0];const cols=flipped?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];for(const visualR of rows){for(const visualC of cols){const r=7-visualR,c=visualC;const sq=doc.createElement('button');sq.type='button';sq.className=`sq ${(r+c)%2===0?'light':'dark'}`;sq.dataset.r=String(r);sq.dataset.c=String(c);const p=state.board[r][c];if(p){sq.textContent=SYMBOLS[p.color][p.type];sq.classList.add(p.color==='w'?'white-piece':'black-piece');}if(selected&&selected.r===r&&selected.c===c)sq.classList.add('selected');const targets=available.filter(m=>m.to.r===r&&m.to.c===c);if(targets.length)sq.classList.add(p?'capture':'target');if(lastMove&&(sameSquare(lastMove.from,{r,c})||sameSquare(lastMove.to,{r,c})))sq.classList.add('last');const k=kingSquare(state,state.turn);if(k&&sameSquare(k,{r,c})&&inCheck(state,state.turn))sq.classList.add('check');const file=doc.createElement('span');file.className='coord file';file.textContent=FILES[c];const rank=doc.createElement('span');rank.className='coord rank';rank.textContent=String(8-r);sq.append(file,rank);boardEl.appendChild(sq);}}updateStatus();capturedPieces();renderHistory();}
  function finishIfNeeded(){const outcome=currentOutcome();if(!outcome)return false;if(outcome.type==='mate'){resultSmall.textContent='Échec et mat';resultTitle.textContent=outcome.winner==='w'?'Les blancs gagnent !':'Les noirs gagnent !';resultText.textContent=`Partie terminée après ${Math.ceil(texts.length/2)} coups.`;tone(820,.12);}else{resultSmall.textContent='Partie nulle';resultTitle.textContent=outcome.type==='stalemate'?'Pat':'Règle des 50 coups';resultText.textContent='Aucun gagnant cette fois.';}resultOverlay.classList.remove('hidden');return true;}
  function commit(move:Move){saveSnapshot(texts[texts.length-1]||'');const before=state;const next=applyMove(state,move);const text=notation(before,move,next);state=next;texts.push(text);lastMove=move;selected=null;available=[];tone(move.captured||move.enPassant?500:330);render();if(finishIfNeeded())return;if(mode==='ai'&&state.turn==='b')scheduleAi();}
  function chooseMove(move:Move){const piece=state.board[move.from.r][move.from.c];if(piece?.type==='P'&&(move.to.r===0||move.to.r===7)){pendingPromotions=available.filter(m=>sameSquare(m.to,move.to));promotionChoices.innerHTML='';for(const promo of['Q','R','B','N']as PieceType[]){const choice=pendingPromotions.find(m=>m.promotion===promo);if(!choice)continue;const btn=doc.createElement('button');btn.textContent=SYMBOLS[piece.color][promo];btn.addEventListener('click',()=>{promotionOverlay.classList.add('hidden');commit(choice);});promotionChoices.appendChild(btn);}promotionOverlay.classList.remove('hidden');return;}commit(move);}
  function onSquare(r:number,c:number){if(thinking||resultOverlay.classList.contains('hidden')===false||promotionOverlay.classList.contains('hidden')===false)return;if(mode==='ai'&&state.turn==='b')return;const p=state.board[r][c];const target=available.find(m=>m.to.r===r&&m.to.c===c);if(selected&&target){chooseMove(target);return;}if(p?.color===state.turn){selected={r,c};available=legalMoves(state).filter(m=>m.from.r===r&&m.from.c===c);tone(260,.025);}else{selected=null;available=[];}render();}
  boardEl.addEventListener('click',(e)=>{const sq=(e.target as Element|null)?.closest<HTMLElement>('.sq');if(sq)onSquare(Number(sq.dataset.r),Number(sq.dataset.c));});
  function scheduleAi(){thinking=true;statusEl.textContent='IA réfléchit…';win.setTimeout(()=>{const move=aiMove(state,aiLevel);thinking=false;if(move)commit(move);else finishIfNeeded();},aiLevel===3?220:150);}
  function startGame(m:'friend'|'ai',level:AiLevel=2){mode=m;aiLevel=level;state=newState();selected=null;available=[];lastMove=null;history=[];texts=[];thinking=false;modeOverlay.classList.add('hidden');resultOverlay.classList.add('hidden');render();}
  function undo(){if(thinking||history.length===0)return;let steps=mode==='ai'?Math.min(2,history.length):1;while(steps-->0&&history.length){const snapshot=history.pop()!;state=cloneState(snapshot.state);texts.pop();}lastMove=null;selected=null;available=[];resultOverlay.classList.add('hidden');render();tone(220,.05);}
  doc.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{const value=btn.dataset.mode!;if(value==='friend')startGame('friend');else startGame('ai',Number(value.replace('ai','')) as AiLevel);}));
  doc.getElementById('flipBtn')?.addEventListener('click',()=>{flipped=!flipped;render();});doc.getElementById('undoBtn')?.addEventListener('click',undo);doc.getElementById('newBtn')?.addEventListener('click',()=>startGame(mode,aiLevel));doc.getElementById('modeBtn')?.addEventListener('click',()=>modeOverlay.classList.remove('hidden'));doc.getElementById('againBtn')?.addEventListener('click',()=>startGame(mode,aiLevel));doc.getElementById('resultModeBtn')?.addEventListener('click',()=>{resultOverlay.classList.add('hidden');modeOverlay.classList.remove('hidden');});
  doc.getElementById('hintBtn')?.addEventListener('click',()=>{if(thinking)return;const moves=legalMoves(state);if(!moves.length)return;let best=moves[0],bestScore=state.turn==='w'?-Infinity:Infinity;for(const m of moves){const s=materialEval(applyMove(state,m));if((state.turn==='w'&&s>bestScore)||(state.turn==='b'&&s<bestScore)){bestScore=s;best=m;}}selected={...best.from};available=legalMoves(state).filter(m=>sameSquare(m.from,best.from));render();tone(650,.06);});
  soundBtn.addEventListener('click',()=>{soundOn=!soundOn;soundBtn.textContent=soundOn?'🔊':'🔇';if(soundOn)tone(520,.06);});
  render();
}
