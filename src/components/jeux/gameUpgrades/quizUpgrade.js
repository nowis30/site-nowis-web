const STORE = 'nowis:quiz:';

const MODES = {
  relax: {
    name: 'Détente',
    desc: '12 questions · 25 s chacune · aucune vie',
    questions: 12,
    seconds: 25,
    lives: 0,
    difficultyBias: -1,
    multiplier: 0.8,
  },
  classic: {
    name: 'Classique',
    desc: '15 questions · 18 s chacune · 3 vies',
    questions: 15,
    seconds: 18,
    lives: 3,
    difficultyBias: 0,
    multiplier: 1,
  },
  expert: {
    name: 'Expert',
    desc: '18 questions · 12 s chacune · 2 vies · questions corsées',
    questions: 18,
    seconds: 12,
    lives: 2,
    difficultyBias: 1,
    multiplier: 1.35,
  },
};

const QUESTIONS = [
  { c: 'Sciences', d: 1, q: 'Quelle planète est surnommée la planète rouge ?', a: ['Mars', 'Vénus', 'Jupiter', 'Mercure'], ok: 0, x: 'La couleur de Mars vient surtout des oxydes de fer présents à sa surface.' },
  { c: 'Sciences', d: 1, q: 'Quel organe pompe le sang dans le corps humain ?', a: ['Le foie', 'Le cœur', 'Le poumon', 'Le rein'], ok: 1, x: 'Le cœur propulse le sang dans la circulation pulmonaire et générale.' },
  { c: 'Sciences', d: 1, q: 'À quelle température l’eau pure gèle-t-elle à pression normale ?', a: ['0 °C', '10 °C', '-10 °C', '32 °C'], ok: 0, x: 'À pression atmosphérique normale, l’eau pure gèle à 0 °C.' },
  { c: 'Sciences', d: 1, q: 'Quel gaz les plantes absorbent-elles principalement pour la photosynthèse ?', a: ['Oxygène', 'Azote', 'Dioxyde de carbone', 'Hélium'], ok: 2, x: 'La photosynthèse utilise notamment le dioxyde de carbone, l’eau et la lumière.' },
  { c: 'Sciences', d: 1, q: 'Combien de pattes possède une araignée ?', a: ['6', '8', '10', '12'], ok: 1, x: 'Les arachnides, dont les araignées, ont huit pattes.' },
  { c: 'Sciences', d: 2, q: 'Quelle unité mesure la puissance électrique ?', a: ['Le volt', 'Le watt', 'L’ampère', 'L’ohm'], ok: 1, x: 'Le watt (W) est l’unité SI de puissance.' },
  { c: 'Sciences', d: 2, q: 'Quel élément chimique a pour symbole Fe ?', a: ['Fluor', 'Fer', 'Francium', 'Fermium'], ok: 1, x: 'Fe vient du latin ferrum, qui signifie fer.' },
  { c: 'Sciences', d: 2, q: 'Quel est le plus grand organe du corps humain ?', a: ['Le foie', 'Le cerveau', 'La peau', 'L’intestin'], ok: 2, x: 'La peau est le plus grand organe du corps humain par surface et masse.' },
  { c: 'Sciences', d: 2, q: 'Quelle force maintient les planètes en orbite autour du Soleil ?', a: ['Magnétisme', 'Gravitation', 'Friction', 'Électricité statique'], ok: 1, x: 'La gravitation fournit l’accélération centripète nécessaire aux orbites.' },
  { c: 'Sciences', d: 2, q: 'Quel type de cellule transporte principalement l’oxygène dans le sang ?', a: ['Globule rouge', 'Globule blanc', 'Plaquette', 'Neurone'], ok: 0, x: 'Les globules rouges transportent l’oxygène grâce à l’hémoglobine.' },
  { c: 'Sciences', d: 3, q: 'Quel phénomène explique surtout la couleur bleue du ciel ?', a: ['Diffraction de Bragg', 'Diffusion de Rayleigh', 'Réflexion totale', 'Effet Doppler'], ok: 1, x: 'La diffusion de Rayleigh disperse davantage les courtes longueurs d’onde de la lumière.' },
  { c: 'Sciences', d: 3, q: 'Quel est le nombre approximatif d’Avogadro ?', a: ['6,02 × 10²³', '3,00 × 10⁸', '9,81 × 10²', '1,60 × 10⁻¹⁹'], ok: 0, x: 'La constante d’Avogadro vaut environ 6,022 × 10²³ mol⁻¹.' },
  { c: 'Sciences', d: 3, q: 'Dans l’ADN, quelle base s’apparie normalement avec l’adénine ?', a: ['Cytosine', 'Guanine', 'Uracile', 'Thymine'], ok: 3, x: 'Dans l’ADN, l’adénine s’apparie avec la thymine.' },
  { c: 'Sciences', d: 3, q: 'Quelle particule porte une charge électrique négative ?', a: ['Proton', 'Neutron', 'Électron', 'Photon'], ok: 2, x: 'L’électron possède une charge élémentaire négative.' },
  { c: 'Monde', d: 1, q: 'Quelle est la capitale du Canada ?', a: ['Toronto', 'Montréal', 'Ottawa', 'Vancouver'], ok: 2, x: 'Ottawa est la capitale fédérale du Canada.' },
  { c: 'Monde', d: 1, q: 'Sur quel continent se trouve le Kenya ?', a: ['Afrique', 'Asie', 'Europe', 'Amérique du Sud'], ok: 0, x: 'Le Kenya se trouve en Afrique de l’Est.' },
  { c: 'Monde', d: 1, q: 'Quel océan borde la côte est du Canada ?', a: ['Pacifique', 'Atlantique', 'Indien', 'Arctique uniquement'], ok: 1, x: 'La côte est du Canada donne sur l’océan Atlantique.' },
  { c: 'Monde', d: 1, q: 'Quel pays a la forme générale d’une botte sur la carte ?', a: ['Italie', 'Portugal', 'Grèce', 'Chili'], ok: 0, x: 'La péninsule italienne est souvent comparée à une botte.' },
  { c: 'Monde', d: 2, q: 'Quel fleuve traverse Paris ?', a: ['La Loire', 'La Seine', 'Le Rhône', 'La Garonne'], ok: 1, x: 'Paris s’est développé de part et d’autre de la Seine.' },
  { c: 'Monde', d: 2, q: 'Quel est le plus grand désert chaud du monde ?', a: ['Gobi', 'Sahara', 'Kalahari', 'Atacama'], ok: 1, x: 'Le Sahara est le plus vaste désert chaud du monde.' },
  { c: 'Monde', d: 2, q: 'Quel pays est traversé par le canal de Panama ?', a: ['Mexique', 'Panama', 'Costa Rica', 'Colombie'], ok: 1, x: 'Le canal traverse l’isthme de Panama entre Atlantique et Pacifique.' },
  { c: 'Monde', d: 2, q: 'Quelle chaîne de montagnes sépare en partie la France et l’Espagne ?', a: ['Alpes', 'Carpates', 'Pyrénées', 'Apennins'], ok: 2, x: 'Les Pyrénées forment une frontière naturelle importante entre les deux pays.' },
  { c: 'Monde', d: 3, q: 'Dans quel pays se trouve la région historique de Transylvanie ?', a: ['Roumanie', 'Hongrie', 'Slovaquie', 'Bulgarie'], ok: 0, x: 'La Transylvanie est une région historique du centre de la Roumanie.' },
  { c: 'Monde', d: 3, q: 'Quel détroit sépare l’Espagne du Maroc ?', a: ['Béring', 'Gibraltar', 'Ormuz', 'Malacca'], ok: 1, x: 'Le détroit de Gibraltar relie l’Atlantique à la Méditerranée.' },
  { c: 'Monde', d: 3, q: 'Quelle capitale européenne est traversée par le Danube ?', a: ['Madrid', 'Lisbonne', 'Budapest', 'Oslo'], ok: 2, x: 'Le Danube traverse Budapest et sépare historiquement Buda et Pest.' },
  { c: 'Histoire', d: 1, q: 'Quel peuple a construit les pyramides de Gizeh ?', a: ['Romains', 'Égyptiens antiques', 'Vikings', 'Aztèques'], ok: 1, x: 'Les pyramides de Gizeh ont été construites dans l’Égypte antique.' },
  { c: 'Histoire', d: 1, q: 'En quelle année le premier humain a-t-il marché sur la Lune ?', a: ['1959', '1969', '1979', '1989'], ok: 1, x: 'Apollo 11 a aluni en juillet 1969.' },
  { c: 'Histoire', d: 1, q: 'Quel navigateur est associé au voyage européen de 1492 vers les Amériques ?', a: ['Christophe Colomb', 'James Cook', 'Marco Polo', 'Roald Amundsen'], ok: 0, x: 'Christophe Colomb a traversé l’Atlantique en 1492 au service de la couronne espagnole.' },
  { c: 'Histoire', d: 2, q: 'Quel événement débute symboliquement la Révolution française en 1789 ?', a: ['La prise de la Bastille', 'Waterloo', 'Le sacre de Napoléon', 'La Commune de Paris'], ok: 0, x: 'La prise de la Bastille, le 14 juillet 1789, est un symbole majeur de la Révolution.' },
  { c: 'Histoire', d: 2, q: 'Quel empire utilisait largement le latin comme langue administrative en Occident ?', a: ['Empire romain', 'Empire inca', 'Empire ottoman', 'Empire moghol'], ok: 0, x: 'Le latin était central dans l’administration et la culture de Rome en Occident.' },
  { c: 'Histoire', d: 2, q: 'Quel conflit mondial s’est terminé en 1945 ?', a: ['Première Guerre mondiale', 'Deuxième Guerre mondiale', 'Guerre de Crimée', 'Guerre de Corée'], ok: 1, x: 'La Deuxième Guerre mondiale s’est achevée en 1945.' },
  { c: 'Histoire', d: 3, q: 'Quel traité de 1919 est associé à la fin de la Première Guerre mondiale avec l’Allemagne ?', a: ['Traité de Versailles', 'Traité de Rome', 'Traité d’Utrecht', 'Traité de Maastricht'], ok: 0, x: 'Le traité de Versailles a été signé le 28 juin 1919.' },
  { c: 'Histoire', d: 3, q: 'Quel empire avait Constantinople pour capitale avant 1453 ?', a: ['Empire byzantin', 'Empire carolingien', 'Empire perse achéménide', 'Empire austro-hongrois'], ok: 0, x: 'Constantinople fut la capitale de l’Empire byzantin jusqu’à sa prise par les Ottomans en 1453.' },
  { c: 'Histoire', d: 3, q: 'Quel souverain français était surnommé le Roi-Soleil ?', a: ['Louis IX', 'Louis XIV', 'Louis XVI', 'François Ier'], ok: 1, x: 'Louis XIV est associé au surnom de Roi-Soleil et au palais de Versailles.' },
  { c: 'Culture', d: 1, q: 'Quel instrument possède habituellement 88 touches dans sa version moderne de concert ?', a: ['Piano', 'Violon', 'Trompette', 'Flûte'], ok: 0, x: 'Le piano moderne standard compte 88 touches.' },
  { c: 'Culture', d: 1, q: 'Qui a peint La Joconde ?', a: ['Vincent van Gogh', 'Léonard de Vinci', 'Claude Monet', 'Pablo Picasso'], ok: 1, x: 'La Joconde est une œuvre de Léonard de Vinci.' },
  { c: 'Culture', d: 1, q: 'Dans quel art utilise-t-on principalement des notes, des rythmes et des harmonies ?', a: ['Musique', 'Sculpture', 'Architecture', 'Photographie'], ok: 0, x: 'La musique organise sons, silences, rythmes et harmonies.' },
  { c: 'Culture', d: 2, q: 'Quel auteur a créé le personnage de Sherlock Holmes ?', a: ['Arthur Conan Doyle', 'Jules Verne', 'Victor Hugo', 'Agatha Christie'], ok: 0, x: 'Sir Arthur Conan Doyle a créé Sherlock Holmes à la fin du XIXe siècle.' },
  { c: 'Culture', d: 2, q: 'À quel mouvement artistique Claude Monet est-il étroitement associé ?', a: ['Cubisme', 'Impressionnisme', 'Surréalisme', 'Baroque'], ok: 1, x: 'Monet est l’une des figures majeures de l’impressionnisme.' },
  { c: 'Culture', d: 2, q: 'Quelle langue est principalement parlée au Brésil ?', a: ['Espagnol', 'Portugais', 'Français', 'Italien'], ok: 1, x: 'Le portugais est la langue officielle du Brésil.' },
  { c: 'Culture', d: 3, q: 'Qui a composé Les Quatre Saisons ?', a: ['Mozart', 'Vivaldi', 'Beethoven', 'Debussy'], ok: 1, x: 'Antonio Vivaldi a composé les concertos connus sous le nom Les Quatre Saisons.' },
  { c: 'Culture', d: 3, q: 'Quel écrivain a publié 1984 ?', a: ['George Orwell', 'Aldous Huxley', 'Ray Bradbury', 'H. G. Wells'], ok: 0, x: 'George Orwell a publié le roman dystopique 1984 en 1949.' },
  { c: 'Culture', d: 3, q: 'Dans quel musée parisien peut-on voir La Joconde ?', a: ['Musée d’Orsay', 'Louvre', 'Centre Pompidou', 'Musée Rodin'], ok: 1, x: 'La Joconde est exposée au musée du Louvre.' },
  { c: 'Technologie', d: 1, q: 'Que signifie généralement « WWW » sur Internet ?', a: ['World Wide Web', 'Wireless World Wire', 'Web Wide Window', 'World Web Work'], ok: 0, x: 'WWW signifie World Wide Web.' },
  { c: 'Technologie', d: 1, q: 'Quel appareil sert principalement à saisir du texte sur un ordinateur ?', a: ['Clavier', 'Routeur', 'Écran', 'Haut-parleur'], ok: 0, x: 'Le clavier est un périphérique de saisie.' },
  { c: 'Technologie', d: 1, q: 'Quel format est couramment utilisé pour une image photographique compressée ?', a: ['JPEG', 'TXT', 'CSV', 'WAV'], ok: 0, x: 'JPEG est très répandu pour les photographies compressées.' },
  { c: 'Technologie', d: 2, q: 'Quel protocole sécurisé est généralement utilisé pour charger un site web chiffré ?', a: ['HTTPS', 'FTP', 'SMTP', 'SSH uniquement'], ok: 0, x: 'HTTPS combine HTTP avec une couche de chiffrement TLS.' },
  { c: 'Technologie', d: 2, q: 'En programmation, que vaut généralement un booléen ?', a: ['Une couleur', 'Vrai ou faux', 'Un fichier audio', 'Une adresse postale'], ok: 1, x: 'Un booléen représente habituellement deux états : vrai ou faux.' },
  { c: 'Technologie', d: 2, q: 'Quel composant exécute principalement les instructions générales d’un ordinateur ?', a: ['CPU', 'SSD', 'Écran', 'Ventilateur'], ok: 0, x: 'Le CPU, ou processeur, exécute les instructions générales du programme.' },
  { c: 'Technologie', d: 3, q: 'Quelle structure de données fonctionne selon le principe LIFO ?', a: ['Pile', 'File', 'Table de hachage', 'Graphe'], ok: 0, x: 'Une pile suit le principe Last In, First Out.' },
  { c: 'Technologie', d: 3, q: 'Quel code d’état HTTP signifie « Non trouvé » ?', a: ['200', '301', '404', '500'], ok: 2, x: 'HTTP 404 indique que la ressource demandée n’a pas été trouvée.' },
  { c: 'Technologie', d: 3, q: 'En base de données relationnelle, quel langage est couramment utilisé pour interroger les données ?', a: ['SQL', 'HTML', 'CSS', 'SVG'], ok: 0, x: 'SQL est conçu pour manipuler et interroger des bases de données relationnelles.' },
  { c: 'Logique', d: 1, q: 'Quel nombre complète la suite : 2, 4, 6, 8, … ?', a: ['9', '10', '11', '12'], ok: 1, x: 'La suite augmente de 2 à chaque étape.' },
  { c: 'Logique', d: 1, q: 'Si tous les chats sont des mammifères et Minou est un chat, Minou est…', a: ['Un mammifère', 'Un reptile', 'Un poisson', 'Impossible à savoir'], ok: 0, x: 'C’est une déduction directe : Minou appartient à l’ensemble des mammifères.' },
  { c: 'Logique', d: 1, q: 'Combien font 9 × 7 ?', a: ['56', '63', '72', '79'], ok: 1, x: '9 × 7 = 63.' },
  { c: 'Logique', d: 2, q: 'Quel nombre complète la suite : 1, 1, 2, 3, 5, 8, … ?', a: ['10', '11', '13', '16'], ok: 2, x: 'Chaque nombre est la somme des deux précédents : le suivant est 13.' },
  { c: 'Logique', d: 2, q: 'Un article coûte 80 $ après une réduction de 20 %. Quel était son prix avant réduction ?', a: ['96 $', '100 $', '104 $', '120 $'], ok: 1, x: '80 $ représente 80 % du prix initial, donc le prix initial était 100 $.' },
  { c: 'Logique', d: 2, q: 'Si 3 machines fabriquent 3 pièces en 3 minutes au même rythme, combien de pièces 6 machines fabriquent-elles en 3 minutes ?', a: ['3', '6', '9', '12'], ok: 1, x: 'Chaque machine produit une pièce en 3 minutes; 6 machines produisent donc 6 pièces.' },
  { c: 'Logique', d: 3, q: 'Quel nombre complète la suite : 3, 6, 12, 24, … ?', a: ['36', '42', '48', '60'], ok: 2, x: 'Chaque terme est le double du précédent : 24 × 2 = 48.' },
  { c: 'Logique', d: 3, q: 'Un dé équilibré à six faces est lancé. Quelle est la probabilité d’obtenir un nombre pair ?', a: ['1/6', '1/3', '1/2', '2/3'], ok: 2, x: 'Trois faces sur six sont paires : 2, 4 et 6, soit 3/6 = 1/2.' },
  { c: 'Logique', d: 3, q: 'Quel est le prochain nombre : 2, 3, 5, 7, 11, … ?', a: ['12', '13', '14', '15'], ok: 1, x: 'La suite énumère les nombres premiers : après 11 vient 13.' },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const shuffle = (items, random = Math.random) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const fmt = (value) => Math.max(0, Math.round(value)).toLocaleString('fr-CA');
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

function targetDifficulty(mode, answered) {
  const level = 1 + Math.floor(answered / 4);
  return clamp(level + MODES[mode].difficultyBias, 1, 3);
}

function scoreFor(question, secondsLeft, streak, mode) {
  const speed = Math.max(0, Math.floor(secondsLeft)) * 3;
  const streakBonus = Math.min(150, Math.max(0, streak - 1) * 15);
  const base = 90 + question.d * 45;
  return Math.round((base + speed + streakBonus) * MODES[mode].multiplier);
}

function pickQuestion(mode, answered, used, random = Math.random) {
  const target = targetDifficulty(mode, answered);
  const unused = QUESTIONS.filter((_, index) => !used.has(index));
  if (!unused.length) return null;
  const tagged = unused.map((question) => ({ question, index: QUESTIONS.indexOf(question) }));
  const preferred = tagged.filter(({ question }) => question.d === target);
  const close = tagged.filter(({ question }) => Math.abs(question.d - target) <= 1);
  const pool = preferred.length ? preferred : close.length ? close : tagged;
  return pool[Math.floor(random() * pool.length) % pool.length];
}

function makeAudio(win) {
  let context;
  let enabled = true;
  const tone = (frequency, duration = 0.07, type = 'sine', gain = 0.025, delay = 0) => {
    if (!enabled) return;
    try {
      context ??= new (win.AudioContext || win.webkitAudioContext)();
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
    } catch {}
  };
  return {
    correct(streak) {
      tone(520 + Math.min(320, streak * 22), 0.06, 'triangle', 0.025);
      tone(760 + Math.min(260, streak * 12), 0.08, 'sine', 0.018, 0.045);
    },
    wrong() {
      tone(165, 0.12, 'sawtooth', 0.024);
      tone(125, 0.13, 'triangle', 0.018, 0.05);
    },
    tick() {
      tone(290, 0.035, 'square', 0.01);
    },
    level() {
      [440, 554, 659].forEach((frequency, index) => tone(frequency, 0.08, 'triangle', 0.02, index * 0.05));
    },
    end() {
      [392, 523, 659, 784].forEach((frequency, index) => tone(frequency, 0.09, 'triangle', 0.02, index * 0.055));
    },
    set(value) {
      enabled = value;
    },
  };
}

function vibrate(win, pattern, enabled) {
  if (!enabled) return;
  try {
    win.navigator?.vibrate?.(pattern);
  } catch {}
}

export function upgradeQuiz(doc, win) {
  const root = doc.documentElement;
  if (!root || root.dataset.nowisQuizPro === 'true') return;
  root.dataset.nowisQuizPro = 'true';
  root.lang = 'fr';
  doc.title = 'Quiz NOWIS';
  doc.head.querySelectorAll('link[rel="stylesheet"],script[src]').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#071018;color:#f8f0dd;font-family:Inter,ui-rounded,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{min-height:100dvh;overflow:hidden;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}button{font:inherit}.app{min-height:100dvh;display:flex;flex-direction:column;align-items:center;gap:7px;padding:max(7px,env(safe-area-inset-top)) max(7px,env(safe-area-inset-right)) max(9px,env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));background:radial-gradient(circle at 12% 4%,#b9934f20,transparent 28%),radial-gradient(circle at 90% 8%,#4fb5ad1b,transparent 26%),linear-gradient(150deg,#071018,#10212d 55%,#0b1720)}.top,.hud,.desk,.status,.controls{width:min(100%,900px)}.top{display:flex;align-items:center;justify-content:space-between;gap:8px}.brand small{display:block;color:#c5a66a;font-size:9px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}.brand h1{margin:2px 0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(25px,7vw,40px);line-height:.95;letter-spacing:-.035em;color:#fff5dc}.tools{display:flex;gap:5px}.badge,.btn,.mode,.modal button{min-height:44px;border:1px solid #e6d1a326;border-radius:14px;background:#112632;color:#fff5df;font-weight:900}.badge{display:flex;align-items:center;padding:0 10px;font-size:10px}.btn{padding:7px 11px;cursor:pointer;touch-action:manipulation}.btn:focus-visible,.answer:focus-visible,.mode:focus-visible,.modal button:focus-visible{outline:3px solid #75e2d4;outline-offset:3px}.hud{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.stat{text-align:center;padding:6px 3px;border:1px solid #e9d9b71a;border-radius:12px;background:#0a1821cc}.stat span{display:block;color:#8faab2;font-size:8px;font-weight:900;text-transform:uppercase}.stat strong{display:block;color:#fff2d3;font-size:clamp(14px,4vw,20px)}.desk{position:relative;flex:1;min-height:360px;display:flex;flex-direction:column;overflow:hidden;border:1px solid #c8a96b4d;border-radius:28px;background:linear-gradient(180deg,#1c3441,#142936 56%,#0d1c26);box-shadow:0 28px 75px #000a,inset 0 1px #fff2}.desk:before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(115deg,#fff0 0 34px,#ffffff04 35px 36px),radial-gradient(circle at 15% 15%,#d8b26918,transparent 24%),radial-gradient(circle at 83% 18%,#55bdb122,transparent 23%)}.ribbon{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px 8px}.category{display:inline-flex;align-items:center;min-height:30px;padding:5px 10px;border:1px solid #d4bb8840;border-radius:999px;background:#07131ad6;color:#e0c68d;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.progress{flex:1;max-width:320px;height:9px;overflow:hidden;border-radius:999px;background:#061117;border:1px solid #fff1}.progress i{display:block;width:0;height:100%;border-radius:inherit;background:linear-gradient(90deg,#d6af62,#6ad7c7);transition:width .28s ease}.paper{position:relative;z-index:1;margin:0 12px 10px;flex:1;display:flex;flex-direction:column;justify-content:center;min-height:145px;padding:clamp(16px,5vw,28px);border-radius:20px;background:linear-gradient(165deg,#f8f0dc,#eadcc1);color:#18242b;box-shadow:0 12px 35px #0006,inset 0 0 0 1px #7d684d2b}.paper:after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:repeating-linear-gradient(0deg,#6f66510a 0 1px,transparent 1px 22px)}.qnum{position:relative;z-index:1;color:#7a6750;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.question{position:relative;z-index:1;margin:7px 0 0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(20px,5.7vw,33px);line-height:1.15;letter-spacing:-.025em}.answers{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 12px 12px}.answer{position:relative;min-height:68px;display:flex;align-items:center;gap:10px;padding:11px 12px;border:1px solid #e5d0a126;border-radius:16px;background:#0c1f29;color:#f8efd9;text-align:left;font-weight:800;cursor:pointer;touch-action:manipulation;transition:transform .12s ease,border-color .18s ease,background .18s ease}.answer:active{transform:scale(.985)}.answer b{flex:0 0 auto;display:grid;place-items:center;width:31px;height:31px;border-radius:10px;background:#d2ae6330;color:#f2d392}.answer span{font-size:clamp(12px,3.7vw,16px);line-height:1.2}.answer.good{border-color:#77dfc5;background:#18473e}.answer.bad{border-color:#ff8d7f;background:#492a2a}.answer.dim{opacity:.42}.answer[disabled]{cursor:default}.timer{height:7px;margin:0 12px 12px;overflow:hidden;border-radius:999px;background:#061117}.timer i{display:block;width:100%;height:100%;background:linear-gradient(90deg,#dd695b,#e4b85c 36%,#66d5c5);transform-origin:left center}.status{min-height:36px;display:grid;place-items:center;padding:6px 10px;border:1px solid #e6d2aa1a;border-radius:12px;background:#091820d9;color:#9db2b6;text-align:center;font-size:11px;font-weight:800}.status strong{color:#f2ce83}.controls{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center}.controls .tools{display:grid;grid-template-columns:repeat(5,1fr)}.hint{color:#78969e;font-size:9px;font-weight:800}.ov{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:18px;background:#03090de9;backdrop-filter:blur(13px)}.ov.hide{display:none}.modal{width:min(100%,570px);max-height:90dvh;overflow:auto;padding:21px;border:1px solid #d1af6b45;border-radius:26px;background:linear-gradient(155deg,#10242f,#183743 58%,#2c2a24);box-shadow:0 32px 90px #000d}.ey{color:#d1b278;font-size:9px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}.modal h2{margin:4px 0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(27px,8vw,40px);color:#fff2d7}.modal p{color:#b6c4c5;font-size:13px;line-height:1.5}.modes{display:grid;gap:7px;margin:14px 0}.mode{text-align:left;padding:12px;cursor:pointer}.mode strong,.mode span{display:block}.mode span{margin-top:3px;color:#9aadaf;font-size:11px}.mode.on{border-color:#d7b66e;background:#8065322f}.acts{display:grid;grid-template-columns:1fr 1fr;gap:7px}.modal button{padding:10px;cursor:pointer}.primary{background:#7d6030!important}.cards{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:12px 0}.cards div{padding:10px;border-radius:12px;background:#08161d;border:1px solid #fff1}.cards b{display:block;color:#e4c57e;font-size:11px}.cards span{color:#97a8a9;font-size:10px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@media(max-width:650px){.hud{grid-template-columns:repeat(3,1fr)}.stat:nth-child(n+4){display:none}.brand h1{font-size:28px}.desk{min-height:355px}.paper{margin:0 8px 8px;padding:16px}.answers{grid-template-columns:1fr;gap:6px;padding:0 8px 8px}.answer{min-height:54px}.ribbon{padding:8px}.controls{grid-template-columns:1fr}.hint{display:none}.controls .tools{grid-template-columns:repeat(5,1fr)}.btn{padding:6px 5px;font-size:10px}}@media(orientation:landscape) and (max-height:620px){.app{gap:4px}.brand h1{font-size:23px}.brand small{display:none}.hud{grid-template-columns:repeat(6,1fr)}.hud .stat:nth-child(n){display:block;padding:3px}.desk{min-height:245px;display:grid;grid-template-columns:1.05fr .95fr;grid-template-rows:auto 1fr auto}.ribbon{grid-column:1/-1;padding:5px 10px}.paper{grid-column:1;margin:0 5px 5px 10px;min-height:150px;padding:13px}.answers{grid-column:2;grid-row:2;padding:0 10px 5px 5px;grid-template-columns:1fr 1fr;align-content:center}.answer{min-height:55px;padding:7px}.timer{grid-column:1/-1;margin:0 10px 6px}.status{min-height:28px;padding:3px}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  `;
  doc.head.appendChild(style);

  doc.body.innerHTML = `<main class="app"><header class="top"><div class="brand"><small>Cabinet des savoirs NOWIS</small><h1>Le grand quiz</h1></div><div class="tools"><span class="badge" id="modeBadge">Classique</span><button class="btn" id="help" aria-label="Aide">?</button></div></header><section class="hud" aria-label="Statistiques de la partie"><div class="stat"><span>Score</span><strong id="score">0</strong></div><div class="stat"><span>Record</span><strong id="record">0</strong></div><div class="stat"><span>Question</span><strong id="round">0/15</strong></div><div class="stat"><span>Niveau</span><strong id="level">1</strong></div><div class="stat"><span>Série</span><strong id="streak">0</strong></div><div class="stat"><span>Vies</span><strong id="lives">♥♥♥</strong></div></section><section class="desk" aria-labelledby="questionText"><div class="ribbon"><span class="category" id="category">Prêt</span><span class="progress" aria-hidden="true"><i id="progress"></i></span></div><article class="paper"><div class="qnum" id="qnum">Choisis un mode</div><h2 class="question" id="questionText">Teste tes connaissances et grimpe les niveaux.</h2></article><div class="answers" id="answers" role="group" aria-label="Choix de réponses"></div><div class="timer" aria-hidden="true"><i id="timerBar"></i></div></section><div class="status" id="status" role="status" aria-live="polite">Choisis un mode pour commencer.</div><section class="controls"><div class="tools"><button class="btn" id="pause">Pause</button><button class="btn" id="replay">Rejouer</button><button class="btn" id="fifty">50/50</button><button class="btn" id="sound" aria-pressed="true">Son ✓</button><button class="btn" id="haptic" aria-pressed="true">Vibre ✓</button></div><div class="hint"><b>1–4</b> répondre · P pause · joker 50/50 une fois</div></section></main><div class="ov" id="overlay"><div class="modal" id="modal" role="dialog" aria-modal="true"></div></div><div class="sr" id="announce" aria-live="assertive"></div>`;

  const $ = (selector) => doc.querySelector(selector);
  const overlay = $('#overlay');
  const modal = $('#modal');
  const answers = $('#answers');
  const audio = makeAudio(win);
  const settings = load(win.localStorage, STORE + 'settings', { mode: 'classic', sound: true, haptic: true });
  let mode = MODES[settings.mode] ? settings.mode : 'classic';
  let records = load(win.localStorage, STORE + 'records', { relax: 0, classic: 0, expert: 0 });
  let stats = load(win.localStorage, STORE + 'stats', { games: 0, correct: 0, bestStreak: 0 });
  let score = 0;
  let answered = 0;
  let correct = 0;
  let streak = 0;
  let lives = MODES[mode].lives;
  let used = new Set();
  let current = null;
  let optionOrder = [];
  let secondsLeft = MODES[mode].seconds;
  let deadline = 0;
  let timerId = 0;
  let running = false;
  let paused = false;
  let locked = false;
  let fiftyAvailable = true;
  let pausedRemaining = 0;
  let lastTickSecond = -1;

  audio.set(Boolean(settings.sound));
  const persistSettings = () => save(win.localStorage, STORE + 'settings', settings);
  const updateSettingsUi = () => {
    $('#sound').textContent = settings.sound ? 'Son ✓' : 'Son —';
    $('#sound').setAttribute('aria-pressed', String(Boolean(settings.sound)));
    $('#haptic').textContent = settings.haptic ? 'Vibre ✓' : 'Vibre —';
    $('#haptic').setAttribute('aria-pressed', String(Boolean(settings.haptic)));
  };
  const announce = (text) => {
    $('#announce').textContent = '';
    win.setTimeout(() => { $('#announce').textContent = text; }, 20);
  };
  const level = () => 1 + Math.floor(answered / 4);
  const livesText = () => MODES[mode].lives ? ('♥'.repeat(Math.max(0, lives)) || '0') : '∞';
  const updateHud = () => {
    $('#score').textContent = fmt(score);
    $('#record').textContent = fmt(records[mode] || 0);
    $('#round').textContent = `${Math.min(answered + (running ? 1 : 0), MODES[mode].questions)}/${MODES[mode].questions}`;
    $('#level').textContent = String(level());
    $('#streak').textContent = String(streak);
    $('#lives').textContent = livesText();
    $('#modeBadge').textContent = MODES[mode].name;
    $('#progress').style.width = `${clamp((answered / MODES[mode].questions) * 100, 0, 100)}%`;
    $('#fifty').disabled = !running || paused || locked || !fiftyAvailable;
    $('#fifty').textContent = fiftyAvailable ? '50/50' : '50/50 ✓';
  };
  const stopTimer = () => {
    if (timerId) win.cancelAnimationFrame(timerId);
    timerId = 0;
  };
  const renderTimer = () => {
    $('#timerBar').style.transform = `scaleX(${clamp(secondsLeft / MODES[mode].seconds, 0, 1)})`;
  };

  const finishGame = (reason = '') => {
    running = false;
    paused = false;
    locked = true;
    stopTimer();
    answered = Math.min(answered, MODES[mode].questions);
    const oldRecord = records[mode] || 0;
    const isRecord = score > oldRecord;
    if (isRecord) records[mode] = score;
    stats.games += 1;
    stats.correct += correct;
    stats.bestStreak = Math.max(stats.bestStreak || 0, streak);
    save(win.localStorage, STORE + 'records', records);
    save(win.localStorage, STORE + 'stats', stats);
    updateHud();
    audio.end();
    vibrate(win, [30, 35, 60], settings.haptic);
    const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
    modal.innerHTML = `<div class="ey">Partie terminée</div><h2>${isRecord ? 'Nouveau record !' : 'Résultat du quiz'}</h2><p>${reason || 'Le cabinet ferme ses dossiers.'}</p><div class="cards"><div><b>Score</b><span>${fmt(score)}</span></div><div><b>Bonnes réponses</b><span>${correct}/${answered || 0}</span></div><div><b>Précision</b><span>${accuracy} %</span></div><div><b>Meilleure série</b><span>${stats.bestStreak || streak}</span></div></div><div class="acts"><button class="primary" id="again">Rejouer</button><button id="change">Changer de mode</button></div>`;
    overlay.classList.remove('hide');
    $('#again').onclick = () => startGame();
    $('#change').onclick = () => showMenu();
    announce(`Partie terminée. Score ${score}. ${correct} bonnes réponses sur ${answered}.`);
  };

  const answerCurrent = (visibleIndex, timedOut = false) => {
    if (!running || paused || locked || !current) return;
    const answerIndex = optionOrder[visibleIndex];
    if (!timedOut && (answerIndex === undefined || answerIndex === null)) return;
    locked = true;
    stopTimer();
    const buttons = [...answers.querySelectorAll('.answer')];
    const correctVisible = optionOrder.findIndex((index) => index === current.question.ok);
    buttons.forEach((button, index) => {
      button.disabled = true;
      if (index === correctVisible) button.classList.add('good');
    });
    const isCorrect = !timedOut && answerIndex === current.question.ok;
    if (isCorrect) {
      correct += 1;
      streak += 1;
      const gained = scoreFor(current.question, secondsLeft, streak, mode);
      score += gained;
      buttons[visibleIndex]?.classList.add('good');
      $('#status').innerHTML = `<strong>Bonne réponse !</strong> +${fmt(gained)} · ${current.question.x}`;
      audio.correct(streak);
      vibrate(win, 24, settings.haptic);
      announce(`Bonne réponse. ${current.question.x}`);
    } else {
      streak = 0;
      if (MODES[mode].lives) lives -= 1;
      if (!timedOut && buttons[visibleIndex]) buttons[visibleIndex].classList.add('bad');
      $('#status').innerHTML = `<strong>${timedOut ? 'Temps écoulé.' : 'Pas cette fois.'}</strong> ${current.question.x}`;
      audio.wrong();
      vibrate(win, [45, 30, 45], settings.haptic);
      announce(`${timedOut ? 'Temps écoulé.' : 'Mauvaise réponse.'} ${current.question.x}`);
    }
    answered += 1;
    if (answered > 0 && answered % 4 === 0 && answered < MODES[mode].questions) {
      audio.level();
      $('#status').innerHTML += ` <strong>Niveau ${level()}.</strong>`;
    }
    updateHud();
    const done = answered >= MODES[mode].questions || (MODES[mode].lives && lives <= 0);
    win.setTimeout(() => {
      if (done) finishGame(lives <= 0 ? 'Tu n’as plus de vies, mais ton score est enregistré.' : 'Toutes les questions sont complétées.');
      else nextQuestion();
    }, 1250);
  };

  const timerLoop = () => {
    if (!running || paused || locked) return;
    secondsLeft = Math.max(0, (deadline - win.performance.now()) / 1000);
    renderTimer();
    const whole = Math.ceil(secondsLeft);
    if (whole <= 5 && whole > 0 && whole !== lastTickSecond) {
      lastTickSecond = whole;
      audio.tick();
    }
    if (secondsLeft <= 0) {
      answerCurrent(-1, true);
      return;
    }
    timerId = win.requestAnimationFrame(timerLoop);
  };

  const renderAnswers = () => {
    answers.innerHTML = '';
    optionOrder.forEach((answerIndex, visibleIndex) => {
      const button = doc.createElement('button');
      button.className = 'answer';
      button.type = 'button';
      button.dataset.index = String(visibleIndex);
      button.setAttribute('aria-label', `Réponse ${visibleIndex + 1}: ${current.question.a[answerIndex]}`);
      button.innerHTML = `<b>${visibleIndex + 1}</b><span>${current.question.a[answerIndex]}</span>`;
      button.onclick = () => answerCurrent(visibleIndex);
      answers.appendChild(button);
    });
  };

  const nextQuestion = () => {
    if (!running) return;
    locked = false;
    const picked = pickQuestion(mode, answered, used);
    if (!picked) {
      finishGame('La banque de questions disponible est épuisée.');
      return;
    }
    current = picked;
    used.add(picked.index);
    optionOrder = shuffle([0, 1, 2, 3]);
    secondsLeft = MODES[mode].seconds;
    deadline = win.performance.now() + secondsLeft * 1000;
    lastTickSecond = -1;
    $('#category').textContent = current.question.c;
    $('#qnum').textContent = `Question ${answered + 1} · difficulté ${current.question.d}/3`;
    $('#questionText').textContent = current.question.q;
    $('#status').textContent = 'Choisis la meilleure réponse.';
    renderAnswers();
    renderTimer();
    updateHud();
    stopTimer();
    timerId = win.requestAnimationFrame(timerLoop);
  };

  const startGame = () => {
    overlay.classList.add('hide');
    score = 0;
    answered = 0;
    correct = 0;
    streak = 0;
    lives = MODES[mode].lives;
    used = new Set();
    current = null;
    running = true;
    paused = false;
    locked = false;
    fiftyAvailable = true;
    $('#pause').textContent = 'Pause';
    updateHud();
    nextQuestion();
    announce(`Mode ${MODES[mode].name}. Le quiz commence.`);
  };

  const showMenu = () => {
    running = false;
    paused = false;
    locked = true;
    stopTimer();
    modal.innerHTML = `<div class="ey">Cabinet des savoirs NOWIS</div><h2>Le grand quiz</h2><p>Réponds vite, enchaîne les bonnes réponses et monte jusqu’aux questions les plus difficiles.</p><div class="modes">${Object.entries(MODES).map(([key, config]) => `<button class="mode ${key === mode ? 'on' : ''}" data-mode="${key}"><strong>${config.name}</strong><span>${config.desc}</span></button>`).join('')}</div><div class="cards"><div><b>Record détente</b><span>${fmt(records.relax || 0)}</span></div><div><b>Record classique</b><span>${fmt(records.classic || 0)}</span></div><div><b>Record expert</b><span>${fmt(records.expert || 0)}</span></div><div><b>Parties jouées</b><span>${stats.games || 0}</span></div></div><button class="primary" id="start">Démarrer</button>`;
    overlay.classList.remove('hide');
    modal.querySelectorAll('[data-mode]').forEach((button) => {
      button.onclick = () => {
        mode = button.dataset.mode;
        settings.mode = mode;
        persistSettings();
        showMenu();
      };
    });
    $('#start').onclick = () => startGame();
    updateHud();
  };

  const pauseGame = (forcePause) => {
    if (!running || locked) return;
    const shouldPause = forcePause === undefined ? !paused : forcePause;
    if (shouldPause === paused) return;
    paused = shouldPause;
    if (paused) {
      pausedRemaining = Math.max(0, deadline - win.performance.now());
      stopTimer();
      $('#pause').textContent = 'Reprendre';
      $('#status').innerHTML = '<strong>Pause.</strong> Le chrono est arrêté.';
      answers.querySelectorAll('.answer').forEach((button) => { button.disabled = true; });
    } else {
      deadline = win.performance.now() + pausedRemaining;
      secondsLeft = pausedRemaining / 1000;
      $('#pause').textContent = 'Pause';
      $('#status').textContent = 'Reprise du quiz.';
      answers.querySelectorAll('.answer').forEach((button) => {
        if (!button.classList.contains('dim')) button.disabled = false;
      });
      stopTimer();
      timerId = win.requestAnimationFrame(timerLoop);
    }
    updateHud();
    announce(paused ? 'Quiz en pause.' : 'Quiz repris.');
  };

  const showHelp = () => {
    const resumeAfter = running && !paused;
    if (resumeAfter) pauseGame(true);
    modal.innerHTML = `<div class="ey">Aide</div><h2>Comment jouer</h2><p>Choisis une réponse avant la fin du chrono. Les questions deviennent plus difficiles tous les quatre tours.</p><div class="cards"><div><b>Score</b><span>Rapidité + difficulté + série.</span></div><div><b>50/50</b><span>Une fois par partie, retire deux mauvaises réponses.</span></div><div><b>Clavier</b><span>Touches 1 à 4 pour répondre. P ou Échap pour pause.</span></div><div><b>Mobile</b><span>Grandes réponses tactiles, portrait et paysage.</span></div></div><button class="primary" id="closeHelp">${resumeAfter ? 'Reprendre' : 'Fermer'}</button>`;
    overlay.classList.remove('hide');
    $('#closeHelp').onclick = () => {
      overlay.classList.add('hide');
      if (resumeAfter) pauseGame(false);
    };
  };

  const useFifty = () => {
    if (!running || paused || locked || !current || !fiftyAvailable) return;
    const wrongVisible = optionOrder.map((answerIndex, visibleIndex) => ({ answerIndex, visibleIndex })).filter(({ answerIndex }) => answerIndex !== current.question.ok);
    shuffle(wrongVisible).slice(0, 2).forEach(({ visibleIndex }) => {
      const button = answers.querySelector(`[data-index="${visibleIndex}"]`);
      if (button) {
        button.disabled = true;
        button.classList.add('dim');
        button.setAttribute('aria-hidden', 'true');
      }
    });
    fiftyAvailable = false;
    updateHud();
    $('#status').innerHTML = '<strong>Joker 50/50.</strong> Deux mauvaises réponses sont retirées.';
    announce('Joker 50/50 utilisé. Deux mauvaises réponses retirées.');
    vibrate(win, 18, settings.haptic);
  };

  $('#pause').onclick = () => pauseGame();
  $('#replay').onclick = () => {
    if (running) {
      const confirmed = win.confirm?.('Recommencer cette partie ? Le score actuel sera perdu.');
      if (confirmed === false) return;
    }
    startGame();
  };
  $('#fifty').onclick = () => useFifty();
  $('#help').onclick = () => showHelp();
  $('#sound').onclick = () => {
    settings.sound = !settings.sound;
    audio.set(Boolean(settings.sound));
    persistSettings();
    updateSettingsUi();
  };
  $('#haptic').onclick = () => {
    settings.haptic = !settings.haptic;
    persistSettings();
    updateSettingsUi();
    if (settings.haptic) vibrate(win, 18, true);
  };
  doc.addEventListener('keydown', (event) => {
    if (overlay && !overlay.classList.contains('hide')) return;
    if (event.key >= '1' && event.key <= '4') {
      event.preventDefault();
      answerCurrent(Number(event.key) - 1);
      return;
    }
    if (event.key.toLowerCase() === 'p' || event.key === 'Escape') {
      event.preventDefault();
      pauseGame();
    }
  });
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden && running && !paused && !locked) pauseGame(true);
  });
  win.addEventListener('blur', () => {
    if (running && !paused && !locked) pauseGame(true);
  });

  updateSettingsUi();
  updateHud();
  showMenu();
}
