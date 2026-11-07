import { CEILING_RANK, type Ceiling } from './types';

export type BankQuestion = {
  id: string;
  level: Ceiling;
  text: string;
};

export type QuickTemplate = {
  level: Ceiling;
  mode: 'cible' | 'tous';
  text: string;
};

export const BANK: BankQuestion[] = [
  { id: 'd1', level: 'doux', text: 'As-tu déjà fait semblant de rire à une joke?' },
  { id: 'd2', level: 'doux', text: 'Est-ce que tu checkes ton téléphone pendant qu’on te parle?' },
  { id: 'd3', level: 'doux', text: 'As-tu déjà répondu « on s’en reparle » juste pour fermer la conversation?' },
  { id: 'd4', level: 'doux', text: 'Est-ce que tu es réellement content d’être ici, là, maintenant?' },
  { id: 'd5', level: 'doux', text: 'As-tu déjà dit « je suis en chemin » alors que tu n’étais pas parti?' },
  { id: 'd6', level: 'doux', text: 'Est-ce que tu laisses parfois un message non lu, puis tu n’y réponds jamais?' },
  { id: 'd7', level: 'doux', text: 'As-tu déjà fait semblant de ne pas voir quelqu’un en public?' },
  { id: 'd8', level: 'doux', text: 'Est-ce que tu juges un peu le monde sur son choix de musique?' },
  { id: 'p1', level: 'party', text: 'As-tu déjà stalké quelqu’un qui est dans cette salle?' },
  { id: 'p2', level: 'party', text: 'Est-ce que quelqu’un ici t’a déjà fait rougir?' },
  { id: 'p3', level: 'party', text: 'As-tu déjà parlé dans le dos de quelqu’un de la gang?' },
  { id: 'p4', level: 'party', text: 'Est-ce que tu resterais plus longtemps ce soir si la bonne personne te le demandait?' },
  { id: 'p5', level: 'party', text: 'As-tu déjà menti sur l’endroit où tu étais?' },
  { id: 'p6', level: 'party', text: 'Est-ce que tu as déjà eu un kick sur un ami proche?' },
  { id: 'p7', level: 'party', text: 'As-tu déjà ouvert le téléphone de quelqu’un sans le dire?' },
  { id: 'p8', level: 'party', text: 'Est-ce que tu as déjà flirté juste pour voir si ça marchait?' },
  { id: 'o1', level: 'ose', text: 'As-tu déjà embrassé quelqu’un que tu n’aurais pas dû?' },
  { id: 'o2', level: 'ose', text: 'Est-ce que tu as déjà fantasmé sur quelqu’un dans cette pièce?' },
  { id: 'o3', level: 'ose', text: 'As-tu déjà menti à ton chum, ta blonde ou ton date?' },
  { id: 'o4', level: 'ose', text: 'Est-ce que tu as déjà envoyé une photo un peu trop honnête?' },
  { id: 'o5', level: 'ose', text: 'As-tu déjà réécrit à un ex juste pour parler?' },
  { id: 'o6', level: 'ose', text: 'Est-ce qu’il y a quelqu’un ici que tu embrasserais ce soir?' },
  { id: 'o7', level: 'ose', text: 'As-tu déjà couché avec un ami?' },
  { id: 'o8', level: 'ose', text: 'Est-ce que tu as déjà été attiré par le partenaire de quelqu’un que tu connais?' },
  { id: 's1', level: 'sans-filtre', text: 'As-tu déjà couché avec quelqu’un le soir où tu l’as rencontré?' },
  { id: 's2', level: 'sans-filtre', text: 'Est-ce que tu as déjà simulé au lit?' },
  { id: 's3', level: 'sans-filtre', text: 'As-tu déjà été attiré par le partenaire de quelqu’un qui est ici?' },
  { id: 's4', level: 'sans-filtre', text: 'Est-ce que tu as déjà fait l’amour quelque part où tu pouvais te faire prendre?' },
  { id: 's5', level: 'sans-filtre', text: 'As-tu déjà rappelé quelqu’un seulement pour le sexe?' },
  { id: 's6', level: 'sans-filtre', text: 'Est-ce qu’il y a quelqu’un dans cette salle avec qui tu coucherais?' },
  { id: 's7', level: 'sans-filtre', text: 'As-tu déjà trompé quelqu’un?' },
  { id: 's8', level: 'sans-filtre', text: 'Est-ce que tu caches quelque chose à la personne avec qui tu couches en ce moment?' },
];

export const QUICK_TEMPLATES: QuickTemplate[] = [
  { level: 'doux', mode: 'cible', text: 'Est-ce que {nom} est du genre à arriver en retard?' },
  { level: 'party', mode: 'cible', text: 'Est-ce que {nom} t’a déjà fait rougir?' },
  { level: 'ose', mode: 'cible', text: 'Est-ce que tu embrasserais {nom} ce soir?' },
  { level: 'party', mode: 'tous', text: 'Est-ce que {nom} est la personne la plus susceptible de texter son ex ce soir?' },
  { level: 'sans-filtre', mode: 'cible', text: 'Est-ce que tu coucherais avec {nom}?' },
];

const MINOR = /p[eé]doph|mineur|mineure|enfant|enfants|\bkid\b|lolita|shota|pr[eé]pub|underage|adolescent/i;
const SEX = /sexe|sexuel|sexuelle|\bnu[e]s?\b|\bcul\b|bite|p[eé]nis|vagin|couche|baiser|porn|orgasm|suce|foutre/i;
const YOUNG = /\b(?:[0-9]|1[0-7])\s*ans\b/i;

export function questionIsBlocked(text: string): boolean {
  if (/p[eé]doph/i.test(text)) return true;
  if (MINOR.test(text) && SEX.test(text)) return true;
  if (YOUNG.test(text) && SEX.test(text)) return true;
  return false;
}

export function normalizeQuestion(input: string): { ok: true; text: string } | { ok: false; error: string } {
  const text = input.normalize('NFKC').replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length < 12) return { ok: false, error: 'Formule une vraie question, au moins une courte phrase.' };
  if (text.length > 180) return { ok: false, error: 'La question est trop longue.' };
  if (/[<>]/.test(text) || /https?:|www\.|discord\.gg|t\.me/i.test(text)) {
    return { ok: false, error: 'Garde la question dans la salle, sans lien ni code.' };
  }
  if (questionIsBlocked(text)) return { ok: false, error: 'Cette question ne peut pas être posée.' };
  return { ok: true, text };
}

export function normalizeName(input: string): string | null {
  const name = input.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 18) return null;
  if (!/^[\p{L}\p{N}]+(?:[ '\-][\p{L}\p{N}]+)*$/u.test(name)) return null;
  return name;
}

export function pickBankQuestion(cap: Ceiling, seen: string[], random: number): BankQuestion | null {
  const capRank = CEILING_RANK[cap];
  const eligible = BANK.filter((question) => CEILING_RANK[question.level] <= capRank);
  if (!eligible.length) return null;
  const fresh = eligible.filter((question) => !seen.includes(question.id));
  const pool = fresh.length ? fresh : eligible;
  const weighted = pool.flatMap((question) => Array.from({ length: CEILING_RANK[question.level] + 1 }, () => question));
  const index = Math.min(weighted.length - 1, Math.max(0, Math.floor(random * weighted.length)));
  return weighted[index] ?? null;
}
