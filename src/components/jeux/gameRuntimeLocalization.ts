const canvasExactTranslations: Record<string, string> = {
  'game over': 'Partie terminée',
  'you win': 'Tu as gagné !',
  'you won': 'Tu as gagné !',
  'you lose': 'Tu as perdu !',
  'you lost': 'Tu as perdu !',
  'play again': 'Rejouer',
  'restart': 'Recommencer',
  'start': 'Démarrer',
  'start game': 'Démarrer la partie',
  'new game': 'Nouvelle partie',
  'score': 'Score',
  'high score': 'Meilleur score',
  'level': 'Niveau',
  'time': 'Temps',
  'lives': 'Vies',
  'moves': 'Coups',
  'round': 'Manche',
  'winner': 'Gagnant',
  'draw': 'Égalité',
  'correct': 'Bonne réponse !',
  'wrong': 'Mauvaise réponse',
  'pause': 'Pause',
  'resume': 'Reprendre',
  'ready': 'Prêt',
  'congratulations': 'Félicitations !',
  'rock': 'Pierre',
  'paper': 'Papier',
  'scissors': 'Ciseaux',
  'checkmate': 'Échec et mat',
  'stalemate': 'Pat',
  'your turn': 'À ton tour',
  'simon says': 'Jacques a dit',
};

function translateRuntimeText(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 180) return value;

  const direct = canvasExactTranslations[trimmed.toLowerCase()];
  if (direct) return direct;

  const patterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [/^score\s*:\s*(.+)$/i, (m) => `Score : ${m[1]}`],
    [/^high score\s*:\s*(.+)$/i, (m) => `Meilleur score : ${m[1]}`],
    [/^level\s*:\s*(.+)$/i, (m) => `Niveau : ${m[1]}`],
    [/^time\s*:\s*(.+)$/i, (m) => `Temps : ${m[1]}`],
    [/^lives\s*:\s*(.+)$/i, (m) => `Vies : ${m[1]}`],
    [/^moves\s*:\s*(.+)$/i, (m) => `Coups : ${m[1]}`],
    [/^round\s*:\s*(.+)$/i, (m) => `Manche : ${m[1]}`],
    [/^question\s+(\d+)\s+of\s+(\d+)$/i, (m) => `Question ${m[1]} sur ${m[2]}`],
    [/^you scored\s+(.+)$/i, (m) => `Ton score : ${m[1]}`],
  ];

  for (const [pattern, translator] of patterns) {
    const match = trimmed.match(pattern);
    if (match) return translator(match);
  }

  return value;
}

export function localizeGameRuntime(win: Window) {
  const marker = win as Window & { __nowisFrenchRuntime?: boolean };
  if (marker.__nowisFrenchRuntime) return;
  marker.__nowisFrenchRuntime = true;

  const runtime = win as unknown as {
    CanvasRenderingContext2D?: typeof CanvasRenderingContext2D;
    alert?: (message?: unknown) => void;
    confirm?: (message?: string) => boolean;
    prompt?: (message?: string, defaultValue?: string) => string | null;
  };

  const canvasCtor = runtime.CanvasRenderingContext2D;
  if (canvasCtor) {
    const prototype = canvasCtor.prototype as CanvasRenderingContext2D & {
      __nowisFrenchCanvas?: boolean;
    };

    if (!prototype.__nowisFrenchCanvas) {
      prototype.__nowisFrenchCanvas = true;
      const originalFillText = canvasCtor.prototype.fillText;
      const originalStrokeText = canvasCtor.prototype.strokeText;

      canvasCtor.prototype.fillText = function fillTextFrench(
        text: string,
        x: number,
        y: number,
        maxWidth?: number,
      ) {
        const translated = translateRuntimeText(String(text));
        if (maxWidth === undefined) return originalFillText.call(this, translated, x, y);
        return originalFillText.call(this, translated, x, y, maxWidth);
      };

      canvasCtor.prototype.strokeText = function strokeTextFrench(
        text: string,
        x: number,
        y: number,
        maxWidth?: number,
      ) {
        const translated = translateRuntimeText(String(text));
        if (maxWidth === undefined) return originalStrokeText.call(this, translated, x, y);
        return originalStrokeText.call(this, translated, x, y, maxWidth);
      };
    }
  }

  const originalAlert = win.alert.bind(win);
  win.alert = (message?: unknown) => originalAlert(translateRuntimeText(String(message ?? '')));

  const originalConfirm = win.confirm.bind(win);
  win.confirm = (message?: string) => originalConfirm(translateRuntimeText(String(message ?? '')));

  const originalPrompt = win.prompt.bind(win);
  win.prompt = (message?: string, defaultValue?: string) =>
    originalPrompt(translateRuntimeText(String(message ?? '')), defaultValue);
}
