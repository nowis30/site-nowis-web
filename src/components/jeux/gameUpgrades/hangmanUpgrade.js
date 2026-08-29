const STATS_KEY = 'nowis:hangman:stats';
const SETTINGS_KEY = 'nowis:hangman:settings';

const MODES = {
  relax: { label: 'Détente', mistakes: 8, scoreBonus: 0, minLength: 4, description: '8 erreurs permises et mots plus accessibles.' },
  classic: { label: 'Classique', mistakes: 6, scoreBonus: 250, minLength: 5, description: '6 erreurs permises, le vrai défi du pendu.' },
  expert: { label: 'Expert', mistakes: 5, scoreBonus: 500, minLength: 7, description: '5 erreurs seulement et mots plus corsés.' },
};

const WORDS = [
  { word: 'ABEILLE', category: 'Animaux', clue: 'Elle fabrique du miel et vit en colonie.' },
  { word: 'ALBATROS', category: 'Animaux', clue: 'Grand oiseau marin aux ailes impressionnantes.' },
  { word: 'BISON', category: 'Animaux', clue: 'Grand bovidé robuste des plaines.' },
  { word: 'CHOUETTE', category: 'Animaux', clue: 'Oiseau nocturne réputé pour ses grands yeux.' },
  { word: 'DAUPHIN', category: 'Animaux', clue: 'Mammifère marin très sociable.' },
  { word: 'ECUREUIL', category: 'Animaux', clue: 'Petit grimpeur qui cache souvent des noix.' },
  { word: 'HERISSON', category: 'Animaux', clue: 'Petit mammifère couvert de piquants.' },
  { word: 'LIBELLULE', category: 'Animaux', clue: 'Insecte rapide que l’on voit près de l’eau.' },
  { word: 'PANTHERE', category: 'Animaux', clue: 'Grand félin souple et discret.' },
  { word: 'RENARD', category: 'Animaux', clue: 'Canidé roux connu pour sa ruse.' },
  { word: 'ASTRONAUTE', category: 'Métiers', clue: 'Travaille au-delà de l’atmosphère terrestre.' },
  { word: 'BOULANGER', category: 'Métiers', clue: 'Prépare pains, baguettes et viennoiseries.' },
  { word: 'CHARPENTIER', category: 'Métiers', clue: 'Assemble des structures, souvent en bois.' },
  { word: 'DENTISTE', category: 'Métiers', clue: 'Soigne les dents et la bouche.' },
  { word: 'INFIRMIER', category: 'Métiers', clue: 'Prodigue des soins aux patients.' },
  { word: 'JOURNALISTE', category: 'Métiers', clue: 'Recherche et transmet de l’information.' },
  { word: 'MUSICIEN', category: 'Métiers', clue: 'Interprète ou compose de la musique.' },
  { word: 'POMPIER', category: 'Métiers', clue: 'Intervient lors d’incendies et de sauvetages.' },
  { word: 'ARCHIPEL', category: 'Géographie', clue: 'Ensemble d’îles proches les unes des autres.' },
  { word: 'AVALANCHE', category: 'Géographie', clue: 'Masse de neige qui dévale une pente.' },
  { word: 'CASCADE', category: 'Géographie', clue: 'Chute d’eau naturelle.' },
  { word: 'DESERT', category: 'Géographie', clue: 'Région très sèche où les précipitations sont rares.' },
  { word: 'FJORD', category: 'Géographie', clue: 'Bras de mer encaissé entre des montagnes.' },
  { word: 'GLACIER', category: 'Géographie', clue: 'Immense masse de glace qui se déplace lentement.' },
  { word: 'HORIZON', category: 'Géographie', clue: 'Ligne apparente où le ciel semble rejoindre la terre.' },
  { word: 'PENINSULE', category: 'Géographie', clue: 'Terre entourée d’eau sur presque tous ses côtés.' },
  { word: 'VOLCAN', category: 'Géographie', clue: 'Relief pouvant projeter lave, gaz et cendres.' },
  { word: 'BOUSSOLE', category: 'Objets', clue: 'Indique le nord et aide à s’orienter.' },
  { word: 'CASQUE', category: 'Objets', clue: 'Protège la tête.' },
  { word: 'HORLOGE', category: 'Objets', clue: 'Affiche l’heure.' },
  { word: 'LANTERNE', category: 'Objets', clue: 'Source de lumière que l’on peut transporter.' },
  { word: 'PARAPLUIE', category: 'Objets', clue: 'Se déploie pour nous protéger de la pluie.' },
  { word: 'TELESCOPE', category: 'Objets', clue: 'Permet d’observer des objets célestes lointains.' },
  { word: 'THERMOMETRE', category: 'Objets', clue: 'Mesure une température.' },
  { word: 'TOURNEVIS', category: 'Objets', clue: 'Outil servant à serrer ou desserrer des vis.' },
  { word: 'ACCORDEON', category: 'Musique', clue: 'Instrument à soufflet et à touches.' },
  { word: 'BATTERIE', category: 'Musique', clue: 'Ensemble de percussions joué avec des baguettes.' },
  { word: 'GUITARE', category: 'Musique', clue: 'Instrument à cordes très répandu.' },
  { word: 'MELODIE', category: 'Musique', clue: 'Suite de notes que l’on peut fredonner.' },
  { word: 'ORCHESTRE', category: 'Musique', clue: 'Grand ensemble de musiciens.' },
  { word: 'RYTHME', category: 'Musique', clue: 'Organisation des durées et des accents en musique.' },
  { word: 'TROMPETTE', category: 'Musique', clue: 'Instrument à vent en cuivre.' },
  { word: 'ALGORITHME', category: 'Technologie', clue: 'Suite d’étapes permettant de résoudre un problème.' },
  { word: 'CLAVIER', category: 'Technologie', clue: 'Périphérique rempli de touches.' },
  { word: 'DONNEES', category: 'Technologie', clue: 'Informations exploitées par un système informatique.' },
  { word: 'INTERNET', category: 'Technologie', clue: 'Réseau mondial reliant des milliards d’appareils.' },
  { word: 'LOGICIEL', category: 'Technologie', clue: 'Programme ou ensemble de programmes informatiques.' },
  { word: 'ROBOTIQUE', category: 'Technologie', clue: 'Domaine consacré à la conception de robots.' },
  { word: 'SERVEUR', category: 'Technologie', clue: 'Machine ou service qui répond à des clients réseau.' },
  { word: 'CANNELLE', category: 'Cuisine', clue: 'Épice brune au parfum chaud et sucré.' },
  { word: 'CHOCOLAT', category: 'Cuisine', clue: 'Douceur fabriquée à partir de cacao.' },
  { word: 'CROISSANT', category: 'Cuisine', clue: 'Viennoiserie feuilletée en forme de lune.' },
  { word: 'FROMAGE', category: 'Cuisine', clue: 'Aliment obtenu par transformation du lait.' },
  { word: 'PAPRIKA', category: 'Cuisine', clue: 'Épice rouge issue de poivrons séchés.' },
  { word: 'RATATOUILLE', category: 'Cuisine', clue: 'Plat de légumes mijotés du sud de la France.' },
  { word: 'VANILLE', category: 'Cuisine', clue: 'Arôme provenant d’une gousse très parfumée.' },
  { word: 'AURORE', category: 'Nature', clue: 'Première lumière du jour avant le lever du soleil.' },
  { word: 'BRUME', category: 'Nature', clue: 'Brouillard léger près du sol.' },
  { word: 'CONSTELLATION', category: 'Nature', clue: 'Groupe apparent d’étoiles formant une figure.' },
  { word: 'ECLIPSE', category: 'Nature', clue: 'Un astre en cache temporairement un autre.' },
  { word: 'FOUDRE', category: 'Nature', clue: 'Décharge électrique spectaculaire pendant un orage.' },
  { word: 'MANGROVE', category: 'Nature', clue: 'Forêt tropicale installée sur un littoral marécageux.' },
  { word: 'SEQUOIA', category: 'Nature', clue: 'Arbre géant pouvant vivre très longtemps.' },
  { word: 'TOURBILLON', category: 'Nature', clue: 'Mouvement rapide qui tourne autour d’un centre.' },
];

