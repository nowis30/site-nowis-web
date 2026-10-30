// Banque de questions de « Combien de Oui? ».
// Chaque question doit se répondre par OUI ou NON, à la première personne.

export type QuestionPackId = 'classique' | 'party' | 'quebec' | 'mix';

export type QuestionPack = {
  id: QuestionPackId;
  name: string;
  emoji: string;
  description: string;
};

export const questionPacks: QuestionPack[] = [
  { id: 'mix', name: 'Le gros mix', emoji: '🎲', description: 'Un peu de tout, pour tous les groupes.' },
  { id: 'classique', name: 'Classique', emoji: '☀️', description: 'Tout public : famille, collègues, première rencontre.' },
  { id: 'party', name: 'Party', emoji: '🎉', description: 'Pour une soirée entre amis. Un brin plus osé.' },
  { id: 'quebec', name: '100 % Québec', emoji: '⚜️', description: 'Poutine, hiver, cônes oranges et compagnie.' },
];

const classique = [
  'As-tu déjà fait semblant de connaître une chanson pour ne pas avoir l’air fou?',
  'As-tu déjà mangé quelque chose qui était tombé par terre?',
  'Dors-tu avec des bas?',
  'As-tu déjà oublié le nom de quelqu’un pendant que tu lui parlais?',
  'As-tu déjà parlé tout seul dans ta voiture?',
  'Lis-tu la fin d’un livre ou d’une série avant de la commencer?',
  'As-tu déjà fait semblant de parler au téléphone pour éviter quelqu’un?',
  'Te lèves-tu avant 7 h la plupart du temps?',
  'As-tu déjà pleuré devant un film d’animation?',
  'As-tu peur des araignées?',
  'Mets-tu le lait avant les céréales?',
  'As-tu déjà envoyé un message à la mauvaise personne?',
  'Appuies-tu sur « répéter » sur ton réveil plus de deux fois?',
  'As-tu déjà menti sur ton âge?',
  'Sais-tu nager?',
  'As-tu déjà cassé un écran de cellulaire?',
  'Chantes-tu sous la douche?',
  'As-tu déjà dormi plus de 12 heures d’affilée?',
  'Préfères-tu les chats aux chiens?',
  'As-tu déjà regardé une saison complète d’une série en une seule journée?',
  'As-tu déjà eu une contravention?',
  'Es-tu capable de cuisiner un repas sans recette?',
  'As-tu déjà gagné quelque chose à la loterie?',
  'As-tu déjà monté à cheval?',
  'Gardes-tu tes boîtes de cadeaux « au cas où »?',
  'As-tu plus de 500 photos non triées dans ton téléphone?',
  'As-tu déjà oublié l’anniversaire d’un proche?',
  'Manges-tu la croûte de ta pizza?',
  'As-tu déjà chanté au karaoké?',
  'As-tu déjà pris l’avion seul?',
];

const party = [
  'As-tu déjà menti pour sortir d’un party plus tôt?',
  'As-tu déjà stalké un ex sur les réseaux sociaux?',
  'As-tu déjà envoyé un message que tu as regretté dans la minute?',
  'As-tu déjà fait un « ghosting » à quelqu’un?',
  'As-tu déjà eu un kick sur quelqu’un dans cette pièce?',
  'As-tu déjà dansé sur une table?',
  'As-tu déjà inventé une excuse pour ne pas aller travailler?',
  'As-tu déjà lu les messages de quelqu’un d’autre sans permission?',
  'As-tu déjà été le dernier à quitter un party?',
  'As-tu déjà oublié comment tu étais rentré chez toi?',
  'As-tu déjà dit « je t’aime » sans le penser?',
  'As-tu déjà regifté un cadeau?',
  'As-tu déjà fait semblant d’aimer un cadeau?',
  'As-tu déjà eu une date avec quelqu’un rencontré sur une application?',
  'As-tu déjà été mis dehors d’un bar?',
  'As-tu déjà pris un égoportrait dans les toilettes d’un restaurant?',
  'As-tu déjà inventé un faux nom pour une soirée?',
  'As-tu déjà mangé de la pizza froide au déjeuner?',
  'As-tu déjà appelé un ex en pleine nuit?',
  'As-tu déjà menti dans ce jeu-ci?',
  'As-tu déjà rompu par texto?',
  'As-tu déjà fait un road trip sans plan?',
  'As-tu déjà accepté un défi complètement ridicule?',
  'As-tu déjà fait la fermeture d’un bar un mardi?',
  'As-tu déjà fait semblant d’être malade pour éviter un souper de famille?',
  'As-tu déjà été jaloux d’un ami?',
  'As-tu déjà fouillé dans la pharmacie d’un hôte?',
  'As-tu déjà fait une déclaration d’amour en public?',
  'As-tu déjà eu un tatouage que tu regrettes?',
  'As-tu déjà commencé une chicane sur internet?',
];

const quebec = [
  'As-tu déjà mangé une poutine à 3 h du matin?',
  'As-tu déjà pelleté ton entrée en pyjama?',
  'As-tu déjà été pris dans un banc de neige avec ton char?',
  'Sais-tu chanter tout « Gens du pays »?',
  'As-tu déjà fait du temps des sucres dans une vraie cabane?',
  'As-tu déjà déménagé le 1er juillet?',
  'As-tu déjà fait du patin sur un lac gelé?',
  'Dis-tu « char » plutôt que « voiture »?',
  'As-tu déjà mangé de la tire sur la neige?',
  'As-tu déjà été au Carnaval de Québec?',
  'As-tu déjà vu un match du Canadien au Centre Bell?',
  'Mets-tu du ketchup sur ton pâté chinois?',
  'As-tu déjà fait la file pour un cornet à la première journée chaude?',
  'Regardes-tu le Bye Bye chaque année?',
  'As-tu déjà roulé dans un nid-de-poule assez gros pour briser ton char?',
  'As-tu déjà fait du camping dans un parc de la SÉPAQ?',
  'As-tu déjà mangé des cretons au déjeuner?',
  'As-tu déjà conduit avec des pneus d’été en novembre?',
  'As-tu déjà été dans un festival western?',
  'As-tu déjà fait un feu de camp en chantant du Cowboys Fringants?',
  'As-tu déjà dit « tiguidou » sans faire exprès?',
  'As-tu déjà acheté de la bière au dépanneur à 22 h 59?',
  'As-tu déjà fait de la motoneige?',
  'As-tu déjà pêché sur la glace?',
  'Préfères-tu l’hiver à l’été?',
  'As-tu déjà vu un orignal en vrai?',
  'As-tu déjà été au Festival d’été de Québec?',
  'As-tu déjà mangé une tourtière qui n’était pas de ta famille et trouvé ça meilleur?',
  'As-tu déjà klaxonné un cône orange par frustration?',
  'As-tu déjà dit « bon matin » à quelqu’un?',
];

const banks: Record<Exclude<QuestionPackId, 'mix'>, string[]> = { classique, party, quebec };

export function isQuestionPackId(value: unknown): value is QuestionPackId {
  return typeof value === 'string' && questionPacks.some((pack) => pack.id === value);
}

export function questionsForPack(pack: QuestionPackId): string[] {
  if (pack === 'mix') return [...classique, ...party, ...quebec];
  return banks[pack];
}
