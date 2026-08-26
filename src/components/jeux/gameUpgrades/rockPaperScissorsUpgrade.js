const BEST_STREAK_KEY = 'nowis:rps:best-streak';
const STATS_KEY = 'nowis:rps:stats';

const CHOICES = {
  rock: { emoji: '✊', label: 'Pierre', beats: 'scissors' },
  paper: { emoji: '✋', label: 'Papier', beats: 'rock' },
  scissors: { emoji: '✌️', label: 'Ciseaux', beats: 'paper' },
};

const CHOICE_KEYS = Object.keys(CHOICES);

function counterTo(choice) {
  if (choice === 'rock') return 'paper';
  if (choice === 'paper') return 'scissors';
  return 'rock';
}

function loadStats(win) {
  try {
    const parsed = JSON.parse(win.localStorage.getItem(STATS_KEY) || '{}');
    return {
      wins: Number(parsed.wins || 0),
      losses: Number(parsed.losses || 0),
      draws: Number(parsed.draws || 0),
      matches: Number(parsed.matches || 0),
    };
  } catch {
    return { wins: 0, losses: 0, draws: 0, matches: 0 };
  }
}

export function upgradeRockPaperScissors(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisRpsPro === 'true') return;
  root.dataset.nowisRpsPro = 'true';
  root.lang = 'fr';
  doc.title = 'Pierre-papier-ciseaux NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"], script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    :root{color-scheme:dark;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
    *{box-sizing:border-box}
    html,body{margin:0;min-height:100%;background:#090515;color:#fff}
    body{min-height:100dvh;overflow-x:hidden;user-select:none;-webkit-tap-highlight-color:transparent}
    button{font:inherit}
    .rps-app{min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:8px;padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));background:radial-gradient(circle at 18% 5%,rgba(236,72,153,.24),transparent 30%),radial-gradient(circle at 82% 8%,rgba(34,211,238,.2),transparent 28%),linear-gradient(160deg,#120726 0%,#080512 55%,#06131c 100%)}
    .rps-head,.rps-hud,.arena,.choice-grid,.rps-tools,.round-feed{width:min(100%,620px)}
    .rps-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
    .brand small{display:block;color:#67e8f9;font-size:10px;font-weight:950;letter-spacing:.17em;text-transform:uppercase}
    .brand h1{margin:2px 0 0;font-size:clamp(22px,6vw,33px);letter-spacing:-.045em;background:linear-gradient(90deg,#f9a8d4,#fde047,#67e8f9);-webkit-background-clip:text;background-clip:text;color:transparent}
    .icon-btn,.rps-tools button,.choice-btn,.panel button{min-height:44px;border:1px solid rgba(255,255,255,.15);border-radius:14px;background:rgba(15,23,42,.78);color:#f8fafc;font-weight:850;cursor:pointer}
    .icon-btn{min-width:44px}
    .rps-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}
    .stat{padding:6px 3px;text-align:center;border:1px solid rgba(255,255,255,.11);border-radius:11px;background:rgba(15,23,42,.66);box-shadow:inset 0 1px rgba(255,255,255,.03)}
    .stat span{display:block;color:#a5b4fc;font-size:9px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}
    .stat strong{display:block;margin-top:2px;font-size:clamp(14px,4vw,19px);font-variant-numeric:tabular-nums}
    .arena{position:relative;overflow:hidden;border:1px solid rgba(192,132,252,.25);border-radius:22px;background:linear-gradient(145deg,rgba(30,14,58,.9),rgba(6,28,39,.9));box-shadow:0 24px 70px rgba(0,0,0,.48);padding:12px}
    .arena::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 49.7%,rgba(255,255,255,.12) 50%,transparent 50.3%);pointer-events:none}
    .fighters{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:12px;min-height:190px;align-items:center}
    .fighter{text-align:center;padding:12px 5px;border-radius:18px;background:rgba(2,6,23,.34);border:1px solid rgba(255,255,255,.08)}
    .fighter.player{box-shadow:inset 0 0 28px rgba(236,72,153,.08)}
    .fighter.cpu{box-shadow:inset 0 0 28px rgba(34,211,238,.08)}
    .fighter-label{font-size:10px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;color:#cbd5e1}
    .fighter.player .fighter-label{color:#f9a8d4}.fighter.cpu .fighter-label{color:#67e8f9}
    .hand{height:100px;display:flex;align-items:center;justify-content:center;font-size:clamp(58px,18vw,92px);filter:drop-shadow(0 10px 18px rgba(0,0,0,.3));transform:translateZ(0)}
    .hand.reveal{animation:pop .35s cubic-bezier(.2,.85,.3,1.2)}
    .fighter-score{font-size:30px;font-weight:1000;line-height:1}.fighter.player .fighter-score{color:#f472b6}.fighter.cpu .fighter-score{color:#22d3ee}
    .round-banner{position:relative;margin:10px auto 2px;width:min(100%,430px);padding:8px 12px;border-radius:999px;text-align:center;background:rgba(2,6,23,.82);border:1px solid rgba(253,224,71,.25);color:#fde68a;font-size:12px;font-weight:950;letter-spacing:.02em;min-height:36px;display:flex;align-items:center;justify-content:center}
    .round-banner.win{border-color:rgba(74,222,128,.48);color:#86efac;box-shadow:0 0 28px rgba(34,197,94,.12)}
    .round-banner.loss{border-color:rgba(251,113,133,.48);color:#fda4af;box-shadow:0 0 28px rgba(244,63,94,.12)}
    .round-banner.draw{border-color:rgba(250,204,21,.45);color:#fde047}
    .choice-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
    .choice-btn{position:relative;overflow:hidden;padding:10px 4px;background:linear-gradient(180deg,rgba(30,41,59,.94),rgba(15,23,42,.96));transition:.16s ease;touch-action:manipulation}
    .choice-btn::after{content:"";position:absolute;inset:0;opacity:0;background:radial-gradient(circle at 50% 25%,rgba(255,255,255,.18),transparent 52%);transition:.16s}
    .choice-btn:hover::after,.choice-btn:focus-visible::after{opacity:1}
    .choice-btn:active{transform:scale(.96)}
    .choice-btn[disabled]{opacity:.52;cursor:not-allowed}
    .choice-btn .emoji{display:block;font-size:clamp(34px,10vw,52px);line-height:1.1}.choice-btn .name{display:block;margin-top:5px;font-size:12px;font-weight:950}.choice-btn .key{display:block;color:#94a3b8;font-size:9px;margin-top:2px}
    .choice-btn[data-choice="rock"]{border-color:rgba(244,114,182,.35)}.choice-btn[data-choice="paper"]{border-color:rgba(34,211,238,.35)}.choice-btn[data-choice="scissors"]{border-color:rgba(250,204,21,.35)}
    .rps-tools{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.rps-tools button{padding:7px 3px;font-size:11px}.rps-tools .primary{background:rgba(147,51,234,.22);border-color:rgba(192,132,252,.42);color:#f3e8ff}
    .round-feed{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;min-height:18px}.feed-dot{height:8px;border-radius:999px;background:#1e293b;border:1px solid rgba(255,255,255,.08)}.feed-dot.win{background:#22c55e}.feed-dot.loss{background:#f43f5e}.feed-dot.draw{background:#eab308}
    .overlay{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.86);backdrop-filter:blur(13px)}.overlay.hidden{display:none}
    .panel{width:min(100%,440px);border:1px solid rgba(192,132,252,.28);border-radius:22px;background:linear-gradient(155deg,#1b1038,#082433);padding:22px;box-shadow:0 32px 90px rgba(0,0,0,.62)}
    .panel small{color:#67e8f9;font-weight:950;letter-spacing:.16em;text-transform:uppercase}.panel h2{margin:5px 0 7px;font-size:29px;letter-spacing:-.045em}.panel p{color:#cbd5e1;line-height:1.5;margin:8px 0}.panel .note{padding:9px 10px;border-radius:12px;background:rgba(15,23,42,.62);border:1px solid rgba(255,255,255,.08);font-size:11px;color:#dbeafe}
    .mode-grid{display:grid;grid-template-columns:1fr;gap:7px;margin-top:14px}.mode-card{padding:11px;text-align:left}.mode-card strong{display:block;font-size:14px}.mode-card span{display:block;color:#cbd5e1;font-size:11px;margin-top:3px;line-height:1.35}.mode-card.active{border-color:#c084fc;background:rgba(126,34,206,.22)}
    .actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:14px}.panel button{padding:11px}.panel .primary{background:linear-gradient(90deg,#a21caf,#0e7490);border-color:rgba(255,255,255,.2)}
    .career{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:12px 0}.career div{padding:8px;border-radius:11px;background:rgba(15,23,42,.55);text-align:center}.career span{display:block;color:#94a3b8;font-size:9px;text-transform:uppercase}.career strong{display:block;margin-top:3px;font-size:17px}
    @keyframes pop{0%{transform:scale(.72) rotate(-8deg);opacity:.35}75%{transform:scale(1.08) rotate(2deg)}100%{transform:scale(1);opacity:1}}
    @keyframes shake{0%,100%{transform:translateX(0)}30%{transform:translateX(-6px)}60%{transform:translateX(6px)}}
    .arena.shake{animation:shake .26s ease}
    @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
    @media (max-height:680px){.fighters{min-height:145px}.hand{height:70px;font-size:54px}.arena{padding:8px}.rps-app{gap:5px}}
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
    <main class="rps-app">
      <header class="rps-head">
        <div class="brand"><small>Arène NOWIS</small><h1>Pierre · Papier · Ciseaux</h1></div>
        <button id="rpsSound" class="icon-btn" type="button" aria-label="Activer ou désactiver le son">🔊</button>
      </header>
      <section class="rps-hud" aria-label="Statistiques de la partie">
        <div class="stat"><span>Manche</span><strong id="rpsRound">1</strong></div>
        <div class="stat"><span>Série</span><strong id="rpsStreak">0</strong></div>
        <div class="stat"><span>Record</span><strong id="rpsBest">0</strong></div>
        <div class="stat"><span>Cible</span><strong id="rpsTarget">5</strong></div>
        <div class="stat"><span>IA</span><strong id="rpsDifficulty">Tactique</strong></div>
      </section>
      <section class="arena" id="rpsArena" aria-live="polite">
        <div class="fighters">
          <div class="fighter player"><div class="fighter-label">Toi</div><div class="hand" id="playerHand">❔</div><div class="fighter-score" id="playerScore">0</div></div>
          <div class="fighter cpu"><div class="fighter-label">NOWIS IA</div><div class="hand" id="cpuHand">🤖</div><div class="fighter-score" id="cpuScore">0</div></div>
        </div>
        <div class="round-banner" id="rpsBanner">Choisis ton coup.</div>
      </section>
      <section class="choice-grid" aria-label="Choisir un coup">
        <button class="choice-btn" data-choice="rock" type="button"><span class="emoji">✊</span><span class="name">Pierre</span><span class="key">Touche 1</span></button>
        <button class="choice-btn" data-choice="paper" type="button"><span class="emoji">✋</span><span class="name">Papier</span><span class="key">Touche 2</span></button>
        <button class="choice-btn" data-choice="scissors" type="button"><span class="emoji">✌️</span><span class="name">Ciseaux</span><span class="key">Touche 3</span></button>
      </section>
      <section class="rps-tools">
        <button class="primary" id="rpsPause" type="button">⏸ Pause</button>
        <button id="rpsRestart" type="button">↻ Rejouer</button>
        <button id="rpsMode" type="button">⚙ Mode</button>
        <button id="rpsHelp" type="button">? Aide</button>
      </section>
      <section class="round-feed" id="rpsFeed" aria-label="Résultats récents"></section>
    </main>
    <div class="overlay" id="rpsIntro"><section class="panel"><small>Nouvelle version NOWIS</small><h2>Lis l’adversaire. Casse la série.</h2><p>Un vrai duel en plusieurs manches. L’IA ne voit jamais ton coup à l’avance : en modes supérieurs, elle essaie seulement de prédire tes habitudes passées.</p><div class="mode-grid" id="rpsIntroModes"><button class="mode-card" data-difficulty="relax"><strong>🌈 Détente</strong><span>IA aléatoire. Idéal pour jouer sans pression.</span></button><button class="mode-card active" data-difficulty="tactical"><strong>🧠 Tactique</strong><span>L’IA observe tes derniers choix et cherche tes habitudes.</span></button><button class="mode-card" data-difficulty="expert"><strong>⚡ Expert</strong><span>L’IA analyse aussi ce que tu joues après chacun de tes coups.</span></button></div><div class="actions"><button class="primary" id="rpsStart">Entrer dans l’arène</button><button id="rpsShort">Duel rapide à 3</button></div></section></div>
    <div class="overlay hidden" id="rpsPauseOverlay"><section class="panel"><small>Pause</small><h2>Le duel est figé</h2><p>Le score et ta série sont conservés.</p><div class="actions"><button class="primary" id="rpsResume">Reprendre</button><button id="rpsPauseRestart">Recommencer</button></div></section></div>
    <div class="overlay hidden" id="rpsModeOverlay"><section class="panel"><small>Réglages</small><h2>Choisis ton adversaire</h2><p>Changer la difficulté recommence le duel pour garder une partie équitable.</p><div class="mode-grid" id="rpsModeModes"><button class="mode-card" data-difficulty="relax"><strong>🌈 Détente</strong><span>100 % aléatoire.</span></button><button class="mode-card" data-difficulty="tactical"><strong>🧠 Tactique</strong><span>Analyse les choix récents.</span></button><button class="mode-card" data-difficulty="expert"><strong>⚡ Expert</strong><span>Analyse les transitions et fréquences.</span></button></div><div class="actions"><button class="primary" id="rpsApplyMode">Appliquer</button><button id="rpsCloseMode">Annuler</button></div></section></div>
    <div class="overlay hidden" id="rpsHelpOverlay"><section class="panel"><small>Comment jouer</small><h2>Simple à apprendre, dur à lire</h2><p>✊ Pierre bat ✌️ Ciseaux · ✋ Papier bat ✊ Pierre · ✌️ Ciseaux battent ✋ Papier.</p><div class="note">Astuce : en Tactique et Expert, varier tes habitudes compte. L’IA choisit son coup à partir de ton historique avant de connaître ton choix actuel.</div><p>Clavier : 1 = Pierre, 2 = Papier, 3 = Ciseaux, P = pause.</p><div class="actions"><button class="primary" id="rpsCloseHelp">Compris</button><button id="rpsHelpPlay">Jouer</button></div></section></div>
    <div class="overlay hidden" id="rpsResult"><section class="panel"><small id="rpsResultSmall">Duel terminé</small><h2 id="rpsResultTitle">Victoire !</h2><p id="rpsResultText"></p><div class="career"><div><span>Victoires</span><strong id="careerWins">0</strong></div><div><span>Défaites</span><strong id="careerLosses">0</strong></div><div><span>Duels gagnés</span><strong id="careerMatches">0</strong></div></div><div class="actions"><button class="primary" id="rpsAgain">Rejouer</button><button id="rpsResultMode">Changer l’IA</button></div></section></div>
  `;

  const playerHand = doc.getElementById('playerHand');
  const cpuHand = doc.getElementById('cpuHand');
  const playerScoreEl = doc.getElementById('playerScore');
  const cpuScoreEl = doc.getElementById('cpuScore');
  const roundEl = doc.getElementById('rpsRound');
  const streakEl = doc.getElementById('rpsStreak');
  const bestEl = doc.getElementById('rpsBest');
  const targetEl = doc.getElementById('rpsTarget');
  const difficultyEl = doc.getElementById('rpsDifficulty');
  const banner = doc.getElementById('rpsBanner');
  const feed = doc.getElementById('rpsFeed');
  const arena = doc.getElementById('rpsArena');
  const intro = doc.getElementById('rpsIntro');
  const pauseOverlay = doc.getElementById('rpsPauseOverlay');
  const modeOverlay = doc.getElementById('rpsModeOverlay');
  const helpOverlay = doc.getElementById('rpsHelpOverlay');
  const resultOverlay = doc.getElementById('rpsResult');
  const soundBtn = doc.getElementById('rpsSound');
  const choiceButtons = [...doc.querySelectorAll('.choice-btn')];

  let playerScore = 0;
  let cpuScore = 0;
  let round = 1;
  let streak = 0;
  let bestStreak = Number(win.localStorage.getItem(BEST_STREAK_KEY) || 0);
  let target = 5;
  let difficulty = 'tactical';
  let pendingDifficulty = difficulty;
  let history = [];
  let outcomes = [];
  let locked = false;
  let paused = false;
  let started = false;
  let soundOn = true;
  let stats = loadStats(win);

  const AudioCtx = win.AudioContext || win.webkitAudioContext;
  let audio = null;

  function tone(freq, duration = 0.06, volume = 0.025, type = 'sine') {
    if (!soundOn || !AudioCtx) return;
    try {
      audio ||= new AudioCtx();
      if (audio.state === 'suspended') audio.resume();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.value = freq;
      gain.gain.setValueAtTime(volume, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
    } catch {}
  }

  function vibrate(pattern) {
    try { win.navigator.vibrate?.(pattern); } catch {}
  }

  function saveStats() {
    try { win.localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {}
  }

  function difficultyLabel(value = difficulty) {
    if (value === 'relax') return 'Détente';
    if (value === 'expert') return 'Expert';
    return 'Tactique';
  }

  function randomChoice() {
    return CHOICE_KEYS[Math.floor(Math.random() * CHOICE_KEYS.length)];
  }

  function mostFrequent(values) {
    if (!values.length) return null;
    const counts = { rock: 0, paper: 0, scissors: 0 };
    values.forEach((choice) => counts[choice]++);
    const max = Math.max(...Object.values(counts));
    const tied = CHOICE_KEYS.filter((choice) => counts[choice] === max);
    return tied[Math.floor(Math.random() * tied.length)];
  }

  function predictPlayerChoice() {
    if (difficulty === 'relax' || history.length < 3) return randomChoice();

    if (difficulty === 'tactical') {
      const recent = history.slice(-8);
      const predicted = mostFrequent(recent) || randomChoice();
      return Math.random() < 0.62 ? predicted : randomChoice();
    }

    const last = history.at(-1);
    const following = [];
    for (let i = 0; i < history.length - 1; i++) {
      if (history[i] === last) following.push(history[i + 1]);
    }
    const transitionPrediction = mostFrequent(following);
    const frequencyPrediction = mostFrequent(history.slice(-12));
    const predicted = transitionPrediction || frequencyPrediction || randomChoice();
    return Math.random() < 0.74 ? predicted : randomChoice();
  }

  function chooseCpu() {
    if (difficulty === 'relax') return randomChoice();
    const prediction = predictPlayerChoice();
    const counter = counterTo(prediction);
    const confidence = difficulty === 'expert' ? 0.78 : 0.66;
    return Math.random() < confidence ? counter : randomChoice();
  }

  function judge(player, cpu) {
    if (player === cpu) return 'draw';
    return CHOICES[player].beats === cpu ? 'win' : 'loss';
  }

  function setChoicesEnabled(enabled) {
    choiceButtons.forEach((button) => { button.disabled = !enabled; });
  }

  function updateHud() {
    roundEl.textContent = String(round);
    streakEl.textContent = String(streak);
    bestEl.textContent = String(bestStreak);
    targetEl.textContent = String(target);
    difficultyEl.textContent = difficultyLabel();
    playerScoreEl.textContent = String(playerScore);
    cpuScoreEl.textContent = String(cpuScore);
  }

  function renderFeed() {
    feed.innerHTML = '';
    outcomes.slice(-7).forEach((outcome) => {
      const dot = doc.createElement('span');
      dot.className = `feed-dot ${outcome}`;
      dot.title = outcome === 'win' ? 'Manche gagnée' : outcome === 'loss' ? 'Manche perdue' : 'Égalité';
      feed.appendChild(dot);
    });
  }

  function resetHands() {
    playerHand.textContent = '❔';
    cpuHand.textContent = '🤖';
    playerHand.classList.remove('reveal');
    cpuHand.classList.remove('reveal');
  }

  function setBanner(text, outcome = '') {
    banner.textContent = text;
    banner.className = `round-banner${outcome ? ` ${outcome}` : ''}`;
  }

  function resetMatch({ keepIntro = true } = {}) {
    playerScore = 0;
    cpuScore = 0;
    round = 1;
    streak = 0;
    history = [];
    outcomes = [];
    locked = false;
    paused = false;
    started = true;
    resetHands();
    setBanner('Choisis ton coup.');
    renderFeed();
    updateHud();
    setChoicesEnabled(true);
    pauseOverlay.classList.add('hidden');
    resultOverlay.classList.add('hidden');
    if (!keepIntro) intro.classList.add('hidden');
  }

  function showResult(playerWon) {
    locked = true;
    setChoicesEnabled(false);
    stats.matches += playerWon ? 1 : 0;
    saveStats();
    doc.getElementById('rpsResultSmall').textContent = playerWon ? 'Arène maîtrisée' : 'Revanche disponible';
    doc.getElementById('rpsResultTitle').textContent = playerWon ? 'Victoire du duel !' : 'L’IA gagne ce duel';
    doc.getElementById('rpsResultText').textContent = playerWon
      ? `Tu remportes le duel ${playerScore} à ${cpuScore}. Meilleure série actuelle : ${bestStreak}.`
      : `Score final : ${playerScore} à ${cpuScore}. Change tes habitudes et tente la revanche.`;
    doc.getElementById('careerWins').textContent = String(stats.wins);
    doc.getElementById('careerLosses').textContent = String(stats.losses);
    doc.getElementById('careerMatches').textContent = String(stats.matches);
    win.setTimeout(() => resultOverlay.classList.remove('hidden'), 520);
  }

  function playRound(playerChoice) {
    if (!started || locked || paused) return;
    locked = true;
    setChoicesEnabled(false);

    const cpuChoice = chooseCpu();
    const outcome = judge(playerChoice, cpuChoice);
    history.push(playerChoice);
    outcomes.push(outcome);

    playerHand.textContent = CHOICES[playerChoice].emoji;
    cpuHand.textContent = CHOICES[cpuChoice].emoji;
    playerHand.classList.remove('reveal');
    cpuHand.classList.remove('reveal');
    void playerHand.offsetWidth;
    playerHand.classList.add('reveal');
    cpuHand.classList.add('reveal');
    arena.classList.remove('shake');

    if (outcome === 'win') {
      playerScore++;
      streak++;
      stats.wins++;
      if (streak > bestStreak) {
        bestStreak = streak;
        try { win.localStorage.setItem(BEST_STREAK_KEY, String(bestStreak)); } catch {}
      }
      setBanner(`${CHOICES[playerChoice].label} bat ${CHOICES[cpuChoice].label} — manche gagnée !`, 'win');
      tone(660, .07, .035, 'triangle');
      win.setTimeout(() => tone(880, .08, .025, 'triangle'), 65);
      vibrate(18);
    } else if (outcome === 'loss') {
      cpuScore++;
      streak = 0;
      stats.losses++;
      setBanner(`${CHOICES[cpuChoice].label} bat ${CHOICES[playerChoice].label} — point à l’IA.`, 'loss');
      tone(190, .13, .03, 'sawtooth');
      arena.classList.add('shake');
      vibrate([20, 35, 20]);
    } else {
      stats.draws++;
      setBanner(`Égalité : ${CHOICES[playerChoice].label} contre ${CHOICES[cpuChoice].label}.`, 'draw');
      tone(420, .05, .02, 'square');
    }
    saveStats();
    renderFeed();
    updateHud();

    if (playerScore >= target || cpuScore >= target) {
      showResult(playerScore > cpuScore);
      return;
    }

    round++;
    updateHud();
    win.setTimeout(() => {
      if (paused) return;
      locked = false;
      setChoicesEnabled(true);
      if (playerScore === target - 1 && cpuScore === target - 1) setBanner('⚡ Balle de match des deux côtés !');
      else if (playerScore === target - 1) setBanner('🔥 Une manche de la victoire !');
      else if (cpuScore === target - 1) setBanner('🚨 L’IA est à une manche du duel.');
      else setBanner('À toi de jouer.');
    }, 620);
  }

  function setDifficulty(value, restart = true) {
    difficulty = value;
    pendingDifficulty = value;
    doc.querySelectorAll('[data-difficulty]').forEach((button) => button.classList.toggle('active', button.dataset.difficulty === value));
    updateHud();
    if (restart && started) resetMatch({ keepIntro: false });
  }

  choiceButtons.forEach((button) => button.addEventListener('click', () => playRound(button.dataset.choice)));

  doc.querySelectorAll('#rpsIntroModes [data-difficulty]').forEach((button) => button.addEventListener('click', () => {
    pendingDifficulty = button.dataset.difficulty;
    doc.querySelectorAll('#rpsIntroModes [data-difficulty]').forEach((candidate) => candidate.classList.toggle('active', candidate === button));
  }));

  doc.querySelectorAll('#rpsModeModes [data-difficulty]').forEach((button) => button.addEventListener('click', () => {
    pendingDifficulty = button.dataset.difficulty;
    doc.querySelectorAll('#rpsModeModes [data-difficulty]').forEach((candidate) => candidate.classList.toggle('active', candidate === button));
  }));

  doc.getElementById('rpsStart').addEventListener('click', () => {
    difficulty = pendingDifficulty;
    target = 5;
    intro.classList.add('hidden');
    resetMatch({ keepIntro: false });
  });
  doc.getElementById('rpsShort').addEventListener('click', () => {
    difficulty = pendingDifficulty;
    target = 3;
    intro.classList.add('hidden');
    resetMatch({ keepIntro: false });
  });
  doc.getElementById('rpsRestart').addEventListener('click', () => resetMatch({ keepIntro: false }));
  doc.getElementById('rpsPauseRestart').addEventListener('click', () => resetMatch({ keepIntro: false }));
  doc.getElementById('rpsAgain').addEventListener('click', () => resetMatch({ keepIntro: false }));

  doc.getElementById('rpsPause').addEventListener('click', () => {
    if (!started || resultOverlay.classList.contains('hidden') === false) return;
    paused = true;
    setChoicesEnabled(false);
    pauseOverlay.classList.remove('hidden');
  });
  doc.getElementById('rpsResume').addEventListener('click', () => {
    paused = false;
    pauseOverlay.classList.add('hidden');
    if (!locked) setChoicesEnabled(true);
  });

  doc.getElementById('rpsMode').addEventListener('click', () => {
    pendingDifficulty = difficulty;
    doc.querySelectorAll('#rpsModeModes [data-difficulty]').forEach((button) => button.classList.toggle('active', button.dataset.difficulty === difficulty));
    modeOverlay.classList.remove('hidden');
  });
  doc.getElementById('rpsCloseMode').addEventListener('click', () => modeOverlay.classList.add('hidden'));
  doc.getElementById('rpsApplyMode').addEventListener('click', () => {
    modeOverlay.classList.add('hidden');
    setDifficulty(pendingDifficulty, true);
  });
  doc.getElementById('rpsResultMode').addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
    pendingDifficulty = difficulty;
    doc.querySelectorAll('#rpsModeModes [data-difficulty]').forEach((button) => button.classList.toggle('active', button.dataset.difficulty === difficulty));
    modeOverlay.classList.remove('hidden');
  });

  doc.getElementById('rpsHelp').addEventListener('click', () => helpOverlay.classList.remove('hidden'));
  doc.getElementById('rpsCloseHelp').addEventListener('click', () => helpOverlay.classList.add('hidden'));
  doc.getElementById('rpsHelpPlay').addEventListener('click', () => helpOverlay.classList.add('hidden'));

  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.textContent = soundOn ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-label', soundOn ? 'Désactiver le son' : 'Activer le son');
    if (soundOn) tone(620, .05, .02);
  });

  doc.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (event.key === '1') playRound('rock');
    else if (event.key === '2') playRound('paper');
    else if (event.key === '3') playRound('scissors');
    else if (event.key.toLowerCase() === 'p' && started) {
      if (paused) doc.getElementById('rpsResume').click();
      else doc.getElementById('rpsPause').click();
    }
  });

  bestEl.textContent = String(bestStreak);
  updateHud();
  renderFeed();
}
