/* eslint-disable */
const SOL_SUITS = ['♠', '♥', '♦', '♣'];
const SOL_STATS_KEY = 'nowis:solitaire:stats';
const solRank = (rank) => rank === 1 ? 'A' : rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : String(rank);
const solRed = (suit) => suit === '♥' || suit === '♦';

function solShuffle(cards) {
  const out = cards.slice();
  for (let index = out.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [out[index], out[swapIndex]] = [out[swapIndex], out[index]];
  }
  return out;
}

function solDeck() {
  const deck = [];
  for (const suit of SOL_SUITS) {
    for (let rank = 1; rank <= 13; rank += 1) {
      deck.push({ id: `${suit}-${rank}`, suit, rank, faceUp: false });
    }
  }
  return solShuffle(deck);
}

function solDeal() {
  const deck = solDeck();
  const tableau = Array.from({ length: 7 }, () => []);
  for (let col = 0; col < 7; col += 1) {
    for (let row = 0; row <= col; row += 1) {
      const card = deck.pop();
      card.faceUp = row === col;
      tableau[col].push(card);
    }
  }
  return {
    tableau,
    stock: deck,
    waste: [],
    foundations: { '♠': [], '♥': [], '♦': [], '♣': [] },
    score: 0,
    moves: 0,
    recycles: 0,
  };
}

function solClone(state) {
  return JSON.parse(JSON.stringify(state));
}

function solCanFoundation(card, pile) {
  if (!pile.length) return card.rank === 1;
  const top = pile[pile.length - 1];
  return top.suit === card.suit && top.rank + 1 === card.rank;
}

function solCanTableau(card, column) {
  if (!column.length) return card.rank === 13;
  const top = column[column.length - 1];
  return top.faceUp && solRed(card.suit) !== solRed(top.suit) && top.rank === card.rank + 1;
}

function solSequence(cards) {
  if (!cards.length || cards.some((card) => !card.faceUp)) return false;
  for (let index = 1; index < cards.length; index += 1) {
    if (
      solRed(cards[index - 1].suit) === solRed(cards[index].suit) ||
      cards[index - 1].rank !== cards[index].rank + 1
    ) {
      return false;
    }
  }
  return true;
}

function solTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function upgradeSolitaire(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisSolitairePro === 'true') return;
  root.dataset.nowisSolitairePro = 'true';
  root.lang = 'fr';
  doc.title = 'Solitaire NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    :root{color-scheme:dark;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;--line:rgba(255,255,255,.17)}
    *{box-sizing:border-box}
    html,body{margin:0;min-height:100%;background:#033b30;color:#fff}
    body{min-height:100dvh;overflow:hidden;user-select:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}
    button{font:inherit}
    .app{min-height:100dvh;height:100dvh;display:flex;flex-direction:column;align-items:center;gap:6px;padding:max(7px,env(safe-area-inset-top)) max(5px,env(safe-area-inset-right)) max(9px,env(safe-area-inset-bottom)) max(5px,env(safe-area-inset-left));background:radial-gradient(circle at 50% 0%,rgba(52,211,153,.13),transparent 26%),linear-gradient(145deg,#08775b,#034e3c)}
    .head,.hud,.desk,.tools{width:min(100%,900px)}
    .head{display:flex;align-items:center;justify-content:space-between}
    .brand small{display:block;color:#a7f3d0;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
    .brand h1{margin:2px 0 0;font-size:clamp(21px,5vw,30px);letter-spacing:-.04em}
    .head-actions{display:flex;gap:4px}
    .head button,.tools button,.modal button{min-height:40px;border:1px solid var(--line);border-radius:11px;background:rgba(6,78,59,.88);color:#ecfdf5;font-weight:850;cursor:pointer}
    .head button{min-width:40px;padding:0 9px}
    .hud{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
    .stat{padding:5px 2px;border:1px solid rgba(255,255,255,.13);border-radius:9px;background:rgba(3,47,40,.56);text-align:center}
    .stat span{display:block;font-size:8px;color:#a7f3d0;font-weight:900;text-transform:uppercase;letter-spacing:.06em}
    .stat strong{display:block;margin-top:1px;font-size:clamp(12px,3.4vw,16px);font-variant-numeric:tabular-nums}
    .desk{flex:1;min-height:0;padding:6px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(2,68,54,.42);box-shadow:0 20px 50px rgba(0,0,0,.25);overflow:auto;overscroll-behavior:contain}
    .top-row{display:flex;justify-content:space-between;gap:7px}
    .stock-group,.foundations{display:flex;gap:clamp(3px,1vw,7px)}
    .slot{position:relative;width:clamp(38px,11.1vw,75px);aspect-ratio:.70;border-radius:7px;border:2px dashed rgba(236,253,245,.22);display:flex;align-items:center;justify-content:center;color:rgba(236,253,245,.4);font-size:clamp(19px,6vw,36px);transition:border-color .12s,background-color .12s,box-shadow .12s,transform .12s}
    .stock.has{border-style:solid;background:repeating-linear-gradient(45deg,#2563eb 0 6px,#1e3a8a 6px 12px);box-shadow:inset 0 0 0 3px #dbeafe}
    .stock.has::after{content:"N";color:white;font-weight:1000;font-size:18px}
    .tableau{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:clamp(2px,.8vw,7px);margin-top:9px;min-height:360px}
    .column{position:relative;min-width:0;min-height:340px;border-radius:7px;transition:background-color .12s,box-shadow .12s,transform .12s}
    .card{position:absolute;left:0;width:100%;aspect-ratio:.70;border:1px solid rgba(15,23,42,.25);border-radius:clamp(5px,1.2vw,9px);background:#f8fafc;color:#0f172a;box-shadow:0 3px 7px rgba(0,0,0,.24);padding:clamp(2px,.7vw,6px);font-weight:900;cursor:grab;touch-action:none;transition:filter .12s,opacity .12s,outline-color .12s}
    .card:active{cursor:grabbing}
    .card.red{color:#dc2626}
    .card.back{background:repeating-linear-gradient(45deg,#2563eb 0 5px,#1e3a8a 5px 10px);box-shadow:inset 0 0 0 3px #dbeafe,0 3px 7px rgba(0,0,0,.24);color:transparent;cursor:default}
    .card.selected{outline:3px solid #fde047;outline-offset:-2px;transform:translateY(-3px);z-index:60!important}
    .card.drag-source{opacity:.24;filter:saturate(.5)}
    .card.hint{animation:solPulse .7s ease 2}
    .corner{display:flex;flex-direction:column;align-items:center;width:max-content;font-size:clamp(9px,2.8vw,18px);line-height:.9}
    .suit-big{position:absolute;inset:27% 0 auto;text-align:center;font-size:clamp(17px,6vw,38px)}
    .drag-stack{position:fixed;left:0;top:0;z-index:250;pointer-events:none;will-change:transform;filter:drop-shadow(0 16px 18px rgba(0,0,0,.42));transform:translate3d(0,0,0)}
    .drag-stack .card{position:absolute;left:0;margin:0;transform:none!important;outline:0!important;opacity:1!important;cursor:grabbing;box-shadow:0 10px 18px rgba(0,0,0,.34)}
    .column.drop-valid,.foundation.drop-valid{background:rgba(52,211,153,.15);box-shadow:inset 0 0 0 2px #6ee7b7,0 0 24px rgba(52,211,153,.2);transform:scale(1.012)}
    .column.drop-invalid,.foundation.drop-invalid{background:rgba(248,113,113,.1);box-shadow:inset 0 0 0 2px rgba(248,113,113,.65)}
    .tools{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
    .tools button{padding:6px 2px;font-size:10px}
    .tools .primary{background:rgba(14,116,144,.36);border-color:rgba(103,232,249,.45)}
    .tools button:disabled{opacity:.4}
    .overlay{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.84);backdrop-filter:blur(12px)}
    .overlay.hidden{display:none}
    .modal{width:min(100%,440px);border:1px solid rgba(52,211,153,.28);border-radius:20px;background:linear-gradient(155deg,#064e3b,#0f172a);padding:22px;box-shadow:0 30px 80px rgba(0,0,0,.6)}
    .modal small{color:#a7f3d0;font-weight:900;letter-spacing:.15em;text-transform:uppercase}
    .modal h2{margin:5px 0 8px;font-size:27px;letter-spacing:-.04em}
    .modal p{color:#d1fae5;line-height:1.5}
    .modes{display:grid;gap:7px}
    .modes button{padding:11px;text-align:left}
    .modes strong,.modes span{display:block}
    .modes span{font-size:11px;color:#a7f3d0;margin-top:2px}
    .modes .recommended{border-color:#6ee7b7;background:rgba(16,185,129,.14)}
    .actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:14px}
    .modal .primary{background:#047857;border-color:#34d399}
    .toast{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%) translateY(15px);opacity:0;z-index:320;background:#0f172a;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:8px 12px;font-size:11px;font-weight:900;transition:.18s;pointer-events:none}
    .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
    @keyframes solPulse{50%{filter:brightness(1.35);transform:translateY(-5px);outline:3px solid #fde047}}
    @media(max-width:430px){.tableau{min-height:320px}.column{min-height:300px}.tools button{font-size:9px;min-height:38px}}
    @media(prefers-reduced-motion:reduce){.slot,.column,.card,.toast{transition:none!important}.card.hint{animation:none!important}}
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
    <main class="app">
      <header class="head"><div class="brand"><small>Arcade NOWIS</small><h1>Solitaire</h1></div><div class="head-actions"><button id="soundBtn">🔊</button><button id="statsBtn">🏆</button></div></header>
      <section class="hud"><div class="stat"><span>Score</span><strong id="score">0</strong></div><div class="stat"><span>Temps</span><strong id="time">0:00</strong></div><div class="stat"><span>Coups</span><strong id="moves">0</strong></div><div class="stat"><span>Pioche</span><strong id="draw">1</strong></div><div class="stat"><span>Fondations</span><strong id="progress">0/52</strong></div></section>
      <section class="desk"><div class="top-row"><div class="stock-group"><div class="slot stock" id="stock"></div><div class="slot" id="waste"></div></div><div class="foundations" id="foundations"></div></div><div class="tableau" id="tableau"></div></section>
      <section class="tools"><button class="primary" id="hintBtn">💡 Indice</button><button id="undoBtn">↶ Annuler</button><button id="autoBtn">✨ Auto</button><button id="newBtn">↻ Nouvelle</button><button id="modeBtn">⚙ Mode</button></section>
    </main>
    <div class="overlay" id="modeOverlay"><section class="modal"><small>Solitaire NOWIS</small><h2>Choisis ton défi</h2><p>Klondike tactile avec glisser-déposer, annulation fiable, double-tap vers les fondations, indice et auto-finition.</p><div class="modes"><button class="recommended" data-mode="detente"><strong>☕ Détente</strong><span>Pioche 1 · recyclage illimité · indices</span></button><button data-mode="classique"><strong>♣ Classique</strong><span>Pioche 1 · 3 recyclages · score standard</span></button><button data-mode="expert"><strong>🔥 Expert</strong><span>Pioche 3 · 1 recyclage · sans indice</span></button></div></section></div>
    <div class="overlay hidden" id="result"><section class="modal"><small>Victoire</small><h2>Solitaire réussi !</h2><p id="resultText"></p><div class="actions"><button class="primary" id="againBtn">Rejouer</button><button id="resultMode">Changer de mode</button></div></section></div>
    <div class="overlay hidden" id="stats"><section class="modal"><small>Statistiques</small><h2>Tes parties</h2><p id="statsText"></p><div class="actions"><button class="primary" id="closeStats">Fermer</button><button id="resetStats">Réinitialiser</button></div></section></div>
    <div class="toast" id="toast"></div>`;

  const tableauEl = doc.getElementById('tableau'), stockEl = doc.getElementById('stock'), wasteEl = doc.getElementById('waste'), foundationsEl = doc.getElementById('foundations'), scoreEl = doc.getElementById('score'), timeEl = doc.getElementById('time'), movesEl = doc.getElementById('moves'), drawEl = doc.getElementById('draw'), progressEl = doc.getElementById('progress'), undoBtn = doc.getElementById('undoBtn'), hintBtn = doc.getElementById('hintBtn'), modeOverlay = doc.getElementById('modeOverlay'), resultOverlay = doc.getElementById('result'), resultText = doc.getElementById('resultText'), statsOverlay = doc.getElementById('stats'), statsText = doc.getElementById('statsText'), toastEl = doc.getElementById('toast'), soundBtn = doc.getElementById('soundBtn');
  let state = solDeal(), difficulty = 'detente', history = [], selected = null, elapsed = 0, timer = null, running = false, soundOn = true, lastTap = null, drag = null, suppressClickUntil = 0, highlightedTarget = null;
  const AudioCtor = win.AudioContext || win.webkitAudioContext;
  let audio = null;
  function tone(frequency, duration = .045) { if (!soundOn || !AudioCtor) return; try { audio ||= new AudioCtor(); const oscillator = audio.createOscillator(), gain = audio.createGain(); oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.025, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + duration); oscillator.connect(gain).connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration); } catch {} }
  function toast(text) { toastEl.textContent = text; toastEl.classList.add('show'); win.setTimeout(() => toastEl.classList.remove('show'), 1100); }
  function cfg() { return difficulty === 'detente' ? { draw: 1, recycles: 999, hints: true } : difficulty === 'classique' ? { draw: 1, recycles: 3, hints: true } : { draw: 3, recycles: 1, hints: false }; }
  function save() { history.push({ state: solClone(state), elapsed }); if (history.length > 150) history.shift(); }
  function sourceCards(src) { if (src.type === 'waste') { const card = state.waste.at(-1); return card ? [card] : []; } if (src.type === 'foundation') { const card = state.foundations[src.suit].at(-1); return card ? [card] : []; } return state.tableau[src.col].slice(src.index); }
  function removeSource(src, count) { if (src.type === 'waste') state.waste.pop(); else if (src.type === 'foundation') state.foundations[src.suit].pop(); else state.tableau[src.col].splice(src.index, count); }
  function reveal(src) { if (src.type !== 'tableau') return; const top = state.tableau[src.col].at(-1); if (top && !top.faceUp) { top.faceUp = true; state.score += 5; } }
  function canMove(cards, dst) { if (!cards.length || !solSequence(cards) || !dst) return false; if (dst.type === 'foundation') return cards.length === 1 && cards[0].suit === dst.suit && solCanFoundation(cards[0], state.foundations[dst.suit]); return solCanTableau(cards[0], state.tableau[dst.col]); }
  function move(src, cards, dst) { if (!canMove(cards, dst)) return false; save(); removeSource(src, cards.length); if (dst.type === 'foundation') { state.foundations[dst.suit].push(cards[0]); state.score += src.type === 'foundation' ? -15 : 10; } else { state.tableau[dst.col].push(...cards); state.score += src.type === 'waste' ? 5 : src.type === 'foundation' ? -15 : 0; } reveal(src); state.moves += 1; selected = null; tone(dst.type === 'foundation' ? 650 : 420); try { win.navigator.vibrate?.(12); } catch {} render(); checkWin(); return true; }
  function drawStock() { if (!running || drag) return; const conf = cfg(); if (!state.stock.length) { if (!state.waste.length) return; if (state.recycles >= conf.recycles) { toast('Plus de recyclage de pioche'); return; } save(); state.stock = state.waste.reverse().map((card) => ({ ...card, faceUp: false })); state.waste = []; state.recycles += 1; state.moves += 1; state.score = Math.max(0, state.score - 20); tone(250); render(); return; } save(); for (let index = 0; index < conf.draw && state.stock.length; index += 1) { const card = state.stock.pop(); card.faceUp = true; state.waste.push(card); } state.moves += 1; tone(320); render(); }
  function cardHtml(card, classes = '', top = 0, z = 1) { return `<button type="button" class="card ${solRed(card.suit) ? 'red' : ''} ${card.faceUp ? '' : 'back'} ${classes}" data-card="${card.id}" style="top:${top}px;z-index:${z}" aria-label="${card.faceUp ? `${solRank(card.rank)} ${card.suit}` : 'Carte face cachée'}">${card.faceUp ? `<span class="corner"><span>${solRank(card.rank)}</span><span>${card.suit}</span></span><span class="suit-big">${card.suit}</span>` : ''}</button>`; }
  function render() { stockEl.className = `slot stock ${state.stock.length ? 'has' : ''}`; stockEl.innerHTML = ''; const waste = state.waste.at(-1); wasteEl.innerHTML = waste ? cardHtml(waste, selected?.cards?.[0]?.id === waste.id ? 'selected' : '') : ''; foundationsEl.innerHTML = ''; for (const suit of SOL_SUITS) { const slot = doc.createElement('div'); slot.className = 'slot foundation'; slot.dataset.suit = suit; const card = state.foundations[suit].at(-1); slot.innerHTML = card ? cardHtml(card, selected?.cards?.[0]?.id === card.id ? 'selected' : '') : `<span>${suit}</span>`; foundationsEl.appendChild(slot); } tableauEl.innerHTML = ''; state.tableau.forEach((column, colIndex) => { const columnEl = doc.createElement('div'); columnEl.className = 'column'; columnEl.dataset.col = String(colIndex); let y = 0; column.forEach((card, cardIndex) => { columnEl.insertAdjacentHTML('beforeend', cardHtml(card, selected?.cards?.some((candidate) => candidate.id === card.id) ? 'selected' : '', y, cardIndex + 1)); y += card.faceUp ? Math.min(30, Math.max(18, 250 / (column.length || 1))) : Math.min(18, Math.max(10, 130 / (column.length || 1))); }); tableauEl.appendChild(columnEl); }); scoreEl.textContent = String(state.score); movesEl.textContent = String(state.moves); drawEl.textContent = String(cfg().draw); progressEl.textContent = `${SOL_SUITS.reduce((count, suit) => count + state.foundations[suit].length, 0)}/52`; undoBtn.disabled = !history.length; hintBtn.disabled = !cfg().hints; }
  function locate(id) { if (state.waste.at(-1)?.id === id) return { type: 'waste' }; for (const suit of SOL_SUITS) if (state.foundations[suit].at(-1)?.id === id) return { type: 'foundation', suit }; for (let col = 0; col < 7; col += 1) { const index = state.tableau[col].findIndex((card) => card.id === id); if (index >= 0) return { type: 'tableau', col, index }; } return null; }
  function selectCard(id) { const src = locate(id); if (!src) return; const cards = sourceCards(src); if (!cards.length || !cards[0].faceUp || !solSequence(cards)) return; const now = Date.now(); if (lastTap?.id === id && now - lastTap.at < 420 && cards.length === 1) { lastTap = null; if (move(src, cards, { type: 'foundation', suit: cards[0].suit })) return; } lastTap = { id, at: now }; selected = selected?.cards?.[0]?.id === id ? null : { src, cards }; tone(280, .025); render(); }
  function destinationFromPoint(clientX, clientY) { const hit = doc.elementFromPoint(clientX, clientY); const foundation = hit?.closest?.('.foundation'); if (foundation?.dataset.suit) return { type: 'foundation', suit: foundation.dataset.suit, element: foundation }; const column = hit?.closest?.('.column'); if (column?.dataset.col != null) return { type: 'tableau', col: Number(column.dataset.col), element: column }; return null; }
  function clearDropHighlight() { if (!highlightedTarget) return; highlightedTarget.classList.remove('drop-valid', 'drop-invalid'); highlightedTarget = null; }
  function updateDropHighlight(destination, cards) { clearDropHighlight(); if (!destination?.element) return; highlightedTarget = destination.element; highlightedTarget.classList.add(canMove(cards, destination) ? 'drop-valid' : 'drop-invalid'); }
  function markDragSources(cards, active) { cards.forEach((card) => doc.querySelector(`[data-card="${card.id}"]`)?.classList.toggle('drag-source', active)); }
  function buildDragGhost(cards, sourceNode, pointerX, pointerY) { const sourceRect = sourceNode.getBoundingClientRect(); const ghost = doc.createElement('div'); ghost.className = 'drag-stack'; ghost.style.width = `${sourceRect.width}px`; const offsetX = Math.max(0, Math.min(sourceRect.width, pointerX - sourceRect.left)), offsetY = Math.max(0, Math.min(sourceRect.height, pointerY - sourceRect.top)); let maxBottom = sourceRect.height; cards.forEach((card, index) => { const sourceCard = doc.querySelector(`[data-card="${card.id}"]`); if (!sourceCard) return; const rect = sourceCard.getBoundingClientRect(), clone = sourceCard.cloneNode(true); clone.classList.remove('selected', 'drag-source', 'hint'); clone.style.width = `${sourceRect.width}px`; clone.style.top = `${Math.max(0, rect.top - sourceRect.top)}px`; clone.style.zIndex = String(250 + index); clone.tabIndex = -1; ghost.appendChild(clone); maxBottom = Math.max(maxBottom, rect.bottom - sourceRect.top); }); ghost.style.height = `${maxBottom}px`; doc.body.appendChild(ghost); return { ghost, offsetX, offsetY }; }
  function positionDragGhost(clientX, clientY) { if (drag?.ghost) drag.ghost.style.transform = `translate3d(${clientX - drag.offsetX}px,${clientY - drag.offsetY}px,0)`; }
  function cleanupDrag({ keepSelection = false } = {}) { clearDropHighlight(); if (drag?.cards) markDragSources(drag.cards, false); drag?.ghost?.remove(); drag = null; if (!keepSelection) selected = null; }
  function beginPointerDrag(event, cardNode) { if (!running || event.button > 0) return; const src = locate(cardNode.dataset.card); if (!src) return; const cards = sourceCards(src); if (!cards.length || !cards[0].faceUp || !solSequence(cards)) return; drag = { pointerId: event.pointerId, src, cards, startX: event.clientX, startY: event.clientY, moved: false, ghost: null, offsetX: 0, offsetY: 0, sourceNode: cardNode }; selected = { src, cards }; try { cardNode.setPointerCapture?.(event.pointerId); } catch {} }
  function handlePointerMove(event) { if (!drag || drag.pointerId !== event.pointerId) return; const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY); if (!drag.moved && distance < 7) return; event.preventDefault(); if (!drag.moved) { drag.moved = true; const built = buildDragGhost(drag.cards, drag.sourceNode, event.clientX, event.clientY); drag.ghost = built.ghost; drag.offsetX = built.offsetX; drag.offsetY = built.offsetY; markDragSources(drag.cards, true); tone(300, .025); try { win.navigator.vibrate?.(8); } catch {} } positionDragGhost(event.clientX, event.clientY); updateDropHighlight(destinationFromPoint(event.clientX, event.clientY), drag.cards); }
  function finishPointerDrag(event, cancelled = false) { if (!drag || drag.pointerId !== event.pointerId) return; const activeDrag = drag; suppressClickUntil = Date.now() + 350; if (!activeDrag.moved) { cleanupDrag({ keepSelection: true }); selectCard(activeDrag.cards[0].id); return; } event.preventDefault(); const destination = cancelled ? null : destinationFromPoint(event.clientX, event.clientY), valid = destination && canMove(activeDrag.cards, destination); cleanupDrag({ keepSelection: !valid }); if (valid) move(activeDrag.src, activeDrag.cards, destination); else { selected = { src: activeDrag.src, cards: activeDrag.cards }; render(); tone(180, .035); try { win.navigator.vibrate?.([10, 24, 10]); } catch {} } }
  doc.addEventListener('pointerdown', (event) => { const cardNode = event.target.closest?.('[data-card]'); if (!cardNode || cardNode.classList.contains('back')) return; beginPointerDrag(event, cardNode); });
  doc.addEventListener('pointermove', handlePointerMove, { passive: false });
  doc.addEventListener('pointerup', (event) => finishPointerDrag(event, false), { passive: false });
  doc.addEventListener('pointercancel', (event) => finishPointerDrag(event, true), { passive: false });
  doc.addEventListener('click', (event) => { if (Date.now() < suppressClickUntil) return; const target = event.target.closest?.('[data-card]'); if (target) { selectCard(target.dataset.card); return; } const foundation = event.target.closest?.('.foundation'); if (foundation && selected) { move(selected.src, selected.cards, { type: 'foundation', suit: foundation.dataset.suit }); return; } const column = event.target.closest?.('.column'); if (column && selected) move(selected.src, selected.cards, { type: 'tableau', col: Number(column.dataset.col) }); });
  stockEl.addEventListener('click', drawStock);
  function undo() { const snapshot = history.pop(); if (!snapshot) return; cleanupDrag(); state = solClone(snapshot.state); elapsed = snapshot.elapsed; selected = null; tone(220); render(); }
  function findHint() { const waste = state.waste.at(-1); if (waste) { if (solCanFoundation(waste, state.foundations[waste.suit])) return { src: { type: 'waste' }, card: waste, text: 'Monte cette carte sur sa fondation' }; for (let col = 0; col < 7; col += 1) if (solCanTableau(waste, state.tableau[col])) return { src: { type: 'waste' }, card: waste, text: `Déplace la pioche vers la colonne ${col + 1}` }; } for (let col = 0; col < 7; col += 1) { const column = state.tableau[col]; for (let index = 0; index < column.length; index += 1) { const card = column[index]; if (!card.faceUp) continue; if (index === column.length - 1 && solCanFoundation(card, state.foundations[card.suit])) return { src: { type: 'tableau', col, index }, card, text: 'Monte cette carte sur sa fondation' }; const sequence = column.slice(index); if (!solSequence(sequence)) continue; for (let targetCol = 0; targetCol < 7; targetCol += 1) if (targetCol !== col && solCanTableau(card, state.tableau[targetCol])) return { src: { type: 'tableau', col, index }, card, text: `Déplace cette suite vers la colonne ${targetCol + 1}` }; } } return null; }
  function hint() { if (!cfg().hints) { toast('Indices désactivés en Expert'); return; } const found = findHint(); if (!found) { toast(state.stock.length ? 'Essaie la prochaine carte de la pioche' : 'Aucun coup évident'); return; } selected = { src: found.src, cards: sourceCards(found.src) }; render(); const node = doc.querySelector(`[data-card="${found.card.id}"]`); node?.classList.add('hint'); win.setTimeout(() => node?.classList.remove('hint'), 1300); toast(found.text); tone(650, .06); }
  function safeAuto() { const candidates = [], waste = state.waste.at(-1); if (waste) candidates.push({ src: { type: 'waste' }, card: waste }); for (let col = 0; col < 7; col += 1) { const card = state.tableau[col].at(-1); if (card?.faceUp) candidates.push({ src: { type: 'tableau', col, index: state.tableau[col].length - 1 }, card }); } for (const item of candidates) if (solCanFoundation(item.card, state.foundations[item.card.suit])) { const opposite = SOL_SUITS.filter((suit) => solRed(suit) !== solRed(item.card.suit)), safe = item.card.rank <= 2 || opposite.every((suit) => (state.foundations[suit].at(-1)?.rank || 0) >= item.card.rank - 1); if (safe) return move(item.src, [item.card], { type: 'foundation', suit: item.card.suit }); } return false; }
  function autoFinish() { let count = 0; const step = () => { if (!running) return; if (safeAuto()) { count += 1; win.setTimeout(step, 130); } else toast(count ? `${count} carte${count > 1 ? 's' : ''} montée${count > 1 ? 's' : ''}` : 'Aucune carte sûre à monter'); }; step(); }
  function readStats() { try { return JSON.parse(win.localStorage.getItem(SOL_STATS_KEY) || 'null') || { games: 0, wins: 0, bestTime: null }; } catch { return { games: 0, wins: 0, bestTime: null }; } }
  function writeStats(stats) { win.localStorage.setItem(SOL_STATS_KEY, JSON.stringify(stats)); }
  function checkWin() { if (SOL_SUITS.reduce((count, suit) => count + state.foundations[suit].length, 0) !== 52) return; running = false; if (timer) { win.clearInterval(timer); timer = null; } const stats = readStats(); stats.wins += 1; stats.bestTime = stats.bestTime == null ? elapsed : Math.min(stats.bestTime, elapsed); writeStats(stats); resultText.textContent = `Temps : ${solTime(elapsed)} · Coups : ${state.moves} · Score : ${state.score}`; resultOverlay.classList.remove('hidden'); tone(820, .12); win.setTimeout(() => tone(1050, .14), 100); }
  function start(mode) { cleanupDrag(); difficulty = mode; state = solDeal(); history = []; selected = null; elapsed = 0; running = true; modeOverlay.classList.add('hidden'); resultOverlay.classList.add('hidden'); if (timer) win.clearInterval(timer); timer = win.setInterval(() => { if (running) { elapsed += 1; timeEl.textContent = solTime(elapsed); } }, 1000); timeEl.textContent = '0:00'; render(); tone(520, .07); }
  function newGame() { const stats = readStats(); stats.games += 1; writeStats(stats); start(difficulty); }
  doc.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { const stats = readStats(); stats.games += 1; writeStats(stats); start(button.dataset.mode); }));
  doc.getElementById('undoBtn').addEventListener('click', undo); doc.getElementById('hintBtn').addEventListener('click', hint); doc.getElementById('autoBtn').addEventListener('click', autoFinish); doc.getElementById('newBtn').addEventListener('click', newGame); doc.getElementById('modeBtn').addEventListener('click', () => modeOverlay.classList.remove('hidden')); doc.getElementById('againBtn').addEventListener('click', newGame); doc.getElementById('resultMode').addEventListener('click', () => { resultOverlay.classList.add('hidden'); modeOverlay.classList.remove('hidden'); }); doc.getElementById('statsBtn').addEventListener('click', () => { const stats = readStats(); statsText.textContent = `Parties : ${stats.games} · Victoires : ${stats.wins} · Meilleur temps : ${stats.bestTime == null ? '—' : solTime(stats.bestTime)}`; statsOverlay.classList.remove('hidden'); }); doc.getElementById('closeStats').addEventListener('click', () => statsOverlay.classList.add('hidden')); doc.getElementById('resetStats').addEventListener('click', () => { writeStats({ games: 0, wins: 0, bestTime: null }); statsText.textContent = 'Statistiques réinitialisées.'; }); soundBtn.addEventListener('click', () => { soundOn = !soundOn; soundBtn.textContent = soundOn ? '🔊' : '🔇'; if (soundOn) tone(520, .05); });
  render();
}