const KEY_ROWS = ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'];
const BODY_PARTS = ['head', 'body', 'armLeft', 'armRight', 'legLeft', 'legRight'];

function normalize(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function readJson(storage, key, fallback) {
  try {
    const parsed = JSON.parse(storage.getItem(key) || 'null');
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Le stockage peut être désactivé en navigation privée.
  }
}

function defaultStats() {
  return { games: 0, wins: 0, currentStreak: 0, bestStreak: 0, bestScore: 0, totalScore: 0 };
}

function defaultSettings() {
  return { sound: true, vibration: true, mode: 'classic' };
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}

function chooseWord(modeKey, level, previousWord) {
  const mode = MODES[modeKey] || MODES.classic;
  const levelBonus = Math.min(4, Math.floor((level - 1) / 2));
  const minLength = Math.min(10, mode.minLength + levelBonus);
  let candidates = WORDS.filter((entry) => normalize(entry.word).replace(/[^A-Z]/g, '').length >= minLength && entry.word !== previousWord);
  if (candidates.length < 6) candidates = WORDS.filter((entry) => entry.word !== previousWord);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function revealedWord(word, guessed, revealAll) {
  return [...word].map((char) => {
    const letter = normalize(char).replace(/[^A-Z]/g, '');
    if (!letter) return `<span class="hm-sep">${char}</span>`;
    const visible = revealAll || guessed.has(letter);
    return `<span class="hm-letter ${visible ? 'is-open' : ''}">${visible ? char : '•'}</span>`;
  }).join('');
}

function scoreRound(modeKey, mistakes, hints, elapsedMs, streak) {
  const mode = MODES[modeKey] || MODES.classic;
  const speedBonus = Math.max(0, 360 - Math.floor(elapsedMs / 1000));
  const accuracy = Math.max(0, 650 - mistakes * 95 - hints * 180);
  const streakBonus = Math.min(5, Math.max(1, streak)) * 90;
  return Math.max(100, 500 + mode.scoreBonus + accuracy + speedBonus + streakBonus);
}

function audioBeep(win, frequency, duration, gainValue) {
  const AudioCtor = win.AudioContext || win.webkitAudioContext;
  if (!AudioCtor) return;
  try {
    const ctx = new AudioCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(gainValue, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
    oscillator.addEventListener('ended', () => ctx.close().catch(() => {}), { once: true });
  } catch {
    // Le son reste un bonus; le jeu ne doit jamais en dépendre.
  }
}

export function upgradeHangman(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisHangmanPro === 'true') return;
  root.dataset.nowisHangmanPro = 'true';
  root.lang = 'fr';
  doc.title = 'Le Pendu NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"], script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    :root { color-scheme:dark; font-family:Inter,ui-rounded,system-ui,-apple-system,"Segoe UI",sans-serif; }
    * { box-sizing:border-box; }
    html,body { width:100%; min-height:100%; margin:0; background:#07131f; color:#f8fafc; }
    body { min-height:100dvh; overflow-x:hidden; user-select:none; -webkit-tap-highlight-color:transparent; }
    button { font:inherit; }
    .hm-app { min-height:100dvh; display:flex; flex-direction:column; align-items:center; gap:8px; padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left)); background:radial-gradient(circle at 10% 0%,rgba(251,191,36,.15),transparent 31%),radial-gradient(circle at 95% 18%,rgba(45,212,191,.14),transparent 29%),radial-gradient(circle at 45% 100%,rgba(244,63,94,.12),transparent 34%),linear-gradient(180deg,#091827,#07131f 60%,#050b12); }
    .hm-head,.hm-hud,.hm-stage,.hm-word-card,.hm-keyboard,.hm-toolbar,.hm-message { width:min(100%,600px); }
    .hm-head { display:flex; align-items:center; justify-content:space-between; gap:9px; }
    .hm-brand small { display:block; color:#fbbf24; font-size:10px; font-weight:950; letter-spacing:.18em; text-transform:uppercase; }
    .hm-brand h1 { margin:2px 0 0; font-size:clamp(27px,8vw,43px); line-height:.94; letter-spacing:-.06em; background:linear-gradient(95deg,#fcd34d,#fb7185 50%,#5eead4); -webkit-background-clip:text; color:transparent; filter:drop-shadow(0 0 18px rgba(251,191,36,.10)); }
    .hm-actions { display:flex; gap:5px; }
    .hm-actions button,.hm-toolbar button,.hm-key,.hm-mode,.hm-modal button { min-height:44px; border:1px solid rgba(148,163,184,.25); border-radius:13px; background:rgba(15,29,44,.9); color:#f8fafc; font-weight:900; cursor:pointer; touch-action:manipulation; }
    .hm-actions button { min-width:44px; padding:0 10px; }
    button:focus-visible { outline:3px solid #fcd34d; outline-offset:2px; }
    button:active { transform:translateY(1px) scale(.98); }
    .hm-hud { display:grid; grid-template-columns:repeat(5,1fr); gap:5px; }
    .hm-stat { min-width:0; padding:6px 3px; border:1px solid rgba(251,191,36,.14); border-radius:11px; background:rgba(15,29,44,.68); text-align:center; box-shadow:inset 0 1px rgba(255,255,255,.03); }
    .hm-stat span { display:block; color:#9fb0c2; font-size:8px; font-weight:950; letter-spacing:.05em; text-transform:uppercase; white-space:nowrap; }
    .hm-stat strong { display:block; margin-top:2px; overflow:hidden; font-size:clamp(12px,3.5vw,17px); white-space:nowrap; text-overflow:ellipsis; }
    .hm-stage { position:relative; display:grid; grid-template-columns:minmax(145px,.86fr) minmax(0,1.14fr); gap:8px; min-height:188px; padding:9px; overflow:hidden; border:1px solid rgba(94,234,212,.16); border-radius:22px; background:linear-gradient(145deg,rgba(13,31,46,.96),rgba(10,23,36,.96)); box-shadow:0 20px 55px rgba(0,0,0,.36),inset 0 1px rgba(255,255,255,.03); }
    .hm-stage::before { content:""; position:absolute; inset:auto -12% -45% 35%; height:75%; background:radial-gradient(ellipse,rgba(45,212,191,.13),transparent 68%); pointer-events:none; }
    .hm-scene { display:flex; align-items:center; justify-content:center; min-width:0; border-radius:17px; background:linear-gradient(180deg,rgba(5,11,18,.28),rgba(251,191,36,.035)); }
    .hm-scene svg { width:100%; max-width:225px; height:172px; overflow:visible; filter:drop-shadow(0 12px 18px rgba(0,0,0,.4)); }
    .hm-frame { stroke:#c28c50; stroke-width:8; stroke-linecap:round; fill:none; }
    .hm-rope { stroke:#f7d38b; stroke-width:4; stroke-linecap:round; fill:none; }
    .hm-person { stroke:#fb7185; stroke-width:7; stroke-linecap:round; fill:none; transition:opacity .24s ease,transform .24s ease; transform-origin:center; }
    .hm-person.head { fill:rgba(251,113,133,.12); }
    .hm-person.is-hidden { opacity:0; transform:scale(.7); }
    .hm-info { position:relative; z-index:1; display:flex; flex-direction:column; justify-content:center; min-width:0; padding:5px; }
    .hm-kicker { margin:0 0 3px; color:#5eead4; font-size:10px; font-weight:950; letter-spacing:.13em; text-transform:uppercase; }
    .hm-info h2 { margin:0; color:#fff3c4; font-size:clamp(18px,5.4vw,27px); line-height:1.05; letter-spacing:-.035em; }
    .hm-clue { margin:7px 0 0; color:#cbd5e1; font-size:clamp(11px,3vw,13px); line-height:1.4; }
    .hm-danger { margin-top:10px; }
    .hm-danger-row { display:flex; align-items:center; justify-content:space-between; gap:8px; color:#b8c6d5; font-size:10px; font-weight:850; }
    .hm-track { height:8px; margin-top:5px; overflow:hidden; border-radius:999px; background:#172637; box-shadow:inset 0 1px 4px rgba(0,0,0,.5); }
    .hm-track i { display:block; width:0; height:100%; border-radius:inherit; background:linear-gradient(90deg,#5eead4,#fbbf24 56%,#fb7185); transition:width .25s ease; }
    .hm-word-card { padding:9px; border:1px solid rgba(251,191,36,.16); border-radius:18px; background:rgba(15,29,44,.72); box-shadow:inset 0 1px rgba(255,255,255,.025); }
    .hm-word { display:flex; flex-wrap:wrap; justify-content:center; gap:clamp(3px,1.3vw,7px); min-height:49px; align-items:center; }
    .hm-letter { display:flex; align-items:center; justify-content:center; min-width:clamp(28px,8vw,42px); height:clamp(39px,10vw,50px); border-bottom:3px solid #64748b; border-radius:8px 8px 3px 3px; background:linear-gradient(180deg,rgba(30,49,68,.66),rgba(17,32,47,.72)); color:transparent; font-size:clamp(19px,6vw,29px); font-weight:1000; text-transform:uppercase; text-shadow:none; }
    .hm-letter.is-open { border-color:#fbbf24; color:#fff7d6; text-shadow:0 2px 9px rgba(251,191,36,.18); animation:hm-open .22s ease-out; }
    .hm-sep { display:flex; align-items:center; justify-content:center; min-width:10px; color:#94a3b8; font-weight:900; }
    .hm-wrongs { margin-top:6px; color:#94a3b8; font-size:10px; font-weight:800; text-align:center; }
    .hm-wrongs strong { color:#fda4af; letter-spacing:.16em; }
    .hm-message { min-height:31px; display:flex; align-items:center; justify-content:center; padding:5px 10px; border:1px solid rgba(148,163,184,.14); border-radius:12px; background:rgba(15,29,44,.52); color:#dbeafe; font-size:11px; font-weight:850; text-align:center; }
    .hm-message.good { color:#a7f3d0; border-color:rgba(45,212,191,.28); background:rgba(13,148,136,.1); }
    .hm-message.warn { color:#fde68a; border-color:rgba(251,191,36,.27); background:rgba(180,83,9,.1); }
    .hm-message.bad { color:#fecdd3; border-color:rgba(251,113,133,.28); background:rgba(190,18,60,.1); }
    .hm-keyboard { display:grid; gap:5px; }
    .hm-key-row { display:flex; justify-content:center; gap:4px; }
    .hm-key { flex:1 1 0; min-width:0; padding:0 2px; border-radius:9px; background:linear-gradient(180deg,#263a4f,#18283b); font-size:clamp(12px,3.6vw,17px); box-shadow:0 3px 0 rgba(2,6,23,.45); }
    .hm-key.good { border-color:#2dd4bf; background:linear-gradient(180deg,#0f766e,#115e59); color:#ccfbf1; }
    .hm-key.bad { border-color:#fb7185; background:linear-gradient(180deg,#9f1239,#881337); color:#ffe4e6; opacity:.72; }
    .hm-key:disabled { cursor:default; }
    .hm-toolbar { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; }
    .hm-toolbar button { padding:6px 4px; color:#dce8f3; font-size:11px; }
    .hm-toolbar button.primary { border-color:rgba(94,234,212,.45); background:linear-gradient(180deg,rgba(13,148,136,.34),rgba(15,118,110,.22)); color:#ccfbf1; }
    .hm-overlay { position:fixed; inset:0; z-index:100; display:flex; align-items:center; justify-content:center; padding:18px; background:rgba(2,8,14,.82); backdrop-filter:blur(13px); }
    .hm-overlay.is-hidden { display:none; }
    .hm-modal { width:min(100%,430px); max-height:min(88dvh,690px); overflow:auto; padding:20px; border:1px solid rgba(251,191,36,.22); border-radius:23px; background:linear-gradient(155deg,#102538,#091827); box-shadow:0 30px 80px rgba(0,0,0,.58); }
    .hm-modal h2 { margin:0; font-size:27px; letter-spacing:-.04em; }
    .hm-modal p { color:#cbd5e1; font-size:13px; line-height:1.5; }
    .hm-mode-list { display:grid; gap:8px; margin:14px 0; }
    .hm-mode { width:100%; padding:12px; text-align:left; }
    .hm-mode strong { display:block; color:#fff6cf; }
    .hm-mode span { display:block; margin-top:3px; color:#a8b6c5; font-size:11px; line-height:1.35; }
    .hm-mode.is-active { border-color:#fbbf24; background:linear-gradient(110deg,rgba(180,83,9,.22),rgba(13,148,136,.12)); box-shadow:0 0 0 1px rgba(251,191,36,.12); }
    .hm-modal-actions { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:14px; }
    .hm-modal button { padding:10px; }
    .hm-modal .primary { border-color:#fbbf24; background:linear-gradient(180deg,#d97706,#b45309); color:#fff7d6; }
    .hm-help-list { margin:12px 0; padding-left:19px; color:#cbd5e1; font-size:12px; line-height:1.55; }
    .hm-toggles { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-top:12px; }
    .hm-toggles button[aria-pressed="true"] { border-color:#2dd4bf; color:#ccfbf1; background:rgba(13,148,136,.16); }
    @keyframes hm-open { 50% { transform:translateY(-4px) scale(1.06); } }
    @keyframes hm-win { 40% { transform:translateY(-5px); filter:brightness(1.18); } }
    .hm-app.is-win .hm-stage,.hm-app.is-win .hm-word-card { animation:hm-win .55s ease; }
    @media (max-width:390px) {
      .hm-app { gap:6px; }
      .hm-stage { grid-template-columns:132px minmax(0,1fr); min-height:170px; padding:7px; }
      .hm-scene svg { height:153px; }
      .hm-info { padding:2px; }
      .hm-clue { font-size:10px; }
      .hm-letter { min-width:26px; height:37px; }
      .hm-toolbar button { font-size:10px; }
    }
    @media (max-height:700px) and (orientation:landscape) {
      .hm-app { display:grid; grid-template-columns:minmax(330px,1.05fr) minmax(300px,.95fr); grid-template-rows:auto auto 1fr auto; align-items:start; max-width:1060px; margin:auto; }
      .hm-head,.hm-hud { grid-column:1 / -1; width:100%; }
      .hm-stage { grid-column:1; grid-row:3; width:100%; }
      .hm-word-card,.hm-message,.hm-keyboard,.hm-toolbar { grid-column:2; width:100%; }
      .hm-word-card { grid-row:3; }
      .hm-message { grid-row:4; align-self:start; }
      .hm-keyboard { grid-row:3; margin-top:116px; }
      .hm-toolbar { grid-row:4; margin-top:39px; }
    }
    @media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; scroll-behavior:auto !important; } }
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `
    <main class="hm-app" id="hmApp">
      <header class="hm-head">
        <div class="hm-brand"><small>Défi de lettres NOWIS</small><h1>Le Pendu</h1></div>
        <div class="hm-actions">
          <button id="hmPause" type="button" aria-label="Mettre le jeu en pause">Ⅱ</button>
          <button id="hmHelp" type="button" aria-label="Afficher l’aide">?</button>
        </div>
      </header>

      <section class="hm-hud" aria-label="Statistiques de la partie">
        <div class="hm-stat"><span>Score</span><strong id="hmScore">0</strong></div>
        <div class="hm-stat"><span>Record</span><strong id="hmBest">0</strong></div>
        <div class="hm-stat"><span>Série</span><strong id="hmStreak">0</strong></div>
        <div class="hm-stat"><span>Niveau</span><strong id="hmLevel">1</strong></div>
        <div class="hm-stat"><span>Temps</span><strong id="hmTimer">0:00</strong></div>
      </section>

      <section class="hm-stage" aria-label="Progression du pendu">
        <div class="hm-scene" aria-hidden="true">
          <svg viewBox="0 0 220 190" role="img">
            <path class="hm-frame" d="M25 174 H188 M53 174 V18 H160 M53 40 L78 18 M160 18 V42" />
            <path class="hm-rope" d="M160 42 V60" />
            <circle id="hmPart-head" class="hm-person head is-hidden" cx="160" cy="76" r="16" />
            <path id="hmPart-body" class="hm-person is-hidden" d="M160 92 V132" />
            <path id="hmPart-armLeft" class="hm-person is-hidden" d="M160 105 L138 119" />
            <path id="hmPart-armRight" class="hm-person is-hidden" d="M160 105 L182 119" />
            <path id="hmPart-legLeft" class="hm-person is-hidden" d="M160 132 L142 158" />
            <path id="hmPart-legRight" class="hm-person is-hidden" d="M160 132 L178 158" />
          </svg>
        </div>
        <div class="hm-info">
          <p class="hm-kicker" id="hmModeLabel">Classique · Niveau 1</p>
          <h2 id="hmCategory">Catégorie</h2>
          <p class="hm-clue" id="hmClue">Un indice apparaîtra ici.</p>
          <div class="hm-danger">
            <div class="hm-danger-row"><span>Erreurs</span><strong id="hmLives">0 / 6</strong></div>
            <div class="hm-track"><i id="hmDangerFill"></i></div>
          </div>
        </div>
      </section>

      <section class="hm-word-card" aria-label="Mot à découvrir">
        <div class="hm-word" id="hmWord" aria-live="polite"></div>
        <div class="hm-wrongs">Lettres ratées : <strong id="hmWrongs">—</strong></div>
      </section>

      <div class="hm-message" id="hmMessage" role="status" aria-live="polite">Choisis une lettre pour commencer.</div>
      <section class="hm-keyboard" id="hmKeyboard" aria-label="Clavier de lettres"></section>

      <nav class="hm-toolbar" aria-label="Commandes du jeu">
        <button id="hmHint" type="button">💡 Indice</button>
        <button id="hmReplay" type="button" class="primary">↻ Rejouer</button>
        <button id="hmMode" type="button">⚙ Mode</button>
        <button id="hmStats" type="button">★ Stats</button>
      </nav>
    </main>

    <div class="hm-overlay is-hidden" id="hmOverlay" role="dialog" aria-modal="true" aria-labelledby="hmModalTitle">
      <section class="hm-modal" id="hmModal"></section>
    </div>
  `;

  const storage = win.localStorage;
  const stats = { ...defaultStats(), ...readJson(storage, STATS_KEY, defaultStats()) };
  const settings = { ...defaultSettings(), ...readJson(storage, SETTINGS_KEY, defaultSettings()) };
  if (!MODES[settings.mode]) settings.mode = 'classic';

  const app = doc.getElementById('hmApp');
  const wordEl = doc.getElementById('hmWord');
  const keyboardEl = doc.getElementById('hmKeyboard');
  const messageEl = doc.getElementById('hmMessage');
  const scoreEl = doc.getElementById('hmScore');
  const bestEl = doc.getElementById('hmBest');
  const streakEl = doc.getElementById('hmStreak');
  const levelEl = doc.getElementById('hmLevel');
  const timerEl = doc.getElementById('hmTimer');
  const modeLabelEl = doc.getElementById('hmModeLabel');
  const categoryEl = doc.getElementById('hmCategory');
  const clueEl = doc.getElementById('hmClue');
  const livesEl = doc.getElementById('hmLives');
  const dangerFillEl = doc.getElementById('hmDangerFill');
  const wrongsEl = doc.getElementById('hmWrongs');
  const overlayEl = doc.getElementById('hmOverlay');
  const modalEl = doc.getElementById('hmModal');
  const pauseButton = doc.getElementById('hmPause');

  let current = null;
  let guessed = new Set();
  let wrongLetters = [];
  let mistakes = 0;
  let hints = 0;
  let score = 0;
  let level = 1;
  let roundFinished = false;
  let paused = false;
  let startedAt = win.performance.now();
  let pausedAt = 0;
  let pausedDuration = 0;
  let lastWord = '';
  let timerHandle = 0;

  function vibrate(pattern) {
    if (!settings.vibration || typeof win.navigator.vibrate !== 'function') return;
    win.navigator.vibrate(pattern);
  }

  function sound(kind) {
    if (!settings.sound) return;
    if (kind === 'good') audioBeep(win, 620, 0.09, 0.045);
    if (kind === 'bad') audioBeep(win, 180, 0.12, 0.05);
    if (kind === 'win') {
      audioBeep(win, 523, 0.11, 0.04);
      win.setTimeout(() => audioBeep(win, 659, 0.11, 0.04), 105);
      win.setTimeout(() => audioBeep(win, 784, 0.17, 0.045), 210);
    }
    if (kind === 'lose') audioBeep(win, 150, 0.28, 0.05);
  }

  function elapsedMs() {
    const end = paused ? pausedAt : win.performance.now();
    return Math.max(0, end - startedAt - pausedDuration);
  }

  function setMessage(text, tone = '') {
    messageEl.textContent = text;
    messageEl.className = `hm-message${tone ? ` ${tone}` : ''}`;
  }

  function isSolved() {
    return [...normalize(current.word)].every((char) => !/[A-Z]/.test(char) || guessed.has(char));
  }

  function updateBody() {
    const maxMistakes = MODES[settings.mode].mistakes;
    const visibleCount = mistakes === 0 ? 0 : Math.ceil((mistakes / maxMistakes) * BODY_PARTS.length);
    BODY_PARTS.forEach((part, index) => {
      const node = doc.getElementById(`hmPart-${part}`);
      node.classList.toggle('is-hidden', index >= visibleCount);
    });
    livesEl.textContent = `${mistakes} / ${maxMistakes}`;
    dangerFillEl.style.width = `${Math.min(100, (mistakes / maxMistakes) * 100)}%`;
  }

  function updateKeyboard() {
    keyboardEl.querySelectorAll('.hm-key').forEach((button) => {
      const letter = button.dataset.letter;
      const used = guessed.has(letter);
      button.disabled = used || roundFinished || paused;
      button.classList.toggle('good', used && normalize(current.word).includes(letter));
      button.classList.toggle('bad', used && !normalize(current.word).includes(letter));
      button.setAttribute('aria-pressed', used ? 'true' : 'false');
    });
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    bestEl.textContent = String(stats.bestScore || 0);
    streakEl.textContent = String(stats.currentStreak || 0);
    levelEl.textContent = String(level);
    modeLabelEl.textContent = `${MODES[settings.mode].label} · Niveau ${level}`;
    wrongsEl.textContent = wrongLetters.length ? wrongLetters.join(' · ') : '—';
    timerEl.textContent = formatTime(elapsedMs());
  }

  function renderWord(revealAll = false) {
    wordEl.innerHTML = revealedWord(current.word, guessed, revealAll);
    const spoken = revealAll
      ? `Le mot était ${current.word}`
      : [...current.word].map((char) => {
        const letter = normalize(char).replace(/[^A-Z]/g, '');
        return !letter || guessed.has(letter) ? char : 'blanc';
      }).join(' ');
    wordEl.setAttribute('aria-label', spoken);
  }

  function render() {
    categoryEl.textContent = current.category;
    clueEl.textContent = current.clue;
    renderWord(roundFinished && mistakes >= MODES[settings.mode].mistakes);
    updateBody();
    updateKeyboard();
    updateHud();
  }

  function endRound(won) {
    if (roundFinished) return;
    roundFinished = true;
    stats.games += 1;

    if (won) {
      stats.wins += 1;
      stats.currentStreak += 1;
      stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
      score = scoreRound(settings.mode, mistakes, hints, elapsedMs(), stats.currentStreak);
      stats.totalScore += score;
      stats.bestScore = Math.max(stats.bestScore, score);
      level = Math.min(9, level + 1);
      app.classList.add('is-win');
      setMessage(`Bravo ! ${current.word} trouvé — ${score} points.`, 'good');
      sound('win');
      vibrate([35, 35, 70]);
    } else {
      stats.currentStreak = 0;
      level = Math.max(1, level - 1);
      setMessage(`Partie terminée. Le mot était ${current.word}.`, 'bad');
      sound('lose');
      vibrate([90, 45, 90]);
    }

    writeJson(storage, STATS_KEY, stats);
    render();
  }

  function guess(letter, fromHint = false) {
    if (!current || roundFinished || paused) return;
    const clean = normalize(letter).replace(/[^A-Z]/g, '').slice(0, 1);
    if (!clean || guessed.has(clean)) return;

    guessed.add(clean);
    const hit = normalize(current.word).includes(clean);
    if (hit) {
      setMessage(fromHint ? `Indice : la lettre ${clean} est dévoilée.` : `Bien vu : ${clean} est dans le mot.`, 'good');
      sound('good');
      vibrate(20);
    } else {
      mistakes += 1;
      wrongLetters.push(clean);
      setMessage(`${clean} n’est pas dans le mot.`, mistakes + 1 >= MODES[settings.mode].mistakes ? 'bad' : 'warn');
      sound('bad');
      vibrate(45);
    }

    render();
    if (isSolved()) endRound(true);
    else if (mistakes >= MODES[settings.mode].mistakes) endRound(false);
  }

  function useHint() {
    if (!current || roundFinished || paused) return;
    const unknown = [...new Set([...normalize(current.word)].filter((char) => /[A-Z]/.test(char) && !guessed.has(char)))];
    if (unknown.length <= 1) {
      setMessage('Il ne reste qu’une lettre à trouver : à toi de jouer !', 'warn');
      return;
    }
    hints += 1;
    const letter = unknown[Math.floor(Math.random() * unknown.length)];
    guess(letter, true);
  }

  function newRound(resetLevel = false) {
    if (resetLevel) level = 1;
    if (current) lastWord = current.word;
    current = chooseWord(settings.mode, level, lastWord);
    guessed = new Set();
    wrongLetters = [];
    mistakes = 0;
    hints = 0;
    score = 0;
    roundFinished = false;
    paused = false;
    pausedAt = 0;
    pausedDuration = 0;
    startedAt = win.performance.now();
    app.classList.remove('is-win');
    pauseButton.textContent = 'Ⅱ';
    pauseButton.setAttribute('aria-label', 'Mettre le jeu en pause');
    setMessage('Choisis une lettre pour commencer.');
    render();
  }

  function closeModal() {
    overlayEl.classList.add('is-hidden');
    modalEl.innerHTML = '';
  }

  function openModeModal() {
    modalEl.innerHTML = `
      <h2 id="hmModalTitle">Choisir la difficulté</h2>
      <p>La difficulté change le nombre d’erreurs permises et la longueur moyenne des mots.</p>
      <div class="hm-mode-list">
        ${Object.entries(MODES).map(([key, mode]) => `<button type="button" class="hm-mode ${settings.mode === key ? 'is-active' : ''}" data-mode="${key}"><strong>${mode.label}</strong><span>${mode.description}</span></button>`).join('')}
      </div>
      <div class="hm-modal-actions"><button type="button" data-close>Annuler</button><button type="button" class="primary" id="hmApplyMode">Jouer ce mode</button></div>
    `;
    let selected = settings.mode;
    modalEl.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        selected = button.dataset.mode;
        modalEl.querySelectorAll('[data-mode]').forEach((candidate) => candidate.classList.toggle('is-active', candidate === button));
      });
    });
    modalEl.querySelector('#hmApplyMode').addEventListener('click', () => {
      settings.mode = selected;
      writeJson(storage, SETTINGS_KEY, settings);
      closeModal();
      newRound(true);
    });
    modalEl.querySelector('[data-close]').addEventListener('click', closeModal);
    overlayEl.classList.remove('is-hidden');
  }

  function openHelpModal() {
    modalEl.innerHTML = `
      <h2 id="hmModalTitle">Comment jouer</h2>
      <p>Trouve le mot avant d’épuiser tes erreurs. Les accents comptent comme leur lettre de base : É se joue avec E.</p>
      <ul class="hm-help-list">
        <li>Touche une lettre à l’écran ou utilise ton clavier physique.</li>
        <li>Une bonne lettre révèle toutes ses positions dans le mot.</li>
        <li>Une mauvaise lettre fait avancer la silhouette.</li>
        <li>Le bouton Indice révèle une lettre, mais réduit le score final.</li>
        <li>Les victoires consécutives augmentent le niveau et le bonus de série.</li>
      </ul>
      <div class="hm-toggles">
        <button type="button" id="hmSoundToggle" aria-pressed="${settings.sound}">🔊 Sons ${settings.sound ? 'activés' : 'coupés'}</button>
        <button type="button" id="hmVibrationToggle" aria-pressed="${settings.vibration}">📳 Vibrations ${settings.vibration ? 'activées' : 'coupées'}</button>
      </div>
      <div class="hm-modal-actions"><button type="button" data-close>Fermer</button><button type="button" class="primary" id="hmHelpReplay">Nouvelle partie</button></div>
    `;
    modalEl.querySelector('#hmSoundToggle').addEventListener('click', (event) => {
      settings.sound = !settings.sound;
      writeJson(storage, SETTINGS_KEY, settings);
      event.currentTarget.setAttribute('aria-pressed', String(settings.sound));
      event.currentTarget.textContent = `🔊 Sons ${settings.sound ? 'activés' : 'coupés'}`;
    });
    modalEl.querySelector('#hmVibrationToggle').addEventListener('click', (event) => {
      settings.vibration = !settings.vibration;
      writeJson(storage, SETTINGS_KEY, settings);
      event.currentTarget.setAttribute('aria-pressed', String(settings.vibration));
      event.currentTarget.textContent = `📳 Vibrations ${settings.vibration ? 'activées' : 'coupées'}`;
    });
    modalEl.querySelector('#hmHelpReplay').addEventListener('click', () => { closeModal(); newRound(true); });
    modalEl.querySelector('[data-close]').addEventListener('click', closeModal);
    overlayEl.classList.remove('is-hidden');
  }

  function openStatsModal() {
    const rate = stats.games ? Math.round((stats.wins / stats.games) * 100) : 0;
    const average = stats.wins ? Math.round(stats.totalScore / stats.wins) : 0;
    modalEl.innerHTML = `
      <h2 id="hmModalTitle">Tes statistiques</h2>
      <p>${stats.games ? 'Voici ton parcours enregistré sur cet appareil.' : 'Joue une partie pour commencer tes statistiques.'}</p>
      <div class="hm-hud" style="width:100%;grid-template-columns:repeat(3,1fr);margin:12px 0">
        <div class="hm-stat"><span>Parties</span><strong>${stats.games}</strong></div>
        <div class="hm-stat"><span>Victoires</span><strong>${stats.wins}</strong></div>
        <div class="hm-stat"><span>Taux</span><strong>${rate}%</strong></div>
        <div class="hm-stat"><span>Record</span><strong>${stats.bestScore}</strong></div>
        <div class="hm-stat"><span>Série max</span><strong>${stats.bestStreak}</strong></div>
        <div class="hm-stat"><span>Moyenne</span><strong>${average}</strong></div>
      </div>
      <div class="hm-modal-actions"><button type="button" data-close>Fermer</button><button type="button" class="primary" id="hmStatsReplay">Rejouer</button></div>
    `;
    modalEl.querySelector('#hmStatsReplay').addEventListener('click', () => { closeModal(); newRound(false); });
    modalEl.querySelector('[data-close]').addEventListener('click', closeModal);
    overlayEl.classList.remove('is-hidden');
  }

  function togglePause() {
    if (roundFinished) return;
    paused = !paused;
    if (paused) {
      pausedAt = win.performance.now();
      pauseButton.textContent = '▶';
      pauseButton.setAttribute('aria-label', 'Reprendre le jeu');
      setMessage('Partie en pause. Le chrono est arrêté.', 'warn');
    } else {
      pausedDuration += win.performance.now() - pausedAt;
      pausedAt = 0;
      pauseButton.textContent = 'Ⅱ';
      pauseButton.setAttribute('aria-label', 'Mettre le jeu en pause');
      setMessage('Partie reprise. À toi de jouer !');
    }
    updateKeyboard();
    updateHud();
  }

  KEY_ROWS.forEach((row) => {
    const line = doc.createElement('div');
    line.className = 'hm-key-row';
    [...row].forEach((letter) => {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'hm-key';
      button.dataset.letter = letter;
      button.textContent = letter;
      button.setAttribute('aria-label', `Lettre ${letter}`);
      button.addEventListener('click', () => guess(letter));
      line.appendChild(button);
    });
    keyboardEl.appendChild(line);
  });

  doc.getElementById('hmHint').addEventListener('click', useHint);
  doc.getElementById('hmReplay').addEventListener('click', () => newRound(false));
  doc.getElementById('hmMode').addEventListener('click', openModeModal);
  doc.getElementById('hmStats').addEventListener('click', openStatsModal);
  doc.getElementById('hmHelp').addEventListener('click', openHelpModal);
  pauseButton.addEventListener('click', togglePause);
  overlayEl.addEventListener('click', (event) => { if (event.target === overlayEl) closeModal(); });

  win.addEventListener('keydown', (event) => {
    if (!overlayEl.classList.contains('is-hidden')) {
      if (event.key === 'Escape') closeModal();
      return;
    }
    if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
      event.preventDefault();
      togglePause();
      return;
    }
    if (/^[a-zA-ZÀ-ÿ]$/.test(event.key)) {
      event.preventDefault();
      guess(event.key);
    }
  });

  timerHandle = win.setInterval(() => {
    if (!paused && !roundFinished) updateHud();
  }, 500);
  win.addEventListener('pagehide', () => win.clearInterval(timerHandle), { once: true });

  newRound(true);
  win.focus();
}
